# Display prices tax excluded

> Source: https://wiki.corp.adobe.com/display/adobedotcom/Display+prices+tax+excluded
> Scraped: 2026-01-06T07:39:37.055Z

---


                           
        ## On Dexter/Titan pages

In XF page properties, tab Commerce, dropdown field Tax Exclusivity (WCS) change from Automatic to Exclude and prices will be displayed without taxes.

This value is inherited so it can be set on XF node or on any folder above e.g. on Cards folder, or Individual, or on Language or Country level.

![image](/download/attachments/3693144884/tax_excluded_dexter.png?version=1&modificationDate=1765361728843&api=v2)

Of course it will work only if in WCS response we have both prices delivered, with tax and tax free.

![image](/download/thumbnails/3693144884/wcs_tax.png?version=1&modificationDate=1765362225360&api=v2)

## On Milo pages

These changes are needed

**Change 1 - Enable mas-ff-defaults**

By default, for all countries, tax info is not displayed and prices are displayed with tax included. This can be changed in OST per price.

If we want to have different settings for different countries e.g. for Africa we need to enable new enhanced defaults by setting mas-ff-defaults meta tag to "on" on Africa pages.

This can be done in metadata.xlsx with one change for all African pages.

The mas-ff-defaults feature is documented here [https://github.com/adobecom/mas/wiki/MAS-Feature-Flags](https://github.com/adobecom/mas/wiki/MAS-Feature-Flags) in details so I will not describe it additionally on this page.

**Change2 - small code change**

These new default values are hardcoded in Milo/MAS code and values for MU_en need to be changed to display prices tax excluded.

At the moment they are configured to be tax included even in new defaults.

New defaults are finely granulated so we can have different values for different segments (individuals, teams, students, universities).

**Change3 - WCS response**

If we want to display prices with tax excluded then that value needs to be there in the WCS response. We cannot calculate it on our side.

At the moment what we get in WCS responses on pages for Africa is

![image](/download/thumbnails/3693144884/wcs_tax_africa.png?version=1&modificationDate=1765365528067&api=v2)

both prices are with tax included,

taxDisplay has the value TAX_EXCLUSIVE and it should have the value TAX_INCLUSIVE_DETAILS and

taxTerm should be set if we want to display tax labels as part of the price.

In other words the WCS response should have values as in Dexter case above.



                
        
    
        