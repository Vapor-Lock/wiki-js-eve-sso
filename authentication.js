/* global WIKI */

// ------------------------------------
// Eve Online ESI
// ------------------------------------
const _ = require('lodash')

const EveOnlineSsoStrategy = require('passport-eveonline-sso').Strategy;

module.exports = {
  init(passport, conf) {
    var client = new EveOnlineSsoStrategy({
      clientID: conf.clientID,
      clientSecret: conf.clientSecret,
      callbackURL: conf.callbackURL,
      passReqToCallback: true,
      scope: "publicData esi-characters.read_titles.v1",
    }, async (req, accessToken, refreshToken, profile, cb) => {
      try {

        const failTitles = conf.disallowedTitles.split("\n")
        const allowedCorps = conf.allowedCorps.split("\n")
        // get allowed corp IDs
        const resCorpIDs = await fetch('https://esi.evetech.net/latest/universe/ids/?datasource=tranquility&language=en', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'wiki-js-eve-sso',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify(allowedCorps),
        })
        const corps = await resCorpIDs.json()

        // fetch character corp membership
        const resCharInfo = await fetch(`https://esi.evetech.net/latest/characters/${profile.CharacterID}/?datasource=tranquility`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'User-Agent': 'wiki-js-eve-sso',
            'Cache-Control': 'no-cache'
          }
        })
        const charInfo = await resCharInfo.json()

        // verify user corp membership
        let match = false
        for (const corp of corps.corporations) {
          if (corp.id == charInfo.corporation_id) { match = true }
        }
        if (!match) {
          throw new Error('Character is not a member of an authorized corporation.')
        }

        // fetch titles
        const resTitles = await fetch(`https://esi.evetech.net/latest/characters/${profile.CharacterID}/titles/?datasource=tranquility`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'User-Agent': 'wiki-js-eve-sso',
            'Cache-Control': 'no-cache'
          }
        })
        var titles = await resTitles.json()
        titles = titles.map(t => t.name.replace(/(<([^>]+)>)/gi, ""))

        // handle disallowed titles
        for (const title of titles) {
          if (failTitles.includes(title)) {
            throw new Error(`Character with title ${title} is disallowed.`)
          }
        }

        // Check for CEO
        var resCorpInfo = await fetch(`https://esi.evetech.net/latest/corporations/${charInfo.corporation_id}/?datasource=tranquility&language=en`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'User-Agent': 'wiki-js-eve-sso',
            'Cache-Control': 'no-cache'
          }
        })
        const corpInfo = await resCorpInfo.json()
        if (corpInfo.ceo_id == profile.CharacterID) { titles.push("CEO") }

        // create initial user object
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

        // assign groups from titles
        if (conf.mapGroups) {
          const groups = titles
          if (groups && _.isArray(groups)) {
            const currentGroups = (await user.$relatedQuery('groups').select('groups.id')).map(g => g.id)
            const expectedGroups = Object.values(WIKI.auth.groups).filter(g => groups.includes(g.name)).map(g => g.id)
            for (const groupId of _.difference(expectedGroups, currentGroups)) {
              await user.$relatedQuery('groups').relate(groupId)
            }
            for (const groupId of _.difference(currentGroups, expectedGroups)) {
              await user.$relatedQuery('groups').unrelate().where('groupId', groupId)
            }
          }
        }
        cb(null, user)

      } catch (err) {
        console.log("eve esi sso failed: %s", err)
        cb(err, null)
      }
    })
    passport.use(conf.key, client)
  }
}
