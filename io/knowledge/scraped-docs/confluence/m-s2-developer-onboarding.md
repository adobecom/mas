# M@S2 Developer Onboarding

> Source: https://wiki.corp.adobe.com/display/adobedotcom/M@S2+Developer+Onboarding
> Scraped: 2026-01-06T07:39:37.051Z

---


                           
        Subpages:

- A11Y
- Adobe Home Integration Gap Analysis
- Code Conventions
- Display prices tax excluded
- IMS
- IO Runtime Fragment pipeline (/mas/io)
- M@S Studio
- ODIN
- Surface: ACOM
- Surface: Adobe Home
- Surface: CCD
- Surface: Commerce
- Troubleshooting
- WCS

On this Page:

- 1Code
- 2Roadmap2.1Figma Access2.2AOS2.3AEM Sites API
- 3Freyja
- 4Nala & Monitoring & Logs (Splunk)4.1WCS Logs4.2CCD Logs
- 5PR branch naming
- 6Release mas npm package6.1Permissions / Groups
- 7Kitchen Sink
- 8Miro Boards
- 9Communication
- 10IMS
- 11Web Commerce Service11.1subscribing surface user to the service
- 12Troubleshooting12.11 Feature branch in MAS - studio inaccessible, IMS redirects to https://www.adobe.com/mas/studio.html12.22 Studio is broken because JS file is not updated

# Code

| Component | Git Repository |
|---|---|
| M@S Studio | https://github.com/adobecom/mas |
| M@S Web Components | https://github.com/adobecom/milo/tree/stage/libs/features/mas |
| Offer Selector Tool | https://git.corp.adobe.com/wcms/tacocat.js |

# Roadmap

[https://miro.com/app/board/uXjVLFAukUo=/](https://miro.com/app/board/uXjVLFAukUo=/)

AH/CCD FIGMA 2025 [https://www.figma.com/files/1177024566520626109/project/106326416?fuid=1346507853512513299](https://www.figma.com/files/1177024566520626109/project/106326416?fuid=1346507853512513299)

## Figma Access

In IAM request access to GRP-AD-FIGMA-VIEWERRESTRICTED

## AOS

[https://developers.corp.adobe.com/aos/docs/guide/apis/api.yaml#/paths/offers/get](https://developers.corp.adobe.com/aos/docs/guide/apis/api.yaml#/paths/offers/get)

## AEM Sites API

Used to fetch/update fragments in Odin:

[https://developer.adobe.com/experience-cloud/experience-manager-apis/api/stable/sites/](https://developer.adobe.com/experience-cloud/experience-manager-apis/api/stable/sites/)

# Freyja

[Content Fragment Delivery with OpenAPI](/display/AEMSites/Content+Fragment+Delivery+with+OpenAPI)

[AEMSites:Project Freyja - Merch @Scale](#)

API docs: [https://git.corp.adobe.com/pages/lpalk/aem-sites-api-schema/#tag/Fragment-Delivery/operation/fragments/getFragment](https://git.corp.adobe.com/pages/lpalk/aem-sites-api-schema/#tag/Fragment-Delivery/operation/fragments/getFragment)

# Nala & Monitoring & Logs (Splunk)

[Assets for Nala cards](https://adobe.sharepoint.com/sites/adobecom/Shared%20Documents/Forms/AllItems.aspx?cid=8c9830b3%2D1f14%2D4327%2D9223%2D0517f6b4013c&FolderCTID=0x012000F36D5B4C46F81741BCAC9F03FA9F93D1&id=%2Fsites%2Fadobecom%2FShared%20Documents%2Fmilo%2Fassets%2Fimg%2Fcommerce&viewid=d776cf70%2D9b7e%2D4ab7%2Db9da%2D9e0f8e03a7d2)

CCD Gallery Page: [https://main--milo--adobecom.hlx.page/libs/features/mas/docs/ccd.html](https://main--milo--adobecom.hlx.page/libs/features/mas/docs/ccd.html)  is used for Nala tests to verify cards. Those tests are located and triggered in Milo. (masccd.test.js)

Similar will be created for other surfaces.

Nala tests for Studio are located in mas repo and run on each MAS PR.

Splunk & Logs wiki: [BaaP:M@S Monitoring with Lana](#) (read the page to find out how to get access, there is a link there)

There are 2 alerts at the moment. One generic alert, when amount on merch errors is bigger than usual (usual right now is around 7-8k errors a day, might change). That is so called anti-CSO alert, it is not design to identify small content issues but rather will scream at us if large amount of prices/cta can't be resolved and impact on users is big.

Second alert is CCD tailored and currently in tuning.

## WCS Logs

```
splunk groups:
```


```
Splunk CT - wcs_admin, Splunk CT - wcs_dev
Splunk CT - generic_adobeio_access_all_logs_nonpciand below
```


```
Go to IAM, Click Access Requests -> Request -> Myself -> "Splunk AWS", select IAM groups: GRP-WCS-ENG, GRP-WCS-FRIENDS
```

## CCD Logs

```
Go to IAM, Click Access Requests -> Request -> Myself -> "Splunk AWS", select:
```

- GRP-SPLUNK-AWS-DUNAMIS-DEV-PROD
- GRP-SPLUNK-AWS-CCD_DEV_PROD

Query:


```
index=dunamis-prod-all producer=dunamis project IN (ccd-win-debug-service, ccd-mac-debug-service) source_version=6.5* ccd_event_source="MAS" ccd_event_subtype="operational" event_type IN ("mas-failed", "mas-error") event_subcategory IN ("on-mount", "on-refresh")
| stats count by event_error_desc
```


# PR branch naming

If you name your branch with ticket format mwpw-* (e.g. [https://mwpw-159269--mas--adobecom.hlx.live/](https://mwpw-159269--mas--adobecom.hlx.live/)) it will enabled on IMS by default.

# Release mas npm package

1. in /libs/features/mas in package.json remove the content of "dependencies", leaving {}.
2. bump the version if needed (e.g. 0.4.0)
3. run npm install
4. run 'npm pack'
5. in https://github.com/adobecom/milo/releasesclick 'Draft a new release',chose branch to be either main or mas-releasesupload the .tgz fileprovide the descriptionadd a tag (e.g. mas-v0.4.0)and publish.
6. commit git changes

## Permissions / Groups

[Merch at Scale (M@S) IAM Groups & Permissions](/pages/viewpage.action?pageId=3330873329)

# Kitchen Sink

[https://main--milo--adobecom.hlx.live/libs/features/mas/docs/ccd.html](https://main--milo--adobecom.hlx.live/libs/features/mas/docs/ccd.html)

# Miro Boards

Miro Board - M@S Roadmap: [https://miro.com/app/board/uXjVLFAukUo=/](https://miro.com/app/board/uXjVLFAukUo=/)

Miro Board - M@Sv2 vision: [https://miro.com/app/board/uXjVPINts_E=/?track=true&utm_source=notification&utm_medium=email&utm_campaign=approve-request&utm_content=go-to-miro](https://miro.com/app/board/uXjVPINts_E=/?track=true&utm_source=notification&utm_medium=email&utm_campaign=approve-request&utm_content=go-to-miro)

Technical Diagrams: [https://miro.com/app/board/uXjVIRQ_2mk=/?userEmail=lukianet@adobe.com&track=true&utm_source=notification&utm_medium=email&utm_campaign=add-to-board&utm_content=go-to-board&share_link_id=124597654095&lid=lmk46fuyqo6b](https://miro.com/app/board/uXjVIRQ_2mk=/?userEmail=lukianet@adobe.com&track=true&utm_source=notification&utm_medium=email&utm_campaign=add-to-board&utm_content=go-to-board&share_link_id=124597654095&lid=lmk46fuyqo6b)

# Communication

| Channel | Purpose |
|---|---|
| #merch-at-scale | Our channel. Any M@S related DM can be forwarded here before answerring. |
| #project-freyja | Questions about Freyja. Jira needed only on-demand. |
| #project-odin-stakeholders | Odin issues. For any issue log an ODIN-xxxxxx ticket, then post in channel. No need to mention anyone. |
| #ccd-merch-collaboration | CCD Integration |
| #merch_card_ah_integration | AH Integration |
| #mas-ccd-testing | QA&Monitoring |
| #mas-ux-chat | M@S Design, collaboration with Vetri |
| #catalog-support | Any issue with commerce that is not us. AOS, WCS etc. |
| #checkout-support | Issues with Checkout Page. (https://commerce.adobe.com...) |

# IMS

[https://imss.corp.adobe.com/#/client/prod/mas-studio](https://imss.corp.adobe.com/#/client/prod/mas-studio)

# Web Commerce Service

API: [https://developers.corp.adobe.com/wcs/docs/api/openapi/wcs/latest.yaml#/operations/web_commerce_artifact](https://developers.corp.adobe.com/wcs/docs/api/openapi/wcs/latest.yaml#/operations/web_commerce_artifact)

## subscribing surface user to the service

please pick one user for stage and one for production, preferably with recognizable ids, and subscribe to "web commerce service" on stage and prod through [https://developers.corp.adobe.com/api-platform/docs/subscribe-api-keys-to-services.md](https://developers.corp.adobe.com/api-platform/docs/subscribe-api-keys-to-services.md)

# Troubleshooting

## 1 Feature branch in MAS - studio inaccessible, IMS redirects to https://www.adobe.com/mas/studio.html

temp mitigation:

add your feature branch to allow-listed domains

![image](/download/attachments/3287999746/image-2024-9-16_16-20-36.png?version=1&modificationDate=1726496437790&api=v2)

## 2 Studio is broken because JS file is not updated

If JS file on aem.page is served correctly - clean Akamai cache.

For Akamai you can use [https://ccp.corp.adobe.com/akamai.php](https://ccp.corp.adobe.com/akamai.php) 
![image](/download/thumbnails/3287999746/image-2025-3-6_15-51-19.png?version=1&modificationDate=1741272679717&api=v2)
If file on aem.page / aem.live is not served correctly:
For EDS [https://www.aem.live/docs/admin.html#tag/cache](https://www.aem.live/docs/admin.html#tag/cache) or [https://www.aem.live/docs/admin.html#tag/code](https://www.aem.live/docs/admin.html#tag/code)



                
        
    
        