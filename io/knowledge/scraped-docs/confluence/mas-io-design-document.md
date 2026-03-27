# MAS / IO Design Document

> Source: https://wiki.corp.adobe.com/pages/viewpage.action?pageId=3565133772
> Scraped: 2026-01-06T07:39:37.062Z

---


                           
        # Overview of mas/io service

what we call mas/io service is for now one API, [https://www.adobe.com/mas/io/fragment](https://www.adobe.com/mas/io/fragment) that is an overlay of odin service, with business addons, which is represented by the green box in that diagram.

![image](/download/attachments/3565133772/image-2025-7-21_14-54-3.png?version=1&modificationDate=1753102940077&api=v2)

usage of that API is done as following:

| parameter | description | mandatory? |
|---|---|---|
| id | id of the fragment that is requested | yes |
| api_key | api_key of the surface requesting the fragment. It's not here for security/authentication purpose, but for tracking of the request in subsequent systems. | yes |
| locale | locale in which the fragment is requested. It may sounds weird as you did already requested a given fragment id, but we don't want to put burden on surface for finding corresponding id in each and every fragment. | yes |

# architecture

as already mentionned, any request to that service is hitting CDN layer (akamai) then adobeio runtime web action, that will fetch content from odin, and web commerce artifact api

## CDN layer: akamai configuration

[https://www.adobe.com/mas/io](https://www.adobe.com/mas/io)/** is a reverse proxy defined in [www.adobe.com](http://www.adobe.com) akamai property, defined with following properties:

| akamai property | value | comment |
|---|---|---|
| origin | adobeio runtime prod URL | this is a public API, but we are not disclosing its URL |
| cache TTL | 15min |  |
| prefresh | prefresh configuration set at 95% TTL |  |
| query parameter checks | api_key|locale|id|env|instant |  |
| stale cache if error | set for 429, 500 & 504 | still in deployement phase 
                    WPS-28861
                            -
            Getting issue details...
                                                STATUS |

## Adobe IO runtime web action

for now only /fragment is used on client side, that is one action in adobeio runtime, that is composed of several software function doing external calls to other APIs, and assembling them

in a summary, here are external APIs that are called:

| domain | URI | comment | public? |
|---|---|---|---|
| https://odin.adobe.com | /adobe/sites/fragments/<id>?references=all-hydrated | used for fetching a fragment's collection cards, dictionary entries, settings | yes |
| https://odin.adobe.com | /adobe/sites/fragments?path=<path> | used for fetching matching fragment in a different locale, and given surface id, | yes |
| https://www.adobe.com | /web_commerce_artifacts | use to prefill WCS cache and speed up consuming rendering time | yes |

# 

# appendix

[https://github.com/adobecom/mas/tree/main/io/www](https://github.com/adobecom/mas/tree/main/io/www)

[Project Odin](/display/ODIN/Project+Odin)

[WCS (Web Commerce Service)](/pages/viewpage.action?pageId=2779259947)



                
        
    
        