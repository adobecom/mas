# M@S Monitoring

> Source: https://wiki.corp.adobe.com/display/adobedotcom/M@S+Monitoring
> Scraped: 2026-01-06T07:39:37.061Z

---


                           
        |  | 1Grafana Akamai Traffic peak1.1access request1.2dashboards1.2.1mas/io/fragment related dashboard1.3useful queries1.3.1WCS recent requests2Splunk2.1Lana based errors2.1.1dashboard2.1.2Protocol when splunk alert is sent2.1.3https://splunk-us.corp.adobe.com/en-US/app/app_log_always_never_assume/ms_lana_logs?form.global_time.earliest=-12h%40h&form.global_time.latest=now2.1.4What is logged?2.1.5access request2.1.6Splunk Alert2.1.7Splunk Details2.1.8Lana2.1.9Useful queries2.1.9.1OSI stats2.1.9.2Main URLs where client errors occured in the last 7 days2.1.10Additional Info2.2Merch At Scale IO layer2.2.1What is logged?2.2.2access request2.2.3dashboards2.2.4useful queries2.2.4.1stage last nala execution2.2.4.2stage request id details2.2.4.3prod request id details2.2.4.4api keys used for the last 6 months2.2.4.5non 200 odin requests2.2.4.6stats mas/io requests2.2.4.7note:  timing dashboard should be more helpful than this2.2.4.8CCD last 24 hours fragments2.2.4.9slow freyja requests2.3Web Commerce Service 2.3.1What is logged?2.3.2access request2.3.3useful queries2.3.3.1incoming requests from last 7 days |
|---|---|

we do monitoring of m@s based on two platform: akamai's grafana data collection, called traffic peak, and splunk

# Grafana Akamai Traffic peak

## access request

ask #akamai-adobe-support

## dashboards

### mas/io/fragment related dashboard

[https://grafana-us.trafficpeak.live/goto/vRQsMPXHg?orgId=750](https://grafana-us.trafficpeak.live/goto/vRQsMPXHg?orgId=750)

## useful queries

### WCS recent requests

# Splunk

## Lana based errors

this section covers splunk logs from what is tracked on client side.

### dashboard

we try to sum up all info that will help you understanding what is wrong quickly in

[https://splunk-us.corp.adobe.com/en-US/app/app_log_always_never_assume/ms_lana_logs?form.global_time.earliest=-12h%40h&form.global_time.latest=now](https://splunk-us.corp.adobe.com/en-US/app/app_log_always_never_assume/ms_lana_logs?form.global_time.earliest=-12h%40h&form.global_time.latest=now)

### Protocol when splunk alert is sent

| Step | Details & comment |
|---|---|
| answer a mail saying you are looking into it | it's ok if it's the first time, we can help you looking into it. We |
| 2. are we the first wednesday of the month? | This is more likely a test alert, please proceed with next step, but if you don't see any peak, just answer that a resolution |
| 3. check for main issues locations | use https://splunk-us.corp.adobe.com/en-US/app/app_log_always_never_assume/ms_lana_logs?form.global_time.earliest=-12h%40h&form.global_time.latest=nowThis should unveil clear "winners" in terms of client href, or country, or tags, |
| 4.if needed, go to corresponding search | certain of the charts are clickable, otherwise just add that URL or set of values you want to search to the index e.g. here with indian plans page. This should unveil "typical" issues. please request content changes to #merch-at-scale channel |
| 5. answer resolution by mail | resolution can be a slack link with your discussion. |

### What is logged?

Every error during price rendering, e.g. failed fetch of WCS request, failed formatting of the price, error during construction the checkout URL, etc.

These cases are muted (no message is sent):

- user agent contains 'bot', 'crawl' or 'spider'
- user agent contains 'Android' and 'wv' and the page is mastercard.html (see 

                    MWPW-139407
                            -
            WCS errors on Androids Webview (Mastercard page)
                                                Closed
                
)

| Surface | Issue | Error | Sample Query |
|---|---|---|---|
| Milo | 429 Response code | "Bad WCS request: 429"
?client=merch-at-scale¦type=e¦sample=100¦user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36¦referer=https://ccd--milo--adobecom.hlx.live/¦ip=undefined¦message=Failed to render mas-element:  Bad WCS request: 429, url: https://www.adobe.com/web_commerce_artifact?offer_selector_ids=A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M&country=US&locale=en_US&landscape=PUBLISHED&api_key=wcms-commerce-ims-ro-user-milo&language=MULT¶page=/libs/features/mas/docs/ccd.html¦tags=ccd | client=merch-at-scale¦type=e¦sample=100¦user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36¦referer=https://ccd--milo--adobecom.hlx.live/¦ip=undefined¦message=Failed to render mas-element:  Bad WCS request: 429, url: https://www.adobe.com/web_commerce_artifact?offer_selector_ids=A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M&country=US&locale=en_US&landscape=PUBLISHED&api_key=wcms-commerce-ims-ro-user-milo&language=MULT¶page=/libs/features/mas/docs/ccd.html¦tags=ccd | index=lana_prod l_client=merch-at-scale "tags=ccd" "429" |
| client=merch-at-scale¦type=e¦sample=100¦user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36¦referer=https://ccd--milo--adobecom.hlx.live/¦ip=undefined¦message=Failed to render mas-element:  Bad WCS request: 429, url: https://www.adobe.com/web_commerce_artifact?offer_selector_ids=A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M&country=US&locale=en_US&landscape=PUBLISHED&api_key=wcms-commerce-ims-ro-user-milo&language=MULT¶page=/libs/features/mas/docs/ccd.html¦tags=ccd |
| Milo | Empty response
?{"resolvedOffers":[]} | {"resolvedOffers":[]} | "Commerce offer not found: 200"
?client=merch-at-scale¦type=e¦sample=100¦user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36¦referer=https://ccd--milo--adobecom.hlx.live/¦ip=undefined¦message=Failed to render mas-element:  Commerce offer not found: 200, url: https://www.adobe.com/web_commerce_artifact?offer_selector_ids=A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M&country=US&locale=en_US&landscape=PUBLISHED&api_key=wcms-commerce-ims-ro-user-milo&language=MULT¶page=/libs/features/mas/docs/ccd.html¦tags=ccd | client=merch-at-scale¦type=e¦sample=100¦user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36¦referer=https://ccd--milo--adobecom.hlx.live/¦ip=undefined¦message=Failed to render mas-element:  Commerce offer not found: 200, url: https://www.adobe.com/web_commerce_artifact?offer_selector_ids=A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M&country=US&locale=en_US&landscape=PUBLISHED&api_key=wcms-commerce-ims-ro-user-milo&language=MULT¶page=/libs/features/mas/docs/ccd.html¦tags=ccd | index=lana_prod l_client=merch-at-scale "tags=ccd" "Commerce offer not found" |
| {"resolvedOffers":[]} |
| client=merch-at-scale¦type=e¦sample=100¦user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36¦referer=https://ccd--milo--adobecom.hlx.live/¦ip=undefined¦message=Failed to render mas-element:  Commerce offer not found: 200, url: https://www.adobe.com/web_commerce_artifact?offer_selector_ids=A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M&country=US&locale=en_US&landscape=PUBLISHED&api_key=wcms-commerce-ims-ro-user-milo&language=MULT¶page=/libs/features/mas/docs/ccd.html¦tags=ccd |
| Milo | No format string in response | "Commerce offer not found: 200"
?client=merch-at-scale¦type=e¦sample=100¦user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36¦referer=https://ccd--milo--adobecom.hlx.live/¦ip=undefined¦message=Failed to render mas-element:  Commerce offer not found: 200, url: https://www.adobe.com/web_commerce_artifact?offer_selector_ids=A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M&country=US&locale=en_US&landscape=PUBLISHED&api_key=wcms-commerce-ims-ro-user-milo&language=MULT¶page=/libs/features/mas/docs/ccd.html¦tags=ccd | client=merch-at-scale¦type=e¦sample=100¦user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36¦referer=https://ccd--milo--adobecom.hlx.live/¦ip=undefined¦message=Failed to render mas-element:  Commerce offer not found: 200, url: https://www.adobe.com/web_commerce_artifact?offer_selector_ids=A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M&country=US&locale=en_US&landscape=PUBLISHED&api_key=wcms-commerce-ims-ro-user-milo&language=MULT¶page=/libs/features/mas/docs/ccd.html¦tags=ccd | index=lana_prod l_client=merch-at-scale "tags=ccd" "Commerce offer not found" |
| client=merch-at-scale¦type=e¦sample=100¦user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36¦referer=https://ccd--milo--adobecom.hlx.live/¦ip=undefined¦message=Failed to render mas-element:  Commerce offer not found: 200, url: https://www.adobe.com/web_commerce_artifact?offer_selector_ids=A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M&country=US&locale=en_US&landscape=PUBLISHED&api_key=wcms-commerce-ims-ro-user-milo&language=MULT¶page=/libs/features/mas/docs/ccd.html¦tags=ccd |

| Surface | Query string |
|---|---|
| Dexter | "tags=consumer=dexter" |
| Milo | "tags=acom" |
| CCD | "tags=ccd" |

### access request

[Splunk#AccesstoSplunkindexesa.k.a.INEEDACCESS](/display/WCMSOps/Splunk#Splunk-AccesstoSplunkindexesa.k.a.INEEDACCESS)

### Splunk Alert

[CSO Alert](https://splunk-us.corp.adobe.com/en-GB/app/app_log_always_never_assume/alert?s=%2FservicesNS%2Fnobody%2Fapp_log_always_never_assume%2Fsaved%2Fsearches%2FM%2540S%2520Catastrophe%2520Alert)

*Alert when the number of errors for M@S is greater than 40k OR is greater than 2 times the average number for the last 9 hours.*

*Additionally, to make sure the Alert is ON, it fires up each first day of the month, at 10:00 Splunk server time (12 PM CET).***

*(

                    MWPW-133440
                            -
            generate m@s lana splunk based alerts
                                                Done
                
)*

Query:


[?](#)| index=lana_prod l_client=merch-at-scale earliest=-9h | timechart  partial=f span=1h count as number_of_errors  | trendline  sma6(number_of_errors) as moving_average_sma6  | autoregress  moving_average_sma6 AS previous_moving_average_sma6 p=1  | eval  current_errors_to_previous_moving_avg = number_of_errors/previous_moving_average_sma6 | tail 1 | where current_errors_to_previous_moving_avg > 2 OR number_of_errors > 40000 |
|---|


Email is sent to [GRP-WCMS-COMMERCE-DEV@adobe.com](mailto:GRP-WCMS-COMMERCE-DEV@adobe.com), subscribe in IAM to 'GRP-WCMS-COMMERCE-DEV' as a group member.

### Splunk Details

|  | Prod | Stage |
|---|---|---|
| Index | lana_prod | lana_nonprod |
| Query | Query | Query |
| Dashboard | All Issues | All Issues |

### Lana

ClientId: **merch-at-scale**

Test requests:

[https://www.stage.adobe.com/lana/ll?m=teststage&c=merch-at-scale&s=100&t=e](https://www.stage.adobe.com/lana/ll?m=teststage&c=merch-at-scale&s=100&t=e)
[https://www.adobe.com/lana/ll?m=testprod&c=merch-at-scale&s=100&t=e](https://www.adobe.com/lana/ll?m=testprod&c=merch-at-scale&s=100&t=e)

### Useful queries

#### OSI stats

Query


[?](#)| | pivot mas_lana_prod_ext RootObject count(RootObject) AS count SPLITROW osis AS osis TOP 100 count(RootObject) ROWSUMMARY 0 COLSUMMARY 0 SHOWOTHER 1 |
|---|


#### Main URLs where client errors occured in the last 7 days

![image](/download/attachments/3439828562/image-2025-3-3_15-16-37.png?version=1&modificationDate=1741011398463&api=v2)


[?](#)| index=lana_prod l_client=merch-at-scale| rex field=_raw "referer=(?<referer>[^¦]+)"| eval base_url=replace(referer, "(https?://[^/]+/[^?]+).*", "\1")| stats count by base_url| sort - count | head 100 |
|---|


### Additional Info

[LANA - Log Always Never Assume](/display/WCMSOps/LANA+-+Log+Always+Never+Assume)

## Merch At Scale IO layer

this section covers splunk logs from what is tracked on the edge of all fragment queries

### What is logged?

all requests going hitting akamai, typically `www.adobe.com/mas/io/fragment?...`  with potential errors & timing

logs all have a prefix


[?](#)| [LOG LEVEL][API KEY][REQUEST ID][REQUESTED FRAGMENT ID][REQUESTED LOCALE][TRANSFORMER NAME / PIPELINE]e.g [info][wcms-commerce-ims-ro-user-milo][G4sLgg4q5G6neEhCJ9qc3QZ8mhox0Rm7][6b3c6c4e-e19f-4d08-914f-fcfd9f77ca14][fr_FR][wcs] |
|---|


### access request

[Splunk#AccesstoSplunkindexesa.k.a.INEEDACCESS](/display/WCMSOps/Splunk#Splunk-AccesstoSplunkindexesa.k.a.INEEDACCESS)

### dashboards

[https://splunk-us.corp.adobe.com/en-GB/app/search/mas_overall](https://splunk-us.corp.adobe.com/en-GB/app/search/mas_overall) for getting a grasp of overall usage of the api, what client ids, what traffic, etc...

[https://splunk-us.corp.adobe.com/en-GB/app/search/mas_io_fragment_timings](https://splunk-us.corp.adobe.com/en-GB/app/search/mas_io_fragment_timings) for having more details on the requests performances, why things are slow, etc..

### useful queries

#### stage last nala execution

CI/CD executes PR code in stage. If anything goes wrong, you can check it on splunk with that query

#### stage request id details

#### prod request id details

searching for a prod request log by id

#### api keys used for the last 6 months


[?](#)| | rex field=_raw "\[info\]\[(?<api_key>[^\]]+)\]" | stats count by api_key |
|---|


#### non 200 odin requests


[?](#)| fetch https://odin.adobe.com/adobe/sites/fragments | rex "\((?<status_code>\d{3})\)" | search NOT (status_code=200 OR status_code=304) |
|---|


#### stats mas/io requests


[?](#)| index=adobeio_events_processing_prod "pipeline completed" | rex field=_raw "in (?<duration>.+)ms" | where isnotnull(duration) | stats avg(duration), perc99(duration), perc95(duration), perc90(duration), perc50(duration) |
|---|


#### note:  timing dashboard should be more helpful than this

#### CCD last 24 hours fragments


[?](#)| index=adobeio_events_processing_prod "pipeline completed" | rex field=_raw "\[(?<client>Creative[^\]]+)\]\[[^\]]+\]\[(?<fragment>[^\]]+)\]" | where isnotnull(client) | stats by client, fragment |
|---|


#### slow freyja requests

odin requests above 2s


[?](#)| index=adobeio_events_processing_prod "fetch https://odin.adobe.com" | rex field=_raw "in (?<duration>[2-9]\d\d\d+)ms" | where isnotnull(duration) | sort - duration |
|---|


## Web Commerce Service

### What is logged?

this secion covers WCS requests that hit the origin (akamai cache misses for `www.adobe.com/web_comerce_artifact?...`  requests)

### access request


[?](#)| you can request to these splunk groupsSplunk CT - wcs_admin, Splunk CT - wcs_devSplunk CT - generic_adobeio_access_all_logs_nonpciand below IAM groupsGRP-WCS-ENG, GRP-WCS-FRIENDS |
|---|


### useful queries

#### incoming requests from last 7 days

[same with count by API_KEY parameter](https://splunk-us.corp.adobe.com/en-GB/app/search/search?q=search%20index%3Dwcs_prod%20%22com.adobe.asr.logging%22%20INGRESS%20api_key%20%7C%20rex%20field%3D_raw%20%22api_key%3D(%3F%3Capi_key%3E%5B%5E%5C%26%5E%5C%22%5D%2B)%5B%5C%26%5C%22%5D%22%20%7C%20stats%20count%20by%20api_key&display.page.search.mode=fast&dispatch.sample_ratio=1&earliest=-7d&latest=now&display.page.search.tab=statistics&display.general.type=statistics&sid=1744115838.50785_57FA74C6-D4D6-4794-AA6A-4D4846C02AB9)


[?](#)| | rex field=_raw "api_key=(?<api_key>[^\&^\"]+)[\&\"]" | stats count by api_key |
|---|




                
        
    
        