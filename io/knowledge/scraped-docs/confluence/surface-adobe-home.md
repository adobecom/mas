# Surface: Adobe Home

> Source: https://wiki.corp.adobe.com/display/adobedotcom/Surface%3A+Adobe+Home
> Scraped: 2026-01-06T07:39:37.059Z

---


                           
        Use cases Wiki: [Merch @ Scale Use cases & Requirements for CCD & Adobe Home](/pages/viewpage.action?pageId=3263727576)

## Figma

[design figma](https://www.figma.com/design/7tUtNgFelfMjgPoJ5QcE1k/Merch%40Scale-Frameworks?node-id=9-76&p=f&t=u1JfvwSVyBdcBZ42-0)

scope:  the widget showing 3 cards (“General pricing” label in Figma), 2 cards (“Double width card” label), and 1 card (“Single width card” label). This POC tested the 3-card version only I believe.

## Local Build

[https://git.corp.adobe.com/nest/nest](https://git.corp.adobe.com/nest/nest)

1. Clone and switch to branch branch -> ritvikk/M@S
2. Yarn cache clean
3. Nvm use 18
4. cd nest
5. set ARTIFACTORY_USER and ARTIFACTORY_API_TOKEN
6. if you have 403/401 issue:set NPM_TOKEN as welltry to modify .npmrc in project root and set instead authToken, not api key
7. yarn install
8. sudo yarn setup
9. cd apps/adobe-home-web
10. yarn start



                
        
    
        