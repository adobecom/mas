# Agent API

## Introduction

Returns one M@S offer with server-hydrated prices, authored content, and CTA
labels. Checkout URLs are not returned.

Select a fragment directly by UUID or resolve an offer by product name.

## Request

### URL paths

Select a published fragment by UUID:

```http
GET https://www.adobe.com/mas/io/agent/ea8f1b95-56b1-4665-b859-41ac2961ddcd?locale=en_US&api_key=<api-key>
```

The fragment UUID is the path segment after `/agent/`.

Or use product-name lookup:

```http
GET https://www.adobe.com/mas/io/agent?productName=Adobe%20Premiere&locale=en_US&api_key=<api-key>
```

### Query parameters

| Query parameter | Required | Description |
| --- | --- | --- |
| `productName` | For product lookup | Product name, for example `Creative Cloud Pro`. |
| `locale` | Yes | Adobe locale, for example `en_US`; used for fragment retrieval and pricing hydration. |
| `api_key` | Yes | Registered MAS client API key forwarded to the fragment action. |
| `pzn` | No | Supported only for product lookup: `edu` for students and teachers, or `team` for business plans. Omit for individual offers. Not supported with `fragment-id`. Not forwarded to the fragment action. |
| `country` | No | Case-insensitive country code, for example `EG`. Defaults to the locale's country and follows the fragment pipeline's market and territory rules. |

A path UUID takes precedence over `productName` and bypasses product and
audience mapping. The path accepts one UUID, case-insensitively, with an
optional trailing slash. An empty path or `/` uses product lookup. Invalid
paths return 400. The selected fragment must be published and retrievable by
the existing fragment pipeline; it does not need an entry in the product map.
Supplying `pzn` with a fragment ID returns 400. Response classification comes
from the returned fragment's tags.

For product lookup, see the [product-name mapping](#product-name-mapping) below.

Browser integrations read `locale` and `country` from the page's
`mas-commerce-service`; these are page context, not model-selected inputs.

## Product-name mapping

Product lookup uses `PRODUCT_FRAGMENT_MAP` in `product-fragment-map.js`.
The tree has one branch per audience segment, with a `default` fragment UUID
and a `products` map of product names to fragment UUIDs.

`pzn` selects the segment. Product names are trimmed and matched
case-insensitively within that branch. A product match takes precedence;
unknown products and products without an entry in that branch use its default.
All segment defaults are Creative Cloud Pro offers.

### Segment defaults

Select a fragment UUID in the tables to open it in Studio.

| Segment | Query selector | Default fragment UUID |
| --- | --- | --- |
| `individual` | Omit `pzn` | [128b6634-6631-4081-a6d9-9a2c7c003414](https://mas.adobe.com/studio.html#fragmentId=128b6634-6631-4081-a6d9-9a2c7c003414&page=fragment-editor&path=brand-concierge) |
| `team` | `pzn=team` | [5c3fe2ac-0dbb-4495-9858-feac379ca19b](https://mas.adobe.com/studio.html#fragmentId=5c3fe2ac-0dbb-4495-9858-feac379ca19b&page=fragment-editor&path=brand-concierge) |
| `edu` | `pzn=edu` | [2b1a6493-e03b-4803-a150-eed983094a05](https://mas.adobe.com/studio.html#fragmentId=2b1a6493-e03b-4803-a150-eed983094a05&page=fragment-editor&path=brand-concierge) |

The `edu` branch has an empty `products` map. Every education product lookup
returns [2b1a6493-e03b-4803-a150-eed983094a05](https://mas.adobe.com/studio.html#fragmentId=2b1a6493-e03b-4803-a150-eed983094a05&page=fragment-editor&path=brand-concierge), regardless of product name.
`productName` is still required for product lookup.

### Product overrides

The current map contains 20 product names. Cells marked `default` use the
selected segment's default UUID above. Education uses its shared default for
every row.

| Product name | Individual fragment UUID | Team fragment UUID |
| --- | --- | --- |
| Creative Cloud Pro | [128b6634-6631-4081-a6d9-9a2c7c003414](https://mas.adobe.com/studio.html#fragmentId=128b6634-6631-4081-a6d9-9a2c7c003414&page=fragment-editor&path=brand-concierge) | [5c3fe2ac-0dbb-4495-9858-feac379ca19b](https://mas.adobe.com/studio.html#fragmentId=5c3fe2ac-0dbb-4495-9858-feac379ca19b&page=fragment-editor&path=brand-concierge) |
| Creative Cloud Pro Plus | `default` | [af478a51-949c-49af-b7df-d3b14b5156de](https://mas.adobe.com/studio.html#fragmentId=af478a51-949c-49af-b7df-d3b14b5156de&page=fragment-editor&path=brand-concierge) |
| Photography | [42df425a-e020-469f-bf0f-5b83504dabce](https://mas.adobe.com/studio.html#fragmentId=42df425a-e020-469f-bf0f-5b83504dabce&page=fragment-editor&path=brand-concierge) | `default` |
| Acrobat Studio | [03822008-9d0f-403a-a22c-ee71884c25ef](https://mas.adobe.com/studio.html#fragmentId=03822008-9d0f-403a-a22c-ee71884c25ef&page=fragment-editor&path=brand-concierge) | [c777f435-3175-4d94-a461-88a0113b82f6](https://mas.adobe.com/studio.html#fragmentId=c777f435-3175-4d94-a461-88a0113b82f6&page=fragment-editor&path=brand-concierge) |
| Photoshop | [9941bca0-5304-47f7-aeb3-4f638aeb8791](https://mas.adobe.com/studio.html#fragmentId=9941bca0-5304-47f7-aeb3-4f638aeb8791&page=fragment-editor&path=brand-concierge) | [c2c79d69-8990-44b8-9a86-071c69e4a25a](https://mas.adobe.com/studio.html#fragmentId=c2c79d69-8990-44b8-9a86-071c69e4a25a&page=fragment-editor&path=brand-concierge) |
| Adobe Firefly Pro | [95c664e4-f605-41df-8f9c-4779d0ef58c5](https://mas.adobe.com/studio.html#fragmentId=95c664e4-f605-41df-8f9c-4779d0ef58c5&page=fragment-editor&path=brand-concierge) | `default` |
| Adobe Premiere | [ea8f1b95-56b1-4665-b859-41ac2961ddcd](https://mas.adobe.com/studio.html#fragmentId=ea8f1b95-56b1-4665-b859-41ac2961ddcd&page=fragment-editor&path=brand-concierge) | [d53944f8-20f1-408d-99fb-98f4e2724534](https://mas.adobe.com/studio.html#fragmentId=d53944f8-20f1-408d-99fb-98f4e2724534&page=fragment-editor&path=brand-concierge) |
| Illustrator | [d9f8b8e7-ff8a-4048-b11f-5e23a76f3d12](https://mas.adobe.com/studio.html#fragmentId=d9f8b8e7-ff8a-4048-b11f-5e23a76f3d12&page=fragment-editor&path=brand-concierge) | [9c6d13e0-49e0-4046-9ff4-185bc4717774](https://mas.adobe.com/studio.html#fragmentId=9c6d13e0-49e0-4046-9ff4-185bc4717774&page=fragment-editor&path=brand-concierge) |
| After Effects | [e41c94e5-d89a-4c68-8d15-3c88c638b8e2](https://mas.adobe.com/studio.html#fragmentId=e41c94e5-d89a-4c68-8d15-3c88c638b8e2&page=fragment-editor&path=brand-concierge) | [6e4d5cfc-6d46-4120-8181-a28a1b6e2f57](https://mas.adobe.com/studio.html#fragmentId=6e4d5cfc-6d46-4120-8181-a28a1b6e2f57&page=fragment-editor&path=brand-concierge) |
| InDesign | [689468c6-7489-48d9-942c-3621e77c2d8f](https://mas.adobe.com/studio.html#fragmentId=689468c6-7489-48d9-942c-3621e77c2d8f&page=fragment-editor&path=brand-concierge) | [d9d74f31-3e77-4b6c-8ff6-6841a716e783](https://mas.adobe.com/studio.html#fragmentId=d9d74f31-3e77-4b6c-8ff6-6841a716e783&page=fragment-editor&path=brand-concierge) |
| Lightroom | [2a86ae74-df04-4faf-96e8-46903aa023bf](https://mas.adobe.com/studio.html#fragmentId=2a86ae74-df04-4faf-96e8-46903aa023bf&page=fragment-editor&path=brand-concierge) | [ee56ead8-fe04-422f-8423-84ab832d3fd7](https://mas.adobe.com/studio.html#fragmentId=ee56ead8-fe04-422f-8423-84ab832d3fd7&page=fragment-editor&path=brand-concierge) |
| Acrobat Pro | [7fef9873-f153-4354-a3c0-4e6fa98b42f9](https://mas.adobe.com/studio.html#fragmentId=7fef9873-f153-4354-a3c0-4e6fa98b42f9&page=fragment-editor&path=brand-concierge) | [db695a1a-61a6-403f-b847-c684cbf4ae0e](https://mas.adobe.com/studio.html#fragmentId=db695a1a-61a6-403f-b847-c684cbf4ae0e&page=fragment-editor&path=brand-concierge) |
| Acrobat Express | [7490cc4e-4064-4152-af18-29d37aa308c5](https://mas.adobe.com/studio.html#fragmentId=7490cc4e-4064-4152-af18-29d37aa308c5&page=fragment-editor&path=brand-concierge) | [a5b6556b-0542-405c-9de9-6baa596f1743](https://mas.adobe.com/studio.html#fragmentId=a5b6556b-0542-405c-9de9-6baa596f1743&page=fragment-editor&path=brand-concierge) |
| Audition | [fdd63a7e-8a02-403e-a5ed-ebd85d585b95](https://mas.adobe.com/studio.html#fragmentId=fdd63a7e-8a02-403e-a5ed-ebd85d585b95&page=fragment-editor&path=brand-concierge) | [07b31d92-e6d0-4b19-8181-02f54956fd33](https://mas.adobe.com/studio.html#fragmentId=07b31d92-e6d0-4b19-8181-02f54956fd33&page=fragment-editor&path=brand-concierge) |
| Animate | [789e6cc7-e5dd-4fb5-b468-a21a19f4966a](https://mas.adobe.com/studio.html#fragmentId=789e6cc7-e5dd-4fb5-b468-a21a19f4966a&page=fragment-editor&path=brand-concierge) | [be18b47b-ba1f-4c51-94f3-5d2a22a52df9](https://mas.adobe.com/studio.html#fragmentId=be18b47b-ba1f-4c51-94f3-5d2a22a52df9&page=fragment-editor&path=brand-concierge) |
| Adobe Substance 3D Collection | [99a79b2f-0fc0-44c6-822f-b5c3e3098ffc](https://mas.adobe.com/studio.html#fragmentId=99a79b2f-0fc0-44c6-822f-b5c3e3098ffc&page=fragment-editor&path=brand-concierge) | [6375d22a-bdf1-4d5b-8769-3e4ddc635e61](https://mas.adobe.com/studio.html#fragmentId=6375d22a-bdf1-4d5b-8769-3e4ddc635e61&page=fragment-editor&path=brand-concierge) |
| Adobe Substance 3D Texturing | [cab214a9-9f95-4308-aeb2-ff58ff177d06](https://mas.adobe.com/studio.html#fragmentId=cab214a9-9f95-4308-aeb2-ff58ff177d06&page=fragment-editor&path=brand-concierge) | `default` |
| Acrobat Standard | [3d79b0d1-1c88-440f-a596-e503388036be](https://mas.adobe.com/studio.html#fragmentId=3d79b0d1-1c88-440f-a596-e503388036be&page=fragment-editor&path=brand-concierge) | [ec9fed2e-eaa2-4c6c-b06b-b55762362de7](https://mas.adobe.com/studio.html#fragmentId=ec9fed2e-eaa2-4c6c-b06b-b55762362de7&page=fragment-editor&path=brand-concierge) |
| AI Assistant for Acrobat | [3345c485-af93-4fef-97d1-bbc10f3b03eb](https://mas.adobe.com/studio.html#fragmentId=3345c485-af93-4fef-97d1-bbc10f3b03eb&page=fragment-editor&path=brand-concierge) | [9ac1751b-4b73-4e1e-bc92-797de6d93cf9](https://mas.adobe.com/studio.html#fragmentId=9ac1751b-4b73-4e1e-bc92-797de6d93cf9&page=fragment-editor&path=brand-concierge) |
| Frame.io | `default` | [ee2636e6-0ecc-49df-9a01-69ffd0558f74](https://mas.adobe.com/studio.html#fragmentId=ee2636e6-0ecc-49df-9a01-69ffd0558f74&page=fragment-editor&path=brand-concierge) |

Direct fragment selection through `/agent/<fragment-id>` bypasses this map.

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
| 400 | Invalid fragment path, neither a path UUID nor `productName`, missing `locale` or `api_key`, `pzn` supplied with a fragment ID, or a supplied `pzn` other than `edu` or `team` for product lookup. |
| Upstream status | The fragment action returns a non-200 response; its message is preserved when supplied. |
| 502 | Fragment invocation, decoding, parsing, or hydration fails. |
| 504 | Fragment invocation exceeds 20 seconds or price hydration exceeds 15 seconds. |

Uncached WCS requests time out after 5 seconds. Fragment invocation is limited
to 20 seconds and hydration to 15 seconds.
