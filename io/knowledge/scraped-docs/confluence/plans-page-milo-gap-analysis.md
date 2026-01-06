# Plans page Milo gap analysis

> Source: https://wiki.corp.adobe.com/display/WP4/Plans+page+Milo+gap+analysis
> Scraped: 2026-01-06T07:39:37.056Z

---


                           
        



### Merch & Plans Migration to Milo/M@S Gap Analysis & UAT wiki

## Table of contents:

- 1Plans Page Layout Requirements
- 2Plans Card functionality
- 3Plans Cards - Variants
- 4Personalization/logged in requirements on Plans





See Also![confluence wiki](/download/attachments/3408942048/64x64-Atlassian_Confluence_2017_logo.png?version=1&modificationDate=1738703571447&api=v2)  [Plans Authoring UAT Wiki - What's possible in M@S and what's needed](https://wiki.corp.adobe.com/x/xM9Jxg)

[Plans Milo Jira Wiki Dashboard](https://wiki.corp.adobe.com/x/9eMMyg)

[Plans Figma Link](https://www.figma.com/design/32yMtkQsTbmKBkECAlnvVy/Plans-and-Catalog?node-id=0-1&p=f&t=tzPYGnO7BSsNfaNg-0)


Plans cards:

- Plans cards wiki
- Plans Figma cards









---









# Plans Page Layout Requirements

| Description | Jira tickets | Status | Authoring notes/UAT discoveries | Use cases | Current Dexter state Screenshot |
|---|---|---|---|---|---|
| Category Filters / Card Collection | MWPW-142148
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-166688
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-167962
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-173772
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-175406
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-175517
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-176897
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-177651
                            -
            Getting issue details...
                                                STATUS | IN DEVUAT - bug discovered (MWPW-173772)re-UAT once MWPW-173772 releasedIssue discovered in 
                    MWPW-175517
                            -
            Getting issue details...
                                                STATUS
                Must fix issue with filter linking not working - MWPW-176897 Bug discovered in MWPW-175406Get to bottom of filter redirects in MWPW-177651 |  | Expand to view requirementsUC1: When user clicks on filter, they should see a group of cards mapped to that filterUC2: It should be possible to link directly to a filter - for example  https://www.adobe.com/creativecloud/plans.html?filter=photography&plan=individual should take users directly to the Photography filterUC3: It should be possible to reorder the filters through authoring if neededUC4: Filters should hav a configurable icon next to the textUC5: Highlight should show the currently selected filterUC6: Authors should be able to set the order of cards in each specific filter | Expand to view screenshots |
| Plans page tabs | MWPW-142145
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-169899
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-163048
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-175518
                            -
            Getting issue details...
                                                STATUS | IN DEVRe-uat ready siince MWPW-169899No action needed for MWPW-163048 Pending MWPW-175518 (not blocker for go live) | Geri: UAT is signed off for 
                    MWPW-142145
                            -
            Getting issue details...
                                                STATUS
                 and 
                    MWPW-169899
                            -
            Getting issue details...
                                                STATUS
                No action at this time for 
                    MWPW-163048
                            -
            Getting issue details...
                                                STATUS | Expand to view requirementsAC: New user landing on Plans page should land on the Individuals tab by defaultAC: User clicks on Business tab, they see corresponding Business contentAC: User clicks on Students tab, they see corresponding Student contentAC: User clicks on Schools & Universities tab, they see corresponding Higher EDU contentAC: Tab state should NOT be set to maintain 24 hour memory (which was the case in Dexter)AC: When a user is on a tab, the selected tab color should correspond to the page color (grey) instead of the current default white - inversed white/gray BG color schemaNotice that there is a brief flash of Blue when selecting a tab in current blockAC: Tabs should be personalizable and Target enabled - Janelle Moore  please let me know if there is further detail to add hereAC: Tabs should work with the custom breakpoint range setupAC: There should be a uniform application of width (current tabbing structure's width is based on content within, which changes from tab to tab)I.e students tab should not be super wide because it has more copy in itIt should be possible to deeplink into a tab of the plans page per the below requirements. If a user is taken to one of the below links, they should be defualted to the respective tab based on query param "plan=":Tab state - in Dexter, this was set as 24 hour memory for some reason. I don't want this amount of time to be as fixed or as long going forward! | Expand to view screenshots |
| Business tab LAYOUT | MWPW-172513
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-173845
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-175520
                            -
            Getting issue details...
                                                STATUS | READY FOR RE-QAUAT 1 - MWPW-172513 discoveredRe-UAT layout once MWPW-172513 releasedRe-UAT card alignment once MWPW-173845 Re-QA since MWPW-175520 released |  | Expand to view requirements UC1: Authors should be able to have a linked heading title on the Business tab with copy description below spanning the first two cards shown on business tab (matching the live site)UC2: Authors should be able to configure the badge displayed on the All Apps card displayed on the tab to change the color or textUC2.5: Authors should be able to add an icon/SVG to the badge present on All Apps card (Regional requirement)UC3: Authors should be able to configure CTAs on the cards to point to the following options:Business plans page (https://www.adobe.com/creativecloud/business-plans.html)Open up a modal (i.e. https://www.adobe.com/creativecloud/plans.html?mboxDisable=1&adobe_authoring_enabled=1#cct-all-apps-purchase-plans)Future - if necessary, point Direct to cart UC4: The card height on the business tab should always be uniform, and align with the height of the tallest card UC5: Authors should be able to add text links on the cards that when clicked, open a modal that may be different from the overall blue CTAUC5: Authors should be able to add a blade with business features that matches the test winner rollout formatting that will be rolled out in Q1 FY25 - see blade in screenshot | Expand to view screenshotsHighlighted areas of Business tab on Plans page - title, all apps badge, single apps card, and business features blade Below screenshot rolled out for US in Q1 FY25This format for the "exclusive business features" section rolled out in Q1 FY25: |
| Students tab LAYOUT | MWPW-161505
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-172513
                            -
            Getting issue details...
                                                STATUS | SIGNED OFFUAT 1 - MWPW-172513 discoveredRe-UAT once MWPW-172513 released |  | Expand to view requirements UC1: Authors should be able to configure a placeholder in the title of the tab to display the Student discount price, and the price should be formatted like the rest of the textUC2: Authors should be able to add a Students all apps card to the tab that takes up ~ 1/2 the width of the tab - 
                    MWPW-161505
                            -
            Getting issue details...
                                                STATUS
                UC3: Authors should be able to add a "what's included" section of bulleted sentences, wherein which the bullets are PNG/SVG icons On mobile, these checkmarks should reflow underneath the all apps card.UC4: Underneath the All Apps card we should be able to add a line of copy in bold that when translated, if it reaches the end of the All Apps card, should wrap to stay within that columnUC5: Underneath this bolded callout, there should be two text links separated by a pipeStudents all apps card contents:UC: The Students all apps card should have a yellow outline around itUC: Within the Students all apps card, authors should be able to display the first year price followed by the strikethrough base priceUC: Within the Students all apps card copy, authors should be able to implement the dynamic first and second year price and have it format in-line to match the rest of the textUC: Within the Students all apps card beneath the description copy, it should be possible to display two text links side-by-side separated by a pipe | UC: Authors should be able to add a 30 day stock trial checkbox to the card that is connected to the Buy CTA | Expand to view screenshots |
| Plans Page footer | MWPW-161504
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-169901
                            -
            Getting issue details...
                                                STATUS | SIGNED OFFUAT (discovered MWPW-169901)UAT after MWPW-169901 fixed |  | Expand to view requirementsUC1: Authors should be able to configure the payment icons by tab (i.e. have Paypal icon show up on the Individuals tab, but not on Business tab)UC2: Authors should be able to add a specific phone number just above the credit card logos, that may change from tab to tabUC3: Authors should be able to configure an optional text callout per tab, that could be shared across tabs or be specific to a certain tab.UC4: Authors should be able to add a banner Callout Block (white box with gray stroke) where author can specify 1 or 2 (or 3?) boxes within a single row-span. | Expand to view screenshots |
| GNAV | Only display logo and login icons | SIGNED OFF |  |  |  |
| MEP promo manifest | MWPW-173238
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-174623
                            -
            Getting issue details...
                                                STATUS | DONEUAT Promo manifest - try to use in MEPUAT Collection swapping with promos in MEPGroom MWPW-174623 - would be needed for Single App promo use case |  | Expand to view requirementsTest for promostest interaction with psnlzUse in MEP |  |
| Promo Banners | MWPW-174336
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-176819
                            -
            Getting issue details...
                                                STATUS | PENDING DEV - NOT blocker for promo go liveDevUAT once MWPW-174336 releasedFast follow tickets to make look and feel match figma - MWPW-176819 |  | Expand to view requirementsSee jira |  |















---









# Plans Card functionality

| Description | Jira tickets | Status | Authoring Notes/UAT Discoveries | Use cases | Screenshot |
|---|---|---|---|---|---|
| Ability to link to 3-in-1 modals | MWPW-173771
                            -
            Getting issue details...
                                                STATUS | SIGNED OFFUAT - bug discovered (MWPW-173771)Re-UAT once MWPW-173771 released |  | Expand to view requirementsUC1: author should have ability to point to 3-in-1 modal ctas via M@S studioUC2: |  |
| Ability to link to Milo modals | MWPW-174199
                            -
            Getting issue details...
                                                STATUS | SIGNED OFFUAT - bug discovered (MWPW-174199)Re-UAT once MWPW-174199 released |  | See Jira |  |
| Preview content before publish | MWPW-162398
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-175097
                            -
            Getting issue details...
                                                STATUS | SIGNED OFFUAT MWPW-162398Re-UAT once MWPW-175097 releasedStage preview confirmed on www.stage.adobe.com | Geri: UAT Sign off on x
                    MWPW-162398
                            -
            Getting issue details...
                                                STATUS
                Stage preview is TBD: 
                    MWPW-175097
                            -
            Getting issue details...
                                                STATUS | See Jira |  |
| Stock/add-on checkbox | MWPW-170031
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-173768
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-173815
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-176314
                            -
            Getting issue details...
                                                STATUS | SIGNED OFF3-in-1 - Stock checkbox passed through TO modal (discovered MWPW-173812)Passing checkbox from card to modal - retest after MWPW-173815 fixed Re-QA wide card after checkbox alignment addressed in MWPW-176314Known issue blocked by commerce on - Stock checkbox passed BACK to a.com | Does not appear to be working to QA - bug logged MWPW-173815 | Expand to view requirements UC1: When user clicks on the Stock checkbox in a plan card, and then opens up that plans modal, they should see the Stock checkbox pre-selected within the modal.UC2: If a user has Stock checkbox selected in the modal, and they click Continue in the modal, they should go to the email step of commerce checkout.On check, the Stock checkbox adds an offer ID to the Buy Now checkout button. This occurs on both the cards and modals on Plans page. |  |
| Quantity selector | MWPW-167306
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-173768
                            -
            Getting issue details...
                                                STATUS | SIGNED OFF3-in-1 - Quantity selector passed through TO modal READY FOR QA 3-in-1 - Quantity selector passed BACK to a.com - bug discovered (MWPW-173768) |  | Expand to view requirementsUC1: A quantity selector should be a configurable option on cardsUC2: Authors should be able to configure the default starting number of this quantity selector as well as being able to restrict it to a maximum number For Business users for Buy, the minimum should be 1, and there is no maximum Final number displayed should be "10+" at which point it turns into a text edit field.UC3: When users click on "Buy now" from the card, whatever number of licenses they have selected should be carried over into the modal. For US, we will need it to work with the 3-in-1 modal.For ROW, 3-in-1 jdi date is unclear, so would need to work with our modalsUC4: The label next to the selector - "Select number of licenses" should be a placeholder UC5: Nice to have - it should be possible to step the number of licenses - i.e. 2,4,6,8 licenses only |  |
| ABM text and vat labels | MWPW-170035
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-167198
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-172033
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-174815
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-174852
                            -
            Getting issue details...
                                                STATUS | IN UATABM text - Verify that we Turn off ABM text on a card level in US (i.e Firefly which has no ABM).ABM text - verify overall functionalityRe-UAT once MWPW-174815 fixed DOUBLE CHECK AFTER THURS DEMO - use placeholder - part of MWPW-174852 | Note - will see "Annual, paid monthly" until MWPW-174852 addressed | Expand to view requirements Ability to configure Annual, billed monthly on cards on Plans page , displayed beneath the price (see figma) For the US plans card, it will be enabled by default. The text itself should be a placeholderIt should be able to be turned off at a card level for products that do not have an ABM option |  |
| Secure transaction | MWPW-138614
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-160510
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-175390
                            -
            Getting issue details...
                                                STATUS | SIGNED OFFUAT (discovered MWPW-160510)UAT after MWPW-160510 fixedUAT after MWPW-175390 is fixed |  | Expand to view requirements UC1: Authors should be able to place the lock icon and text beside it on footer, on modals, and by CTAs on Plans pageUC2: At the footer of Plans page, when a user rolls over or hovers on the lock icon, a popup should show up |  |
| Link Transformation | MWPW-177328
                            -
            Getting issue details...
                                                STATUS | IN DEVUAT after MWPW-17738 fixed |  |  |  |

# Plans Cards - Variants

Overall requirements in this wiki: [https://wiki.corp.adobe.com/x/bKrnxQ](https://wiki.corp.adobe.com/x/bKrnxQ)

| Description | Jira tickets | Status | Authoring notes |
|---|---|---|---|
| Individuals - Plans page card variant | MWPW-134585
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-164492
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-164491
                            -
            Getting issue details...
                                                STATUS
                ROW super wide: 
                    MWPW-172917
                            -
            Getting issue details...
                                                STATUS | SIGNED OFFUS UAT SignoffPending ROW issue for super wide card (MWPW-172917) |  |
| Students - Plans Page Card variant | MWPW-164493
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-175655
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-176249
                            -
            Getting issue details...
                                                STATUS | SIGNED OFFPending "Ability to link to Milo Modals" (MWPW-174199)Groom MWPW-17655 - discovered while testingUAT once MWPW-175655 signed offUAT once MWPW-176249 signed off |  |
| Business tab- Plans page card variant | MWPW-164494
                            -
            Getting issue details...
                                                STATUS | SIGNED OFFUS UAT |  |
| Schools and Universities - Plans page card variant | MWPW-164498
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-174815
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-175488
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-177105
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-176962
                            -
            Getting issue details...
                                                STATUS | SMALL FIX NEEDED Re-UAT once MWPW-174815 fixed Re-UAT once MWPW-175488 is fixedDev in progress for MWPW-176962Dev needed for MWPW-177105 and but not blocker for go live |  |









---









# Personalization/logged in requirements on Plans

| Description | Jira tickets | Status | Requirements | Authoring notes | Screenshots |
|---|---|---|---|---|---|
| SMB Plans page tab personalization with comp chart | MWPW-172513
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-176133
                            -
            Getting issue details...
                                                STATUS | TO GROOMUAT once MWPW-176133 implemented | Expand to view requirementsOnly shown for SMB OPM personalizationHides Substance and Acrobat cards from default view, replacing with a checkmark sectionOriginal test: 
                    OPT-30316
                            -
            Getting issue details...
                                                STATUS |  | Expand to view screenshots |
| Personalize into tabs | MWPW-163048
                            -
            Getting issue details...
                                                STATUS
                
                    OPT-33795
                            -
            Getting issue details...
                                                STATUS |  | See jira |  |  |
| NBA card ordering | OPT-33592
                            -
            Getting issue details...
                                                STATUS |  | Expand to view requirementsSet a custom card order per XLG segmentOriginal test: 
                    OPT-25175
                            -
            Getting issue details...
                                                STATUS |  |  |
| Entry traffic link in header on Plans page | OPT-33696
                            -
            Getting issue details...
                                                STATUS |  | Expand to view requirementsOnly shown to entry traffic/new visitorsOriginal test: 
                    OPT-16221
                            -
            Getting issue details...
                                                STATUS |  | Expand to view screenshots |
| Logged-in switch modal | MWPW-176922
                            -
            Getting issue details...
                                                STATUS |  | Expand to view requirements RET0596 US Plans Paid Switch Modal vs DPE Flow for CCI Upgrades - final analysis:The Switch modal led to a +19.2% lift in All Apps upgrades, generating +$222.8K in quarterly ARR.Add-ons also saw an +8.8% lift, contributing another +$224.8K in ARR |  |  |
| Logged-in winback cards |  |  |  |  |  |
|  |  |  |  |  |  |









---



## Plans Page Modals - What's Included

Need to migrate What's included modals as well as TERMs pages

[https://www.adobe.com/creativecloud/plans.html#edu-institution-eligibility](https://www.adobe.com/creativecloud/plans.html#edu-institution-eligibility) linked ( and Dexter plans uses this )  ,
but on Milo we have this linked: [https://www.adobe.com/creativecloud/plans.html#modal-institutional-eligibility](https://www.adobe.com/creativecloud/plans.html#modal-institutional-eligibility)

Some What's Included Modals used on the plans page are planned to be part of this batch and should be estimated for PPC:

What's Included Modals: Buy & Try

1. Individuals
2. Teams
3. STE

What's Included Modal (no commerce CTAs):

4. Substance

All others are no longer applicable due to 3-in-1







### What's Included - Try and buy URLs

1. https://www.stage.adobe.com/creativecloud/whats-included/mini-plans/cci-all-apps-whats-included.html
2. https://www.stage.adobe.com/creativecloud/whats-included/mini-plans/cct-all-apps-whats-included.html
3. https://www.stage.adobe.com/creativecloud/whats-included/mini-plans/edu-all-apps-whats-included.html





### What's Included - Buy only URLs

1. https://www.adobe.com/creativecloud/whats-included/plans/edu-all-apps-whats-included.html
2. https://www.adobe.com/creativecloud/whats-included/plans/edu-inst-all-apps-whats-included.html
3. https://www.adobe.com/creativecloud/whats-included/plans/cct-all-apps-whats-included.html
4. https://www.adobe.com/creativecloud/whats-included/plans/cci-all-apps-whats-included.html







### What's Included modal requirements


 | Description | Use cases/ACs | Requirements | Screenshot / Notes | Jira tickets | priority | Batch |
|---|---|---|---|---|---|---|
| What's included modal CTAs | Enable authors to have two CTAs on the What's included modal - one for Try and one for Buy
      Enable authors to have just one CTA on the What's included modal - Buy only
      Enable authors to link to commerce from the CTA OR link to a page |  |  | Dexter:  MWPW-150050 - Getting issue details... STATUS |  | 1 |
| What's included modal formatting |  |  |  |  |  | 1 |
| Mobile requirements |  |  |  |  |  | 1 |
| Secure transaction |  |  |  |  |  | 1 |
| Intro pricing requirements |  |  |  |  |  | 1 |
















---









## Logged In & Entitlement Customization on Plans

| Page |  | Use cases | Requirements | Jira ticket | Consonant block existing? | Modifications needed? |
|---|---|---|---|---|---|---|
| Plans | Switch modal |  |  |  |  |  |









---



## Regional Requirements for Plans Page

**For more details please view Milo Plans page - Regional customizations**















---









## Placeholder use cases

Useful reference: [Dexter CC Plans Modular Layout](/display/adobedotcom/Dexter+CC+Plans+Modular+Layout)
Useful reference: [https://milo.adobe.com/docs/authoring/commerce/commerce-placeholders](https://milo.adobe.com/docs/authoring/commerce/commerce-placeholders)

![(warning)](/s/-gahb51/9012/1t6dj0k/_/images/icons/emoticons/warning.svg) GWP Assumption: managing VAT/tax labels, per license text, etc. will all be done via OST code generated commerce placeholders and is out of scope for authoring placeholders.

| Page | Type | Use cases | Requirements |
|---|---|---|---|
| Multi | Promo | using placeholders to update headline copy from Black Friday content to Cyber Monday content e.g. "Save 50% for Black Friday"→ "Save 50% for Cyber Monday".using placeholders to update promo end date, e.g. "Ends Nov. 30"→"Ends Dec. 8" using placeholders to update discount % across pages, e.g. "Save 50% for Cyber Monday".Nesting placeholders within placeholders, e.g. "Save {{cci-discount-percentage}} on Creative Cloud for Black Friday". | authors can designate strings of alphanumeric text that can be edited in a singular place and updated across all references of given stringauthors can isolate localized copy updates at a locale level (e.g. French localized string can be updated in FR_FR and CA_FR only, no dependency on other geo updates)authors can nest placeholders within placeholderscontent isn't centrally managed but rules for placeholders are, i.e. do not want similar setup as Milo placeholder fileSharepoint permission management in place to control who can edit/publish the placeholder fileability to change CTA copy content at a merch card collection level, eg. change all Plans Card CTAs from "Buy now" to "Select" by replacing a "Buy now" PH key with a "Select" PH key at a merch card collection level |
| Plans | Title | updating product name from "Elements 2024" to "Elements 2025" |
| Plans | Add-on checkbox copy | updating checkbox copy from "Add a 30-day free trial of Adobe Stock*" to "Add a 7-day free trial of Adobe Stock*" |
| Plans | Secure transaction icon copy | updating "Secure transaction" copy to "Safe transaction" |
| Plans | CTA text | updating primary CTA copy from "Buy now" to "Select" |
| Plans | Plan sub-text | updating plan sub-text copy from "annual by monthly plan" to "annual plan, paid monthly" |


Promo placeholder file example:

![image](/download/attachments/2767456219/image-2024-10-1_15-0-25.png?version=1&modificationDate=1727820026177&api=v2)

---









---









## List of all plans pages URLs

[DOTCOM-136509](https://jira.corp.adobe.com/browse/DOTCOM-136509)
                            -
            Getting issue details...
                                                STATUS

![image](/download/thumbnails/2977023521/Excel%20Icon.png?version=1&modificationDate=1693499569330&api=v2) [Plans Pages List.xlsx](https://adobe.sharepoint.com/:x:/r/sites/plansmerchandisinghpsquad/Shared%20Documents/Milo/Plans%20Pages%20List.xlsx?d=w3be7dca1665044f09365333637bd000a&csf=1&web=1&e=CQxBCt)









---









## Catalog page - completed!

Expand to view Catalog archive### Catalog page - COMPLETED

| Priority | Summary | Use cases | Jira ticket |
|---|---|---|---|
| P0 | banner |  | MWPW-139968
                            -
            Getting issue details...
                                                STATUS |
| P0 | Filters & dropdown functionality within filters | If a user selects a category, the category should drop down to show the sub-category items in that category. (i.e. selecting Creativity and Design will drop down and reveal Photo, Graphic Design, VIdeo, etc)If a user has a dropdown selected, and clicks another overall dropdown category, the initial dropdown should close and the second dropdown should open. | MWPW-136872
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-143426
                            -
            Getting issue details...
                                                STATUS |
| P2 | Device type selector | Display 3 checkboxes for Desktop, Web, and MobileIf a user selects Desktop, they should see all cards that are tagged as Desktop apps | MWPW-137257
                            -
            Getting issue details...
                                                STATUS |
| P0 | FAQs section accordion |  | Yes |
| P0 | Sorting functionality | Authors should be able to configure order by respective category and filterthis will set the default ordering by "popularity"Authors should be able to configure order within categories and filters BY GEOIf users use the dropdowns at the top of the page for alphabetical order, cards within the selected filter should be shown in A-Z orderFor promos, whatever the card that has a promo on it is displayed FIRST in the selected filter. | MWPW-136866
                            -
            Getting issue details...
                                                STATUS |
| P0 | ENTITLEMENT AWARENESS | If a user is entitled to the specific app in a card, they should see "Download" CTAIf a user is NOT entitled to that specific app, they should see Try and Buy buttons | MWPW-136891
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-136892
                            -
            Getting issue details...
                                                STATUS
                
                    DOTCOM-105981
                            -
            Getting issue details...
                                                STATUS |
| P1 | "Show more" button functionality to limit # of cards shown | Authors should be able to set the # of cards shown in a given filter, at which point a "Show more" button should be displayedWhen clicked, the rest of the cards on the page should be displayed | Yes? plans? |
| P3 | Display number of cards within card collection | At top of page, display a count of how many cards are within that card collection: |  |
| P1 | Search bar | When a user enters text in the search bar, as they type the applicable cards should be displayedAdditionally, text should be displayed at the top of the page that shows how many applicable results there are: | MWPW-137257
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-136890
                            -
            Getting issue details...
                                                STATUS |
| P2 | Buy Modals | When a user clicks Buy on the Catalog page, a BUY version of the TWP modals should pop up according to the XD below: https://xd.adobe.com/view/3adeca8f-727a-4aa9-86c4-5c2f09f42728-6f8d/ |  |
| P0 | GNAV | UTILIZE HOMEPAGE GNAV | DOTCOM-105855
                            -
            Getting issue details...
                                                STATUS |
| P1 | Analytics |  | MWPW-136881
                            -
            Getting issue details...
                                                STATUS |
| P3 (NOT MVP) | Card dropdown functionality on Catalog | In the top right of a catalog card, three dots should be shown indicating interactivity.If a user clicks on the three dots, a dropdown should be displayed like in the XD with a bullet point list.Within the dropdown, the content will be spec'd out in a separate excel file. | DOTCOM-109594
                            -
            Getting issue details...
                                                STATUS |
| P2 | Mnemonic in Catalog card should be linkable | Ability to link each product mnemonics in the cards to the respective product page (the same link destination as the text links for "learn more" within the cards - https://www.adobe.com/creativecloud/all-apps.html)Within a catalog card, user should be able to click on the mnemonic in the top left cornerThat mnemonic should be configurable by authors to point to a URL | MWPW-139969
                            -
            Getting issue details...
                                                STATUS |



---



## Personalization on Catalog page

| Page |  | Use cases | Requirements | Jira ticket | Consonant block existing? | Modifications needed? |
|---|---|---|---|---|---|---|
| Catalog | EDU personalized catalog banner | completed |  | OPT-22656
                            -
            Getting issue details...
                                                STATUS |  |  |
| Catalog | SMB personalized catalog banner | completed |  | OPT-22656
                            -
            Getting issue details...
                                                STATUS |  |  |



---



## Logged In & Entitlement Customization on Catalog page

| Page |  | Use cases | Requirements | Jira ticket | Consonant block existing? | Modifications needed? |
|---|---|---|---|---|---|---|
| Catalog | Wide Cards | Single app entitlement with Acrobat ProSingle app entitlement without Acrobat Pro |  | DOTCOM-105981
                            -
            Getting issue details...
                                                STATUS |  |  |




































                
        
    
        