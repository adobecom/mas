# Merch At Scale
This project is a library of web components providing merchandising content to various surfaces.

## Environments
- Preview: https://main--mas--adobecom.aem.page/
- Live: https://main--mas--adobecom.aem.live/

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development
```
npm run build
npm run studio
```
To test your local changes from Milo run in milo root:
```
aem up --port 6456
```
and access studio at http://localhost:3000/studio.html?milolibs=local

to test gallery:
1. shut down npm run studio if you were running it.
2.
```
npm run gallery
```

Refer to the corresponding README.md under any of the packages:
* studio - M@S Studio for creating, updating and publishing merch fragments
* ost-audit - crawls EDS pages HTML for OST links and generates a CSV report

## Nala E2E tests
for initial setup:
```
npm install
npx playwright install
export IMS_EMAIL=<val>
export IMS_PASS=<val>
```
Ask colleagues/slack for IMS_EMAIL ad IMS_PASS values, your user might not work as expected because it's not '@adobetest.com' account.

`npm run nala local` - to run on local
`npm run nala MWPW-160756` - to run on branch
`npm run nala MWPW-160756 mode=ui` - ui mode

Beware that 'npm run nala' runs `node nala/utils/nala.run.js`, it's not the script that GH action does. 
If you want to debug GH action script run sh `nala/utils/pr.run.sh`
# CI/CD
documented in .github/README.md

#### Troubleshooting
Please reach out to us in `#merch-at-scale` for any questions.
