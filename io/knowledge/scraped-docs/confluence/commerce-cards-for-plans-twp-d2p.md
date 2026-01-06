# Commerce cards for Plans, TWP, D2P

> Source: https://wiki.corp.adobe.com/display/WP4/Commerce+cards+for+Plans%2C+TWP%2C+D2P
> Scraped: 2026-01-06T07:39:37.056Z

---


                           
        



## Commerce Cards

[Figma link](https://www.figma.com/design/tiEUQLJ1hVlosqwzAATVXZ/Cards-(Merch)?node-id=1485-47610&t=HjwZYib36RPXvul4-0)







| # | Description | Current UX | Future UX | Status |
|---|---|---|---|---|
| 1 | Wide plans card(2-up)2 cols | Reference URL: https://www.adobe.com/creativecloud/plans.html | Figma | MWPW-164492
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-134585
                            -
            Getting issue details...
                                                STATUS |
| 2 | Wide Key Apps plans card(Full width to 2-up)2 cols or 4 cols | Reference URL: https://www.adobe.com/creativecloud/plans.html | Figma link | MWPW-164491
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-135160
                            -
            Getting issue details...
                                                STATUS |
| 3 | Standard plans CCI card(3-up)1 col | Reference URL: https://www.adobe.com/creativecloud/plans.html | Studio Notes:197pxIdeally the badge should be no more than 3-4 words.Figma link | MWPW-164492
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-134585
                            -
            Getting issue details...
                                                STATUS |
| 4 | STE card(2-up)2 cols | Reference URL: https://www.adobe.com/creativecloud/plans.html?plan=edu | Figma linkStudio Notes:See terms should not break, but should be on the same line as the other link. | MWPW-164493
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-134585
                            -
            Getting issue details...
                                                STATUS |
| 5 | STE card - APAC |  |  |  |
| 6 | Teams card(4-up)1 col | As of 12/10 in the US:  Regional (but above experience will be rolled out internationally Jan 2025):Reference URL: https://www.adobe.com/creativecloud/plans.html?plan=team |  | MWPW-164494
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-134585
                            -
            Getting issue details...
                                                STATUS |
| 7 | EDU tab plan card(4-up)1 col | Reference URL:Schools & Universities TAB: https://www.adobe.com/creativecloud/plans.html?plan=edu_inst |  | MWPW-164498
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-134585
                            -
            Getting issue details...
                                                STATUS |













Archive - no longer needed due to 3-IN-1:

Click here to expand...| Teams step 2 Card(3-up)1 col | Reference URL: https://www.adobe.com/creativecloud/business-plans.html |  | crd-mrch-plan-biz-2........................................................Old name: merch-card (plans-add) | MWPW-163834
                            -
            Getting issue details...
                                                STATUS
                
                    MWPW-134585
                            -
            Getting issue details...
                                                STATUS |
|---|---|---|---|---|
| Teams step 2 key apps(Full width)2-cols or 4 cols | Reference URL: https://www.adobe.com/creativecloud/plans.html |  | ........................................................Old name: merch-card (plans-add, key-apps)GWP Notes: the "wide" attribute is for positioning the free trial and secure trans elements | MWPW-163834
                            -
            Getting issue details...
                                                STATUS
                 
                    MWPW-135160
                            -
            Getting issue details...
                                                STATUS |
| TwP standard card(4-up) cards?1 col? | Reference URL: All Apps example | Studio Notes:Note this is the 'selected' variant. Non-selected uses a light gray 1px outline. | merch-card (twp) | DONE
                    MWPW-134585
                            -
            Getting issue details...
                                                STATUS |
| TwP Evergreen/Intro Pricing Market card | Reference URL: Evergreen example | Studio Notes:The gradient in the current version is replaced by a solid color. The future state also will use an outlined badge. | merch-card (twp, intro-pricing)GWP Notes: "evergreen" attribute is to style badge outline and the bottom promo | DONE
                    MWPW-134585
                            -
            Getting issue details...
                                                STATUS |
| D2P standard card |  |  |  |  |
| D2P Intro pricing card |  |  |  |  |



















## Functional Requirements - General

| ID | Description | Use cases | Requirements | Jira | Priority |
|---|---|---|---|---|---|
| F1 | Parallel editing of content | UC1: multiple authors are editing different cards on the Plans simultaneouslyauthor 1 is updating Ps card with new descriptionauthor 2 is updating Ai card with new descriptionUC2: an update to the /gr_el/ Plans page is in process /gr_el/ update could be made while all of the rest of the geo Plans pages, including /gr_el/, are being updated for a separate Plans "Business tab" project | multiple authors have the ability to make edits to different cards simultaneouslyauthors can work on parallel projects on a given page without overriding/interrupting each other's updatesBoth authors are able to publish their updates independently from each other | MWPW-134469
                            -
            Getting issue details...
                                                STATUS | P0 |
| F2 | Isolating content for LOC | UC1: author needs to update description of Ps card and rollout globally author is able to send Ps card updates for LOC without having to send all other non-edited cards for LOC | authors have the ability to isolate specific areas of content for updates and localization without having to send the entire page (or other non-edited content on the page) to LOC | MWPW-134470
                            -
            Getting issue details...
                                                STATUS | P0 |
| F3 | Card sorting & ordering | UC1: Special Offers page shows cards in the following order: CCI, CCT, STE  GTM would like to change the order to STE, CCI, CCTUC2: Plans page shows products in the following order: Ps, Ai, PrGTM would like to change the order to Ai, Pr, PsUC3: Product page shows Individual, Businesses, Students merch cardsGTM would like to change the order to Students, Individuals, Teams | authors have the ability to quickly and easily manage the order in which the cards render on the pageauthors are able to support custom card orders based on region | MWPW-134215
                            -
            Getting issue details...
                                                STATUS | P1 |
| F4 | Tagging for category filtering | UC1: Cards collections are filtered based on user's category filter selectionauthor is able to set a category filter for Graphic Design that hides all other cards except CCI, Ps, Ai, AX, etc. UC2: Users are taken to a specific tab/view of the Plans page based on a CTA selection on a different pageuser clicking on an STE card on a Product page is landed on the STE tab of the Plans page UC3: additional existing use cases documented here | authors have the ability to tag cards for display based on a category filterauthors have the ability to tag tabs/views of plans page based on defined parameters passed from the incoming URL | MWPW-136866
                            -
            Getting issue details...
                                                STATUS | P1 |
| F5 | Logged-out vs logged-in content management | UC1: Logged-in (entitled) user lands on Plans page Logged-in user sees different CTAs based on entitlement compared to default logged-out usersUC2: Logged-in (free) user lands on Plans pageLogged-in user sees an upsell banner offering them to purchase CCI at a discount | authors are able to set different experiences on a given page based on whether the user is:logged-outlogged-in (free)logged-in (entitled) | pending | P2 |
| F6 | Test winner authoring rollouts | UC1: PdM tests adding an icon to the plans card to signify the purchase transaction is secure PdM determines the icon experience should be rolled out | authors are able to convert a tested experience to default authored experience without freezing the page or setting a blackout period for authoring other content areas of the page | Supported via MEP | P2 |
| F7 | Promo authoring via specific time frames (on/off) | UC1: BTS promo is set to run on a.com from 8am PST on 8/21 to 8am PST on 9/5UC2: Two separate promos (CCI and STE) are running concurrently on a.com | author is able to set a specific time and date for both enabling and disabling the promo content author is able to set multiple promo experiences to go live and be taken down at the same time for a given page or set of pages | MWPW-134799
                            -
            Getting issue details...
                                                STATUS | P0 |
| F8 | Dynamic card reflow and height sizing | UC1: On desktop (above 1200 px) 4 cards across for small cards, if a wide card is used, then the page automatically adjusts to show 1 wide and 2 small. automatic tablet reflow behavior, mobile reflow. etc.UC2: 4 cards in a row, 1 card has more content than the other 3, thus making the card taller. the longest card determines the height of the remaining cards in the row and the other 3 cards automatically adjust their height to matchthe CTAs automatically align | card reflow automatically happens on page based on user browser windowcards auto-size to match the tallest card and align CTAs | MWPW-134233
                            -
            Getting issue details...
                                                STATUS | P0 |

## Functional Requirements - Plans page and modals (TWP, DWP, Content rich, dual try buy)

Please see the following two wikis for details on functional requirements:

- Plans page Milo gap analysis

- Milo Gap Analysis for A.com merch modals (TWP, D2P, Content rich, Dual try/buy)

## User interaction and design conceptual diagram






                
        
    
        