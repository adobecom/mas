# MasHealthCheck

## Setup / First Steps

- install aio cli
- Request access to I/O Runtime in Adobe Corp org
- navigate to Developer Console https://developer.adobe.com/console
- in Mas HealthCheck project, create a workspace with your ldap
- in your workspace click on 'Download all' and copy the auth .json in root of this project
- run `aio app use filename`
- this should populate the `.env` and the `.aio` file in the project root
- add ODIN_CDN_ENDPOINT,ODIN_ORIGIN_ENDPOINT,WCS_CDN_ENDPOINT,WCS_ORIGIN_ENDPOINT env vars to .env file
- run `npm i`
- run `aio where` and verify output is:
```
aio where
You are currently in:
1. Org: Adobe Corp
2. Project: Mas HealthCheck
3. Workspace: your ldap
```

## Local Dev

- `aio app dev` to start your local Dev server
- App will run on `localhost:9080` by default
- open https://localhost:9080/api/v1/web/MerchAtScale/health-check


## Test & Coverage

- Run `aio app test` to run unit tests for ui and actions

## Deploy & Cleanup

- `aio app test && aio app deploy` to test, build and deploy all actions on Runtime and static files to CDN
- `aio app undeploy` to undeploy the app

## Config

### `.env`

You can generate this file using the command `aio app use`. 

```bash
# This file must **not** be committed to source control

## please provide your Adobe I/O Runtime credentials
# AIO_RUNTIME_AUTH=
# AIO_RUNTIME_NAMESPACE=
```

### `app.config.yaml`

Main configuration file that defines an application's implementation. 
