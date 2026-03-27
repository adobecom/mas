# M@S Studio design document

> Source: https://wiki.corp.adobe.com/display/WP4/M@S+Studio+design+document
> Scraped: 2026-01-06T07:39:37.062Z

---


                           
        # Overview

m@s studio is an user interface for creating, editing, and publishing merchandising content, that can be used on different adobe surfaces.

# architecture

studio is first and foremost a web application, deployed through [EDS](https://www.aem.live/) that communicates to [odin](https://wiki.corp.adobe.com/display/ODIN/Project+Odin).  Code is deployed through [https://github.com/adobecom/mas/tree/main/studio/](https://github.com/adobecom/mas/tree/main/studio/) (EDS does then deploy it to typical EDS CDN) and then is reverse proxied by akamai at the mas.adobe.com FQDN, with no cache.

![image](/download/attachments/3567307009/image-2025-7-23_11-12-48.png?version=1&modificationDate=1753262425517&api=v2)

# security

## access

access is done through public [https://mas.adobe.com/studio.html](https://mas.adobe.com/studio.html) that requires IMS authentication, and proper ODIN ACLs (done through IAM groups). All read & write requests are either direcIMS token is then passed along all operations made to odin.

Write acess to a given subfolder needs specific ODIN rights being setup for him.

## XSS

Both forms validations in studio, and Odin write APIS are protected against XSS injections

# content architecture

![image](/download/thumbnails/3567307009/image-2025-7-25_12-13-8.png?version=1&modificationDate=1753438389467&api=v2)

![image](/download/attachments/3567307009/image-2025-2-19_9-8-27.png?version=1&modificationDate=1753436464943&api=v2)

![image](/download/thumbnails/3567307009/image-2025-2-19_9-9-34.png?version=1&modificationDate=1753436465000&api=v2)

## Requirements

[Odin / Freyja requirements](/pages/viewpage.action?pageId=3304129681)

## card content model

some more detail in [there](https://wiki.corp.adobe.com/display/WP4/Card+Content+Model)

## i13n

each one of m@s consumer has its own set of locales

### adobe.com

source: [https://github.com/adobecom/milo/blob/main/libs/utils/locales.js](https://github.com/adobecom/milo/blob/main/libs/utils/locales.js)

### CCD

source: [https://git.corp.adobe.com/ccd/ccd-app/blob/develop/configs/webpack/build/utils.js](https://git.corp.adobe.com/ccd/ccd-app/blob/develop/configs/webpack/build/utils.js)


[?](#)| 'cz_CZ','da_DK','de_DE','en_US','es_ES','es_MX','fi_FI','fr_CA','fr_FR','id_ID','hu_HU','it_IT','ja_JP','ko_KR','nb_NO','nl_NL','pl_PL','pt_BR','ru_RU','sv_SE','th_TH','tr_TR','vi_VN','uk_UA','zh_CN','zh_TW', |
|---|


# appendix

[https://mas.adobe.com/studio.html](https://mas.adobe.com/studio.html)

[https://github.com/adobecom/mas/tree/main/studio/](https://github.com/adobecom/mas/tree/main/studio/)

[Project Odin](https://wiki.corp.adobe.com/display/ODIN/Project+Odin)



                
        
    
        