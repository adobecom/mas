# BCOS tool: resolve a MAS offer

`/mas/io/agent` is a proof-of-concept HTTP action for Brand Concierge (BCOS).
It resolves a product name and audience personalization through the static map in
`product-fragment-map.js`, invokes the sibling `fragment` action, hydrates
prices and authored terms in Node.js, and returns one offer object.

The repository does not contain an authoritative BCOS manifest schema. The
HTTP and data contracts below are authoritative; translate the schema-neutral
tool contract into the supported BCOS registration format when that format is
confirmed.

## HTTP endpoint

```http
GET /mas/io/agent?productName=<name>&locale=<locale>&api_key=<key>[&pzn=<pzn>][&country=<country>]
```

| Parameter     | Required | Description                                                                |
| ------------- | -------- | -------------------------------------------------------------------------- |
| `productName` | yes      | Product intent resolved case-insensitively through the static product map. |
| `locale`      | yes      | Locale passed to the `fragment` action and used for pricing hydration.     |
| `api_key`     | yes      | Registered MAS client API key passed to the `fragment` action.             |
| `pzn`         | no       | Agent-only audience selector: `edu` or `team`. Omit for individuals.       |
| `country`     | no       | Country passed to the `fragment` action and normalized for hydration.      |

`locale` and `country` come from the page's `mas-commerce-service` element — the
web page (or BC agent) reads them there and passes them through. They are page
context, not model-selected inputs.

Omit `pzn` for individual offers. Only `edu` and `team` are accepted when it is
supplied; an empty value or `pzn=individual` returns 400. `pzn` is not forwarded
to the fragment action.

## Product map

`PRODUCT_FRAGMENT_MAP` maps each product to one Brand Concierge product card
(variant `brand-concierge-product`) per segment, sourced from
`/content/dam/mas/brand-concierge/en_US`. A card's segment comes from its tags:

| Segment      | Tags                                                          |
| ------------ | ------------------------------------------------------------- |
| `individual` | `mas:customer_segment/individual` + `mas:market_segments/com` |
| `team`       | `mas:customer_segment/team` + `mas:market_segments/com`       |
| `edu`        | `mas:customer_segment/individual` + `mas:market_segments/edu` |

`pzn=edu` selects the `edu` card and `pzn=team` selects the `team` card.
Omitting `pzn` selects the `individual` card. There is no separate `segment`
query parameter. Not every product has a card for every audience.

The current map contains 20 products and 49 offers: 18 individual, 18 team, and
13 education cards. Creative Cloud Pro Plus and Frame.io are team-only. The
[product map](./product-fragment-map.js) defines supported product/audience
combinations. Cards with missing audience
tags or unresolved product identity are not added to the map.

`__ow_action_name` is OpenWhisk runtime metadata, not a public query
parameter. The handler uses it to derive the sibling `fragment` action name.

## Processing contract

1. Reject missing `productName`, `locale`, or `api_key`, and an unknown `pzn`.
2. Resolve the product and audience selected by `pzn` to a fragment ID through
   `PRODUCT_FRAGMENT_MAP`.
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
10. Return the mapped fragment UUID used for the invocation and echo `pzn`.
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
| 400             | `productName` is missing.                                    |
| 400             | `locale` is missing.                                         |
| 400             | `api_key` is missing.                                        |
| 400             | Supplied `pzn` is not `edu` or `team`.                       |
| 404             | The product is not in the static product map.                |
| 404             | The product has no fragment for the segment.                 |
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

The BCOS integration must call the action with HTTP GET, pass only supplied
optional parameters, consume the response root as one offer record, and
surface upstream non-200 responses as tool errors.
