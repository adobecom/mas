# Merch At Scale
This project is a library of web components providing merchandising content to various surfaces.

## Environments
- Preview: https://main--mas--adobecom.hlx.page/
- Live: https://main--mas--adobecom.hlx.live/

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


#### Troubleshooting
Please reach out to us in `#tacocat-friends` for any questions.