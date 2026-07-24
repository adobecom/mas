# Agent API

## Introduction

The Agent API returns a flat, server-hydrated M@S offer. Price and terms data are resolved in Node.js from the fragment's WCS data, without browser APIs.

Checkout links and buttons are not included.

## Request

```http
GET https://www.adobe.com/mas/io/agent?productName=Creative%20Cloud%20Pro&locale=en_US&api_key=<api-key>
```

| Parameter | Required | Description |
| --- | --- | --- |
| `productName` | Yes | Product name, for example `Creative Cloud Pro`. |
| `locale` | Yes | Adobe locale, for example `en_US`. |
| `api_key` | No | API key forwarded to the fragment action. |

## Response

```json
{
  "fragment": "2c5cd672-1db8-409c-96ff-46b1a1dfb7dc",
  "productName": "Creative Cloud Pro",
  "badge": "Save 50%",
  "customer_segment": "individual",
  "title": "Creative Cloud Pro",
  "description": "Pay US$34.99/mo for the first 3 months and US$69.99/mo after that.",
  "promoPrice": "US$34.99",
  "regularPrice": "US$69.99",
  "planTypeText": "Annual, billed monthly",
  "recurrenceText": "/mo",
  "terms_url": "https://www.adobe.com/offer-terms/cc_full_special_offer.html"
}
```

Optional properties are omitted when they do not apply.

| Property | Type | Description |
| --- | --- | --- |
| `fragment` | `string \| null` | Fragment ID. |
| `productName` | `string \| null` | Product name used by the agent. |
| `badge` | `string \| null` | Card badge text. |
| `cta_label` | `string \| null` | Authored CTA label. |
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

Authored fragment tags may add fields such as `customer_segment`.
