# Email Offer API

Returns product and pricing data for a given customer offer, for use in email templates.

## Endpoint

```
GET /email-offer
```

## Parameters

| Parameter | Required | Description |
|---|---|---|
| `offerID` | yes | Customer's offer ID from subscription data |
| `country` | yes | Two-letter country code (e.g. `MX`, `US`, `IN`) |
| `locale` | yes | Customer's locale preference (e.g. `en-us`, `es-mx`) |
| `promotionCode` | no | Promotion code — include to get discounted pricing and promo dates |

## Example Request

```
GET /email-offer?offerID=30404A88D89A328584307175B8B27616&country=MX&locale=en-us&promotionCode=MXPROMO123
```

## Example Response

```json
{
  "productName": "Photoshop",
  "percentOff": 40,
  "strikethroughPrice": "MXN $299.00",
  "destinationUrl": "https://commerce.adobe.com/store/recommendation?items%5B0%5D%5Bid%5D=...&apc=MXPROMO123&...",
  "regularPrice": "MXN $299.00",
  "discountedPrice": "MXN $179.40",
  "currency": "MXN",
  "offerStartDate": "2026-02-24T08:00:00.000Z",
  "offerEndDate": "2026-11-28T07:59:00.000Z",
  "offerType": "BASE",
  "promoType": "MXPROMO123"
}
```

Without a `promotionCode`, `discountedPrice`, `percentOff`, `offerStartDate`, `offerEndDate`, and `promoType` will be `null`.

## Notes

- `destinationUrl` is a direct-to-cart link with the promotion pre-applied. Use this as the CTA href in the email template.
- `strikethroughPrice` and `regularPrice` are the same value — the pre-promotion price formatted for display.
- Prices are formatted strings with currency symbol included, ready for display.
- `offerStartDate` / `offerEndDate` are ISO 8601 UTC strings representing the promotion window.
