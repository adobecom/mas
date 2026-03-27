# Dexter CC Plans Modular Layout

> Source: https://wiki.corp.adobe.com/display/adobedotcom/Dexter+CC+Plans+Modular+Layout
> Scraped: 2026-01-06T07:39:37.057Z

---


                           
        ## Current state

The Dexter CC Plans page has been built with a modular XF layout structure, to allow updates to be made and published on isolated sections of the page. Since the Plans page is one "HTML" file, this strategy was developed to meet the requirement of managing updates for project requests on various areas of the Plans page that have varying and sometimes overlapping timelines. In addition, isolating content updates, rather than republishing the complete Plans page every time an update is made, reduces the risk of CSOs. Publishing the full Plans page requires a complete regression test of all price content on the Plans page, rather than just the QA required for the isolated updated/published content.

Plans Page Structure

In the diagram below, the areas outlined in Green are XFs and areas outlined in Pink are Placeholders. These areas can be updated and published independently of the parent Plans page HTML file.

![image](/download/attachments/2939854336/cc-plans-overview.png?version=1&modificationDate=1689643953970&api=v2)

## Overlapping Project Example

In the timeline below an update to the /gr_el/ Plans page could be made while all of the rest of the Geo Plans pages, including /gr_el/, were being updated for another Plans "Business tab" project. The production timelines overlapped, but the XFs that were involved in each project was different, so they could be worked on simultaneously (and published independently) without any collisions.

![image](/download/attachments/2939854336/greek-row-projects.png?version=5&modificationDate=1689644328773&api=v2)

For the first project, [DOTCOM-88316](https://jira.corp.adobe.com/browse/DOTCOM-88316) for the Greek Plans page, these 4 XFs on the Individuals tab of the Greek Plans page were updated:

![image](/download/attachments/2939854336/greek-xfs-ai.png?version=1&modificationDate=1689645612950&api=v2)

For the second project, [DOTCOM-86697](https://jira.corp.adobe.com/browse/DOTCOM-86697) for the ROW Plans pages (including the Greek /gr_el geo), these Business tab XFs were updated:

![image](/download/attachments/2939854336/business-tab-substance.png?version=2&modificationDate=1689647512833&api=v2)

Since there were no shared XFs between the two projects, the two projects could be worked on by multiple GWPs simultaneously and the updated files could go live independently on their separate launch dates.

## Dexter Plans Page Placeholders

Placeholder XF content is used to isolate content on Merch content elements, such as Product cards and modals, that contain commerce elements. Isolating the content into XF fragments allows GWPs to do both parallel editing and to edit and publish text content without having to re-rollout the XF that contains the commerce elements. Content that contains commerce data has more risk and production overhead when rolling out to geo locales, eg. there might be customizations that need to be re-added and prices need to be rechecked on rollout.

Plans placeholder content is organized into three categories of XF files:

**Global literals:** text strings such as "Buy now", "See terms", "Learn more" etc., that are common terms used across the Plans page tabs. 

In this example, the "See plan. & pricing details" string is used on all the Individual tab Product cards. 
 
![image](/download/thumbnails/2939854336/global-literals.png?version=1&modificationDate=1690341956190&api=v2)

**Product content:** content elements such as Product name, description, and feature lists that are used on the Product cards and Modals.

In this example, the "Adobe Premiere Pro" "Name" string is used in several places, eg. the card and on two locations on the modal.

![image](/download/thumbnails/2939854336/products.png?version=1&modificationDate=1690342395957&api=v2)

**Category content:** category strings are used on the Category filter on the Individuals tab of the Plans page.

In this example, the "Graphic Design" category string is used both in the left rail filter list and in the heading above the card collection.

![image](/download/thumbnails/2939854336/categories.png?version=1&modificationDate=1690342714483&api=v2)

This document outlines how the Dexter Plans page Placeholders are created and managed with Placeholder Rules:

[Merch Squad Production Guidelines#Placeholders](/display/adobedotcom/Merch+Squad+Production+Guidelines#MerchSquadProductionGuidelines-Placeholders)



                
        
    
        