# Agent API

## Introduction

The Agent API returns one server-hydrated M@S offer object. Price and terms data are resolved in Node.js from the fragment's WCS data, without browser APIs.

Authored CTA labels are returned in an ordered `ctas` array. Checkout URLs are
not returned or hydrated.

## Request

```http
GET https://www.adobe.com/mas/io/agent?productName=Adobe%20Premiere&locale=en_US&api_key=<api-key>
```

| Parameter | Required | Description |
| --- | --- | --- |
| `productName` | Yes | Product name, for example `Creative Cloud Pro`. |
| `locale` | Yes | Adobe locale, for example `en_US`; used for fragment retrieval and pricing hydration. |
| `api_key` | Yes | Registered MAS client API key forwarded to the fragment action. |
| `pzn` | No | Agent-only audience selector: `edu` for students and teachers, or `team` for business plans. Omit for individual offers. Not forwarded to the fragment action. |
| `country` | No | Country code forwarded to the fragment action and normalized for pricing hydration, for example `US`. |

Product names are matched case-insensitively and trimmed. Not every product has
an offer for every audience; an unavailable combination returns 404.
Use `&pzn=edu` or `&pzn=team` to select that audience.

For teams, add `&pzn=team`; for students and teachers, add `&pzn=edu`.
Omit `pzn` for individuals: `pzn=individual` and an empty `pzn` are not accepted.
The agent passes only the selected fragment UUID, locale, API key, and any
country to the fragment action; it does not pass `pzn`.

Browser integrations read `locale` and `country` from the page's
`mas-commerce-service`; these are page context, not model-selected inputs.

## Product availability

The static product map uses `brand-concierge-product` cards from
`/content/dam/mas/brand-concierge/en_US`. It contains 20 products and 49 offers.
Individual offers require no `pzn`; team and education offers use `pzn=team`
and `pzn=edu`, respectively. Unsupported combinations return 404.

| Product | Individual | `pzn=team` | `pzn=edu` |
| --- | --- | --- | --- |
| Creative Cloud Pro | Yes | Yes | Yes |
| Creative Cloud Pro Plus | No | Yes | No |
| Photography | Yes | Yes | Yes |
| Acrobat Studio | Yes | Yes | No |
| Photoshop | Yes | Yes | Yes |
| Adobe Firefly Pro | Yes | No | No |
| Adobe Premiere | Yes | Yes | Yes |
| Illustrator | Yes | Yes | Yes |
| After Effects | Yes | Yes | Yes |
| InDesign | Yes | Yes | Yes |
| Lightroom | Yes | Yes | Yes |
| Acrobat Pro | Yes | Yes | Yes |
| Acrobat Express | Yes | Yes | Yes |
| Audition | Yes | Yes | Yes |
| Animate | Yes | Yes | Yes |
| Adobe Substance 3D Collection | Yes | Yes | No |
| Adobe Substance 3D Texturing | Yes | No | No |
| Acrobat Standard | Yes | Yes | Yes |
| AI Assistant for Acrobat | Yes | Yes | No |
| Frame.io | No | Yes | No |

## Response

Example shape; prices and authored text vary by locale, offer, and publication
state:

```json
{
  "fragment": "ea8f1b95-56b1-4665-b859-41ac2961ddcd",
  "productName": "Adobe Premiere",
  "pzn": null,
  "badge": null,
  "ctas": [
    { "label": "Free trial" },
    { "label": "Buy now" }
  ],
  "customer_segment": "individual",
  "market_segment": "com",
  "title": "Adobe Premiere",
  "description": "Professional video and film editing on desktop and iPhone",
  "regularPrice": "US$22.99",
  "recurrenceText": "/mo",
  "terms_url": null
}
```

`customer_segment` and `market_segment` come from the returned fragment's tags:
individual offers use `individual`/`com`, team offers use `team`/`com`, and
education offers use `individual`/`edu`.
`pzn` is `null` when omitted from the request.
Locale and country are not echoed. Other optional properties are omitted when
they do not apply.

`fragment` is the exact UUID used to invoke the fragment action, even when the
returned payload represents a different locale or variation.
`ctas` contains one `{ "label": "..." }` object per non-empty authored link or
button, in authored order. It is `[]` when no CTAs exist and replaces the
concatenated `cta_label` field. Checkout URLs are not returned or hydrated.

| Property | Type | Description |
| --- | --- | --- |
| `fragment` | `string` | Exact fragment UUID passed to the fragment action. |
| `productName` | `string \| null` | Authored card title from the returned fragment; not an echo of the lookup name. |
| `customer_segment` | `string` | Customer segment from fragment tags, for example `individual` or `team`. |
| `market_segment` | `string` | Market segment from `mas:market_segments/*` tags, for example `com` or `edu`. |
| `pzn` | `string \| null` | Requested audience selector; `null` when omitted. |
| `badge` | `string \| null` | Card badge text. |
| `ctas` | `object[]` | Ordered `{ label: string }` CTA entries; `[]` when none exist. |
| `terms_url` | `string \| null` | Authored offer terms URL. |
| `title` | `string` | Card title. |
| `subtitle` | `string` | Card subtitle. |
| `promoText` | `string` | Promotional text. |
| `shortDescription` | `string` | Short card description. |
| `description` | `string` | Card description with hydrated inline prices. |
| `callout` | `string` | Card callout. |
| `promoPrice` | `string` | Promotional price. |
| `regularPrice` | `string` | Regular or strikethrough price. |
| `annualPrice` | `string` | Annual price. |
| `planTypeText` | `string` | Plan type, for example `Annual, billed monthly`. |
| `taxText` | `string` | Tax text, for example `excl. GST`. |
| `recurrenceText` | `string` | Billing frequency, for example `/mo`. |
| `unitText` | `string` | Offer unit, for example `per license`. |
| `seeTermsInfo` | `object` | See-terms `analyticsId`, `href`, and `text`. |
| `renewalText` | `string` | Authored renewal text. |
| `promoDurationText` | `string` | Authored promotion-duration text. |

Other non-excluded authored MAS tags may add top-level fields.

## API contract changes

| Previous contract | Current contract |
| --- | --- |
| `pzn` forwarded to the fragment action | Only the mapped UUID selects the audience downstream; `pzn` is not forwarded. |
| Concatenated `cta_label` string | Ordered `ctas` array of `{ label }` objects, or `[]`. |
| `fragment` taken from the response payload | Exact UUID passed to the fragment action, even if the payload ID differs. |
| `api_key` documented as optional | Required registered client key; missing keys return 400. |

## Errors

Errors return JSON with a `message` field.

| Status | Condition |
| --- | --- |
| 400 | Missing `productName`, `locale`, or `api_key`, or a supplied `pzn` other than `edu` or `team`. |
| 404 | Unknown product or no offer for the requested audience. |
| Upstream status | The fragment action returns a non-200 response; its message is preserved when supplied. |
| 502 | Fragment invocation, decoding, parsing, or hydration fails. |
| 504 | Fragment invocation exceeds 20 seconds or price hydration exceeds 15 seconds. |

Incomplete WCS caches may require network requests during hydration. Only the
Node agent applies a 5-second timeout to each such WCS request; browser clients
have no default fetch timeout.

### Hydration geography

Country codes are case-insensitive at the agent boundary: `country=eg` becomes
`EG` before the fragment action is called, not only when its response is
hydrated. This ensures prefetch and hydration use the same canonical country.

The agent carries request `locale` and `country` into its pricing runtime even
when the fragment contains no geography settings. If `country` is omitted,
it derives the country from `locale`. The same surface-specific market
restrictions and territory mapping used by the fragment pipeline determine
the effective commerce country; for example, `es_PR` uses US pricing.

Request geography overrides fragment-wide defaults, while authored per-price
country and language overrides are preserved. Photoshop with
`locale=en_US&country=EG` therefore uses the prefetched Egypt offer instead of
attempting an unnecessary US WCS lookup.
