# Merch At Scale

This repository provides a suite of features and web components to support merchandising content across various surfaces, starting from adobe.com. It integrates core commerce capabilities and reusable components designed to simplify development and improve the user experience.

For a developer guide please see [mas.js documentation](https://mas.adobe.com/web-components/docs/mas.js.html)

## Features

### Web Components

Interactive web components built using the [Lit](https://lit.dev/) framework, offering a vanilla HTML/JS approach:

- **Merch Cards**
- `catalog`
- `image`
- `inline-heading`
- `mini-compare-chart`
- `plans`
- `product`
- `segment`
- `special-offers`
- `twp`
- `ccd-slice`
- `ccd-suggested`
- **Merch Card Collection**
    - Features:
        - Filtering by category and device type
        - Keyword search
        - Sorting (natural order)
        - Deep linking
        - Query parameter support
        - "Show more" button

### Commerce Services

Generic commerce-related logic, including:

- `mas-commerce-service` to enable mas commerce in the page
- `price` and `checkout-link` custom elements
- Functions for building checkout URLs and resolving price offers

### Installation

Install from the repository root so npm links the `@adobecom/mas-price` workspace
dependency.

```sh
npm install
```

### Shared price rendering

`@adobecom/mas-price` owns offer selection, soft-bundle summation, price/discount
templates, number formatting, and localized price literals. Web-components keeps
option collection, tax-default resolution, WCS fetching, DOM updates, and
browser diagnostic adapters; there is no separate browser renderer.

The commerce service's `buildPriceHTML(offers, options)` API is unchanged.
Service settings provide formatting defaults, while template selection stays
per-price. Explicit `instant` wins over the query string; `?instant=` fallback
applies only to promotional monthly-with-annual rendering, as before.

Use Node 22 or newer for web-components testing and the build command (which
runs tests). Browser parity computes native Node output using the shared package,
whose supported runtime is Node 22+. The dedicated web-components build CI job
uses Node 22; Studio's build job and the repository-wide `.nvmrc` stay at Node 20.
This validation requirement does not change the browser bundle's target or
upgrade unrelated workspaces.

`test/price-parity.test.js` compares all 854 original price HTML goldens against
the browser service and freshly computed native Node results. Expected markup
is reused unchanged from `price/test/fixtures/`; do not regenerate fixtures to
hide integration drift. Run this alongside browser adapter tests:

```sh
cd web-components
npx wtr --config web-test-runner.config.mjs --files test/price-integration.test.js test/price-parity.test.js
```

### Building

mas builds packages both for Milo and external consumers.
the evergreen mas.js is located at /web-components/dist/mas.js

```sh
npm run build
```

#### Build documentation

```sh
npm run build:docs
```

### Testing

This package uses:

- [Web Test Runner](https://modern-web.dev/docs/test-runner/overview/)
- [ChaiJS](https://www.chaijs.com/api/bdd/)
- [SinonJS](https://sinonjs.org/releases/v15/)

Run all tests:

```sh
npm run test
```

Run a specific test:

```sh
npm run test:file -- test/settings.test.js
```

## Linting

```sh
npm run lint
```

## Troubleshooting

Reach out in the `#merch-at-scale` Slack channel for support.
