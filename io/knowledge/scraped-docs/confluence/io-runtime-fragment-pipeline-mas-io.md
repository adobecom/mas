# IO Runtime Fragment pipeline (/mas/io)

> Source: https://wiki.corp.adobe.com/pages/viewpage.action?pageId=3587728545
> Scraped: 2026-01-06T07:39:37.055Z

---


                           
        | 1Useful URLs1.1 admin space: https://admin.adobe.io/consumer/org/51963/apps1.2 source repo: https://github.com/adobecom/mas/tree/main/io/www#readme1.3 M@S monitoring documentation : adobedotcom:M@S Monitoring1.4 grafana dashboard: https://grafana-us.trafficpeak.live/d/765dd726-ca2f-4814-a6be-3eb71e8d7ad1/mats-mas-io-fragment?1.5 splunk overall dashboard: https://splunk-us.corp.adobe.com/en-GB/app/search/mas_overall1.6 splunk timings dashboard: https://splunk-us.corp.adobe.com/en-GB/app/search/mas_io_fragment_timings2Onboarding for developing3Onboarding for maintenance4Troubleshooting4.1use cases4.1.1stale content / update not arriving4.1.2error in the request processing4.1.3performance issue4.2tooling4.2.1how to check splunk logs4.2.2how to check request & response headers5Configuration5.1listing available configuration5.2getting configuration5.3setting configuration5.4prod configuration5.5stage configuration | Useful URLs admin space: https://admin.adobe.io/consumer/org/51963/apps source repo: https://github.com/adobecom/mas/tree/main/io/www#readme M@S monitoring documentation : adobedotcom:M@S Monitoring grafana dashboard: https://grafana-us.trafficpeak.live/d/765dd726-ca2f-4814-a6be-3eb71e8d7ad1/mats-mas-io-fragment? splunk overall dashboard: https://splunk-us.corp.adobe.com/en-GB/app/search/mas_overall splunk timings dashboard: https://splunk-us.corp.adobe.com/en-GB/app/search/mas_io_fragment_timings |
|---|---|

content source for m@s platform, e.g.

[https://www.adobe.com/mas/io/fragment?id=07f9729e-dc1f-4634-829d-7aa469bb0d33&api_key=wcms-commerce-ims-ro-user-milo&locale=en_US](https://www.adobe.com/mas/io/fragment?id=07f9729e-dc1f-4634-829d-7aa469bb0d33&api_key=wcms-commerce-ims-ro-user-milo&locale=en_US)

# Onboarding for developing

there is high coverage of the code with unit test you can check under io/www folder with


[?](#)| npm run test:coverage |
|---|


and you should be respecting it.

This coverage should be use for developing as well. For any new development (new unit test), or bug (new broken unit test), you can focus on that test by renaming mocha's `it` with `it.only` and then you can open in code a debug terminal

![image](/download/attachments/3587728545/image-2025-10-29_14-58-30.png?version=1&modificationDate=1761746310957&api=v2)

then run you test with `npm run test`  and benefit from usual debugging context & features.

# Onboarding for maintenance

you need:

- adobeio access (#milo-dev),
- github.com/adobecom/mas write access (warriors team),
- traffic peak access (grafana) (WPS team)
- splunk access (https://wiki.corp.adobe.com/display/adobedotcom/M@S+Monitoring#M@SMonitoring-accessrequest.2)

# Troubleshooting

## use cases

### stale content / update not arriving

in the [response headers](https://www.w3.org/International/questions/qa-headers-charset.en), you can check last update of the resource with 2 headers:

- etag this is the SHA256 hash computed from the body of the response (uncompressed),
- last-modified this is the last time above hash has been updated (meaning the response changed),

if that last-modified date is **15 minutes** (akamai TTL) prior to the moment content (fragment, or related dictionary) has been modified **and published,**you can check the request id **x-request-id** and look [for it in the splunk logs](https://wiki.corp.adobe.com/display/adobedotcom/M@S+Monitoring#M@SMonitoring-Usefulqueries). You should fine a request ran a the moment last-modified was done. From there you can:

- search for more recent requests corresponding to same fragment id & locale and check what happened there (could be cache has not been propagated all other the place),
- check related odin queries, and execute them, to check for your change.

**Don't request akamai cache flush** as per path flush does not seem to work! Akamai support might help you.

### error in the request processing

| error code | explanation | what to do |
|---|---|---|
| 400 | this could be that your request has been rejected at akamai level because of missing or empty mandatory parametersapi_keylocaleit can also be sent by mas/io origin itself in case parameters are wrong | fix the client so it uses right parameters |
| 403 | forbidden, probably sent by akamai, | check on traffic peak filtering on status code |
| 404 | whatever requested resource does not exist | fix the client so it uses right parameters |
| 429 | too many request | should not happen, as akamai must have turned this into 529, please contact admins / raise alert at akamai level, plus action done in 529 |
| 500 | internal server error, without stale cache from akamai | check if the error is akamai only (could be EW error), or origin, we generally should be more precise |
| 503 | internal server error | check for origin splunk logs, a fix is needed |
| 504 | timeout, without stale cache from akamai | check why origin takes too long |
| 529 | too many request, without stale cache from akamai | create IO EXT Jira ticket like this one 

                    IOEXT-1497
                            -
            raise rate limit of 14257-merchatscale to 1500 RPM 
                                                Closed
                
 to raise RPM (currently at 2500 RPM) |

any 4xx or 5xx status code, check if there is a **x-request-id** response header. If not, this means you need to look for Akamai Support. If you do, look [for it in the splunk logs](https://wiki.corp.adobe.com/display/adobedotcom/M@S+Monitoring#M@SMonitoring-Usefulqueries). And see how did it happen.

Best is to try to reproduce the issue in a unit test (you can debug and fix). If you really need debug logs, this is possible, please check how to (quickly!) enable debug logs below, but this is a prod change with its risks, and bloat logs very quickly!

### performance issue

if you get slow response, it should mostly be caching issue: you can check akamai [IORuntimeFragmentpipeline(/mas/io)-howtocheckrequest&responseheaders](#IORuntimeFragmentpipeline(/mas/io)-IORuntimeFragmentpipeline(/mas/io)-howtocheckrequest&responseheaders)

| server-timing | cdn-cache; desc=MISS |
|---|---|

or

| server-timing | cdn-cache; desc=REVALIDATE |
|---|---|

means request came down to the origin, and then duration of the request is a composition of all network to go down to the origin, plus the actual time it took to process the request (you can check searching for **x-request-id**)

if you have

| server-timing | cdn-cache; desc=HIT |
|---|---|

there must be some network latency in between your client, and the first akamai node, you should be contacting akamai support.

## tooling

### how to check splunk logs

please go to the dedicated section [https://wiki.corp.adobe.com/display/adobedotcom/M@S+Monitoring#M@SMonitoring-MerchAtScaleIOlayer](https://wiki.corp.adobe.com/display/adobedotcom/M@S+Monitoring#M@SMonitoring-MerchAtScaleIOlayer) where you will find all that you need

### how to check request & response headers

when hitting [https://www.adobe.com/creativecloud/plans.html](https://www.adobe.com/creativecloud/plans.html) and opening inspector of your browser, search for mas/io request

![image](/download/attachments/3587728545/image-2025-9-18_15-17-18.png?version=1&modificationDate=1758201439557&api=v2)

then clicking on one, you can usually see request & response headers of a request

![image](/download/attachments/3587728545/image-2025-9-18_15-18-23.png?version=1&modificationDate=1758201504587&api=v2)

# Configuration

using adobe.io [state management](https://developer.adobe.com/app-builder/docs/guides/app_builder_guides/application-state#state), we store configurations that help driving fragment pipeline

### listing available configuration


[?](#)| aio app state list |
|---|


### getting configuration


[?](#)| aio app state get configuration |
|---|


### setting configuration


[?](#)| aio app state put configuration {...} |
|---|


```
where object can contain following configurations (more details in https://github.com/adobecom/mas/blob/main/io/www/src/fragment/README.md#configuration)- wcsConfiguration,- networkConfig,- debugLogs
```

### prod configuration


[?](#)| aio app state put configuration '{"wcsConfiguration":[{"api_keys":["wcms-commerce-ims-ro-user-milo","CreativeCloud_v6_8"],"wcsURL":"https://www.adobe.com/web_commerce_artifact","env":"prod"}],"networkConfig":{"fetchTimeout":2000,"retries":3,"retryDelay":50,"mainTimeout":5000}}' --ttl=31536000 |
|---|


### stage configuration


[?](#)| aio app state put configuration '{"wcsConfiguration":[{"api_keys":["wcms-commerce-ims-ro-user-milo","CreativeCloud_v6_8"],"wcsURL":"https://www.adobe.com/web_commerce_artifact","env":"prod"},{"api_keys":["dexter-commerce-offers","CreativeCloud_v6_8","wcms-commerce-ims-ro-user-milo"],"wcsURL":"https://wcs-stage.adobe.io/web_commerce_artifact","env":"stage","landscape":"ALL"}]}' --ttl=31536000 |
|---|




                
        
    
        