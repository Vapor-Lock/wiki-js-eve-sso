/* global WIKI */

// ------------------------------------
// Eve Online ESI
// ------------------------------------

const EveOnlineSsoStrategy = require('passport-eveonline-sso').Strategy;

module.exports = {
  init(passport, conf) {
    console.log(conf)
    var client = new EveOnlineSsoStrategy({
      clientID: conf.clientID,
      clientSecret: conf.clientSecret,
      callbackURL: conf.callbackURL,
      passReqToCallback: true,
    }, async (req, accessToken, refreshToken, profile, cb) => {
      try {
        //console.log(profile) //[DEBUG]
        const user = await WIKI.models.users.processProfile({
          providerKey: req.params.strategy,
          profile: {
            ...profile,
            id: profile.CharacterID,
            displayName: profile.CharacterName,
            email: `${profile.CharacterID}@evesso.local`,
            picture: `https://images.evetech.net/characters/${profile.CharacterID}/portrait?tenant=tranquility&size=128`
          }
        })
        console.log("record created: %s", user)
        cb(null, user)

      } catch (err) {
        console.log("failed: %s", err)
        //console.log("user: %s", user)
        cb(err, null)
      }
    })
    passport.use(conf.key, client)
  }
}
