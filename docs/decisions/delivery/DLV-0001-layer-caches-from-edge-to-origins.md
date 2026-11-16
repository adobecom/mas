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

We will cache at every layer below. Each layer has its own key and lifetime, and is only filled by the layer above it missing. From the visitor down:

| #   | Layer                                                 | Owner                  | Key                                      | Lifetime                                         |
| --- | ----------------------------------------------------- | ---------------------- | ---------------------------------------- | ------------------------------------------------ |
| 1   | Browser: HTTP cache and the `aem-fragment` page cache | M@S (`web-components`) | URL; fragment id                         | up to 5 min; page life                           |
| 2   | `www.adobe.com` CDN, `/mas/io` path                   | WPS                    | request URL                              | 15 min                                           |
| 3   | `io/www` container memory                             | M@S (`io/www`)         | see below                                | 60 s for State copies; 5 min ±20% for inputs     |
| 4   | App Builder State of the namespace                    | M@S (`io/www`)         | `req-<request key>`, `res-<request key>` | refreshed after 5 min; served stale up to 15 min |
| 5   | `www.adobe.com` CDN, WCS artifacts path               | WCS team               | request URL                              | 15 min                                           |
| 6   | AEM CDN in front of Odin                              | Odin / AEM             | URL                                      | 1 h                                              |

The browser lifetime comes from `io/www`, which sends `Cache-Control: public, max-age=300, …`, configurable through `networkConfig.cacheMaxAge` in State. The CDN caps it to its own remaining lifetime.

Layers 3 and 4 are owned by M@S. They behave as follows:

- **Request key**: built by `getRequestMetadataKey` from the fragment id (or `.offer`), the locale, the country and each personalization parameter present, e.g. `req-<id>-fr_FR-LU.p-edu.m-catalog`. Values are escaped so that two parameter sets never share a key.
- **State, two entries per request key**:
    - `req-` holds the request metadata: the response hash, `lastModified`, `refreshedAt` and the context needed to rebuild (fragment ids, path, surface).
    - `res-` holds the response: `{ hash, body }`, the body being brotli compressed and base64 encoded, up to 900 KB.
    - A response is served as is while `refreshedAt` is less than 5 minutes old.
    - Beyond that, one rebuild starts per container while the previous response is served, up to 15 minutes old. Older ones wait for the rebuild.
    - Before rebuilding, the container re-reads State, in case another container just refreshed it.
    - A failed rebuild (5xx) falls back to a response less than 15 minutes old.
    - Every rebuild rewrites `req-`. `res-` is only rewritten when the hash changed.
- **Memory**, one shared LRU per container, bounded by 75% of the V8 heap:
    - copies of the State entries, re-read at most every minute;
    - stale-while-revalidate caches of the inputs that many responses share: `dictionary`, `promotions`, `baselines`, `offers`, `offer-mapping` and `wcs-artifacts`. Each refills in the background and in a single flight per key.
- **Bypass**: Studio preview and `instant` (time travel) requests read neither the memory copies nor the stored responses.

The `offers` action follows the same pattern: it syncs offer baselines into State every 15 minutes and serves them through layer 2.

## Rationale

- **State as a shared origin cache**: it survives container recycling and is shared by all containers, so a key is built about once every 5 minutes for the whole fleet instead of once per CDN miss. A CDN miss then usually costs a memory read (~9 ms) or a State read (~85 ms) instead of a rebuild.
- **Not a bigger CDN parent tier instead**: the available offers are sized and priced for far more traffic than this endpoint has, and a parent tier would not shield a cold key either.
- **Two State entries rather than one**: most rebuilds produce the same hash. They then write ~1 KB of metadata rather than a body of up to 900 KB, which keeps within State's bandwidth limits (10 MB/min by default).
- **A short memory copy in front of State**: hot keys don't hit State on every request. A minute bounds how far a container can lag behind another one's refresh.
- **Stale-while-revalidate everywhere**: visitors don't wait for a rebuild. Odin and WCS see one request per key and interval rather than a burst when entries expire together, which the ±20% jitter also prevents.

## Evidence

- Replay of real production requests against a dev workspace, server side: stored responses served from memory in 9 ms p50 / 20 ms p90, against 242 ms p50 / 1627 ms p90 for the pipeline before. State reads and writes take ~85–90 ms each, run in parallel.
- CDN lifetimes of layers 2, 5 and 6 were checked against the response headers and CDN configuration on 2026-11-16.

## Consequences

### Positive

- Most CDN misses are served from memory or State without calling Odin or WCS. Rebuild traffic depends on the number of keys, not on the number of visitors.
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
- **CDN fragmentation**: each site currently gets its own layer 2 copy. [WPS-36704](https://jira.corp.adobe.com/browse/WPS-36704) removes that split.
- **Heap budget**: memory eviction relies on V8 heap samples. [MWPW-215446](https://jira.corp.adobe.com/browse/MWPW-215446) tracks a case where heap usage is underestimated.
- **Layers 2, 5 and 6 are owned by other teams**: their TTLs and keys can change without M@S being involved.

## References

- Implementation: `io/www/src/fragment/pipeline.js` (`mainProcess`), `io/www/src/fragment/utils/cache.js`, `io/www/src/fragment/utils/swr-cache.js`, `io/www/src/offers/index.js`, `web-components/src/aem-fragment.js` (`FragmentCache`)
- Jira: [MWPW-214624](https://jira.corp.adobe.com/browse/MWPW-214624) (shared response cache), [WPS-36704](https://jira.corp.adobe.com/browse/WPS-36704), [MWPW-215446](https://jira.corp.adobe.com/browse/MWPW-215446)
- Pull request: [adobecom/mas#1604](https://github.com/adobecom/mas/pull/1604)
