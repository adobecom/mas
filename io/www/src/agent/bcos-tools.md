# BCOS tool: resolve a MAS offer

`/mas/io/agent` is a proof-of-concept HTTP action for Brand Concierge (BCOS).
It resolves a product name through the static map in `product-fragment-map.js`,
invokes the sibling `fragment` action, hydrates prices and authored terms in
Node.js, and returns one flat offer record.

The repository does not contain an authoritative BCOS manifest schema. The
HTTP and data contracts below are authoritative; translate the schema-neutral
tool contract into the supported BCOS registration format when that format is
confirmed.

## HTTP endpoint

```http
GET /mas/io/agent?productName=<name>&locale=<locale>[&api_key=<key>][&pzn=<pzn>][&country=<country>]
```

| Parameter | Required | Description |
| --- | --- | --- |
| `productName` | yes | Product intent resolved case-insensitively through the static product map. |
| `locale` | yes | Locale passed to the `fragment` action. |
| `api_key` | no | Passed to the `fragment` action when supplied. |
| `pzn` | no | Pricing zone passed to the `fragment` action and echoed as `null` when omitted. |
| `country` | no | Country passed to the `fragment` action. |

`locale` and `country` come from the page's `mas-commerce-service` element — the
web page (or BC agent) reads them there and passes them through. They are page
context, not model-selected inputs.

`__ow_action_name` is OpenWhisk runtime metadata, not a public query
parameter. The handler uses it to derive the sibling `fragment` action name.

## Processing contract

1. Reject missing `productName` or `locale`.
2. Resolve the product to a fragment ID through `PRODUCT_FRAGMENT_MAP`.
3. Invoke the sibling `fragment` action with the fragment ID, locale, and any
   supplied `api_key`, `pzn`, and `country`.
4. Base64-decode and Brotli-decompress the fragment response when its
   `Content-Encoding` is `br`.
5. Parse the fragment response and prefill the real `Wcs` cache from
   `fragment.wcs`.
6. Hydrate every `<span is="inline-price">` found in fragment fields or
   settings through the real `Price` and `Wcs` implementations.
7. Render with `displayFormatted: false`; the agent performs no independent
   currency or locale formatting.
8. Extract the offer, price, and authored terms data and add the locale,
   pricing zone, and country.

The fragment is expected to contain a complete WCS cache for every offer
selector and promotion combination used by its inline prices. With a complete
cache, hydration performs no WCS network request. An incomplete cache can
cause `Wcs` to use its configured transport.

Fragment-level promotion codes follow the web-component compatibility rules:

- `fields.promoCode` is eligible as the context promotion code.
- It applies only when `fields.compatVersion` is at least
  `COMPAT_VERSION_GLOBAL_PROMO_CODE` or `fragment.promoProject` is present.
- An inline `data-promotion-code` takes precedence.
- `data-promotion-code="cancel-context"` suppresses the context promotion.

## Success response

The action returns HTTP 200 with one JSON offer record.

| Field | Type | Description |
| --- | --- | --- |
| `fragment` | string | Resolved fragment ID. |
| `productName` | string | Hydrated card title. |
| `pzn` | string or null | Requested pricing zone. |
| `badge` | string or null | Card badge text. |
| `cta_label` | string or null | Authored CTA text; checkout URLs are not hydrated. |
| `terms_url` | string or null | Authored offer-terms URL when present. |
| `customer_segment` | string | Customer segment derived from fragment tags when present. |
| `title` | string | Card title. |
| `subtitle` | string | Card subtitle. |
| `promoText` | string | Promotional copy. |
| `shortDescription` | string | Short card description. |
| `description` | string | Description after inline prices are hydrated and markup is stripped. |
| `callout` | string | Card callout text. |
| `promoPrice` | string | Main promotional display price. |
| `regularPrice` | string | Main regular or strikethrough display price. |
| `annualPrice` | string | Main annual display price when rendered. |
| `planTypeText` | string | Authored plan-type text. |
| `taxText` | string | Authored tax text. |
| `recurrenceText` | string | Authored billing-frequency text. |
| `unitText` | string | Authored unit text. |
| `seeTermsInfo` | object | `{ analyticsId, href, text }` for the authored terms link. |
| `renewalText` | string | Authored renewal text. |
| `promoDurationText` | string | Authored promotion-duration text. |

Optional string and object fields are omitted from serialized JSON when their
value is unavailable.

Other non-excluded MAS tags may also appear as tag-derived top-level fields.

## Errors

| Status | Condition |
| --- | --- |
| 400 | `productName` is missing. |
| 400 | `locale` is missing. |
| 404 | The product is not in the static product map. |
| upstream status | The `fragment` action returns a non-200 response. |
| 502 | Invoking the `fragment` action throws. |

## BCOS registration

See [`bcos-tools.json`](./bcos-tools.json) for the tool metadata sample — the
LLM `input_schema` (`productName` enum + `pzn`), the context-injected
`query_template` (`locale`/`country` from the page's `mas-commerce-service`,
`api_key` from a BCOS-held secret), and the `multimodal` card mapping. Field
names and registration format must follow the authoritative BCOS manifest
schema rather than that illustrative local format.

The BCOS integration must call the action with HTTP GET, pass only supplied
optional parameters, consume the response root as one offer record, and
surface upstream non-200 responses as tool errors.
