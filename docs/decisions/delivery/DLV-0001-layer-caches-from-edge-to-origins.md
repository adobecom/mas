---
id: DLV-0001
title: Layer fragment caches from the CDN edge down to Odin and WCS
status: active
scope: project
related: ['CONT-0005', 'adr:Adobe-acom/core/KNOW-0000']
---

# DLV-0001. Layer fragment caches from the CDN edge down to Odin and WCS

## Context

Pages get merch cards and collections from `https://www.adobe.com/mas/io/fragment`. That endpoint is the `io/www` App Builder action, which builds each response from several sources:

- Odin (AEM as a Cloud Service): the fragment and its references, dictionary, promotions, settings and baselines;
- WCS: offers and prices.

A response depends on all of them, on the request parameters (`id`, `locale`, `country`, `pzn`, `mask`, `offer`, `template`, `surface`) and on the date (promotion windows). It can't be invalidated when content is published.

One CDN miss used to rebuild the whole response, which means many Odin and WCS calls. The CDN has many edges and little parent tier sharing, so misses were frequent: millions of requests a day waited for the origin, with a p90 above 1 s. An I/O Runtime container only lives a few minutes, so its memory alone can't absorb these misses.

## Decision

We will cache the `/mas/io/fragment` API at every layer below. Each layer has its own key and lifetime, and is only filled by the layer above it missing. From the visitor down:

| #   | Layer                                                 | Owner                  | Key                                      | Lifetime                                         |
| --- | ----------------------------------------------------- | ---------------------- | ---------------------------------------- | ------------------------------------------------ |
| 1   | Browser: HTTP cache and the `aem-fragment` page cache | M@S (`web-components`) | URL; fragment id                         | up to 5 min; page life                           |
| 2   | `www.adobe.com` CDN, `/mas/io` path                   | M@S                    | request URL                              | 15 min                                           |
| 3   | `io/www` container memory                             | M@S (`io/www`)         | see below                                | 60 s for stored copies; 5 min ±20% for inputs    |
| 4   | App Builder State and Files of the namespace          | M@S (`io/www`)         | `req-<request key>`, `res-<request key>` | refreshed after 5 min; served stale up to 15 min |

On a rebuild, `io/www` calls two other APIs, each with its own cache:

- **WCS**, through the `www.adobe.com/web_commerce_artifact` CDN path, owned by M@S and also called directly by pages for prices: 15 min.
- **Odin**, through the AEM CDN, owned by Odin / AEM: 1 h.

The browser lifetime comes from `io/www`, which sends `Cache-Control: public, max-age=300, …`, configurable through `networkConfig.cacheMaxAge` in State. The CDN caps it to its own remaining lifetime.

Layers 3 and 4 live in `io/www`. They behave as follows:

- **Request key**: built by `getRequestMetadataKey` from the fragment id (or `.offer`), the locale, the country and each personalization parameter present, e.g. `req-<id>-fr_FR-LU.p-edu.m-catalog`. Values are escaped so that two parameter sets never share a key.
- **Two entries per request key**:
    - `req-`, in State, holds the request metadata: the response hash, `lastModified`, `refreshedAt` and the context needed to rebuild (fragment ids, path, surface).
    - `res-`, in Files (`fragment-cache/res-<request key>.json`), holds the response: `{ hash, body }`, the body being brotli compressed and base64 encoded. Responses over 900 KB are not stored; most are under 20 KB.
    - Files reads and writes are best effort: one failing or taking over 500 ms is a miss. Until a container's Files client is ready (a couple of seconds after it starts), its requests skip `res-`.
    - A response is served as is while `refreshedAt` is less than 5 minutes old.
    - Beyond that, one rebuild starts per container while the previous response is served, up to 15 minutes old. Older ones wait for the rebuild.
    - Before rebuilding, the container re-reads both entries, in case another container just refreshed them.
    - A failed rebuild (5xx), or one still running near the request deadline, falls back to a response less than 15 minutes old; the slow rebuild goes on and stores its response.
    - A degraded rebuild (a 200 missing data after an Odin or WCS failure: settings, dictionary, promotions, baselines, offers, offer mapping, WCS 5xx) is not stored, and falls back the same way; otherwise it is served, and the next request rebuilds again.
    - Every rebuild rewrites `req-`, to update `refreshedAt`. `res-` is only rewritten when the hash changed, or when its previous write failed (the response then only lived in memory).
- **Memory**, one shared LRU (least recently used) cache per container, bounded by 75% of the V8 heap:
    - copies of the stored entries, re-read at most every minute;
    - stale-while-revalidate caches of the inputs that many responses share: `dictionary`, `promotions`, `baselines`, `offers`, `offer-mapping` and `wcs-artifacts`. Each refills in the background and in a single flight per key.
- **Bypass**: Studio preview and `instant` (time travel) requests read neither the memory copies nor the stored responses.

The `offers` action follows the same pattern: it syncs offer baselines into State every 15 minutes and serves them through layer 2.

## Rationale

- **State and Files as a shared origin cache**: they survive container recycling and are shared by all containers, so a key is built about once every 5 minutes for the whole fleet instead of once per CDN miss. A CDN miss then usually costs a memory read (~9 ms) or a storage read (~80–90 ms) instead of a rebuild.
- **Not a bigger CDN parent tier instead**: the available offers are sized and priced for far more traffic than this endpoint has, and a parent tier would not shield a cold key either.
- **Two entries rather than one**: most rebuilds produce the same hash. They then only write ~1 KB of metadata.
- **Responses in Files rather than State**: a first version also kept `res-` in State. In production, reads and writes of responses from many new containers exceeded State's rate and bandwidth limits; throttled calls made requests time out, and it was reverted ([adobecom/mas#1661](https://github.com/adobecom/mas/pull/1661)). In a benchmark from one container, Files read and wrote 3 to 80 KB responses in ~80 ms (p50) without throttling, while State slowed down to seconds from 20 KB values. The small `req-` entries stay in State, as before.
- **A short memory copy in front of State and Files**: hot keys don't hit State on every request. A minute bounds how far a container can lag behind another one's refresh.
- **Stale-while-revalidate everywhere**: visitors don't wait for a rebuild. Odin and WCS see one request per key and interval rather than a burst when entries expire together, which the ±20% jitter also prevents.

## Consequences

### Positive

- Most CDN misses are served from memory, State or Files without calling Odin or WCS. Rebuild traffic depends on the number of keys, not on the number of visitors.
- Odin or WCS failures and slowness are hidden for up to 15 minutes per key.
- Each request logs one `pipeline completed` line with its cache outcome (`hit`, `stale`, `joined`, `stale-error`, `miss`) and key. Memory and evictions are logged on a separate `memory:` line.

### Costs and risks

- **Staleness adds up and nothing is purged on publish.** A publication can take over an hour to show in the worst case:
    - Odin CDN up to 1 h, unless purged (`softpurge`);
    - 5 min for the shared input caches;
    - 5 to 15 min for the stored response, plus 1 min for the memory copy;
    - 15 min in Akamai;
    - 5 min in the browser.
- **Hot keys only**: every request key needs its own entry, so rarely requested ones are still built on their first miss. State is limited to 200k keys and 1 GB per workspace; entries expire after 24 h without a write.
- **Files never expire**: stored responses of keys no longer requested stay until cleaned up. [MWPW-215962](https://jira.corp.adobe.com/browse/MWPW-215962) adds a scheduled cleanup.
- **CDN fragmentation**: each site currently gets its own layer 2 copy. [WPS-36704](https://jira.corp.adobe.com/browse/WPS-36704) removes that split.
- **Heap budget**: memory eviction relies on V8 heap samples. [MWPW-215446](https://jira.corp.adobe.com/browse/MWPW-215446) tracks a case where heap usage is underestimated.
- **The Odin CDN is owned by Odin / AEM**: its lifetime can change without M@S being involved.

## References

- Implementation: `io/www/src/fragment/pipeline.js` (`mainProcess`), `io/www/src/fragment/utils/cache.js`, `io/www/src/fragment/utils/swr-cache.js`, `io/www/src/offers/index.js`, `web-components/src/aem-fragment.js` (`FragmentCache`)
- Jira: [MWPW-214624](https://jira.corp.adobe.com/browse/MWPW-214624) (shared response cache), [WPS-36704](https://jira.corp.adobe.com/browse/WPS-36704), [MWPW-215446](https://jira.corp.adobe.com/browse/MWPW-215446)
- Pull requests: [adobecom/mas#1604](https://github.com/adobecom/mas/pull/1604), reverted by [adobecom/mas#1661](https://github.com/adobecom/mas/pull/1661)
