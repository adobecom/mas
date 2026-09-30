# Agent API

## Introduction

Returns one M@S offer with server-hydrated prices, authored content, and CTA
labels. Checkout URLs are not returned.

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
| `country` | No | Case-insensitive country code, for example `EG`. Defaults to the locale's country and follows the fragment pipeline's market and territory rules. |

Product names are matched case-insensitively and trimmed. Not every product has
an offer for every audience; an unavailable combination returns 404.

Browser integrations read `locale` and `country` from the page's
`mas-commerce-service`; these are page context, not model-selected inputs.

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

`ctas` contains one `{ "label": "..." }` object per non-empty authored link or
button, in authored order, or `[]` when no CTAs exist.

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

## Errors

Errors return JSON with a `message` field.

| Status | Condition |
| --- | --- |
| 400 | Missing `productName`, `locale`, or `api_key`, or a supplied `pzn` other than `edu` or `team`. |
| 404 | Unknown product or no offer for the requested audience. |
| Upstream status | The fragment action returns a non-200 response; its message is preserved when supplied. |
| 502 | Fragment invocation, decoding, parsing, or hydration fails. |
| 504 | Fragment invocation exceeds 20 seconds or price hydration exceeds 15 seconds. |

Uncached WCS requests time out after 5 seconds. Fragment invocation is limited
to 20 seconds and hydration to 15 seconds.
