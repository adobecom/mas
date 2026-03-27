# Dexter CC Plans Page FAQ

> Source: https://wiki.corp.adobe.com/display/adobedotcom/Dexter+CC+Plans+Page+FAQ
> Scraped: 2026-01-06T07:39:37.057Z

---


                           
        



# Dexter CC Plans Page/A.com D2P FAQ

Filtering URLs, Modals, FAQ

**Plans Page**

**TWP/D2P Modals (ROW)**

**Catalog**







# FAQs and Links

![image](/download/attachments/1830242372/CC%20gradient%20horizontal%20rule.png?version=1&modificationDate=1717196863407&api=v2)







- 1Plans URLs/Filters1.2What are the query parameters that select the tabs automatically?1.3What are the query parameters that select filters automatically?1.4What are the query parameters that rank a single app 2nd to All Apps in a filter automatically?
- 2Types of Modals2.1Content rich modal2.2Content rich modal Plans page URLs - Individuals2.3D2P modal2.4How to open up a Content rich modal on a page: 2.5Buy modal URLs2.6Business Plans page modal URLs2.8What's included modals:2.9Dual Try/Buy content rich modals:
- 3Intro Pricing





Helpful Links:

- Plans, Catalog, Buy Journey Tests - results, charters, resources, and personalization info
- Merch Squad Jira board
- Plans page AA Dashboard
- Catalog page AA Dashboard
- D2P Modal AA Dashboard







## Plans URLs/Filters

### 

CC Plans Page: [https://www.adobe.com/creativecloud/plans.html](https://www.adobe.com/creativecloud/plans.html?plan=individual)

The "Step 2" Business plans or Education plans pages for teams:

- https://www.adobe.com/creativecloud/business-plans.html
- https://www.adobe.com/creativecloud/education-plans.html

### What are the query parameters that select the tabs automatically?

The four tabs on the Plans Page can be selected automatically through the URL. To pre-select the tab, append the "plan" query parameter to the end of the URL with the appropriate value.

NOTE

**NOTE: Visitor's most recent filter state is saved/remembered for 24 hours.**







| Tab | Query Param | Example |
|---|---|---|
| Individual | plan=individual | https://www.adobe.com/creativecloud/plans.html?plan=individual |
| Business | plan=team | https://www.adobe.com/creativecloud/plans.html?plan=team |
| Students & Teachers | plan=edu | https://www.adobe.com/creativecloud/plans.html?plan=edu |
| Schools & Universities | plan=edu_inst | https://www.adobe.com/creativecloud/plans.html?plan=edu_inst |





| Step 2 for | Dexter Direct URL |
|---|---|
| Business | https://www.adobe.com/creativecloud/business-plans.html |
| Schools and Universities | https://www.adobe.com/creativecloud/education-plans.html |







### What are the query parameters that select filters automatically?

On the Dexter Plans Page, the Individual tab has filters for plan categories that control the display of plans as follows.







**Individuals Plans page***(/creativecloud/plans.html):*

| Left Rail categories | Query Parm | Example |
|---|---|---|
| All | filter=all | https://www.adobe.com/creativecloud/plans.html?filter=all |
| Graphic Design | filter=design | https://www.adobe.com/creativecloud/plans.html?filter=design |
| Photo | filter=photography | https://www.adobe.com/creativecloud/plans.html?filter=photography |
| Video | filter=video-audio | https://www.adobe.com/creativecloud/plans.html?filter=video-audio |
| Illustration | filter=illustration | https://www.adobe.com/creativecloud/plans.html?filter=illustration |
| Acrobat & PDF | filter=acrobat | https://www.adobe.com/creativecloud/plans.html?filter=acrobat |
| 3D and AR | filter=3dar | https://www.adobe.com/creativecloud/plans.html?filter=3dar |
| Social Media | filter=social | https://www.adobe.com/creativecloud/plans.html?filter=social |





*PLEASE NOTE - AS OF APRIL 2025 WE ARE NO LONGER USING THE A.COM BUSINESS PLANS PAGE AND A.COM EDU PLANS PAGE IN THE US. The Commerce M7 Business and EDU plans pages are now being used. ROW migration will follow*

**Step-2 Business plans page***(/creativecloud/business-plans.html):*

| Left Rail categories | Query Parm | Example |
|---|---|---|
| All apps | filter=all | https://www.adobe.com/creativecloud/business-plans.html?filter=all |
| Graphic Design | filter=design | https://www.adobe.com/creativecloud/business-plans.html?filter=design |
| Photo | filter=photography | https://www.adobe.com/creativecloud/business-plans.html?filter=photography |
| Video | filter=video-audio | https://www.adobe.com/creativecloud/business-plans.html?filter=video-audio |
| UI and UX | filter=web-ux | https://www.adobe.com/creativecloud/business-plans.html?filter=web-ux |
| Illustration | filter=illustration | https://www.adobe.com/creativecloud/business-plans.html?filter=illustration |
| Acrobat & PDF | filter=acrobat | https://www.adobe.com/creativecloud/business-plans.html?filter=acrobat |
| 3D and AR | filter=3dar | https://www.adobe.com/creativecloud/business-plans.html?filter=3dar |
| Social Media | filter=social | https://www.adobe.com/creativecloud/business-plans.html?filter=social |

| Commitment type | Query Param | URL |
|---|---|---|
| Pay annually | commitment=annual | https://www.adobe.com/creativecloud/business-plans.html?commitment=annual |
| Pay Monthly | commitment=monthly | https://www.adobe.com/creativecloud/business-plans.html?commitment=monthly |

Left rail filters and commitment type parameters can be used in combination. For example, the URL [https://www.adobe.com/creativecloud/business-plans.html?commitment=annual&filter=design](https://www.adobe.com/creativecloud/business-plans.html?commitment=annual&filter=design) should put the user in design filter and display the annual commitment prices







### What are the query parameters that rank a single app 2nd to All Apps in a filter automatically?

The "single_app" parameter will enable you to rank a specific single app 2nd to All Apps on the Plans page.

| App | Single App Query Param | URL Examples |
|---|---|---|
| Photoshop | single_app=photoshop | Based on testing we have found that sending users to the unfiltered all view is best for Photoshop, so please just use the following for photoshop: https://www.adobe.com/creativecloud/plans.html?filter=all |
| Illustrator | single_app=illustrator | https://www.adobe.com/creativecloud/plans.html?filter=illustration&plan=individual&single_app=illustrator |
| InDesign | single_app=indesign | https://www.adobe.com/creativecloud/plans.html?single_app=indesign |
| Acrobat Pro DC | single_app=acrobat | Please use: https://www.adobe.com/creativecloud/plans.html?filter=acrobatExtra option if needed - Acrobat as 2nd app in All view: https://www.adobe.com/creativecloud/plans.html?single_app=acrobat |
| Dreamweaver | single_app=dreamweaver | https://www.adobe.com/creativecloud/plans.html?single_app=dreamweaver |
| Animate | single_app=animate | https://www.adobe.com/creativecloud/plans.html?single_app=animate |
| Adobe Premiere Pro | single_app=premiere | https://www.adobe.com/creativecloud/plans.html?single_app=premiere |
| After Effects | single_app=aftereffects | https://www.adobe.com/creativecloud/plans.html?single_app=aftereffects |
| Audition | single_app=audition | https://www.adobe.com/creativecloud/plans.html?single_app=audition |
| InCopy | single_app=incopy | https://www.adobe.com/creativecloud/plans.html?single_app=incopy |
| Lightroom 1TB | single_app=lightroom_1tb | https://www.adobe.com/creativecloud/plans.html?filter=photography&plan=individual&single_app=lightroom_1tb |

TBD - photo plan resolutionThe Legacy "photo_plan" parameters from the Beagle Plans Page are mapped to Dexter Plans Page filters as follows:

| Offering | Legacy Query Param | Legacy URL Example | Mapped to Dexter Filter |
|---|---|---|---|
| Photography plan (20 GB)PHLT (Lightroom + Photoshop + 20 GB) | photo_plan=photography_20gb | https://www.adobe.com/creativecloud/plans.html?photo_plan=photography_20gb | Photography |
| Photography plan (1 TB)PLES (Lightroom + Photoshop + 1 TB) | photo_plan=photography_1tb | https://www.adobe.com/creativecloud/plans.html?photo_plan=photography_1tb | Photography |
| Lightroom CC plan (1 TB)LPES (Lightroom + 1 TB) | photo_plan=lightroom_1tb | https://www.adobe.com/creativecloud/plans.html?photo_plan=lightroom_1tb | Photography |








![image](/download/attachments/1830242372/CC%20gradient%20horizontal%20rule.png?version=1&modificationDate=1717196863407&api=v2)

## Types of Modals







### Content rich modal

**Used on Plans page, occasionally on Merch cards.**

Formatting on left side only displays selected app for Individuals. Also as of Q3 2024 this format is available for Teams for ALl Apps and Substance.

Example: [https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/aftereffects/master.modal.html](https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/aftereffects/master.modal.html)

![image](/download/attachments/1830242372/Screenshot%202024-03-04%20at%208.03.11%E2%80%AFAM.png?version=1&modificationDate=1709568228580&api=v2)

![image](/download/attachments/1830242372/Screenshot%202024-09-30%20at%209.08.07%E2%80%AFAM.png?version=1&modificationDate=1727713476910&api=v2)

### Content rich modal Plans page URLs - Individuals

1. https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/acrobat/master.modal.html
2. https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/acrobat-standard/master.modal.html
3. https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/aftereffects/master.modal.html
4. https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/animate/master.modal.html
5. https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/audition/master.modal.html
6. https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/cc-express/master.modal.html
7. https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/all-apps/master.modal.html
8. https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/dreamweaver/master.modal.html
9. https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/firefly/master.modal.html
10. https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/illustrator/master.modal.html
11. https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/incopy/master.modal.html
12. https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/indesign/master.modal.html
13. https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/lightroom/master.modal.html
14. https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/photography/master.modal.html
15. https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/photography1tb/master.modal.html
16. https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/photoshop/master.modal.html
17. https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/premierepro/master.modal.html
18. https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/stock/master.modal.html
19. https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/substance-3d-collection/master.modal.html
20. https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/substance-3d-texturing/master.modal.html





### D2P modal

**Used on Catalog page and on in-page CTAs for certain pages.**

Cards on left side, Segmentation available on the top allows users to choose between segments.

*(Look and feel mimics the TWP modals)*

*Example:*[https://www.adobe.com/mini-plans/buy/aftereffects.html?web=1](https://www.adobe.com/mini-plans/buy/aftereffects.html?web=1)

![image](/download/attachments/1830242372/Screenshot%202024-03-04%20at%208.02.44%E2%80%AFAM.png?version=1&modificationDate=1709568227143&api=v2)

![image](/download/attachments/1830242372/Screenshot%202024-03-04%20at%208.05.33%E2%80%AFAM.png?version=1&modificationDate=1709568339610&api=v2)

![image](/download/attachments/1830242372/Screenshot%202024-03-04%20at%208.05.39%E2%80%AFAM.png?version=1&modificationDate=1709568341120&api=v2)







### How to open up a Content rich modal on a page:

A modal component with an iframe inside has to be added to the file that will link to a Plans page with a CRM modal open. the iframe then has to point to the CRM modal files. eg. [https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/all-apps/master.modal.html](https://www.adobe.com/plans-fragments/modals/individual/modals-content-rich/all-apps/master.modal.html).

For more details, please view this wiki: [Linking to a Plans Page Content Rich Modal](/display/adobedotcom/Linking+to+a+Plans+Page+Content+Rich+Modal)

![image](/download/attachments/1830242372/Screenshot%202024-04-10%20at%2012.10.01%20PM.png?version=1&modificationDate=1712782829527&api=v2)





### Buy modal URLs

These are the URLs for the new Buy modals that are pointed to from Catalog page and live as of Jan 30 in the US.

1. https://www.adobe.com/mini-plans/buy/aftereffects.html?web=1
2. https://www.adobe.com/mini-plans/buy/animate.html?web=1
3. https://www.adobe.com/mini-plans/buy/audition.html?web=1
4. https://www.adobe.com/mini-plans/buy/dreamweaver.html?web=1
5. https://www.adobe.com/mini-plans/buy/illustrator.html?web=1
6. https://www.adobe.com/mini-plans/buy/incopy.html?web=1
7. https://www.adobe.com/mini-plans/buy/indesign.html?web=1
8. https://www.adobe.com/mini-plans/buy/photoshop-lightroom.html?web=1
9. https://www.adobe.com/mini-plans/buy/photoshop.html?web=1
10. https://www.adobe.com/mini-plans/buy/premiere.html?web=1
11. https://www.adobe.com/mini-plans/buy/acrobat-pro.html?web=1
12. https://www.adobe.com/mini-plans/buy/photoshop-lightroom-classic.html?web=1
13. https://www.adobe.com/mini-plans/buy/substance3d-collection.html?web=1
14. https://www.adobe.com/mini-plans/buy/ai-assistant-acrobat.html

For defaulting to a certain tab, you can add a query parameter to all the URLs like so:

1. &plan=team for Teams
2. &plan=edu for Students

Example: [https://www.adobe.com/mini-plans/buy/illustrator.html?web=1&plan=team](https://www.adobe.com/mini-plans/buy/illustrator.html?web=1&plan=team)







### Business Plans page modal URLs

These modals are linked to from the "See details" CTAs on the Business plans page ([https://www.adobe.com/creativecloud/business-plans.html](https://www.adobe.com/creativecloud/business-plans.html)) cards -

1. https://www.adobe.com/content/experience-fragments/offers-plans/us/en/plans-fragments/modals/business/modals/acrobat/master.html?allowfullpath=true
2. https://www.adobe.com/content/experience-fragments/offers-plans/us/en/plans-fragments/modals/business/modals/acrobat-standard/master.html?allowfullpath=true
3. https://www.adobe.com/content/experience-fragments/offers-plans/us/en/plans-fragments/modals/business/modals/ai-assitant-acrobat/master.html?allowfullpath=true
4. https://www.adobe.com/content/experience-fragments/offers-plans/us/en/plans-fragments/modals/business/modals/aftereffects/master.html?allowfullpath=true
5. https://www.adobe.com/content/experience-fragments/offers-plans/us/en/plans-fragments/modals/business/modals/animate/master.html?allowfullpath=true
6. https://www.adobe.com/content/experience-fragments/offers-plans/us/en/plans-fragments/modals/business/modals/audition/master.html?allowfullpath=true
7. https://www.adobe.com/content/experience-fragments/offers-plans/us/en/plans-fragments/modals/business/modals/creativecloud/master.html?allowfullpath=true
8. https://www.adobe.com/content/experience-fragments/offers-plans/us/en/plans-fragments/modals/business/modals/cc-express/master.html?allowfullpath=true
9. https://www.adobe.com/content/experience-fragments/offers-plans/us/en/plans-fragments/modals/business/modals/dreamweaver/master.html?allowfullpath=true
10. https://www.adobe.com/content/experience-fragments/offers-plans/us/en/plans-fragments/modals/business/modals/illustrator/master.html?allowfullpath=true
11. https://www.adobe.com/content/experience-fragments/offers-plans/us/en/plans-fragments/modals/business/modals/incopy/master.html?allowfullpath=true
12. https://www.adobe.com/content/experience-fragments/offers-plans/us/en/plans-fragments/modals/business/modals/indesign/master.html?allowfullpath=true
13. https://www.adobe.com/content/experience-fragments/offers-plans/us/en/plans-fragments/modals/business/modals/lightroom/master.html?allowfullpath=true
14. https://www.adobe.com/content/experience-fragments/offers-plans/us/en/plans-fragments/modals/business/modals/photoshop/master.html?allowfullpath=true
15. https://www.adobe.com/content/experience-fragments/offers-plans/us/en/plans-fragments/modals/business/modals/premierepro/master.html?allowfullpath=true
16. https://www.adobe.com/content/experience-fragments/offers-plans/us/en/plans-fragments/modals/business/modals/stock/master.html?allowfullpath=true
17. https://www.adobe.com/content/experience-fragments/offers-plans/us/en/plans-fragments/modals/business/modals/substance-3d-collection/master.html?allowfullpath=true







### 

### What's included modals:







New redesigned links with**try and buy**

*For use on TWP card what's included links, catalog banner, Top Tasks merch cards:*

![image](/download/attachments/1830242372/Screenshot%202024-03-21%20at%208.37.52%20AM.png?version=1&modificationDate=1717198348103&api=v2)

1. https://www.stage.adobe.com/creativecloud/whats-included/mini-plans/cci-all-apps-whats-included.html
2. https://www.stage.adobe.com/creativecloud/whats-included/mini-plans/cct-all-apps-whats-included.html
3. https://www.stage.adobe.com/creativecloud/whats-included/mini-plans/edu-all-apps-whats-included.html

Examples:

![image](/download/attachments/1830242372/Screenshot%202024-05-31%20at%204.38.30%E2%80%AFPM.png?version=1&modificationDate=1717198772147&api=v2)![image](/download/attachments/1830242372/Screenshot%202024-05-31%20at%204.39.22%E2%80%AFPM.png?version=1&modificationDate=1717198772440&api=v2)





New redesigned links with **buy CTAs only** -

For use on for non MIlo merch cards (example below), Plans page tabs and Plans page references:

![image](/download/attachments/1830242372/Screenshot%202024-03-21%20at%208.47.57%20AM.png?version=1&modificationDate=1717198427730&api=v2)

1. https://www.adobe.com/creativecloud/whats-included/plans/edu-all-apps-whats-included.html
2. https://www.adobe.com/creativecloud/whats-included/plans/edu-inst-all-apps-whats-included.html
3. https://www.adobe.com/creativecloud/whats-included/plans/cct-all-apps-whats-included.html
4. https://www.adobe.com/creativecloud/whats-included/plans/cci-all-apps-whats-included.html

![image](/download/attachments/1830242372/Screenshot%202024-05-31%20at%204.34.33%E2%80%AFPM.png?version=1&modificationDate=1717198476950&api=v2)![image](/download/attachments/1830242372/Screenshot%202024-05-31%20at%204.35.49%E2%80%AFPM.png?version=1&modificationDate=1717198588457&api=v2)![image](/download/attachments/1830242372/Screenshot%202024-05-31%20at%204.36.02%E2%80%AFPM.png?version=1&modificationDate=1717198608220&api=v2)







### Dual Try/Buy content rich modals:

To be created in Q1 for all products (Business and Individual) and for All Apps students

For use on pages where there are two side by side Try/Buy CTAs that will be reduced to ONE CTA - "Select" - that launches the dual try/buy Content rich modal

![image](/download/attachments/1830242372/Screenshot%202024-01-16%20at%204.04.15%E2%80%AFAM%20%282%29.png?version=1&modificationDate=1727713604110&api=v2)

![image](/download/attachments/1830242372/Screenshot%202024-01-18%20at%208.48.43%E2%80%AFAM%20%285%29.png?version=1&modificationDate=1727713604417&api=v2)

![image](/download/attachments/1830242372/Screenshot%202024-01-16%20at%204.00.45%E2%80%AFAM%20%282%29.png?version=1&modificationDate=1727713603783&api=v2)











![image](/download/attachments/1830242372/CC%20gradient%20horizontal%20rule.png?version=1&modificationDate=1717196863407&api=v2)

## Intro Pricing

The Plans page supports Intro pricing as follows.

Types of intro pricing:

- CCI Intro pricing
- CCT intro pricing
- Photography intro pricing
- Express intro pricing
- Acrobat Standard intro pricing
- Acrobat pro intro pricing

pls refer to [ACOM - International Geos.xlsx](https://adobe.sharepoint.com/:x:/s/Adobedotcom/EcmErnZeI_xDlWslOD2qPk8BgtRySMFVpMyjj2BbizTCsg?e=T4KNad)  as source of truth of all current geos. There is also an additional sheet that Natalia maintains here: [Intl pricing programs](https://adobe.sharepoint.com/:x:/s/EMEAWebExperience/EfdYhoenEgJBn-vyrq_WDXsBG_P1kEb6cZM8FKpHFtjTpg?e=rpGc84&nav=MTVfezExOEZGNEQ2LThGRDQtNDFGNS05NjQ5LTdGRjE5NzY0NUQ0MH0&xsdata=MDV8MDJ8bHNvZ2FyZEBhZG9iZS5jb218MTUxZGNkMjZhNGUyNDk0NDI3ZGIwOGRjZDRiMDZkZTZ8ZmE3YjFiNWE3YjM0NDM4Nzk0YWVkMmMxNzhkZWNlZTF8MHwwfDYzODYxOTEwMTQzNDg3ODk4NnxVbmtub3dufFRXRnBiR1pzYjNkOGV5SldJam9pTUM0d0xqQXdNREFpTENKUUlqb2lWMmx1TXpJaUxDSkJUaUk2SWsxaGFXd2lMQ0pYVkNJNk1uMD18MHx8fA%3d%3d&sdata=RWRmSUpIVzUycCtXcnZzMmdodjJIY1BBUGtYRHB5RUFwa2hpVk1rQ09Ydz0%3d)







### 

###### Archive

Archive###### What are the query parameters to automatically populate the CCT cart?

The Business "Step 2" CCT cart can also be "auto filled" with one or more plans by using properly constructed (and encoded) URL parameters. Construct the "items" parameter following the "Raw URL" example, and then encode it for usage:

| Example | Raw (unencoded) URL for constructing link | Encoded URL (this must be used for URL to work) |
|---|---|---|
| Photoshop, 1 license | https://www.adobe.com/creativecloud/business-plans.html?countryCode=US&term=MONTHLY&commitment=YEAR&items=[{"offerId":"D5349E66BACCC8C1B3C1EA63348ED949","quantity":"1","cs":""}] | https://www.adobe.com/creativecloud/business-plans.html?countryCode=US&term=MONTHLY&commitment=YEAR&items=%5B%7B%22offerId%22%3A%22D5349E66BACCC8C1B3C1EA63348ED949%22%2C%22quantity%22%3A%221%22%2C%22cs%22%3A%22%22%7D%5D |
| Photoshop (2 licenses) and All Apps (1 licenses) | https://www.adobe.com/creativecloud/business-plans.html?countryCode=US&term=MONTHLY&commitment=YEAR&items=[{"offerId":"D5349E66BACCC8C1B3C1EA63348ED949","quantity":"2","cs":""},{"offerId":"7B3FB5E4F8662A207A960BAFB6B1C21C","quantity":"1","cs":""}] | https://www.adobe.com/creativecloud/business-plans.html?countryCode=US&term=MONTHLY&commitment=YEAR&items=%5B%7B%22offerId%22%3A%22D5349E66BACCC8C1B3C1EA63348ED949%22%2C%22quantity%22%3A%222%22%2C%22cs%22%3A%22%22%7D%2C%7B%22offerId%22%3A%227B3FB5E4F8662A207A960BAFB6B1C21C%22%2C%22quantity%22%3A%221%22%2C%22cs%22%3A%22%22%7D%5D |

To construct these URLs, you'll need the correct offer ID's, which you can get from: [http://linkgenerator-dev-us-west-2.stage.cloud.adobe.io/](http://linkgenerator-dev-us-west-2.stage.cloud.adobe.io/)

In the Unified Checkout Link Generator, you will probably want to use the following to find the offer ID's that you need:

- Environment: production
- clientId: creative (The "creative" clientID is used by the Plans Page...it sends customers to Downloads after checkout. If you use the "adobe_com" client ID, customers go to Account Management after checkout.)
- Filter offers by: COM Teams
- Filter by price point: Regular (unless you want promo SKUs)
- Filter by service commitment: Annual Plan, Paid Monthly (unless you want to specify Annual Plan, Prepaid)

NOTE: All Apps (without Stock) is listed as “Creative Cloud for teams” in the Link Generator.

In the "items" array, you also specify license quantity (i.e."quantity":"2") and country scope ("cs"). In the examples above, cs is not specified. This will default to however the plans page is authored, which should be what you want. If you need to change the country scope from default, you can specify cs as follows:

- 0 = global ("cs":"0")
- 1 = country specific  ("cs":"1")
- 2 = region specific  ("cs":"2")

Once you construct the items array, you'll need to encode it using something like [https://www.urlencoder.org](https://www.urlencoder.org)

For example, for US, Photoshop, Regular, Annual Plan Paid Monthly, single quantity, default country scope, the items array is:

[{"offerId":"D5349E66BACCC8C1B3C1EA63348ED949","quantity":"1","cs":""}]That should encode into:

%5B%7B%22offerId%22%3A%22D5349E66BACCC8C1B3C1EA63348ED949%22%2C%22quantity%22%3A%221%22%2C%22cs%22%3A%22%22%7D%5DYou then add that to the plain text URL portion (note that this portion of the URL needs to be customized for country and service commitment):

https://www.adobe.com/creativecloud/plans.html?step=2&plan=team&countryCode=US&term=MONTHLY&commitment=YEAR&items=to get:

https://www.adobe.com/creativecloud/plans.html?step=2&plan=team&countryCode=US&term=MONTHLY&commitment=YEAR&items=%5B%7B%22offerId%22%3A%22D5349E66BACCC8C1B3C1EA63348ED949%22%2C%22quantity%22%3A%221%22%2C%22cs%22%3A%22%22%7D%5DAlso, you can **set the Service term on the CCT Plans Page**, without also adding items to the cart using this approach. Here's a US example:

Default the Dexter Step 2 page to Annual Plan, Paid Monthly:
[https://www.adobe.com/creativecloud/business-plans.html?term=MONTHLY&commitment=YEAR](https://www.adobe.com/creativecloud/business-plans.html?term=MONTHLY&commitment=YEAR)

Default the Dexter Step 2 page to Annual, Prepaid:
[https://www.adobe.com/creativecloud/business-plans.html?term=ANNUAL&commitment=YEAR](https://www.adobe.com/creativecloud/business-plans.html?term=ANNUAL&commitment=YEAR)

**De-prioritized sub-locales**

The Dexter Plans Page uses a different architecture than the previous Beagle Plans Page, and uses dedicated pages for the most important sub-locales. This allows the sub-locales to be more customizable than before, but it also means that the smaller countries are served by the default regional page. Pricing is still correct for these de-prioritized countries (USD), but these default pages send the "US" country code to Checkout. Customers will change to their local country in Checkout, when either logging in or creating a new Adobe ID. These countries are:

- Latin America:
- Costa Rica (CR)Ecuador (EC)Guatemala (GT)Venezuela (VE)
- Middle East/North Africa:
- Bahrain (BH)Egypt (EG)Jordon (JO)Kuwait (KW)Oman (OM)Qatar (QA)Algeria (DZ)Lebanon (LB)Morocco (MA)
- Commonwealth of Independent States:
- Belarus (BY)Kazakhstan (KZ)Tajikistan (TJ)Kyrgyzstan (KG)Uzbekistan (UZ)Azerbaijan (AZ)Moldova (MD)Armenia (AM)Turkmenistan (TM)Georgia (GE)

Each umbrella region has a default "region" plans page, and dedicated sub-locale plans pages for the most important sub-countries in that region. If a visitor lands on the default regional plans page, and they are detected to belong to one of the supported sub-locales, they are instantly redirected to the dedicated sub-locale plans page. Visitors countries are detected by looking at their IP address, Adobe ID country, and [adobe.com](http://adobe.com) cookies. (Adobe employees can also add a country code to the regional page URL to simulate this geo-detection, for example, by using, say, ".../la/creativecloud/plans.html?country=pe"

| Default regional plans page | Sub-countries and country codes | Currency | Dedicated sub-locale plans pages |
|---|---|---|---|
| Latin America - USDhttps://www.adobe.com/la/creativecloud/plans.html | Argentina - arChile - clColumbia - coPeru - pe | Ar$Ch$Col$S/ | https://www.adobe.com/ar/creativecloud/plans.htmlhttps://www.adobe.com/cl/creativecloud/plans.html own site as of March 2021 no longer under umbrellahttps://www.adobe.com/co/creativecloud/plans.htmlhttps://www.adobe.com/pe/creativecloud/plans.html |
| Southeast Asia - S$https://www.adobe.com/sea/creativecloud/plans.html | Indonesia - idMalaysia - myPhillippines - ph | RpRM₱ | https://www.adobe.com/id/creativecloud/plans.htmlhttps://www.adobe.com/my/creativecloud/plans.htmlhttps://www.adobe.com/ph/creativecloud/plans.html |
| Middle East/North Africa - USDhttps://www.adobe.com/mena_en/creativecloud/plans.htmlhttps://www.adobe.com/mena_ar/creativecloud/plans.html | Saudi Arabia - saUAE - ae | SRSRUSDUSD | https://www.adobe.com/sa_en/creativecloud/plans.htmlhttps://www.adobe.com/sa_ar/creativecloud/plans.htmlhttps://www.adobe.com/ae_en/creativecloud/plans.htmlhttps://www.adobe.com/ae_ar/creativecloud/plans.html - Now these are their own sites as of March 2021 |
| Commonwealth of Independent States - USDhttps://www.adobe.com/cis_en/creativecloud/plans.htmlhttps://www.adobe.com/cis_ru/creativecloud/plans.html | (none) |  | (none) |

###### Dexter vs. Beagle CC Plans Page

The new Dexter CC Plans Page replaced the legacy Beagle CC Plans Page starting in late September, 2019, on a geo-by-geo basis, according to the following timeline:

| Geos | Dexter Live Date |
|---|---|
| US | 10/3/2019 |
| TIER 3: BR, KR, TW, HK_ZH, MX, AFRICA, CA_FRTIER 4: CZ, PL, RO, BG, HU, LV, LT, EE, SK, SI, CA_EN, HK_EN, IE, BE_EN, CY_EN, GR_EN, LU_EN, BE_FR, CH_FR, LU_FR, CH_DE, LU_DE, CH_IT, BE_NL, PT, MT, AT, IN | 12/9/2019 |
| TIER 2: IT, ES, NL, SE, DK, FI, NO | 12/10/2019 |
| TIER 1: UK, FR, DE, AU, NZ | 12/11/2019 |
| JP, RU | 1/28/2020 |
| TR, IL_EN, IL_HE | 3/2/2020 |
| UA, MENA_EN, MENA_AR, CIS_EN, CIS_RU, SEA, LA | 5/11/2020 |

(The archived legacy Beagle Plans Page FAQ is here: [https://wiki.corp.adobe.com/pages/viewpage.action?spaceKey=MWPPDM&title=CC+Plans+Page+FAQ](https://wiki.corp.adobe.com/pages/viewpage.action?spaceKey=MWPPDM&title=CC+Plans+Page+FAQ))

The base URL for the CC Plans Page remains the same on Beagle and Dexter: [https://www.adobe.com/creativecloud/plans.html](https://www.adobe.com/creativecloud/plans.html?plan=individual)

However, the Dexter Plans Page introduced 2 new pages for each geo, replacing "Step 2" for both the Business and the Schools & Universities tabs:

[https://www.adobe.com/creativecloud/business-plans.html](https://www.adobe.com/creativecloud/business-plans.html)

[https://www.adobe.com/creativecloud/education-plans.html](https://www.adobe.com/creativecloud/education-plans.html)

Geo expansion March 2021:

[https://www.adobe.com/ae_ar/](https://www.adobe.com/ae_ar/)
[https://www.adobe.com/ae_en/](https://www.adobe.com/ae_en/)
[https://www.adobe.com/cl/](https://www.adobe.com/cl/)
[https://www.adobe.com/sg/](https://www.adobe.com/sg/)
[https://www.adobe.com/sa_ar/](https://www.adobe.com/sa_ar/)
[https://www.adobe.com/sa_en/](https://www.adobe.com/sa_en/)
[https://www.adobe.com/th_en/](https://www.adobe.com/th_en/)

May 2021: [https://www.adobe.com/th_th/](https://www.adobe.com/th_th/)

Upcoming geo expansion June 2022: (For Plans and Catalog the /la sites already existed: /ar, /cl, /co, /pe)

In the Phase 1 geo expansion these /sea geos changed
Changed from /ph /id and /my to:
[https://www.adobe.com/ph_en/](https://www.adobe.com/ph_en/) (Philippines / English)
[https://www.adobe.com/id_en/](https://www.adobe.com/id_en/) (Indonesia / English)
[https://www.adobe.com/my_en/](https://www.adobe.com/my_en/) (Malaysia / English)
New site launched for Vietnam English
[https://www.adobe.com/vn_en/](https://www.adobe.com/vn_en/) (Vietnam / English)
Phase 2 these sites will launch
[https://www.adobe.com/ph_ph/](https://www.adobe.com/ph_ph/) (Philippines / Filipino)
[https://www.adobe.com/id_id/](https://www.adobe.com/id_id/) (Indonesia / Indonesian)
[https://www.adobe.com/my_ms/](https://www.adobe.com/my_ms/) (Malaysia / Malay)
[https://www.adobe.com/vn_vn/](https://www.adobe.com/vn_vn/) (Vietnam / Vietnamese)
[https://www.adobe.com/in_hi/](https://www.adobe.com/in_hi/) (India / Hindi)

**Country to plans page mapping  - https://adobe-my.sharepoint.com/:x:/p/thamalap/EX0XfQAluGdJgj8oOU-qinMBeS4XldABfioq3B4Vqrtbww?e=Cq5r9i**

**Adobe.com mapping to NGL locales**

**Geo-routing logic for visitors to Umbrella Regions**

![image](/download/attachments/1830242372/DxWithUmbrellaGeorouting.jpg?version=1&modificationDate=1592529674987&api=v2)

On the Dexter Plans Page, the Individual tab has filters for plan categories that control the display of plans as follows. Note that the **US Plans Page launched new "Left Rail" filters on 9/23/20**, and ROW is expected to get Left Rail filters in Q1 2021:
























                
        
    
        