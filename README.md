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
aem up
```

Refer to the corresponding README.md under any of the packages:
* commerce - contains generic commerce-related logic, 'price' and 'checkout-link' web components
* web-components - merch-card, merch-offer-selector and other web components
* studio - M@S Studio for creating, updating and publishing merch fragments

# Pre push hook
Before each push 'npm run build:precommit' is triggered.
1. It will build the artifacts in /libs folder
2. If any of the artifacts have an update the hook will stage the changes and commit
3. If there are unstaged/uncommitted changed the hook will prevent the push

There is no need to run 'npm run build:precommit' manually, but before commits are pushed no unstaged changes should exist in the mas folder.
For milo consumption please continue as before, with 'npm run build' command & manual copy of files to milo repository.

#### Troubleshooting
Please reach out to us in `#tacocat-friends` for any questions.