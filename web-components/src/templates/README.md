# Merch card templates

A template decides how a `merch-card` lays out an AEM fragment: which fields it shows, in which slots, with which
styles. This folder holds every template and is the reference for which page loads which template.

> We say **template**. "Variant" is the old name. It survives only in the AEM fragment field `variant` and the card's
> `variant` attribute, which mirrors the card's `template` attribute so page CSS and older markup keep working.

## How templates load

`merch-card.js` contains one family of templates: headless, marquee, faq and banner-blade (`headless.js`), because
the global nav uses headless cards on every page. Every other template comes in a bundle. Milo (`MERCH_CARD_TEMPLATE_RULES` in `libs/utils/utils.js`) matches the page URL against the rules below.
It loads `merch-card.js` and the matching bundle in parallel, so no request waits on another before the first card
renders.

| Rule (path after the locale) | Bundle                                |
| ---------------------------- | ------------------------------------- |
| `acrobat/plans`              | `dc`                                  |
| `products/catalog`           | `catalog`                             |
| `products/firefly/`          | `firefly`                             |
| `products/`                  | `cc`                                  |
| `creativecloud/`             | `cc`                                  |
| `express/`                   | `express`                             |
| no rule matches              | every web bundle, plus a LANA warning |

- A trailing `/` matches every page under that path. Without it, the rule matches that page only (`.html` optional).
- Without a leading `/`, a rule applies to every locale (`acrobat/plans` matches `/acrobat/plans` and
  `/fr/acrobat/plans`). With a leading `/`, it applies to that exact path only (`/fr/acrobat/plans`).
- The most specific rule wins: a locale-specific rule beats an all-locale one, and a longer path beats a shorter one.
- On a page with a rule, a card whose template is not in the loaded bundle does not render. It waits up to
  `TEMPLATE_LOAD_TIMEOUT` (5 seconds), then logs an error with the template name and page through MAS `Log`. On `.aem.page` and localhost it
  also shows the card error badge, so authors see it before publishing. Add the template to that page's
  bundle, or give the page its own rule.
- The "no rule" row is a safety net and should never be used. The warning tells us which rule is missing.

CCD, Adobe Home, Brand Concierge and the commerce surface load `mas.js`, which still contains every template. Their
bundles (`ccd`, `ah`, `bc`, `aup`) are built so those apps can switch to `merch-card.js` + bundle when they opt in.

## Bundles

A bundle is a build output (`dist/templates/<bundle>.js`) that registers a group of templates. The headless family is
not in any bundle; it is in `merch-card.js`. A template can belong to
several bundles: a page loads one bundle, and if two loaded bundles register the same template, the first registration
wins.

| Bundle    | Used by                          | Templates                                                                                                                                                                                                             |
| --------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dc`      | Acrobat plans                    | pro, compare-chart-column                                                                                                                                                                                             |
| `catalog` | Catalog                          | catalog                                                                                                                                                                                                               |
| `cc`      | Creative Cloud and product pages | plans, plans-students, plans-education, plans-v2, pro, segment, special-offers, product, product-c2, product-pricing, mini-compare-chart, mini-compare-chart-mweb, image, media, compare-chart-column, inline-heading |
| `firefly` | Firefly                          | pro                                                                                                                                                                                                                   |
| `express` | Express                          | simplified-pricing-express, full-pricing-express, compare-chart-column                                                                                                                                                |
| `ah`      | Adobe Home (opt-in)              | ah-try-buy-widget, ah-promoted-plans, mini                                                                                                                                                                            |
| `ccd`     | Creative Cloud Desktop (opt-in)  | ccd-slice, ccd-suggested, mini                                                                                                                                                                                        |
| `bc`      | Brand Concierge (opt-in)         | brand-concierge-product                                                                                                                                                                                               |
| `aup`     | Commerce (opt-in)                | fries                                                                                                                                                                                                                 |

## Templates

Surfaces are where Studio lets authors pick the template (`studio/src/editors/variant-picker.js`).

| Template                   | Studio label               | Surfaces                                           | Bundles         |
| -------------------------- | -------------------------- | -------------------------------------------------- | --------------- |
| ah-promoted-plans          | Promoted Plans             | Adobe Home                                         | ah              |
| ah-try-buy-widget          | Try Buy Widget             | Adobe Home                                         | ah              |
| banner-blade               | Banner/Blade               | acom, acom-cc, acom-dc, sandbox, nala              | merch-card.js   |
| brand-concierge-product    | Brand Concierge Product    | Brand Concierge                                    | bc              |
| catalog                    | Catalog                    | acom                                               | catalog         |
| ccd-slice                  | Slice                      | CCD                                                | ccd             |
| ccd-suggested              | Suggested                  | CCD                                                | ccd             |
| compare-chart-column       | Compare Chart Column       | acom, acom-cc, acom-dc, Express                    | dc, cc, express |
| faq                        | FAQ                        | acom, acom-cc, acom-dc, sandbox, nala              | merch-card.js   |
| fries                      | Fries                      | Commerce                                           | aup             |
| full-pricing-express       | Full Pricing Express       | Express                                            | express         |
| headless                   | Headless                   | acom, acom-cc, acom-dc, acom-edu, genuine, sandbox | merch-card.js   |
| image                      | Image                      | acom-cc, acom-dc                                   | cc              |
| inline-heading             | (not authorable in Studio) | Milo markup only                                   | cc              |
| marquee                    | Marquee                    | acom, acom-cc, acom-dc, sandbox, nala              | merch-card.js   |
| media                      | Media                      | acom                                               | cc              |
| mini                       | Mini                       | CCD, Adobe Home                                    | ah, ccd         |
| mini-compare-chart         | Mini Compare Chart         | acom-cc, acom-dc, acom-edu                         | cc              |
| mini-compare-chart-mweb    | Mini Compare Chart Mweb    | acom, acom-cc, acom-dc, acom-edu                   | cc              |
| plans                      | Plans                      | acom, genuine                                      | cc              |
| plans-education            | Plans Education            | acom                                               | cc              |
| plans-students             | Plans Students             | acom                                               | cc              |
| plans-v2                   | Plans v2                   | acom                                               | cc              |
| pro                        | Pro                        | acom, acom-cc, acom-dc                             | dc, cc, firefly |
| product                    | Product                    | acom-cc, acom-dc, acom-edu                         | cc              |
| product-c2                 | Product C2                 | acom-cc, acom-dc                                   | cc              |
| product-pricing            | Product Pricing            | acom                                               | cc              |
| segment                    | Segment                    | acom-cc, acom-dc                                   | cc              |
| simplified-pricing-express | Simplified pricing Express | Express                                            | express         |
| special-offers             | Special offers             | acom-cc                                            | cc              |

### Fragment fields per template

The fields each template reads from its fragment (its fragment mapping). Editor-only settings such as the
`allowed*Colors` lists are left out.

| Template                   | Fields                                                                                                                                                                                                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ah-promoted-plans          | mnemonics, title, description, prices, ctas, backgroundImage, backgroundColor, borderColor                                                                                                                                                                                   |
| ah-try-buy-widget          | mnemonics, title, badge, description, prices, ctas, backgroundImage, backgroundColor, borderColor, size                                                                                                                                                                      |
| banner-blade               | cardName, image, backgrounds, title, description, ctas                                                                                                                                                                                                                       |
| brand-concierge-product    | cardName, mnemonics, badge, title, prices, planType, promoText, description, ctas                                                                                                                                                                                            |
| catalog                    | cardName, badge, ctas, description, mnemonics, prices, shortDescription, size, title                                                                                                                                                                                         |
| ccd-slice                  | backgroundImage, badge, ctas, description, mnemonics, size                                                                                                                                                                                                                   |
| ccd-suggested              | backgroundImage, badge, ctas, description, mnemonics, prices, size, subtitle, title                                                                                                                                                                                          |
| compare-chart-column       | mnemonics, title, badge, prices, description, callout, ctas, features                                                                                                                                                                                                        |
| faq                        | cardName, prices, description, shortDescription, callout                                                                                                                                                                                                                     |
| fries                      | mnemonics, title, description, whatsIncluded, badge, trialBadge, prices, ctas, addonConfirmation, borderColor                                                                                                                                                                |
| full-pricing-express       | title, badge, description, shortDescription, callout, prices, trialBadge, ctas, mnemonics, borderColor, multiWhatsIncluded                                                                                                                                                   |
| headless                   | cardName, title, cardTitle, subtitle, description, promoText, shortDescription, callout, quantitySelect, whatsIncluded, addonConfirmation, badge, trialBadge, prices, backgroundImage, ctas, addon, secureLabel, borderColor, backgroundColor, size, mnemonics, customFields |
| image                      | cardName, badge, badgeIcon, borderColor, ctas, description, mnemonics, prices, promoText, size, title, subtitle, backgroundImage                                                                                                                                             |
| inline-heading             | none (no fragment mapping)                                                                                                                                                                                                                                                   |
| marquee                    | cardName, image, backgrounds, title, description, shortDescription, prices, ctas                                                                                                                                                                                             |
| media                      | cardName, title, subtitle, description, ctas, backgroundImage                                                                                                                                                                                                                |
| mini                       | title, prices, description, planType, ctas                                                                                                                                                                                                                                   |
| mini-compare-chart         | cardName, title, subtitle, prices, promoText, shortDescription, description, mnemonics, quantitySelect, callout, addon, secureLabel, planType, badgeIcon, badge, whatsIncludedDividerColor, borderColor, size, whatsIncluded, ctas                                           |
| mini-compare-chart-mweb    | cardName, title, subtitle, prices, promoText, quantitySelect, shortDescription, description, mnemonics, secureLabel, planType, badgeIcon, badge, borderColor, size, ctas                                                                                                     |
| plans                      | cardName, title, subtitle, prices, promoText, description, mnemonics, callout, quantitySelect, addon, secureLabel, planType, badgeIcon, badge, borderColor, size, whatsIncluded, ctas, perUnitLabel                                                                          |
| plans-education            | plans fields; title and secureLabel overridden                                                                                                                                                                                                                               |
| plans-students             | plans fields                                                                                                                                                                                                                                                                 |
| plans-v2                   | cardName, title, subtitle, prices, shortDescription, promoText, description, mnemonics, callout, quantitySelect, addon, secureLabel, planType, badgeIcon, badge, borderColor, size, whatsIncluded, ctas, perUnitLabel                                                        |
| pro                        | cardName, subtitle, title, description, mnemonics, size, prices, promoText, perUnitLabel, callout, quantitySelect, shortDescription, secureLabel, planType, addon, ctas, whatsIncluded, eduDisclaimer, backgroundColor, borderColor                                          |
| product                    | cardName, title, prices, promoText, description, shortDescription, mnemonics, callout, quantitySelect, secureLabel, planType, addon, addonBackground, badgeIcon, badge, borderColor, whatsIncluded, ctas, perUnitLabel                                                       |
| product-c2                 | cardName, subtitle, description, prices, shortDescription, ctas, planType, backgroundColor, badge                                                                                                                                                                            |
| product-pricing            | cardName, mnemonics, badge, title, prices, description, shortDescription, ctas, planType                                                                                                                                                                                     |
| segment                    | cardName, title, prices, promoText, description, callout, planType, secureLabel, badgeIcon, badge, borderColor, ctas, perUnitLabel                                                                                                                                           |
| simplified-pricing-express | title, badge, description, prices, callout, ctas, borderColor (supports a default child in collections)                                                                                                                                                                      |
| special-offers             | cardName, backgroundImage, subtitle, title, prices, description, ctas, planType, badgeIcon, badge, borderColor                                                                                                                                                               |

## Writing a template

One file per template: `<template>.js` holds its page CSS, its shadow CSS and its class. Templates that share a class or
styles share a file:

- `plans.js` registers plans, plans-students and plans-education.
- `headless.js` registers the headless family: headless, marquee, faq and banner-blade (shared shadow styles, page CSS
  and backgrounds preview).

A template file imports nothing at runtime. It exports `define`, which receives its dependencies and returns its
templates by name:

```js
import { css } from '../css.js'; // build-time tag, removed from the output

// Page CSS, inserted once per page by TemplateLayout.insertTemplateStyle()
const CSS = css`
    merch-card[variant='pro'] { ... }
`;

// Pure data can stay at module level (tests import it from here)
export const PRO_AEM_FRAGMENT_MAPPING = {
    title: { tag: 'h3', slot: 'heading-xs' } /* ... */,
};

export function define({
    TemplateLayout,
    escapeHTML,
    SELECTOR_MAS_INLINE_PRICE,
    Log,
}) {
    class Pro extends TemplateLayout {
        static templateStyle = css`
            :host([variant='pro']) { ... }
        `;

        getGlobalCSS() {
            return CSS;
        }
        // ...
    }
    return {
        pro: {
            class: Pro,
            fragmentMapping: PRO_AEM_FRAGMENT_MAPPING,
            style: Pro.templateStyle,
        },
    };
}
```

A bundle (`build.mjs`, `TEMPLATE_BUNDLES`) imports the `define` of each of its files and, once `merch-card` is defined,
calls `MerchCard.registerTemplates(define)` for each. `mas.js` and the unit tests register every file through
`src/all-templates.js`.

- **Dependencies come from `templateDeps` in `src/template-deps.js`.** If a template needs something new, add it there.
  Adding a name is safe; removing or renaming one breaks bundles that are already deployed, and a test pins the list.
- **Code two templates share belongs in `templateDeps`** (or in a shared file, like the headless family), not in an
  import between template files.
- **The build fails if a template file imports anything** other than the build-time `css` tag. That keeps bundles
  independent of where `merch-card.js` is served from.
- **CSS uses the `css` tag and the `@custom-media` breakpoints** from `src/media.css` (for example
  `@media (--tablet-up)`). It is minified at build time and cannot interpolate values.
- **The registry is `src/template-registry.js`**: `registerTemplate(s)`, `getTemplate`, `whenTemplate`,
  `getTemplateLayout`, `getFragmentMapping`, `getCollectionOptions`. The first registration of a name wins. Card,
  hydration and collection code wait with `whenTemplate(name)` before they lay out a card or read its fragment mapping.

### Adding a template

1. Create `<template>.js` in this folder and add it to `src/all-templates.js` and `test/templates.test.js`.
2. Add it to the bundles that need it in `build.mjs`. If a page needs a new bundle, add the bundle here and its rule
   in Milo `libs/utils/utils.js` (`MERCH_CARD_TEMPLATE_RULES`).
3. Add it to Studio's template picker (`studio/src/editors/variant-picker.js`) with its surfaces.
4. Add tests, update this README (tables above), and run perf-ab on a page that uses it.
