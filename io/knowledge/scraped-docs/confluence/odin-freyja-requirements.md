# Odin / Freyja requirements

> Source: https://wiki.corp.adobe.com/pages/viewpage.action?pageId=3304129681
> Scraped: 2026-01-06T07:39:37.062Z

---


                           
        all of the below on QA, STAGE & PROD (odin & freyja), with IMS authentication

# Authoring

1. CF ID based GET/POST APIs to CRUD CF,
2. CF ID based API to get publication status of CF,
3. Folder API to CRUD folders,
4. CF ID based API to trigger translation ?
5. first level (mas/CCD, mas/acom, ...) of Access control, every mas user can read mas/*, but only CCD members can write to mas/ccd,
6. Easy content transfer from QA → STAGE, QA → PROD, PROD → STAGE,

# Delivery

1. CF ID based API to publish to freyja,
2. CF ID based AP to preview to freyja,

# Open Questions

1. When could we expect Freyja delivery available on Odin Prod instance?
2. What will be the Prod/Stage/QA Freyja endpoint? (should we start using https://odin.adobe.com/ and abandon https://publish-p22655-e59433.adobeaemcloud.com/?)
3. For Authoring calls, what endpoint should we use (QA/Stage/Prod)? (we are currently using https://author-p22655-e59433.adobeaemcloud.com/content/odin/home.html)



                
        
    
        