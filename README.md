## Features
- Group autoassignment from corp titles
- Multi-corp support (alliance support soon)
- Title disallow list

## Setup

### ESI application
1. Sign in to the [EVE developer portal](https://developers.eveonline.com/)
2. Select `Manage Applications` -> `Create New Application`

3. Under Connection Type, select "authentication and API access"

4. Choose the following scopes from the list:
 * `esi-characters.read_titles.v1`
 * `publicData`

5. For now, put `http://localhost` in the callback.  We will come back and change this.

### wiki.js configuration
1. clone this project into `server/modules/authentication` under the root of your wiki.js installation.
2. restart wiki.js
3. Sign in as an administrator and select `Authentication` from the left nav bar
4. Select `ADD STRATEGY` and choose Eve Online ESI from the list
5. Populate the `Client ID` and `Client Secret` with the values provided by the EVE Developer Portal.
6. Fill in the allowed Corporation names, new line delimited, in `Allowed Corporations`
7. Fill in any disallowed titles, new line delimited, in `Disallowed Titles`
8. Toggle `Map Titles to Groups` to true if you would like users to by assigned to groups that match the names of their titles.
9. Enable `Allow self-registration` and set the email domain to evesso.local.  Leave Assign to group blank.

10. At the bottom of this window copy the `Callback URL / Redirect URI` value (under Configuration Reference)
11. Click `Apply` at the top right of the window

12. Back in the EVE developer portal, go to applications and select `view application` for your wiki backend
choose the `Update Details` tab, scroll down to the bottom, and replace the `Callback URL` with the value you copied in step 10.
`Click Confirm Changes and Update App`



### local dev setup
clone this project into `server/modules/authentication` under the root of the
wiki.js project.


enter the `server/modules/authentication/wiki-js-eve-sso` directory and execute
 `npm install`

follow the directions in the [official docs](https://docs.requarks.io/dev) to 
launch the instance via `docker-compose`