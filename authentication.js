/* global WIKI */

// ------------------------------------
// Eve Online ESI
// ------------------------------------

const EveOnlineSsoStrategy = require('passport-eveonline-sso').Strategy;

module.exports = {
  init(passport, conf) {
    console.log(conf)
    passport.use(conf.key,
      new EveOnlineSsoStrategy({
        clientID: conf.clientID,
        clientSecret: conf.clientSecret,
        callbackURL: conf.callbackURL,
      }, function(accessToken, refreshToken, profile, cb) {
        console.log(profile)
        WIKI.models.users.processProfile(profile).then((user) => {
          return cb(null, user) || true
        }).catch((err) => {
          return cb(err, null) || true
        })
      }
      ))
  }
}
