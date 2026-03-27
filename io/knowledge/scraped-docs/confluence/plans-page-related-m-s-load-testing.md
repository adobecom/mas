# Plans page related m@s load testing

> Source: https://wiki.corp.adobe.com/display/adobedotcom/Plans+page+related+m@s+load+testing
> Scraped: 2026-01-06T07:39:37.063Z

---


                           
        ## traffic projection

milo us plans page is an EDS page with 4 mas/io fragments.

### current traffic

![image.png](https://files.slack.com/files-tmb/T23RE8G4F-F099UCBLCCT-2ff6c8f63e/image_720.png)![image](/download/attachments/3587354506/Screenshot%202025-08-12%20at%2013.58.53.png?version=1&modificationDate=1755003554210&api=v2)

from akamai figures on last 7 days, we are at 1.5 req/s avg, 5 req/s max, 150k req / day avg, 4M avg a month

![image](/download/attachments/3587354506/Screenshot%202025-08-12%20at%2014.56.02.png?version=1&modificationDate=1755003554140&api=v2)

from analytics, we are reaching 600k req / day avg on the heaviest traffic day (max conference), which would give 7 req/s avg (no max figures).

### traffic projection

10 req/s which is 40 req to mas/io per seconds.

avg duration on last 24h of mas/io request for plans is 1.7s, 90% percentile at 6s. This basically means we would reach in a no cache moment on akamai  40 requests / s during 6 seconds (until cache is filled), added to actual ~166 RPM we would reach 400 RPM. Even if that number is below the current rate limit of 600 RPM, we'll ask for a raise of 800 RPM

### note on expected traffic growth

at the moment /mas/io/fragment API serves ~1M requests per hour

![image](/download/attachments/3587354506/image-2025-8-13_16-46-31.png?version=1&modificationDate=1755096392313&api=v2)

respecting the above, we expect 40 * 3600 = 144k requests growth, wich is < 15 % growth

## load testing

we want to test normal scenario, and invalidation scenario. We changed a bit what [was done for CCD launch](https://wiki.corp.adobe.com/pages/viewpage.action?pageId=3351574680) as here 1 Virtual user needs to load those 4 fragments used for plans page in a row. Numbers below were found to "mimic" load projection above

### 10 Virtual Users, Sleep 500ms public web (good connexion), 20 min

#### test summary

test gone well and reached ~60r/s over 20minutes which is above the traffic projection. 77052 requests were done and all served in avg in 26 ms.  77043 did hit akamai cache, 9 got revalidated/missed

![image](/download/attachments/3587354506/image-2025-8-13_16-58-6.png?version=1&modificationDate=1755097087387&api=v2)

![image](/download/attachments/3587354506/image-2025-8-13_16-58-43.png?version=1&modificationDate=1755097123787&api=v2)

considering splunk logs on mas/io side (below akamai), we can see that very few requests got through akamai, and that CCD load is what is taking most of the activity

splunk logs for milo (load tests + other testing)

![image](/download/attachments/3587354506/image-2025-8-13_17-13-30.png?version=1&modificationDate=1755098010777&api=v2)![image.png](https://files.slack.com/files-tmb/T23RE8G4F-F099UCBLCCT-2ff6c8f63e/image_720.png)

splunk logs overall, same time (plans load tests + CCD):

![image](/download/attachments/3587354506/image-2025-8-13_17-33-33.png?version=1&modificationDate=1755099214253&api=v2)

to confirm figures on akamai hit ratio, on 77k requests overall in 20 minutes

revalidation details :


[?](#)| time="2025-08-13T16:33:37+02:00" level=info msg="URL: https://www.adobe.com/mas/io/fragment?id=07f9729e-dc1f-4634-829d-7aa469bb0d33&locale=en_US&api_key=wcms-commerce-ims-ro-user-milo, Status: 200, Headers: Server-Timing: cdn-cache; desc=REVALIDATE, edge; dur=28, origin; dur=1077, sis; desc=0, geo; desc=FR, ak_p; desc=\"1755095616282_1551541674_509939237_110338_9478_5_27_15\";dur=1, Cache-Control: undefined, X-Request-Id: A8O94lcasPciKge0OxhYE0SDoRiAZADh, Akamai-Grn: undefined" source=consoletime="2025-08-13T16:33:37+02:00" level=info msg="URL: https://www.adobe.com/mas/io/fragment?id=07f9729e-dc1f-4634-829d-7aa469bb0d33&locale=en_US&api_key=wcms-commerce-ims-ro-user-milo, Status: 200, Headers: Server-Timing: cdn-cache; desc=REVALIDATE, edge; dur=16, origin; dur=1119, sis; desc=0, geo; desc=FR, ak_p; desc=\"1755095616376_1551541669_515875735_113311_9971_4_10_15\";dur=1, Cache-Control: undefined, X-Request-Id: A8O94lcasPciKge0OxhYE0SDoRiAZADh, Akamai-Grn: undefined" source=consoletime="2025-08-13T16:33:38+02:00" level=info msg="URL: https://www.adobe.com/mas/io/fragment?id=745bf04d-0112-4468-a6d4-15db07e93578&locale=en_US&api_key=wcms-commerce-ims-ro-user-milo, Status: 200, Headers: Server-Timing: cdn-cache; desc=REVALIDATE, edge; dur=13, origin; dur=606, sis; desc=0, geo; desc=FR, ak_p; desc=\"1755095617451_1551541674_509947705_61869_7820_5_0_15\";dur=1, Cache-Control: undefined, X-Request-Id: hC4gVPYJsfO8H0TI7Lc6x46qV8hcpy2o, Akamai-Grn: undefined" source=consoletime="2025-08-13T16:33:38+02:00" level=info msg="URL: https://www.adobe.com/mas/io/fragment?id=745bf04d-0112-4468-a6d4-15db07e93578&locale=en_US&api_key=wcms-commerce-ims-ro-user-milo, Status: 200, Headers: Server-Timing: cdn-cache; desc=REVALIDATE, edge; dur=15, origin; dur=722, sis; desc=0, geo; desc=FR, ak_p; desc=\"1755095617557_1551541669_515881752_73530_12134_8_0_15\";dur=1, Cache-Control: undefined, X-Request-Id: ISGYvr8TThT5mvG3IHpYesOKKpS4RVWL, Akamai-Grn: undefined" source=consoletime="2025-08-13T16:33:38+02:00" level=info msg="URL: https://www.adobe.com/mas/io/fragment?id=2bee9d3e-55ae-4701-b946-44b32fa5d9fa&locale=en_US&api_key=wcms-commerce-ims-ro-user-milo, Status: 200, Headers: Server-Timing: cdn-cache; desc=REVALIDATE, edge; dur=14, origin; dur=714, sis; desc=0, geo; desc=FR, ak_p; desc=\"1755095618090_1551541674_509952246_72678_9992_5_0_15\";dur=1, Cache-Control: undefined, X-Request-Id: 8JpThWiQOH0b0PhAahLldPhviwcRafYi, Akamai-Grn: undefined" source=consoletime="2025-08-13T16:33:38+02:00" level=info msg="URL: https://www.adobe.com/mas/io/fragment?id=2bee9d3e-55ae-4701-b946-44b32fa5d9fa&locale=en_US&api_key=wcms-commerce-ims-ro-user-milo, Status: 200, Headers: Server-Timing: cdn-cache; desc=REVALIDATE, edge; dur=13, origin; dur=721, sis; desc=0, geo; desc=FR, ak_p; desc=\"1755095618089_1551541674_509952238_73279_12060_5_0_15\";dur=1, Cache-Control: undefined, X-Request-Id: yST1zUaJCEYbbEUf3RJdCGnbgoaHsVg6, Akamai-Grn: undefined" source=consoletime="2025-08-13T16:33:40+02:00" level=info msg="URL: https://www.adobe.com/mas/io/fragment?id=e6e35985-bcc3-4d2a-bbe5-c9eb4b3851e8&locale=en_US&api_key=wcms-commerce-ims-ro-user-milo, Status: 200, Headers: Server-Timing: cdn-cache; desc=REVALIDATE, edge; dur=12, origin; dur=1832, sis; desc=0, geo; desc=FR, ak_p; desc=\"1755095618836_1551541669_515888426_184043_10364_7_0_15\";dur=1, Cache-Control: undefined, X-Request-Id: nB7e8tjlaag3EUVSBYQ1hLAg0sbPghhD, Akamai-Grn: undefined" source=console |
|---|


### 10 Virtual Users, Sleep 500ms, publication of a card (i.e. invalidation of some cache), vpn, 30 min

card modified and published shortly after beginning of the test

![image](/download/attachments/3587354506/image-2025-8-14_14-9-39.png?version=1&modificationDate=1755173379627&api=v2)

![image](/download/attachments/3587354506/image-2025-8-14_14-10-14.png?version=1&modificationDate=1755173415273&api=v2)

## conclusion

things look good. We probably need to keep on optimizing mas/io time to avoid long requests to be so frequent in case of cold cache.

[https://jira.corp.adobe.com/browse/MWPW-173746](https://jira.corp.adobe.com/browse/MWPW-173746)

[https://jira.corp.adobe.com/browse/MWPW-178324](https://jira.corp.adobe.com/browse/MWPW-178324)



                
        
    
        