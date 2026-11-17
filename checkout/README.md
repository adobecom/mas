# Shared checkout decisions

`src/decisions.js` provides deterministic checkout decisions for Node and browser
consumers. It has no DOM, network, SDK or service-instance dependencies and does
not mutate its inputs. Browser adapters retain fetching, feature-flag reads,
localization, option consumption, DOM updates and checkout/modal handlers.

## Access

Node and other source consumers import the named functions or the frozen
`checkoutDecisions` namespace directly, using a relative `.js` path:

```js
// Relative to checkout/.
import { checkoutDecisions, selectModalPath } from './src/decisions.js';
```

After loading MAS's existing `commerce.js` or `mas.js` entry point, browser
consumers access the same namespace through the commerce service:

```js
const service = document.querySelector('mas-commerce-service');
const decisions = service.checkoutDecisions;
```

The read-only getter is available as soon as the registered service element is
constructed, including before DOM connection or asynchronous activation. All
instances share the same frozen namespace; consumers cannot add, replace or
delete its methods. The namespace contains no mutable service configuration.

## Decision contracts

Arguments are plain data. Resolve browser metadata into explicit flags before
calling these helpers; `threeInOneEnabled` defaults to `true`.

| Method                             | Inputs                                                                                                                                         | Result                                                                                                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `is3in1Modal(modal)`               | Authored modal string, or `undefined`.                                                                                                         | `true` for `twp`, `d2p` or `crm`, independently of feature flags; otherwise `false`.                                                          |
| `isOpen3in1Modal(context)`         | `{ modal, threeInOneEnabled = true }`.                                                                                                         | Whether the modal is a recognized 3-in-1 type and the supplied flag permits opening it.                                                       |
| `resolveWorkflowFallback(context)` | `{ modal, fallbackStep, wcsOsi, checkoutClientId, checkoutWorkflowStep, threeInOneEnabled = true }`.                                           | `{ checkoutWorkflowStep, modal, fallbackUsed }`. An applied fallback changes the workflow step and clears the modal together.                 |
| `selectCheckoutConfig(context)`    | `{ configs, productArrangementCode, productCode, productFamily, locale, svar }`. Config rows have string `PRODUCT_FAMILY` and `LOCALE` fields. | A new normalized config object, `undefined` if no product rows match, or `{}` if matched rows supply neither a base nor the requested locale. |
| `selectModalHash(context)`         | `{ config, modal, isOpen3in1, offerType }`.                                                                                                    | The selected hash string, or `undefined` when config, offer type or the selected field is missing.                                            |
| `selectModalPath(context)`         | `{ config, modal, isOpen3in1, offerType, isCheckoutLink, customerSegment, marketSegments }`.                                                   | The selected path string, or `undefined` for missing config/field or an unavailable segmented target. Empty authored paths remain `''`.       |

### Workflow fallback

An authored `fallbackStep` takes precedence over the existing `doc_cloud`
offer-to-workflow map. `null` or `undefined` permits the map lookup; an authored
empty string suppresses it. The map is used only for
`checkoutClientId === 'doc_cloud'`.

A truthy fallback is applied only when the modal is a recognized 3-in-1 type
and `threeInOneEnabled` is `false`. Otherwise the workflow step and modal remain
unchanged and `fallbackUsed` is `false`.

### Config precedence

Product candidates are considered in arrangement-code, product-code, then
product-family order. Rows containing `+` sort first, with equal-priority rows
retaining authored order. A matching `${product}+${svar}` row suppresses later
matches for that product.

The first candidate with `LOCALE === ''` supplies the base. The first matching
locale candidate supplies overrides, even from a lower-priority product group.
Only truthy override fields replace base fields. Values `X` and the cross mark
(`\u274c`) normalize to empty strings. Sorting and normalization leave the input rows and array
unchanged. Consuming/removing `svar` from caller options remains an adapter task.

### Modal targets and missing paths

CRM uses `CRM_PATH`/`CRM_HASH` when 3-in-1 is not open. Otherwise `TRIAL` selects
`FREE_TRIAL_PATH`/`FREE_TRIAL_HASH`, and other offer types select
`BUY_NOW_PATH`/`BUY_NOW_HASH`. Unlike hash selection, path selection retains the
buy-path default when the offer type is omitted.

When 3-in-1 is not open, pipe-separated paths map to:

1. `INDIVIDUAL_COM`
2. `TEAM_COM`
3. `INDIVIDUAL_EDU`
4. `TEAM_EDU`

Only checkout links supply a segment mapping, using `customerSegment` and the
first `marketSegments` value. Unmapped/missing segments, non-checkout-link CTAs
and absent list entries return `undefined`, not another audience's first path
and not an exception. Selected entries are trimmed; empty entries remain `''`.
Single paths and open-3-in-1 paths are returned without segment splitting.

For example, `TEAM_EDU` with a three-entry CRM path returns `undefined`.
Consumers must treat an absent/empty target as **no modal action** and retain
normal navigation to the offer's checkout URL.

## Rollout and validation

Publish and verify the MAS capability in production before merging the Milo
consumer under MWPW-215063. The new consumer requires `checkoutDecisions`; it
does not retain duplicate rules or support older MAS bundles without this API.
Refresh Milo's locked MAS test dependency after a real containing revision is
published. Rolling MAS back below that capability also requires rolling Milo
back. Unmodified Milo remains compatible with the additive MAS release.

Run `npm run test:checkout` from the repository root. Shared golden fixtures in
`test/fixtures/decisions.js` are also exercised through Node/browser parity,
the service getter and the built commerce bundle in the web-components suite:
`npm run test:ci --workspace=web-components`.
