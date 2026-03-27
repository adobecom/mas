# First tests

> Source: https://wiki.corp.adobe.com/display/adobedotcom/First+tests
> Scraped: 2026-01-06T07:39:37.062Z

---


                           
        # 2introduction3freyja testing3.1expected load tests3.1.1qa - 1 fragment rotation - 250 virtual users - 100ms sleep - no invalidation3.1.2qa - 9 fragments rotation - 250 virtual users - 100ms sleep - no invalidation3.1.3qa - 1 fragments rotation - 250 virtual users - 100ms sleep - several invalidations of same fragment3.2edge cases3.2.1DDOS possibilities4wcs testing4.1expected load test4.2edge cases4.2.1DDOS possibilities4.3testing akamai configurations,4.3.110 VU, 20 minutes on ~70 OSI with prefresh + Make Public Early4.3.210 VU, 20 minutes on ~70 OSI with prefresh with origin with last modified4.3.3last-modified5mas/io testing5.1first iterations5.1.125 minutes, 500ms sleep, 10 VU5.2last-modified + if-modified-since5.3same cache set, with one new item across different local5.4conclusion

# introduction

[m@s architecture](https://wiki.corp.adobe.com/display/WP4/M@S?focusedCommentId=3298875056#comment-3298875056) is based on 3 streams of content:

- code content through adobe.com (akamai CDN)
- fragment content through freyja (fastly CDN)
- web commerce content through web commerce service (akamai CDN)

for CCD use case that is the first consumer of m@s, code content does not need any test as it will be embedded in the application, which leaves us with freyja & wcs testing.

Peak informations we got from [Ankit Goyal](/display/~ankgoyal) are the following:

- Current users with UI running: 35,472 RPM
- Users bringing CCD into focus : 8,046 RPM
- Total: 35,472 + 8,046 = 43,518 RPM

Please note: these numbers are captured during the MAX 2024 event (October 14th–15th), so they may increase as the CCD user base grows.

for go live we should have one card with one to two WCS items in there so tested load should be

> 50 KRPM freyja calls

> 100 KRPM wcs calls

obviously we are not here to test CDNs which is useless (they are designed to support much higher loads), but limit cases, basically misconfiguration which introduces breaches to origin at given times.

we are using k6 scripts in [https://github.com/adobecom/mas/blob/main/k6-scripts](https://github.com/adobecom/mas/blob/main/k6-scripts/fragment-fetches.js), following same idea:

For each virtual user ([VU](https://grafana.com/docs/k6/latest/get-started/running-k6/#add-vus)) :

- take some source ID (depending on source file & max number of different parameterized),
- fetch related request,
- sleep SLEEP time

# freyja testing

script location: [https://github.com/adobecom/mas/blob/main/k6-scripts/fragment-fetches.js](https://github.com/adobecom/mas/blob/main/k6-scripts/fragment-fetches.js)

what is at stake here is the API https://<odin-host>.adobe.com/adobe/sites/fragments/<fragment-id>. Each usage of m@s references such a fragment and trigger a request to freyja to get corresponding payload. First usage is simple fragment query, no parameter. Any unwanted parameter gives 400 requests, any malformed UUID gives 400 requests. We can eventually test load with such malformed requests (voluntary or unvoluntary DDOS attack), but this is not primary goal. Main risk could be when a fragment gets published & invalidated, that too many requests hit the origin.

## expected load tests

### qa - 1 fragment rotation - 250 virtual users - 100ms sleep - no invalidation

![image](/download/attachments/3597264546/Screenshot%202024-11-21%20at%2016.05.08.png?version=1&modificationDate=1756129137350&api=v2)

| metric | avg | max | med | min | p90 | p95 | p99 |
|---|---|---|---|---|---|---|---|
| http_req_duration | 36ms | 796ms | 35ms | 21ms | 46ms | 53ms | 81ms |
| iteration_duration | 137ms | 897ms | 135ms | 121ms | 147ms | 154ms | 185ms |

| metric | count | rate |
|---|---|---|
| iterations | 365.2k | 960.83/s |

### qa - 9 fragments rotation - 250 virtual users - 100ms sleep - no invalidation

![image](/download/attachments/3597264546/image-2024-11-21_16-26-10.png?version=1&modificationDate=1756129137317&api=v2)

| metric | avg | max | med | min | p90 | p95 | p99 |
|---|---|---|---|---|---|---|---|
| http_req_duration | 29ms | 315ms | 27ms | 20ms | 38ms | 42ms | 55ms |
| iteration_duration | 131ms | 432ms | 129ms | 120ms | 141ms | 146ms | 161ms |

| metric | count | rate |
|---|---|---|
| iterations | 379.8k | 999.24/s |

### qa - 1 fragments rotation - 250 virtual users - 100ms sleep - several invalidations of same fragment

you can see pretty similar average time, but no impact on average, no failed request most of the load was focused on one fragment, just a substantial raise of max time (corresponding to requests hitting the origin, with no impact of the 99th percentile which indicates very few requests were impacted.

![image](/download/attachments/3597264546/image-2024-11-21_16-57-22.png?version=1&modificationDate=1756129137283&api=v2)

| metric | avg | max | med | min | p90 | p95 | p99 |
|---|---|---|---|---|---|---|---|
| http_req_duration | 27ms | 617ms | 25ms | 20ms | 33ms | 37ms | 51ms |
| iteration_duration | 129ms | 717ms | 127ms | 120ms | 137ms | 142ms | 159ms |

| metric | count | rate |
|---|---|---|
| iterations | 386.5k | 1.02k/s |

## edge cases

### DDOS possibilities

no extra parameters allowed (400 responses), no misformatted fragment id allowed, we could test random fragment id if we have time and if there is interest

# wcs testing

actual load for mostly milo pages (edge + origin)

![image](/download/attachments/3597264546/image-2024-11-22_7-21-9.png?version=1&modificationDate=1756129137250&api=v2)

actual load for mostly titan pages (edge + origin):

![image](/download/attachments/3597264546/image-2024-11-22_8-7-0.png?version=1&modificationDate=1756129137217&api=v2)

this load should be moved to [www.adobe.com](http://www.adobe.com) (and half of it composed of OPTIONS requests should vanish) with 
                    [MWPW-156157](https://jira.corp.adobe.com/browse/MWPW-156157)
                            -
            Getting issue details...
                                                STATUS

Script location: [https://github.com/adobecom/mas/blob/main/k6-scripts/wcs-fetches.js](https://github.com/adobecom/mas/blob/main/k6-scripts/wcs-fetches.js)

## expected load test

we first want to test out "prefresh" option if possible on [www.adobe.com](http://www.adobe.com)/web_commerce_artifact property (removing the [wcs.adobe.com](http://wcs.adobe.com) one) with 
                    [WPS-27128](https://jira.corp.adobe.com/browse/WPS-27128)
                            -
            Getting issue details...
                                                STATUS
                . Once that setup is done we can test what should be the load

## edge cases

### DDOS possibilities

test with extra parameters revealed that it's doable and origin is hit every time 
                    [WPS-27099](https://jira.corp.adobe.com/browse/WPS-27099)
                            -
            Getting issue details...
                                                STATUS

## testing akamai configurations,

### 10 VU, 20 minutes on ~70 OSI with prefresh + Make Public Early


```

```


### 10 VU, 20 minutes on ~70 OSI with prefresh with origin with last modified

### last-modified


```
checks.........................: 66.66% 76748 out of 115122
     data_received..................: 34 MB  28 kB/s
     data_sent......................: 6.6 MB 5.4 kB/s
     http_req_blocked...............: avg=38.62µs  min=0s       med=1µs      max=335.78ms p(90)=1µs     p(95)=1µs     
     http_req_connecting............: avg=10.95µs  min=0s       med=0s       max=58.77ms  p(90)=0s      p(95)=0s      
     http_req_duration..............: avg=67.6ms   min=38.21ms  med=47.77ms  max=5.22s    p(90)=72.27ms p(95)=242.42ms
       { expected_response:true }...: avg=67.6ms   min=38.21ms  med=47.77ms  max=5.22s    p(90)=72.27ms p(95)=242.42ms
     http_req_failed................: 0.00%  0 out of 38374
     http_req_receiving.............: avg=187.02µs min=12µs     med=81µs     max=298.65ms p(90)=216.7µs p(95)=406µs   
     http_req_sending...............: avg=152.89µs min=15µs     med=105µs    max=17.97ms  p(90)=215µs   p(95)=335µs   
     http_req_tls_handshaking.......: avg=22.8µs   min=0s       med=0s       max=276.81ms p(90)=0s      p(95)=0s      
     http_req_waiting...............: avg=67.26ms  min=38.06ms  med=47.43ms  max=5.22s    p(90)=71.76ms p(95)=242.06ms
     http_reqs......................: 38374  31.449265/s
     iteration_duration.............: avg=169.36ms min=138.66ms med=149.58ms max=5.32s    p(90)=174.2ms p(95)=344.18ms
     iterations.....................: 38374  31.449265/s
     vus............................: 1      min=1               max=10
     vus_max........................: 10     min=10              max=10
```


note: following the tests above we moved TTL to 15 minutes, and raised pods to 750 RPS capacity from the 18th of february.

![image](/download/attachments/3597264546/image-2025-3-17_16-51-10.png?version=1&modificationDate=1756129137183&api=v2)

The raise of the TTL has been the key factor here (15% raise of offload, 40-60 RPS less on the origin)

# mas/io testing

without disqualifying above freyja tests, there is now an additional layer in io runtime below CDN  that we are calling mas/io

![image](/download/attachments/3597264546/image-2025-3-17_16-54-54.png?version=1&modificationDate=1756129137150&api=v2)

the API is /mas/io/fragment and basically fetches odin fragment to then do stuff to it, eventually re-fetch stuff from odin and finally send back response that is cached into akamai CDN.

Obviously this needs re-testing of it for:

- akamai configuration,
- io runtime throughput in case of invalidation of cached values

[https://github.com/adobecom/mas/blob/main/k6-scripts/fragment-fetches.js](https://github.com/adobecom/mas/blob/main/k6-scripts/fragment-fetches.js) has been re-adapted with this time different locales & some fragments.

we set mas/io CDN configuration similar to WCS, with 5 minutes TTL, prefresh configuration of 15%, and started with low load

## first iterations

### 25 minutes, 500ms sleep, 10 VU

![image](/download/attachments/3597264546/image-2025-3-17_18-14-58.png?version=1&modificationDate=1756129137117&api=v2)

| metric | avg | max | med | min | p90 | p95 | p99 |
|---|---|---|---|---|---|---|---|
| http_req_blocked | 30µs | 135ms | 1µs | 0ms | 2µs | 3µs | 3µs |
| http_req_connecting | 8µs | 25ms | 0ms | 0ms | 0ms | 0ms | 0ms |
| http_req_duration | 145ms | 3s | 35ms | 24ms | 453ms | 638ms | 876ms |
| http_req_receiving | 284µs | 63ms | 131µs | 10µs | 367µs | 694µs | 3ms |
| http_req_sending | 430µs | 28ms | 286µs | 16µs | 765µs | 1ms | 3ms |
| http_req_tls_handshaking | 17µs | 48ms | 0ms | 0ms | 0ms | 0ms | 0ms |
| http_req_waiting | 144ms | 3s | 34ms | 1ms | 453ms | 637ms | 876ms |
| iteration_duration | 648ms | 4s | 537ms | 525ms | 955ms | 1s | 1s |

## last-modified + if-modified-since

in order to be more CDN friendly, headers were implemented so the whole response is not conveyed everytime & recached

very first iteration with 100 VU for 20 minutes was a bit hectic

![image](/download/attachments/3597264546/image-2025-3-17_18-19-11.png?version=1&modificationDate=1756129137087&api=v2)

this is most likely due to cache being propagated on all akamai nodes.

as then the load stabilised, even for 500 VU (almost 1k RPS)

![image](/download/attachments/3597264546/image-2025-3-17_18-21-23.png?version=1&modificationDate=1756129137050&api=v2)

| metric | avg | max | med | min | p90 | p95 | p99 |
|---|---|---|---|---|---|---|---|
| http_req_blocked | 15µs | 58ms | 1µs | 0ms | 1µs | 2µs | 2µs |
| http_req_connecting | 4µs | 13ms | 0ms | 0ms | 0ms | 0ms | 0ms |
| http_req_duration | 35ms | 3s | 29ms | 13ms | 49ms | 61ms | 115ms |
| http_req_receiving | 140µs | 29ms | 93µs | 10µs | 188µs | 278µs | 974µs |
| http_req_sending | 203µs | 47ms | 128µs | 13µs | 358µs | 460µs | 1ms |
| http_req_tls_handshaking | 9µs | 28ms | 0ms | 0ms | 0ms | 0ms | 0ms |
| http_req_waiting | 34ms | 3s | 28ms | 0ms | 49ms | 61ms | 115ms |
| iteration_duration | 537ms | 3s | 530ms | 514ms | 551ms | 563ms | 618ms |

## same cache set, with one new item across different local

added to the set of fragments one new fragment published on every tested locales, and modified it published it several times.

test do show some bigger exceptions than above, but overall, no failed requests

![image](/download/attachments/3597264546/image-2025-3-17_18-24-19.png?version=1&modificationDate=1756129136977&api=v2)

| metric | avg | max | med | min | p90 | p95 | p99 |
|---|---|---|---|---|---|---|---|
| http_req_blocked | 34µs | 150ms | 0ms | 0ms | 1µs | 1µs | 1µs |
| http_req_connecting | 10µs | 32ms | 0ms | 0ms | 0ms | 0ms | 0ms |
| http_req_duration | 70ms | 1s | 58ms | 22ms | 124ms | 154ms | 225ms |
| http_req_receiving | 113µs | 254ms | 56µs | 8µs | 193µs | 288µs | 884µs |
| http_req_sending | 64µs | 34ms | 50µs | 8µs | 98µs | 129µs | 284µs |
| http_req_tls_handshaking | 22µs | 80ms | 0ms | 0ms | 0ms | 0ms | 0ms |
| http_req_waiting | 70ms | 1s | 58ms | 267µs | 123ms | 153ms | 225ms |
| iteration_duration | 471ms | 1s | 459ms | 423ms | 524ms | 555ms | 626ms |

## conclusion

we should be good for a start. We probably still want to investigate for higher security to:

- increase TTL (15 min?)
- increast runtime capacity (600 RPM at the moment)



                
        
    
        