# MAS/IO io runtime service

## services index

- [fragment pipeline service](./src/fragment/README.md)
- [health-check service](./src/health-check/README.md)
- offers service (`offers`): every 15 minutes (`offersSync` alarm rule), copies offer baselines (`/content/dam/mas/offers/<locale>/baselines/<pa>/baseline`) into the namespace state, one `offer-<locale>-<pa>` key each, served below to the fragment pipeline (see [offer baselines](./src/fragment/README.md#offer-baselines)). Unchanged ones are rewritten every 30 to 60 days so that they never expire (365 days TTL), and a full sync also cleans up previously synced locales (`offers-locales`) that have none anymore. Sync on demand with `aio rt action invoke MerchAtScale/offers [-p locale en_US]` (web requests never sync). As a web action, `GET /offers?api_key=<key>&locale=<locale>[&pa=<pa>[,<pa>…]]` (up to 50; same api keys as the fragment pipeline, 400 if missing, 401 if not accepted) serves `{ [pa]: offerBaseline }` (en_US fallback, 404 if none), for the requested product arrangements or, without `pa`, the whole locale (synced as one `offers-bundle-<locale>` entry), brotli compressed, with an `ETag`: send it back as `If-None-Match` to get a `304` when unchanged. State reads (absent offers included) and encoded locale responses are cached in container memory (jittered 5 minutes TTL, stale-while-revalidate), cleared when a sync of the same container changes anything.

## Setup / Local

- install the aio cli: `npm install -g @adobe/aio-cli`, and request access to I/O Runtime in the Adobe Corp org (#milo-dev)
- in the [Developer Console](https://developer.adobe.com/console), `Merch at Scale` project, create a workspace named after your github username, and add the `I/O Management API` service to it (`Add Service` → `API`)
- in your workspace, click `Download all`, copy the auth json to this folder and run `aio app use <filename>`: it writes `.env` and `.aio`
- add the www env vars to `.env` (ask a colleague or check vault, they are not in the Developer Console)
- select the oauth credentials as IMS context:

```bash
aio context -s $(aio config ls --json | jq -r '.project.workspace.details.credentials[] | select(.integration_type == "oauth_server_to_server") | .name' | tr '[:upper:]' '[:lower:]')
```

- run `npm i`, then `aio where`, which should show `Org: Adobe Corp`, `Project: MerchAtScale`, `Workspace: <your github username>`

## PR auto deploy

Every push to a pull request deploys `io/www` to its author's workspace, given 2 repository secrets holding the content of your `.env` and `.aio` files: `AIO_WWW_ENV_<GITHUB LOGIN>` and `AIO_WWW_AIO_<GITHUB LOGIN>`.

## Test & deploy

Node >=22.16 is required.

- `npm test`: unit tests, with 100% coverage required (`npm run test:coverage` for a report)
- `aio app deploy`: builds and deploys all actions to your workspace (`--force-deploy --no-publish` to force it, `-a <action>` for one action), `aio app undeploy` to remove them
