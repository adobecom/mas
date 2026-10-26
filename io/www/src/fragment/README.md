# fragment pipeline

![pipeline description](architecture.png)

this action sits behind mas/io/fragment in CDN and treats multiple odin related requests to provide m@s customers with :

- placeholders,
- settings,
- promotion,
- masks (field overlays applied on top of card fragments),
- regional and personalization customization,

that each stand behind so called transformers. To optimize calls make to odin, the sequence is based on promises created at init time and sometimes depending on each other. The pipeline order is:

`fetchFragment → defaultLanguage → offer → promotions → mask → customize → settings → replace → wcs → corrector`

## Inactive price-render transformer

`transformers/render.js` is available for direct execution only. It is **not**
registered in the pipeline, and does not change production responses or fetch
offers. It imports the shared framework-free implementation directly from
`price/src/index.js` via a relative path, following the server's existing
cross-directory import convention. No installed price package or workspace
symlink is required; keep the repository's `price/src/` directory alongside
`io/www` when running or bundling the server. `parse5` remains a runtime dependency.

```js
import { transformer as render } from './transformers/render.js';

await render.process(context, {
    environment: 'prod', // Required; no default or cross-environment fallback.
    resolveOptions: ({ context, fragment, fieldName, valueIndex, attributes }) => {
        // The caller supplies already-resolved options for this particular price.
        return {
            country: 'US',
            language: 'en',
            wcsOsi: ['resolved-osi'],
            promotionCodes: [''],
            promotionCode: '',
            displayTax: false,
            forceTaxExclusive: false,
            quantity: [1],
            template: 'price',
            literals: {},
        };
    },
});
```

`resolveOptions` may be asynchronous. It receives decoded HTML attributes and
the owning fragment, field name, optional array index, and original context.
It must not mutate those inputs. Return the country used for the WCS cache
(including any commerce-country override), the display language, a non-empty
array of final OSIs, and an equally sized array of effective promotion codes.
Resolve substitutions, fragment/element promotion precedence, broadcast codes,
and `cancel-context` upstream; cancelled/non-promoted OSIs use `''`. The stage
does not reinterpret authored promo scope or fetch missing cache entries.

`promotionCodes` selects the cached offers separately for each OSI.
The singular `promotionCode` is the resolved per-placeholder selector passed to
the shared formatter: supply the resolved code for promotional rendering, or
explicitly supply `''` to disable it. Both inputs are required, including for
non-promotional prices. The caller resolves the selector using the browser's
precedence; the stage does not derive it from the first, joined, or non-empty
bundle cache codes. Unresolved `cancel-context` is rejected in either input.

`country`, `language`, `wcsOsi`, `promotionCodes`, `promotionCode`, `displayTax`, and
`forceTaxExclusive` must be supplied. Inputs are normalized rendering options,
not raw dataset strings: notably `forceTaxExclusive` must be a boolean.
Supply applicable literals, per-unit/annual/old-price flags, quantity and time
inputs, retaining the browser's override precedence. Optional formatting defaults
remain those of the shared package. Literal dictionary tokens must be resolved
or omitted; unresolved `price-literal-*` values are rejected. The stage does not
derive geo/segment tax policy, browser feature flags, provider defaults, or query
parameters. These are prerequisites for the separate activation ticket.

The selected cache is `context.body.wcs[environment]`. Cache keys follow the WCS
producer: final OSI, lowercased country, `mult` except for GB, then the lowercased
effective promotion code if present. Raw cached offers are copied and normalized
using `applyPlanType` imported from `price/src/index.js` before offer
selection. Its mapping preserves the browser's existing tacocat behavior;
web-components is unchanged and continues using its current helper.
The server does not depend on Dexter or Pandora for normalization.
Missing environments/offers, empty offer groups, unaligned promotions,
and unresolved required options fail explicitly with request/field diagnostics.
All field updates are committed only after the entire render succeeds; cached
offers and unrelated context values are not modified.

For a `discount` template with exactly two OSIs, the first selected offer supplies
the discounted price and the second supplies the reference price, matching the
browser. Stale `priceInfo` is discarded on the derived offer. Other multi-OSI
prices retain shared soft-bundle summation; percentage calculation and markup
remain in the shared `price/src` implementation.

Root and flattened referenced fragments are processed once. String fields,
wrapped rich-text `value` strings/arrays and string-array fields are supported.
Only `<span is="inline-price">` contents are replaced. A source-offset HTML parser
preserves the original outer wrapper, attributes, spelling, whitespace and
surrounding markup; checkout links, badges and other content remain untouched.
Nested inline-price placeholders, prices inside inert `<template>` elements,
and wrappers without an explicit closing tag are rejected.

The original `is="inline-price"` and other client hooks remain on the wrapper.
The activation ticket must determine how to prevent unintended browser
re-rendering/hydration, supply the explicit environment and resolved option
provider, and then register the stage after `wcs` and before `corrector`.
No hidden activation flag or shadow rendering exists in this change.

Focused validation (Node 22+, from `io/www`):

```sh
npx mocha test/fragment/render.test.js
npm test
```

The tests use the unchanged shared golden corpus with fixed UTC time. Valid
fixtures assert exact price contents inside preserved wrappers. The shared
package's empty-offer/missing-option fixtures intentionally produce errors at
this transformer boundary, rather than blank prices.

You can see the full flow on below diagram:
![flow](image.png)

## offer baselines

See ADR [CONT-0005](../../../../docs/decisions/content/CONT-0005-layer-merch-content-through-baselines.md).

Request parameters: `locale` (required), `id`, `offer` (an OSI for now), `template` (a card variant), `surface`.

Surface resolution: the `surface` parameter is the source of truth, then the surface of the `id` fragment, then the api key's (`apiKeySurfaces` configuration). A `surface` parameter different from the api key's or the fragment's surface returns `404`.

- with `id`: baselines are opt-in: only when the requested card or collection has `enableBaselines` on (a boolean of both models, toggled in Studio's General info), which then applies to every card it references whatever their own flag. The `offer` transformer then looks baselines up for the requested fragment and for every card of its references tree (collections). Each fragment's offer (the `offer` param for the root, its own `osi` otherwise) is resolved through WCS to its product arrangement code, its template is its `variant` (or the `template` param for the root). `customize` then layers, per fragment: offer baseline < fragment baseline < fragment market segment baseline < fragment < its variations. A fragment baseline can hold the content common to all cards of an offer & template. Failures are logged and ignored.
- without `id`: `offer`, `template` & a surface (parameter or api key's) are required (400 otherwise). The main body is the most specific baseline: the fragment market segment baseline, the fragment baseline, or the offer baseline (404 if there is none).

Baselines locations (`<pa>` being the product arrangement code, e.g. `phsp_direct_individual`, `<segment>` the lower cased market segment of the resolved offer, e.g. `edu`, `gov`):

- offer baseline (offer model, MCS copy & assets): `/content/dam/mas/offers/<locale>/baselines/<pa>/baseline`, falling back to `en_US`. With ~1800 product arrangements per locale in MCS, that folder is too big to list per request: the `offers` action (every 15 minutes) syncs it into the namespace state (only changed ones are written, removed ones deleted) and serves a locale at once; the pipeline fetches the whole locale (en_US fallback included) from `https://www.adobe.com/mas/io/offers?api_key=…&locale=<locale>&id` (CDN cached; the bare `id` is only there for the CDN to accept the request until WPS-36294). Its MCS fields are mapped to card fields: `name` → `cardTitle`, first (svg) `icons` → `mnemonicIcon` with `name` as `mnemonicAlt` (both dropped when a higher layer sets its own icons); the other offer model fields are dropped (MCS `description` and `shortDescription` do not mean a card's),
- fragment baseline: `/content/dam/mas/<surface>/<locale>/baselines/<template>/<pa>/baseline`,
- fragment market segment baseline: `/content/dam/mas/<surface>/<locale>/baselines/<template>/<pa>/<segment>/baseline`, only applied to offers of that market segment (COM offers use the fragment baseline only). Offer baselines have no market segment override.

Baselines are fields only: their references are not hydrated.

Baselines' own variations are ignored. Each customized fragment exposes `offerBaselineId` / `fragmentBaselineId` / `fragmentSegmentBaselineId`, and the root `fields.osi` is forced to the `offer` param.

Nothing is requested twice, whatever the collection size: distinct offers are resolved in one WCS batch whose artifacts are reused by the `wcs` transformer (and always shipped in `body.wcs`). Fragment baselines are fetched in bulk, in parallel with WCS, with one (paginated) listing of `/content/dam/mas/<surface>/<locale>/baselines/<template>` per template used; offer baselines are fetched once per locale. Both are kept in a single-flight SWR cache (5 min TTL) shared by all fragments and requests, absence included.

## configuration

you can configure a few things via state with `aio app state put/del` command
to see all configuration in place, type `aio app state list`

workspace wise configurations are put in one single key named `configuration`
please don't forget that every state item has TTL defaulting to 24h! typical long live TTL to add to your command would be `--ttl=31536000`

below are the members of that object
| Configuration Key | Description | Type | Default |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------- |
| `wcsConfiguration` | WCS (Web Content Service) endpoints, one per environment, e.g. `[{"wcsURL":"https://www.stage.adobe.com/web_commerce_artifact","env":"stage"}]`. The `prod` row is hardcoded in `utils/configuration.js`; you only need to list extra envs here. A state entry with `env: "prod"` overrides the hardcoded URL (handy for dev/test workspaces). | Array | ``    |
| `apiKeys`           | Extra accepted client API keys, merged with the hardcoded baseline in `utils/configuration.js`. Entries are literal strings; wrap a value in `/.../` to match a regex pattern, e.g. `["my-test-key", "/^CreativeCloud_v\\d+_\\d+$/"]`. Unknown api_key values in the request → `401` before any downstream call. | Array |`` |
| `apiKeySurfaces` | Surface served by an api key, e.g. `{"AdobeExpressWeb": "express", "/^CreativeCloud_v\\d+_\\d+$/": "ccd"}` (keys accept the same `/.../` regex form as `apiKeys`). Used as surface when the request has neither `surface` nor `id`; a `surface` parameter conflicting with it → `404`. | Object |`` |
| `debugLogs` | turns debug log on | Boolean | `false` |
| `networkConfig` | Sets of threshold for timing out main process (`mainTimeout`) & subsequent fetches (`fetchTimeout`), e.g. `{"fetchTimeout":2000,"mainTimeout":15000,"retries":3,"retryDelay":500` | Array |`` |

Each configuration can be managed using the following commands:
https://wiki.corp.adobe.com/pages/viewpage.action?pageId=3587728545

### prod

In prod main timeout is 15seconds, it includes time that action takes to fetch `networkConfig`. Main timeout is from start of the action till end of execution.
Fetch timeout is 2seconds and applied to each fetch call separately. There are multiple fetch calls to Odin and WCS. WCS ones could be disabled.

## preview

![preview architecture](preview.png)

[fragment-client.js](../fragment-client.js) is built consistently with what is deployed in adobe io runtime with
`npm run build:client` to reproduce that pipeline not in io runtime containers but on the browser.
