# Linking to a Plans Page Content Rich Modal

> Source: https://wiki.corp.adobe.com/display/adobedotcom/Linking+to+a+Plans+Page+Content+Rich+Modal
> Scraped: 2026-01-06T07:39:37.058Z

---


                           
        



## MILO PAGE INSTRUCTIONS:

- Please view this page: https://main--milo--adobecom.hlx.page/docs/authoring/commerce/commerce-iframe-modals
- Please note that the Content rich modals will be in Dexter until ~ FY25 Q1. So please use the above instructions to point to these Dexter modals using the temporary solution of iFrames until we are migrated to Milo!







## DEXTER PAGE INSTRUCTIONS:

The Plans page Individual tab product cards "See plan & pricing details" and CTA links open a Content Rich Modal (CRM) file:

![image](/download/attachments/3169878614/00-crm.png?version=2&modificationDate=1712790400887&api=v2)

When linking to these CRMs from other pages, they must be opened from within a modal window. 

To add a modal link to a Plans page Content Rich Modal:

1. Add a modal component to the bottom of the file that will contain the href link that will open the modal.
2. Open the Modal component and in the "General" tab ID field, add a name for your modal. This can be anything, so something that is descriptive for your modal use. This ID name will be what is used when you author the link to the modal. In this example, it's "modal-name".
3. In the "Layout" tab, set the following settings for Mobile, Tablet and Desktop.MobileTabletDesktop
4. Next add an "iframe" component inside the "Modal" component.
5. In the "Link to" field, add a link to the Content Rich Modal you are linking to using this format: /content/www/us/en/plans-fragments/modals/individual/modals-content-rich/all-apps/master.modal.html. (List of current Content Rich Modals: Dexter CC Plans Page FAQ#ContentrichmodalPlanspageURLs)
6. The Modal "ID" described in Step 2 above, is what will be used when authoring the href link to the Modal. In this example the link would be: #modal-name






                
        
    
        