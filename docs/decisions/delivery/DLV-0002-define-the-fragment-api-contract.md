---
id: DLV-0002
title: Define the fragment API contract
status: active
scope: project
related: ['DLV-0001', 'CONT-0001', 'CONT-0003', 'CONT-0005', 'CONT-0006', 'adr:Adobe-acom/core/KNOW-0000']
---

# DLV-0002. Define the fragment API contract

## Context

`https://www.adobe.com/mas/io/fragment` (the `io/www` `fragment` action, [DLV-0001](./DLV-0001-layer-caches-from-edge-to-origins.md)) serves merch cards and collections to very different clients:

- web pages (acom, Milo sites), which hydrate the authored markup in the browser (`merch-card`, `inline-price`, `checkout-link`);
- native or server clients (Creative Cloud Desktop, Express, commerce services), which can't run that markup and need either sanitized html, a structured tree or plain text;
- agents and tools, which mostly need text.

Rich text fields are authored as html in Odin, with web component markup inside. Each client used to receive them as authored and post-process them itself, with its own sanitization. Most clients also always ask for the same surface, and every new client meant another hardcoded rule in the client or in the action.

The request parameters, their defaults and their errors were only described across the action's README and the content ADRs, so each client team had to read code to know what to send and what to expect.

## Decision

We will define the fragment API by the request parameters below, each with whether it's required, its default and its errors. Adding, changing or removing a parameter is a change of this ADR.

### Request parameters

| Parameter     | Required                                        | Description                                                                                                                                                                                                                                                                                                     |
| ------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api_key`     | yes (`400` if missing, `401` if not accepted)   | Identifies the client, see [api keys](#api-keys).                                                                                                                                                                                                                                                               |
| `locale`      | yes (`400` if missing or unknown)               | `{lang}_{COUNTRY}`, resolved to the surface's default locale ([CONT-0001](../content/CONT-0001-organize-content-by-surface-and-locale.md)).                                                                                                                                                                     |
| `id`          | `id`, or `offer` + `template` + surface (`400`) | Fragment (card or collection) id.                                                                                                                                                                                                                                                                               |
| `offer`       | see `id`                                        | An OSI: without `id`, the most specific baseline of that offer and `template` is the response; with `id`, it overrides the root card's offer ([CONT-0005](../content/CONT-0005-layer-merch-content-through-baselines.md)).                                                                                      |
| `template`    | see `id`                                        | A card variant, with the same use as `offer`.                                                                                                                                                                                                                                                                   |
| `surface`     | no                                              | See [surface resolution](#surface-resolution).                                                                                                                                                                                                                                                                  |
| `type`        | no, `400` if not `html`, `json` or `text`       | Representation of the rich text fields, see [response types](#response-types). Defaults to the api key's, then to `html`.                                                                                                                                                                                       |
| `country`     | no                                              | Visitor country: picks the region locale and regional variations ([CONT-0006](../content/CONT-0006-select-one-fragment-variation.md)), promotion geos ([CONT-0003](../content/CONT-0003-model-promotions-as-projects-and-variations.md)) and the WCS pricing country, restricted to the locale's market family. |
| `pzn`         | no                                              | Comma separated personalization tokens, matched against PZN variations' `pznTags` ([CONT-0006](../content/CONT-0006-select-one-fragment-variation.md)). Ignored (and logged) if a token isn't `[a-zA-Z0-9_-]`.                                                                                                  |
| `mask`        | no                                              | Name of a mask of the surface, overlaid on the cards. Ignored (and logged) if not `[a-zA-Z0-9_-]` or not found.                                                                                                                                                                                                 |
| `instant`     | no                                              | Time travel: an ISO date or epoch ms used instead of now to select promotions. Such requests bypass the stored responses.                                                                                                                                                                                       |
| `serveLatest` | no                                              | `true` asks WCS configurations of `env: stage` for their latest offers (Orion stage testing), cached apart.                                                                                                                                                                                                     |
| `preview`     | no                                              | Not supported by this API: `400`.                                                                                                                                                                                                                                                                               |

`offer`, `template` and `surface` must match `[a-zA-Z0-9_-]` (`400` otherwise). `refresh` is reserved to the action's own background refreshes and ignored on web requests (DLV-0001). A response not modified since the `If-Modified-Since` header (its `Last-Modified` isn't later) is a `304`.

### Api keys

An api key is accepted if it is listed, as a literal or a `/regex/`, in `API_KEY_DEFAULTS` (`io/www/src/fragment/utils/configuration.js`) or in the `apiKeys` State configuration. Each key of `API_KEY_DEFAULTS` holds the request defaults of its client, `{ surface?, type? }`:

| Api key                                       | Defaults                   |
| --------------------------------------------- | -------------------------- |
| `/wcms-commerce-ims-ro-user-milo(-[a-z]+)?$/` | none                       |
| `/^CreativeCloud_v\d+_\d+$/`                  | `{ "surface": "ccd" }`     |
| `AdobeExpressWeb`                             | `{ "surface": "express" }` |
| `unified_checkout_client_v3`                  | none                       |
| `concierge-conversation-service`              | none                       |
| `acom-bc-service`                             | none                       |

The `apiKeyDefaults` State configuration (`{ "<apiKey or /regex/>": { "surface": "…", "type": "…" } }`) is merged over them, and over the legacy `apiKeySurfaces` one (`{ "<apiKey or /regex/>": "<surface>" }`), so a workspace can add or change defaults without a deployment.

### Surface resolution

The `surface` parameter wins, then the surface of the `id` fragment, then the api key's (refining [CONT-0001](../content/CONT-0001-organize-content-by-surface-and-locale.md)):

- a `surface` parameter different from the api key's surface → `404` (`surface '…' is not available for this api_key`);
- a `surface` parameter different from the `id` fragment's surface → `404` (`fragment … not found on surface '…'`);
- without `id`, the api key's surface is used when there is no `surface` parameter.

### Response types

The rich text fields of the card model (`badge`, `trialBadge`, `prices`, `shortDescription`, `description`, `callout`, `customFields`; not `ctas`) of the response and of its referenced cards are parsed once, as the last step of the pipeline (`serialize` transformer), into an allowlisted tree in the Odin multi-line `json` format, then emitted per `type`:

- `html` (default): `{ "value": "<p>…</p>", "mimeType": "text/html" }`, re-serialized from that tree;
- `json`: `{ "json": [ { "nodeType": "paragraph", "content": [ { "nodeType": "text", "value": "…", "format": { "variants": ["bold"] } } ] } ] }`;
- `text`: `{ "value": "…", "mimeType": "text/plain" }`, one line per block.

The tree vocabulary:

- kept: `paragraph`, `header` (`style` `h1`…`h6`), `unordered-list`, `ordered-list`, `list-item`, `line-break`, `link` (`data: { href, target }`, `https:`, `mailto:` and `tel:` only, unwrapped otherwise), `text` with `bold`, `italic`, `underline` and `strikethrough` variants (resolved strikethrough prices included);
- unwrapped (content kept): `span`, `div`, `sup`, `sub`, `small` and unknown elements (logged);
- dropped: hidden (`.disabled`, `sr-only`) and unsafe (`script`, `style`, `iframe`…) elements, and, logged as errors, elements that aren't rich text (checkout links, `img`, `button`, `merch-icon`, `mas-mnemonic`).

The effective type is part of the request key (`.y-<type>`, e.g. `req-<id>-fr_FR.y-html`, DLV-0001), so each type is cached apart.
