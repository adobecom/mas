# BCOS tool: resolve a MAS offer

`/mas/io/agent` accepts a fragment UUID selected by the client or resolves a product
name and audience through the static map in `product-fragment-map.js`. Both
routes invoke the sibling `fragment` action, hydrate prices and authored terms
in Node.js, and return one offer object. This document describes its Brand
Concierge (BCOS) integration.

The repository does not contain an authoritative BCOS manifest schema. The
HTTP and data contracts below are authoritative; translate the schema-neutral
tool contract into the supported BCOS registration format when that format is
confirmed.

## HTTP endpoint

### URL paths

```http
GET /mas/io/agent/<fragment-id>?locale=<locale>&api_key=<key>[&country=<country>]
GET /mas/io/agent?productName=<name>&locale=<locale>&api_key=<key>[&pzn=<pzn>][&country=<country>]
```

In `/mas/io/agent/<fragment-id>`, the fragment UUID is the path segment after
`/agent/`.

### Query parameters

| Query parameter | Required | Description                                                                |
| ------------- | -------- | -------------------------------------------------------------------------- |
| `productName` | for product lookup | Product name resolved case-insensitively through the product map. |
| `locale`      | yes      | Locale passed to the `fragment` action and used for pricing hydration.     |
| `api_key`     | yes      | Registered MAS client API key passed to the `fragment` action.             |
| `pzn`         | no       | Audience selector for product lookup: `edu` or `team`. Omit for individuals. Not supported with a fragment ID. |
| `country`     | no       | Country passed to the `fragment` action and normalized for hydration.      |

`locale` and `country` come from the page's `mas-commerce-service` element — the
web page (or BC agent) reads them there and passes them through. They are page
context, not model-selected inputs.

Omit `pzn` for individual offers. Only `edu` and `team` are accepted when it is
supplied; an empty value or `pzn=individual` returns 400. `pzn` is not forwarded
to the fragment action. A path UUID takes precedence over `productName` and
bypasses audience selection, including the education fallback. Supplying `pzn`
with a fragment ID returns 400.

The fragment path accepts one UUID, case-insensitively, with an optional
trailing slash. Invalid paths return 400 rather than using the product map.
An empty path or `/` uses product lookup. Direct selection does not require an
entry in `PRODUCT_FRAGMENT_MAP`; the client owns that mapping. The fragment
must be published and retrievable by the existing fragment pipeline.

## Product map

`PRODUCT_FRAGMENT_MAP` is a tree keyed by audience segment. Each segment has a
`default` fragment ID and a `products` map of product names to fragment IDs.
The Brand Concierge product cards (variant `brand-concierge-product`) are sourced from
`/content/dam/mas/brand-concierge/en_US`. A card's segment comes from its tags:

| Segment      | Tags                                                          |
| ------------ | ------------------------------------------------------------- |
| `individual` | `mas:customer_segment/individual` + `mas:market_segments/com` |
| `team`       | `mas:customer_segment/team` + `mas:market_segments/com`       |
| `edu`        | `mas:customer_segment/individual` + `mas:market_segments/edu` |

Product matches take precedence over the segment's default. Unknown products
and products without a card for that audience receive its Creative Cloud Pro
default. `pzn=edu` always selects education card
[2b1a6493-e03b-4803-a150-eed983094a05](https://mas.adobe.com/studio.html#fragmentId=2b1a6493-e03b-4803-a150-eed983094a05&page=fragment-editor&path=brand-concierge); its `products` map is empty.
`productName` is required for product lookup. `pzn=team` selects the `team` branch, and
omitting `pzn` selects `individual`. There is no separate `segment` parameter.

The tree contains 20 products and 36 distinct offers: 18 individual, 17 team, and
1 shared education card. Creative Cloud Pro Plus and Frame.io have only
product-specific team cards. The [product map](./product-fragment-map.js)
defines supported product/audience
combinations. Product identity is checked against authored `cardTitle` and
product-code tags; fragment titles and `cardName` alone are insufficient.
Cards with missing audience tags or conflicting product identity are not added
to the map.

See the [API mapping table](../../../../web-components/docs/src/agent.md#product-name-mapping)
for all current segment defaults and product fragment UUIDs.

The former single-product student cards are now authored as Creative Cloud Pro;
all education product lookups use the canonical Creative Cloud Pro education card.
Photography/team cards still combine Creative Cloud Pro content with
Photography checkout links, so that request uses the team default.
Lightroom/team is mapped to its corrected card
with the Lightroom product code and OSI.

`__ow_action_name` and `__ow_path` are OpenWhisk runtime metadata, not public
query parameters. The handler uses the action name to derive the sibling
`fragment` action name and the unmatched path to read the requested UUID. See
[OpenWhisk web actions](https://github.com/apache/openwhisk/blob/master/docs/webactions.md).

## Processing contract

1. Reject an invalid fragment path, a missing path UUID and `productName`,
   missing `locale` or `api_key`, `pzn` supplied with a fragment ID, and an
   unknown `pzn` for product lookup.
2. Use the path UUID when supplied. Otherwise select the audience branch in
   `PRODUCT_FRAGMENT_MAP`, then the matching product fragment ID or that branch's
   default ID.
3. Invoke the sibling `fragment` action with the fragment ID, locale, API key,
   and any supplied `country`. Do not forward `pzn`; it only selects the mapped
   fragment in the agent.
4. Base64-decode and Brotli-decompress the fragment response when its
   `Content-Encoding` is `br`.
5. Parse the fragment response and prefill the real `Wcs` cache from
   `fragment.wcs`.
6. Carry request `locale` and `country` into the pricing runtime, using the
   fragment pipeline's market restrictions and territory commerce-country
   mapping. Hydrate every `<span is="inline-price">` found in fragment fields
   or settings through the real `Price` and `Wcs` implementations.
7. Render with `displayFormatted: false`; the agent performs no independent
   currency or locale formatting.
8. Extract one `{ label }` entry for each non-empty authored CTA link or button,
   preserving authored order after inline-price hydration.
9. Extract the offer, price, and authored terms data, including tag-derived
   `customer_segment` and `market_segment`.
10. Return the selected fragment UUID used for the invocation and echo `pzn`.
    Locale and country are not included in the response.

The fragment is expected to contain a complete WCS cache for every offer
selector and promotion combination used by its inline prices. With a complete
cache, hydration performs no WCS network request. An incomplete cache can
cause `Wcs` to use its configured transport. Only the agent opts into a
5-second timeout for each WCS request; browser clients have no default fetch
timeout. The fragment invocation is bounded to 20 seconds and hydration to
15 seconds. Their deadline timers are cleared when each operation settles.

Fragment-level promotion codes follow the web-component compatibility rules:

- `fields.promoCode` is eligible as the context promotion code.
- It applies only when `fields.compatVersion` is at least
  `COMPAT_VERSION_GLOBAL_PROMO_CODE` or `fragment.promoProject` is present.
- An inline `data-promotion-code` takes precedence.
- `data-promotion-code="cancel-context"` suppresses the context promotion.

## Success response

The action returns HTTP 200 with one JSON offer record.

| Field               | Type           | Description                                                               |
| ------------------- | -------------- | ------------------------------------------------------------------------- |
| `fragment`          | string         | Exact fragment UUID passed to the `fragment` action.                      |
| `productName`       | string         | Hydrated card title.                                                      |
| `pzn`               | string or null | Requested audience selector; `null` when omitted.                         |
| `badge`             | string or null | Card badge text.                                                          |
| `ctas`              | object array   | Ordered authored CTA labels as `{ label }` objects; `[]` when none exist. |
| `terms_url`         | string or null | Authored offer-terms URL when present.                                    |
| `customer_segment`  | string         | Customer segment derived from fragment tags when present.                 |
| `market_segment`    | string         | Market segment derived from `mas:market_segments/*` tags when present.    |
| `title`             | string         | Card title.                                                               |
| `subtitle`          | string         | Card subtitle.                                                            |
| `promoText`         | string         | Promotional copy.                                                         |
| `shortDescription`  | string         | Short card description.                                                   |
| `description`       | string         | Description after inline prices are hydrated and markup is stripped.      |
| `callout`           | string         | Card callout text.                                                        |
| `promoPrice`        | string         | Main promotional display price.                                           |
| `regularPrice`      | string         | Main regular or strikethrough display price.                              |
| `annualPrice`       | string         | Main annual display price when rendered.                                  |
| `planTypeText`      | string         | Authored plan-type text.                                                  |
| `taxText`           | string         | Authored tax text.                                                        |
| `recurrenceText`    | string         | Authored billing-frequency text.                                          |
| `unitText`          | string         | Authored unit text.                                                       |
| `seeTermsInfo`      | object         | `{ analyticsId, href, text }` for the authored terms link.                |
| `renewalText`       | string         | Authored renewal text.                                                    |
| `promoDurationText` | string         | Authored promotion-duration text.                                         |

Optional string and object fields are omitted from serialized JSON when their
value is unavailable.

`ctas` replaces the concatenated `cta_label` field. Each non-empty authored
link or button in the CTA field becomes one entry, in authored order; checkout
URLs are not returned or hydrated. The response's `fragment` is the mapped UUID used for
the action invocation, not a potentially different ID in its returned payload.

For example, the relevant fields for an individual Premiere offer are:

```json
{
    "fragment": "ea8f1b95-56b1-4665-b859-41ac2961ddcd",
    "productName": "Adobe Premiere",
    "customer_segment": "individual",
    "market_segment": "com",
    "pzn": null,
    "ctas": [{ "label": "Free trial" }, { "label": "Buy now" }]
}
```

Other non-excluded MAS tags may also appear as tag-derived top-level fields.
`mas:market_segments/com` and `mas:market_segments/edu` are exposed under the
standard singular field `market_segment`. The response does not include a
`segment` field.

## Errors

| Status          | Condition                                                    |
| --------------- | ------------------------------------------------------------ |
| 400             | Neither a path UUID nor `productName` is supplied.           |
| 400             | The fragment path is not one UUID with an optional trailing slash. |
| 400             | `locale` is missing.                                         |
| 400             | `api_key` is missing.                                        |
| 400             | `pzn` is supplied with a fragment ID.                        |
| 400             | Supplied `pzn` is not `edu` or `team`.                       |
| upstream status | The `fragment` action returns a non-200 response.            |
| 502             | Invoking the `fragment` action throws.                       |
| 502             | Fragment decoding, parsing, or price hydration fails.        |
| 504             | Fragment invocation or price hydration exceeds its deadline. |

Errors return JSON with a `message` field. Fragment-action error messages
are preserved when supplied.

### Hydration geography

The agent normalizes country codes to uppercase at its request boundary,
before both fragment prefetch and pricing hydration. For example, `country=eg`
is passed downstream as `EG`; normalizing only inside hydration is too late
because the lowercase prefetch can return an empty offer array.

Request geography is used even when the fragment has no `settings`. The
language comes from the requested locale, and the country defaults to that
locale's country when omitted. The agent reuses `restrictCountryToLocaleMarket`
for the returned fragment's surface and `resolveTerritoryCountries` for the
commerce country, matching the fragment pipeline rather than inventing its own
geography rules.

Normalized request geography overrides fragment-wide pricing defaults;
authored per-price `data-country` and `data-language` overrides still apply.
For `locale=en_US&country=EG`, hydration uses the prefetched `-eg-mult` cache
entry rather than falling back to `-us-mult`. Territory requests such as `es_PR`
retain their content locale while using the US commerce country.

## API contract changes

- Use `/mas/io/agent/<fragment-id>` to let the client select the offer
  directly. The existing `productName` query route remains supported.
- Use `pzn=edu` or `pzn=team` instead of the removed `segment` query parameter;
  omit `pzn` for individuals. It selects the mapped UUID in the agent only.
- Consume `customer_segment` and `market_segment` from fragment tags, not a
  response `segment` field.
- Iterate `ctas[].label` instead of reading the concatenated `cta_label`.
- Use `fragment` as the UUID invoked by the agent, not as the returned
  payload's potentially different locale/variation ID.
- Supply the required registered `api_key`; the earlier optional wording was
  incorrect.

## BCOS registration

See [`bcos-tools.json`](./bcos-tools.json) for the tool metadata sample — the
LLM `input_schema` (`productName` and `pzn` enums), the
context-injected `query_template` (`locale`/`country` from the page's
`mas-commerce-service`, `api_key` from BCOS configuration), and the
`multimodal` card mapping. Field
names and registration format must follow the authoritative BCOS manifest
schema rather than that illustrative local format.

That sample uses product lookup. For direct fragment selection, Brand Concierge
constructs the endpoint path using its own product/audience mapping and passes
the same `locale`, `country`, and `api_key` context. No product map entry or
`productName` parameter is required on that route.

The BCOS integration must call the action with HTTP GET, pass only supplied
optional parameters, consume the response root as one offer record, and
surface upstream non-200 responses as tool errors.
