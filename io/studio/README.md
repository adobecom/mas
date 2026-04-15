# SETUP

## Setup your workspace

- install aio cli running `npm install -g @adobe/aio-cli`
- Request access to I/O Runtime in Adobe Corp org (you can do that on #milo-dev)
- navigate to Developer Console https://developer.adobe.com/console
- in 'Merch at Scale Studio' project, create a workspace with your github user id
- to enable the oauth-server flow, navigate to your personal workspace
- if there is no `I/O Management API` card present yet, click on `Add Service`, then select `API`
- in the list of API services, find `I/O Management API` and select it
- click `Next`
- click `Save configured API`
- in your workspace click on 'Download all' and copy the auth .json in root (/io/studio)

## Prepare .aio and .env files

With the aio-cli v11 installed locally, run the following commands in the terminal:

```bash
cd io/studio

# load the workspace config
# this should populate the `.env` and the `.aio` file in the project root (/io/studio)
aio app use <path_to_workspace_json>

# run `aio where` and verify output has your ldap in workspace
aio where

# extract the name of the oauth-credentials with jq and format string
aio config ls --json | jq -r '.project.workspace.details.credentials[] | select(.integration_type == "oauth_server_to_server") | .name' | tr '[:upper:]' '[:lower:]'

# set the returned string from above as current IMS context
aio context -s <string_from_above_command>
```

ask colleague for values and add these env vars in .env file:
ODIN_CDN_ENDPOINT=
ODIN_ORIGIN_ENDPOINT=
WCS_CDN_ENDPOINT=
WCS_ORIGIN_ENDPOINT
AOS_URL=
AOS_API_KEY=
OST_WRITE_API_KEY=
ODIN_ENDPOINT=
BATCH_SIZE=

With these steps, both the `.aio` and `.env` files are ready to be used as GH action secrets.

## CI/CD for I/O studio

Using Github workflows, the CI/CD of I/O studio has been automated. The workflows have been setup to do the following:

- detect PR creations with files in io/studio
- build and run tests
- auto-deploy the I/O studio actions in a personal workspace of the github.actor (with fallback mechanism to QA workspace)
- runs health-check on deployed actions
- post merge of PR, auto-deployment to stage with tests, then to prod if successful

## CI/CD Prerequisites

In order for the auto-deployment to work, a number of Github action secrets are required. In addition, every developer who wants to get his/her PR changes deployed to their personal I/O studio workspace, needs his/her own set of github secrets.

## Set GH action secrets

The following secrets need to be added to the mas repository in order for the CI/CD workflows for I/O studio to auto-deploy the studio actions to your personal workspace.

Please note that your GH user-id matches the personal workspace name.

The following secrets need to be added per workspace:

| Name                          | Value         | Comment                                          |
| ----------------------------- | ------------- | ------------------------------------------------ |
| `AIO_STUDIO_ENV_<gh_user_id>` | `<.env_file>` | content of the local `.env` file                 |
| `AIO_STUDIO_AIO_<gh_user_id>` | `<.aio_file>` | content of the local `.aio` file                 |
| `AIO_STUDIO_NS_<gh_user_id>`  | `<namespace>` | see `AIO_runtime_namespace` value in `.env` file |

With these secrets in place, any github user's I/O studio workspace that has the above set of secrets created will be used when raising a PR against `io/studio`.

## Local Dev

- `aio app dev` to start your local Dev server
- App will run on `localhost:9080` by default
- open https://localhost:9080/api/v1/web/MerchAtScale/health-check

## Test & Coverage

- Run `aio app test` to run unit tests for ui and actions

## Deploy & Cleanup

Do not deploy all actions at the same time - this increases risks, provide -a <action-name> to specify what you are deploying.

- `aio app test && aio app deploy -a ost-products-read` to test and deploy an action to Runtime and static files to CDN
- `aio app undeploy` to undeploy the app

If you need to force re-deploy:

- `aio app deploy --force-deploy --no-publish`
  To deploy specific action
- `aio app deploy --force-deploy -a ost-products-read`

## Config

### `.env`

You can generate this file using the command `aio app use`. Be aware that it would remove all custom env vars, you will need to re-add them.

```bash
# This file must **not** be committed to source control

## please provide your Adobe I/O Runtime credentials
# AIO_RUNTIME_AUTH=
# AIO_RUNTIME_NAMESPACE=
```

### `app.config.yaml`

Main configuration file that defines an application's implementation.
