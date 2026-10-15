# MAS/IO io runtime service

## services index

- [fragment pipeline service](./src/fragment/README.md)
- [healthcheck service](./src/fragment/README.md)
- offers service (`offers`): every 15 minutes (`offersSync` alarm rule), copies offer baselines (`/content/dam/mas/offers/<locale>/<pa>/baseline`) into the namespace state, one `offer-<locale>-<pa>` key each, to be read by the fragment pipeline. Unchanged ones are rewritten every 30 to 60 days so that they never expire (365 days TTL), and a full sync also cleans up previously synced locales (`offers-locales`) that have none anymore. Sync on demand with `aio rt action invoke MerchAtScale/offers [-p locale en_US]` (web requests never sync). As a web action, `GET /offers?api_key=<key>&locale=<locale>[&pa=<pa>[,<pa>…]]` (up to 50; same api keys as the fragment pipeline, 400 if missing, 401 if not accepted) serves `{ [pa]: offerBaseline }` (en_US fallback, 404 if none), for the requested product arrangements or, without `pa`, the whole locale (synced as one `offers-bundle-<locale>` entry), brotli compressed, with an `ETag`: send it back as `If-None-Match` to get a `304` when unchanged. State reads (absent offers included) and encoded locale responses are cached in container memory (jittered 5 minutes TTL, stale-while-revalidate), cleared when a sync of the same container changes anything.

## Setup / Local

- install aio cli running `npm install -g @adobe/aio-cli`
- Request access to I/O Runtime in Adobe Corp org (you can do that on #milo-dev)
- navigate to Developer Console https://developer.adobe.com/console
- in 'Merch at Scale' project, create a workspace with your github username
- to enable the oauth-server flow, navigate to your personal workspace
- if there is no `I/O Management API` card present yet, click on `Add Service`, then select `API`
- in the list of API services, find `I/O Management API` and select it
- click `Next`
- click `Save configured API`
- in your workspace click on 'Download all' and copy the auth .json in root of this project
- run `aio app use <filename>`
- this should populate the `.env` and the `.aio` file in the project root
- ask a colleague or check vault for www env vars (they are not stored in developer console)
- run:

```bash
# extract the name of the oauth-credentials with jq and format string
aio config ls --json | jq -r '.project.workspace.details.credentials[] | select(.integration_type == "oauth_server_to_server") | .name' | tr '[:upper:]' '[:lower:]'

# set the returned string from above as current IMS context
aio context -s <string_from_above_command>
```

- run `npm i`
- run `aio where` and verify output is:

```
aio where
You are currently in:
1. Org: Adobe Corp
2. Project: MerchAtScale
3. Workspace: your github username
```

## Setup / PR auto deploy

every time you push to your feature branch, CI/CD can deploy it to your workspace.

For that, add 2 Repository secrets in github settings:
AIO*WWW_ENV*<GITHUBUSERNAME>=
AIO*WWW_AIO*<GITHUBUSERNAME>=
<GITHUBUSERNAME> should match your workspace name and be in capital case.

values of those secrets should be the content of your corresponding resp `.env` and `.aio` files

## Test & Coverage

- Run `aio app test` to run unit tests for ui and actions (_Note: If tests fail, make sure to have the latest node version installed._)

## Deploy & Cleanup

- `aio app test && aio app deploy` to test, build and deploy all actions on Runtime and static files to CDN
- `aio app undeploy` to undeploy the app

If you need to force re-deploy:

- `aio app deploy --force-deploy --no-publish`

To deploy specific action

- `aio app deploy -a health-check --force-deploy`

### `app.config.yaml`

Main configuration file that defines an application's implementation.

<!-- MWPW-201374: temporary marker to trigger io/www Docs NALA for namespace verification (to be reverted) -->
