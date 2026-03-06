#!/bin/bash

node ./docs/src/build-docs.mjs inline-price.md ./docs/inline-price.html
node ./docs/src/build-docs.mjs checkout-link.md ./docs/checkout-link.html
node ./docs/src/build-docs.mjs checkout-button.md ./docs/checkout-button.html
node ./docs/src/build-docs.mjs upt-link.md ./docs/upt-link.html
node ./docs/src/build-docs.mjs mas.md ./docs/mas.html
node ./docs/src/build-docs.mjs step-by-step.md ./docs/step-by-step.html
node ./docs/src/build-docs.mjs mas.js.md ./docs/mas.js.html
node ./docs/src/build-docs.mjs feature-flags.md ./docs/feature-flags.html
node ./docs/src/build-docs.mjs aem-fragment.md ./docs/aem-fragment.html
node ./docs/src/build-docs.mjs merch-card.md ./docs/merch-card.html
node ./docs/src/build-docs.mjs plans.md ./docs/plans.html
node ./docs/src/build-docs.mjs commerce.md ./docs/commerce.html
node ./docs/src/build-docs.mjs ccd.md ./docs/ccd.html
npx esbuild --bundle --external:*.css --outfile=./docs/spectrum.js ./docs/src/spectrum.mjs