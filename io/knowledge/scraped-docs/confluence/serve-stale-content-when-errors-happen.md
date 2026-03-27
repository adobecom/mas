# Serve stale content when errors happen

> Source: https://wiki.corp.adobe.com/display/adobedotcom/Serve+stale+content+when+errors+happen
> Scraped: 2026-01-06T07:39:37.063Z

---


                           
        ## default

![image](/download/attachments/3600560152/image-2025-9-5_16-35-32.png?version=1&modificationDate=1757082933053&api=v2)

![image](/download/attachments/3600560152/image-2025-9-5_16-35-55.png?version=1&modificationDate=1757082956740&api=v2)

41 calls recorded server side (31 at t0, then 5 every 15min)

![image](/download/attachments/3600560152/image-2025-9-5_16-37-9.png?version=1&modificationDate=1757083029743&api=v2)

## 504 errors

mas/io pipeline has timeout mechanisms in place so if a request takes too long it just stops, freeing capacity, and returns 504, leaving responsibility to akamai to serve stale content. We configured the following, and then run a load test


```
aio app state put network-config '{"fetchTimeout":500,"retries":3,"retryDelay":100,"mainTimeout":200}' --ttl=31536000
```


![image](/download/attachments/3600560152/image-2025-9-5_17-23-39.png?version=1&modificationDate=1757085820587&api=v2)

![image](/download/attachments/3600560152/image-2025-9-5_17-24-18.png?version=1&modificationDate=1757085858780&api=v2)

![image](/download/attachments/3600560152/image-2025-9-5_17-36-14.png?version=1&modificationDate=1757086574530&api=v2)

83368 requests (with only 200 response) were made that translated into 17 requested on origin that gave 504 systematically

# 429 errors

before a request hits mas/io, if the throughput is higher than rate limit, runtime will send a 429 response that we don't want to bubble up to user surface. We simulated this by hacking mas/io on stage, and setting it up to return 429 responses.

![image](/download/attachments/3600560152/image-2025-9-5_18-19-38.png?version=1&modificationDate=1757089179243&api=v2)

![image](/download/attachments/3600560152/image-2025-9-5_18-19-58.png?version=1&modificationDate=1757089199287&api=v2)

86386 200 status got hit out of 86386, while 28 requests made it through and returned 429

![image](/download/attachments/3600560152/image-2025-9-5_18-22-45.png?version=1&modificationDate=1757089365837&api=v2)



                
        
    
        