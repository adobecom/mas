# MAS/IO io runtime service

## services index

- [fragment pipeline service](./src/fragment/README.md)
- [healthcheck service](./src/fragment/README.md)

## Setup / Local

- install aio cli running `npm install -g @adobe/aio-cli`
- Request access to I/O Runtime in Adobe Corp org (you can do that on #milo-dev)
- navigate to Developer Console https://developer.adobe.com/console
- in 'Merch at Scale' project, create a workspace with your github username
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
AIO_WWW_ENV_GITHUBUSERNAME=
AIO_WWW_AIO_GITHUBUSERNAME=
GITHUBUSERNAME should match your workspace name and be in capital case.

## Local Dev

- `aio app dev` to start your local Dev server
- App will run on `localhost:9080` by default
- open https://localhost:9080/api/v1/web/MerchAtScale/health-check

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
