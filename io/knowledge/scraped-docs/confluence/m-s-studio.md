# M@S Studio

> Source: https://wiki.corp.adobe.com/display/adobedotcom/M@S+Studio
> Scraped: 2026-01-06T07:39:37.056Z

---


                           
        # 2Design3Technical Diagrams4Local development5Components5.1aem-fragments5.2content-navigation6M@S Rundeck to refresh users7Authoring Documentation (DA)

# Design

[https://main--mas--adobecom.hlx.live/studio.html](https://main--mas--adobecom.hlx.live/studio.html)

# Technical Diagrams

[https://miro.com/app/board/uXjVIRQ_2mk=/?utm_source=notification&utm_medium=email&utm_campaign=daily-updates&utm_content=board-name&lid=1864upizxwzn](https://miro.com/app/board/uXjVIRQ_2mk=/?utm_source=notification&utm_medium=email&utm_campaign=daily-updates&utm_content=board-name&lid=1864upizxwzn)

# Local development

in the root run:


```
npm run studio
```


that will run a proxy to the right odin instance, and run studio from your local files.

# Components

##### aem-fragments

core content model in studio, that is bound to odin through **aem.js** that collects its APIs.

it has a method **getTopFolders** that returns first level folder of storage, that is used by tabs. Note you can ignore some of them adding "ignore_folders" array in your local storage

![image](/download/attachments/3473919770/image-2024-10-30_19-56-23.png?version=1&modificationDate=1744112883567&api=v2)

##### content-navigation

used for the user to navigate through the content. It contains views (table & render) displaying aem-fragments content, and tabs.

# M@S Rundeck to refresh users

[https://rundeck.wcmsops.adobe.com/project/Merch-at-Scale/job/show/116eeb53-4762-46c4-a32e-4ad4f8ed79c7](https://rundeck.wcmsops.adobe.com/project/Merch-at-Scale/job/show/116eeb53-4762-46c4-a32e-4ad4f8ed79c7)

# Authoring Documentation (DA)

Studio is hosted in Document Authoring. Documentation for DA can be found here: [https://da.live/docs](https://da.live/docs)

You can request access to adobecom DA space in #milo-dev slack channel.

Documentation For M@S Studio authors is located in [https://da.live/#/adobecom/mas/docs](https://da.live/#/adobecom/mas/docs)

To be able to edit documentation, choose 'Adobe Experience Cloud Skyline' IMS Org.

![image](/download/thumbnails/3473919770/image-2025-9-1_16-50-12.png?version=1&modificationDate=1756738213310&api=v2)



                
        
    
        