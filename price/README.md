# Shared price rendering

Framework-free, source-ESM price rendering extracted from M@S web-components.
Runs natively in Node 22+ and browsers, with **no runtime dependencies**, DOM,
network calls, or import-time browser configuration.

This private workspace is not published. Web-components and the inactive io/www
price transformer import the shared source directly via relative paths, without
declaring an installed-package dependency. The workspace provides test tooling.
Web-components retains browser option/diagnostic adapters, not a separate renderer.
Production pipeline rendering is not enabled.

## API

```js
// Example run from price/; consumers use the relative path from their file.
import { applyPlanType, selectOffers, sumOffers, buildPriceHTML } from './src/index.js';

const options = {
    country: 'GB',
    language: 'en',
    displayTax: true,
    forceTaxExclusive: false,
    quantity: [1],
    // Used by the promo-with-annual path; see Time and diagnostics.
    instant: '2025-01-15T12:00:00.000Z',
};

// resolvedOfferGroups contains one WCS result array per OSI.
// Normalize raw WCS offers into copies before selection sorts the arrays.
const selected = resolvedOfferGroups.map((offers) => selectOffers(offers.map(applyPlanType), options)[0]);
const combined = sumOffers(selected);
const html = buildPriceHTML([combined], options);
```

Callers must handle empty WCS groups before summing. No partial-bundle fallback
or fetching occurs here.

| Export                                                 | Contract                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `applyPlanType(offer)`                                 | Returns a shallow copy of a WCS offer with `planType` derived from commitment/term, overwriting any stale value without mutating the input. See normalization below.                                                                                                                                                                                                                                                              |
| `selectOffers(offers, options)`                        | Prefers offers without a term, then the preferred language (EN in GB, MULT elsewhere). Sorts input arrays in place. Preserves zero/single-array identity unless `forceTaxExclusive` is enabled, which always maps the array. Rewriting creates amended offers and clears stale gross `priceInfo`; already-exclusive offers retain identity.                                                                                       |
| `sumOffers(offers, { logger }?)`                       | Returns null for absent/empty arrays and the same object for one offer. Combines OSIs and positive numeric/annualized sums rounded to two decimals; retains first-offer metadata and regular price fields where a sum is non-positive. Annualized output includes only positive sums. Clears `priceInfo` for bundles. Does not mutate offers. Warns on mismatched commitment, term, or currency format without rejecting the sum. |
| `buildPriceHTML(offers, resolvedOptions, { logger }?)` | Dispatches the first offer to existing templates and flattens its `priceDetails`. Returns the exact markup string, including whitespace/entities/classes/accessibility labels. Returns `''` for non-array/empty offers or missing options; invalid offer entries and missing required price inputs can throw. Does not select/sum offers, merge service settings, or collect options.                                             |

Callers merge service settings with overrides **before** rendering, preserving
the browser's `{ ...settings, ...options }` precedence. Supply resolved
country/language, literals, display flags, quantity, promotion code, and template
options. Geo/segment tax-default resolution, offer fetching, OSI/promo alignment,
checkout URLs, DOM updates, and hydration are not part of this shared renderer.

### Plan-type normalization

Call `applyPlanType` on raw WCS offers before selection/summation and formatting.
The supported mappings are YEAR/MONTHLY -> ABM, YEAR/ANNUAL -> PUF,
MONTH/MONTHLY -> M2M, PERPETUAL -> PERPETUAL, and TERM_LICENSE/P3Y -> P3Y.
Other commitment/term combinations return an empty plan type. The helper uses
the shared constants and introduces no runtime dependencies.

Consumers must supply WCS offer objects; legacy invalid-input sentinels and
non-object compatibility are not part of this API.
Nested properties retain identity because the returned offer is a shallow copy.

Web-components and the inactive IO transformer both normalize WCS offers with
this helper. Missing or unsupported commitments produce an empty plan type.
Direct Node unit tests cover the supported mappings and mutation contract.
Node/Chrome parity remains focused
on price rendering and offer selection/summation, not the pure plan-type mapping.

Templates: default, optical, strikethrough, promo-strikethrough, annual, legal,
discount, alternative, optical-alternative, and monthly-with-annual equivalents.
Promotion dispatch is gated by both the supplied promotion code and the offer's
own promotion. WCS preformatted price leaves are used where compatible; the
original numeric formatting remains the fallback.

### Markup, styles, and input trust

The renderer returns markup, not CSS. Consumers must style the generated price
classes and provide a visually-hidden rule for the **`sr-only` element**, as in
[`web-components/src/global.css.js`](../web-components/src/global.css.js).
Labels such as "Regularly at" and "Alternatively at" use `<sr-only>`, not a
`.sr-only` class. Without that rule they appear as visible text; the rule must
preserve their availability to assistive technology.

Supply valid WCS offer data and string literals from trusted sources. The
renderer is **not an HTML sanitizer**: price text and WCS preformatted leaves
can be emitted verbatim, and links in formatted literals retain their authored
attributes. Untrusted inputs require validation/sanitization at the consumer
boundary before rendering or inserting the returned HTML.

### Time and diagnostics

The promo-with-annual path (`pricePromoWithAnnual`) uses
`resolvedOptions.instant`. `buildPriceHTML` selects this path for an ABM offer
with `displayAnnual`, a supplied promotion code, and an offer promotion, unless
another template takes precedence. The ordinary `template: 'annual'` and
non-promo `priceWithAnnual` paths do **not** use `resolvedOptions.instant`;
the compatibility `createPriceTemplate` factory accepts `instant` in its
factory options instead.

The shared renderer never reads `?instant=` from a query string. The browser
adapter preserves the original promo-with-annual fallback, with an explicit
`options.instant` taking precedence over the query parameter, without extending
it to other template paths. Regular promotional rendering retains the legacy
`offer.promotion.displaySummary.instant` input. Where no applicable instant is
provided, existing promotion calculations use current time. Use equivalent
instants and clocks for deterministic Node/browser comparisons.

Pass a logger with `warn(message, details)` to summation and
`error(message, literal)` to HTML rendering. The default is `console`, so
standalone diagnostics are visible. Literal-formatting errors retain the existing
empty-literal behavior and report an error; other errors propagate. No global
logger registration or cross-request mutable state is introduced.

Consumer adapters must supply the required logger methods and forward
diagnostics to the existing Lana-backed browser logging or IO request logging,
rather than relying on the standalone console default.

### Source entry points

Consumers import the shared primitives from `src/index.js` using relative paths.
Supporting entry points include `src/constants.js`, `src/price/index.js`,
`src/price/template.js`, `src/price/utilities.js`, `src/price/legal.js` and
`src/discount/index.js`. All imports use `.js` extensions. Node smoke tests cover
these source entry points; they do not assert an installed-package contract.

The small internal boolean/predicate/escaping helpers and net-price rewrite
preserve `@dexter/tacocat-core` 1.13.1 semantics without importing its
browser-oriented entry point. Price templates, number formatting, and the ICU
formatter retain their existing repository implementations. The renderer also
retains the trial-offer net-price special case.

## Tests and golden contract

From the repository root:

```sh
npm --prefix price run test:ci
npm --prefix price run test:node
npm --prefix price run test:browser
```

`test:ci` runs native Node contracts with coverage, then real Chrome tests.
Coverage includes all `src/**`, with no inherited blanket exclusions.
Statements, branches, functions, and lines must each reach **100% in every source file**.
CI runs Node 22 and 24.
Chrome must be installed, as for existing Web Test Runner workspaces.

Renderer-owned price, legal, discount, formatting, and literal tests are
co-located under `test/browser/price/` and `test/browser/discount/`, with their
original snapshots and matrix data. Their HTML snapshot helper is test-only;
production rendering does not depend on browser test utilities. Literal tests
also validate the authored consumer data in `web-components/price-literals.json`;
shared-price CI runs when that file changes. The browser service retains its
own integration tests and all 854 service-level goldens in
`web-components/test/price.test.js`.

`test/fixtures/price-html.expected.json` contains **854 raw HTML golden strings**
captured before extraction from `web-components/src/price.js` at
`58b8724dfdfaea7bc1aa17422adb75991c058cfe`, in Chrome with UTC and a fixed
`2025-01-15T12:00:00.000Z` clock. The file records browser/source provenance.
`cases.js` retains inputs for the complete captured matrix:
6 locales × 4 customer segments × 11 template paths × 3 offer shapes, plus
62 named edge cases. Segment display flags are explicit resolved inputs, not
tests of tax-policy fetching. Preformatted cases deliberately test verbatim
WCS leaves, not consistency between arbitrary leaf strings and numeric prices.

The independent Node/browser tests compare against those committed strings,
and the browser also compares directly against freshly computed native Node
results served by its test-only middleware. The executed `parityCases` matrix
uses INDIVIDUAL and TEAM as representatives for per-unit display off/on:
6 locales × 2 resolved-flag states × 11 template paths × 3 offer shapes,
plus all 62 edge cases and two focused STUDENT/UNIVERSITY label regressions.
This executes **460 price cases** rather than repeating equivalent segment
combinations. Fixture contract tests require every omitted segment row to have
the same original golden output as its TEAM representative. All 854 original
inputs and expectations remain available for characterization and integration;
add executed cases whenever a segment acquires distinct renderer behavior.
No expected HTML is computed by
the new renderer at test time. A differing actual price is rejected by the
parity-harness regression.

`message-format.expected.json` preserves the existing repository's 1,731 ICU
golden literal cases, including plural/select, number/date/time skeletons,
escaping, links, invalid syntax, and missing arguments. Node and Chrome run
the same corpus in UTC.

Selection/summation contracts additionally test mutation, identity, warnings,
tax-exclusive/trial rewriting, soft bundles, annualized prices, and non-positive
sums. `offers.expected.json` captures 21 selection/bundle cases from the same
unchanged legacy browser revision; both runtimes check returned values and
input-array mutation against those goldens and against each other.
Test names describe one behavior each. Follow red/green/refactor when
adding functionality: write the failing test, observe it fail, implement, then
refactor while green. Do not regenerate goldens merely to pass changed output.

Future integrations must reuse this corpus, add adapter cases first, and keep
the production renderer singular. Finite fixtures cover the declared contract,
not every future Intl/ICU/runtime version; supported-input changes require
reviewed fixture additions.

Node 20 is deliberately excluded: its Intl implementation renders German
`{d, time, ::hhmma}` with `00` rather than Chrome/Node 22's `12` at midnight and
noon. Although every price HTML fixture matches on Node 20, the two strict
time-literal goldens do not. Requiring Node 22 (already required by io/www)
preserves the extracted formatter unchanged instead of concealing drift or
changing locale-sensitive behavior during extraction.
