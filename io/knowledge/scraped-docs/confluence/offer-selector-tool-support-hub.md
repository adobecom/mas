# Offer Selector Tool Support Hub

> Source: https://wiki.corp.adobe.com/display/adobedotcom/Offer+Selector+Tool+Support+Hub
> Scraped: 2026-01-06T07:39:37.061Z

---


                           
        









# Offer Selector Tool Support Hub

**Ask questions in the Mr. Fluffy Jaws Workspace for Merch at Scale**

















# Questions? We have answers.















---















OST has no results for the offer I'm searching for, what should I do?Troubleshooting tips:

- Verify that the locale of the page you are working on matches one of the countries the offer has been onboarded for.  Many offers (i.e. intro and regional pricing) are not valid for all countries that A.com supports.
- Verify the offer availability dates.  If the current date is not within the range of the market start and market end dates for the offer, it will not be available to use on A.com.















---















Why am I unable to see the price after authoring a page for regional specific pricing?Commerce placeholders are not localized in the traditional sense of being translated.  Applying "do not translate" (DNT) styles or tags will have no effect.  The backend code automatically sets the commerce locale, and this cannot be changed by authoring.

If the offer is not valid for US, no data will be returned when authoring on a US/en page.

OSI's (offer selector IDs) rely on the page they're authored on to determine the locale for which to send to WCS for the pricing response. Unlike Dexter, in this use case the authoring would need to be done directly in the relevant geo node for WCS to retrieve the appropriate country code and fetch the price.















---















How are price/checkout placeholders localized?Commerce placeholders are not localized in the traditional sense of being translated.  Applying "do not translate" (DNT) styles or tags will have no effect.  The backend code automatically sets the commerce locale, and this cannot be changed by authoring.

When you author your page in US/en and localization is completed, you must roll out the page/fragment to the geos and then the price/checkout placeholders will use the locale setting for the page/fragment to adjust the price/checkout link accordingly.















---















On second screen "Select your offer", what do the disable checkboxes do?See the **OST Parameters for Price Merch Link** section in the [Offer Selector Tool (OST) documentation](https://main--milo--adobecom.hlx.page/docs/authoring/commerce/commerce-ost-intro).

Note that by default, the parameters are enabled and ticking the boxes will disable the parameter options.















---















How do I search for draft offers not published to production yet?Default OST opens with WCS Commerce set to **prod** (e.g. env=prod, landscape=PUBLISHED), which can only display *published* offers.

*https://milo.adobe.com/tools/ost*

To access newly onboarded offers, open the Milo OST with commerce.landscape=DRAFT, like so:

*https://milo.adobe.com/tools/ost?commerce.landscape=DRAFT*

*wcsLandscape=DRAFT is decommissioned as of August 2025, use commerce.landscape=DRAFT going forward.*

**Please note**, that only DRAFT landscape flag can be used for OST, ‘commerce.env=STAGE’ is not supposed to be used for OST and won’t work.

‘DRAFT’ value is case-sensitive.

In the OST, you will see a draft label in the search offer results:

![image](/download/attachments/3213719384/Screenshot%202024-08-29%20at%207.59.17%E2%80%AFAM.png?version=1&modificationDate=1724943594817&api=v2)

**You will not need to re-author prices or checkout links later.**  The commerce placeholder for the draft offer will automatically pull the same offer details after the offer onboarding team publishes the offer and releases it to market.

If you have questions about the offer onboarding process, such as when a draft offer will be published, you can ask on Slack in [#offer-onboarding-support](https://adobe.enterprise.slack.com/archives/C04UNS01937).

If you need to log a bug for the onboarding team, follow the process on [Onboarding Bug Intake And Triage Process](/display/eCommOps/Onboarding+Bug+Intake+And+Triage+Process).















---















How do I switch from commerce prod to stage for testing?In the past on Dexter, entire instances (CC, Offers, DC) would need a configuration change to point all pages to either or production commerce (checkout, pricing) or stage commerce.

It is now possible for individuals to make this configuration change in their personal browser which only impacts their individual session.  See the following page for detailed instructions.

![(warning)](/s/-gahb51/9012/1t6dj0k/_/images/icons/emoticons/warning.svg)  Don't forget to revert your changes when you are done!  Generally switching to commerce stage is a temporary activity and most will want to revert back to production commerce when complete.

[M@S environment configurations](/display/BaaP/M@S+environment+configurations)















---















There's a bug in checkout, what should I do?Checkout links advance customers from [adobe.com](http://adobe.com) to [commerce.adobe.com](http://commerce.adobe.com).  If you are observing errors on [commerce.adobe.com](http://commerce.adobe.com) only the commerce and Unified Checkout (UCv3) teams can assist since [adobe.com](http://adobe.com) team does not own pages in that subdomain.

You can share your feedback and error details on Slack in [#checkout-support](https://adobe.enterprise.slack.com/archives/C05RKQ49M5G).  Additionally, you can log a bug with details and steps to reproduce in in the ECOMM project in Jira.

![image](/download/thumbnails/3213719384/Jira_large.png?version=1&modificationDate=1724943809217&api=v2) [Create an ECOMM bug](https://jira.corp.adobe.com/secure/CreateIssueDetails!init.jspa?pid=21334&issuetype=1)















---















How often does OST refresh its list of offers from the Commerce Catalog?There is a rundeck job that refreshes the list of offers from the Commerce Catalog once per day.

If you are unable to find the offer you are searching for, first ask in [#merch-at-scale](https://adobe.enterprise.slack.com/archives/C02RZERR9CH) for support.















---















What if there is a price discrepancy between my page and OST or checkout?In the rare event there is a bug and the Adobe Business Platform (ABP) Product Catalog is not returning valid data via the Web Commerce Service (WCS) or the Available Offers Service (AOS), the team can help raise the issue in [#catalog-support](https://adobe.enterprise.slack.com/archives/C168J7945).  The ABP Product Catalog team also advises the following:

[If you have any issues or requests related to Catalog services or data, please create a ticket in the Jira project ODMT. This includes requests for data analysis, data extraction, data modifications, and data corrections, etc.](https://adobedotcom.slack.com/archives/C168J7945/p1724796105522789)

In Slack or Jira you may also tag APB Catalog engineering team members for support (available IST only):

- Vikash Soni
- Swetabh Raj "Raj"
- Rajen Joshi

Example Tickets:

- ODMT-4072
                            -
            Getting issue details...
                                                STATUS
- ODMT-4082
                            -
            Getting issue details...
                                                STATUS
- ODMT-4214
                            -
            Getting issue details...
                                                STATUS















---













---









# Documentation

****

### Offer Selector Tool Docs

### Milo Commerce Docs

# Updates

****

### Change Log & Updates

### Demo Recordings

# Tools

![image](/download/thumbnails/3213719384/What-to-choose-for-your-product-testing-manual-testing-or-automated-testing.png?version=1&modificationDate=1718116084737&api=v2)

### Merch Squad Tools: Offer Highlight

### AOS Swagger













![image](/download/thumbnails/3213719384/slack%20icon.png?version=1&modificationDate=1717771664570&api=v2)

# Join the conversation on Slack!


## #merch-at-scale

## Any and all questions, concerns, feedback

**Please do not DM team members**









---









# Backlog & Active Tickets

*component = "OST (Offer Selector Tool)" or summary ~ OST or labels = ost-ui*



        
    
        
    
        
    
        |  |
||
| T | P | Key | Summary | Status | Assignee | Reporter | Created |


    
            
                                        
                        
                            Loading...
                        
                        
                        Refresh
                        
                        
                    
                    
        

            
    








---









# Resolved Tickets



        
    
        
    
        
    
        |  |
||
| T | P | Key | Summary | Status | Resolution | Assignee | Reporter | Resolved |


    
            
                                        
                        
                            Loading...
                        
                        
                        Refresh
                        
                        
                    
                    
        

            
    








---




































 
 





                
        
    
        