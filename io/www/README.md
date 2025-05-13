

# Adobe IO WWW for m@s

## Onboarding

### first steps

- install aio cli running `npm install -g @adobe/aio-cli`
- Request access to I/O Runtime in Adobe Corp org (you can do that on #milo-dev)
- navigate to Developer Console https://developer.adobe.com/console
- in 'Merch at Scale' project, create a workspace with your ldap
- in your workspace click on 'Download all' and copy the auth .json in root of this project
- run `aio app use <filename>` 
- this should populate the `.env` and the `.aio` file in the project root
- ask a colleague for values:
    - for health-check action, 
    add ODIN_CDN_ENDPOINT,ODIN_ORIGIN_ENDPOINT,WCS_CDN_ENDPOINT,WCS_ORIGIN_ENDPOINT env vars to .env file
    - for ost-products, add AOS_URL and AOS_API_KEY env vars to .env file
- run `npm i`
- run `aio where` and verify output is:
```
aio where
You are currently in:
1. Org: Adobe Corp
2. Project: MerchAtScale
3. Workspace: your ldap
```

### Local Dev

- `aio app dev` to start your local Dev server
- App will run on `localhost:9080` by default
- open https://localhost:9080/api/v1/web/MerchAtScale/health-check


### Test & Coverage

- Run `aio app test` to run unit tests for ui and actions

### Deploy & Cleanup

be aware you should _never_ deploy to prod or stage even if you have the rights to do so, you can still though deploy to your own workspace using following commands:

- `aio app test && aio app deploy` to test, build and deploy all actions on Runtime and static files to CDN
- `aio app undeploy` to undeploy the app

If you need to force re-deploy:
- `aio app deploy --force-deploy --no-publish`
To deploy specific action
- `aio app deploy -a ost-products-read`

### Config

#### `.env`

You can generate this file using the command `aio app use`. 

```bash
# This file must **not** be committed to source control

## please provide your Adobe I/O Runtime credentials
# AIO_RUNTIME_AUTH=
# AIO_RUNTIME_NAMESPACE=
```

#### `app.config.yaml`

Main configuration file that defines an application's implementation. 

## Fragment Pipeline
<img width="970" alt="image" src="https://github.com/user-attachments/assets/b58a4ccc-907c-4582-952b-e835c2017e49" />

this pipeline can work on your browser in preview mode. To be sure that we always have browser version consistent with actual prod one, 
you should always, when bringing changes to www/io/src/fragment, run in io/www folder following command:

`npm run build:client`


