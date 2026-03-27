# Card Content Model

> Source: https://wiki.corp.adobe.com/display/WP4/Card+Content+Model
> Scraped: 2026-01-06T07:39:37.062Z

---


                           
        # 1. Existing designs



# 2. Original Plans content structure


(from [Geri Wittig (she, her)](/display/~gewittig) 's [Dexter CC Plans Modular Layout](/display/adobedotcom/Dexter+CC+Plans+Modular+Layout)), to quote her,


"In the diagram below, the areas outlined in Green are XFs and areas outlined in Pink are Placeholders. These areas can be updated and published independently of the parent Plans page HTML file."



![image](https://wiki.corp.adobe.com/download/attachments/2939854336/cc-plans-overview.png?version=1&modificationDate=1689643953970&api=v2)


![products.png](https://wiki.corp.adobe.com/download/attachments/2939854336/products.png?version=1&modificationDate=1690342395957&api=v2)


# 3. Card fields


### 3.1.1. card source (MAS Card reference)


reference to another card this card will take information from


### 3.1.2. MCS product / offer (MCS Product reference / AOS MERCH PROVIDER CALL) ?


could we fetch this from MCS which could give "included products", and related name & icons, that are bound to a given offer? From there we could get default price / checkout URL


also we should have a look at terms & services


note we could "just" make use of AOS there with MERCHANDISING


[https://aos.adobe.io/offers/817F9DC93DC31E93D6C6EEB860FCEB83?country=US&merchant=ADOBE&service_providers=MERCHANDISING&locale=en_US&api_key=adobedotcom2&landscape=PUBLISHED](https://aos.adobe.io/offers/817F9DC93DC31E93D6C6EEB860FCEB83?country=US&merchant=ADOBE&service_providers=MERCHANDISING&locale=en_US&api_key=adobedotcom2&landscape=PUBLISHED)


### 3.1.3. card variant (select)


choice here (plans, catalog, ccd?, ah?, product, ...) will set look and feel for the card


### 3.1.4.  promotion code (plain text)


promotion code used by the card


### 3.1.5. badge (rich text + select(s))


badge text can have italic or bold, color for background & border, possibly style list.


### 3.1.6. short description (rich text)


### 3.1.7. long description (rich text)


### 3.1.8. extra & recommendations (rich text)


### 3.1.9. Terms & Services? (rich text)


should be entirely defined in 3.1.2, not sure we want to keep that


### 3.1.10. CTA Group (multifield of CTA fieldgroup)


group of ordered CTAs, defaulting to product / offer's defined in 3.1.2, with override possibility.






                
        
    
        