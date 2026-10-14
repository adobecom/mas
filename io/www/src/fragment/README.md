# fragment pipeline

![pipeline description](architecture.png)

this action sits behind mas/io/fragment in CDN and treats multiple odin related requests to provide m@s customers with :

- placeholders,
- settings,
- promotion,
- masks (field overlays applied on top of card fragments),
- regional and personalization customization,

that each stand behind so called transformers. To optimize calls make to odin, the sequence is based on promises created at init time and sometimes depending on each other. The pipeline order is:

`fetchFragment → defaultLanguage → promotions → mask → customize → settings → replace → wcs → corrector`

## Inactive price-render transformer

`transformers/render.js` is available for direct execution only. It is **not**
registered in the pipeline, and does not change production responses or fetch
offers. It consumes `@adobecom/mas-price` from the shared `price/` workspace.
Run `npm ci` inside `io/www`; the committed `.npmrc` installs local dependencies
as copies rather than external workspace symlinks.

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
effective promotion code if present. Cached arrays are copied before offer
selection. Missing environments/offers, empty offer groups, unaligned promotions,
and unresolved required options fail explicitly with request/field diagnostics.
All field updates are committed only after the entire render succeeds; cached
offers and unrelated context values are not modified.

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
