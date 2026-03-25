# Data Model: Hide Trial CTAs via Settings (MWPW-190803)

## Setting Entry Fragment (AEM Content Fragment)

Existing fields (unchanged):

| Field          | Type    | Description                                          |
| -------------- | ------- | ---------------------------------------------------- |
| `name`         | text    | Setting name key (e.g., `hideTrialCTAs`)             |
| `templates`    | text[]  | Card variants this setting applies to (empty = all)  |
| `locales`      | text[]  | Locales this entry applies to (empty = all)          |
| `tags`         | tag[]   | AEM tags for additional scoping                      |
| `valuetype`    | text    | `boolean`, `text`, `optional-text`, or `richText`    |
| `booleanValue` | boolean | The boolean value when `valuetype = boolean`         |
| `textValue`    | text    | The text value when `valuetype = text/optional-text` |

---

## Resolved Settings Object (IO pipeline output)

The `fragment.settings` object gains one new field:

```js
fragment.settings = {
    secureLabel: string | undefined,
    displayAnnual: boolean,
    displayPlanType: boolean,
    quantitySelect: string | undefined,
    // NEW
    hideTrialCTAs: boolean, // true = hydrate.js will filter trial CTAs during card rendering
};
```

---

## New Setting Definition Entry

Added to `SETTING_NAME_DEFINITIONS` in `io/www/src/fragment/transformers/settings.js`:

```js
{ name: 'hideTrialCTAs', valueType: 'boolean' }
```

### Resolution behavior

| Scope               | Behavior                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------- |
| Surface-level       | Applied to all fragments on the surface when no locale/tag override exists                   |
| Locale override     | Scopes setting to specific locales (e.g., en_US, en_GB, fr_FR)                               |
| Tag override        | Further scopes by AEM tag matching (e.g., `mas:product/photoshop`)                           |
| Template filter     | Can restrict to specific card variants (e.g., `plans`, `catalog`)                            |
| Card-level override | `fragment.fields.hideTrialCTAs` on an individual fragment takes precedence over all settings |

### Override precedence (highest to lowest)

1. Fragment field `hideTrialCTAs` (card-level, set by Content Author in Studio)
2. Locale + tag matched override entry
3. Locale-only matched override entry
4. Surface default entry
5. Not set → `false` (no change to CTA delivery)

---

## CTA Identification Schema

Trial CTAs are identified exclusively by `data-analytics-id`:

| `data-analytics-id` value | CTA type      | Action when `hideTrialCTAs = true` |
| ------------------------- | ------------- | ---------------------------------- |
| `free-trial`              | Trial         | Filtered by `hydrate.js`           |
| `start-free-trial`        | Trial         | Filtered by `hydrate.js`           |
| `buy-now`                 | Buy           | Keep                               |
| `save-now`                | Buy           | Keep                               |
| `get-started`             | Buy           | Keep                               |
| `upgrade-now`             | Buy           | Keep                               |
| `get-offer`               | Buy           | Keep                               |
| `select`                  | Buy           | Keep                               |
| `learn-more`              | Informational | Keep                               |
| _(any other value)_       | Unknown       | Keep (no-op)                       |

---

## Card-Level Override Flow

```
[No fragment field set]
    → Surface/locale setting applies

[fragment.fields.hideTrialCTAs = false]
    → Trial CTA preserved regardless of global mode

[fragment.fields.hideTrialCTAs = true]
    → Explicit card-level enforcement (same as surface setting being true)
```
