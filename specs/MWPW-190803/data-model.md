# Data Model: Hide Trial CTAs via Settings (MWPW-190803)

## Existing Entities (no structural changes)

### Setting Entry Fragment (AEM Content Fragment)

Existing fields (unchanged):

| Field | Type | Description |
|-------|------|-------------|
| `name` | text | Setting name key (e.g., `hideTrialCTAs`) |
| `templates` | text[] | Card variants this setting applies to (empty = all) |
| `locales` | text[] | Locales this entry applies to (empty = all) |
| `tags` | tag[] | AEM tags for additional scoping |
| `valuetype` | text | `boolean`, `text`, `optional-text`, or `richText` |
| `booleanValue` | boolean | The boolean value when `valuetype = boolean` |
| `textValue` | text | The text value when `valuetype = text/optional-text` |

### Resolved Settings Object (IO pipeline output)

The `fragment.settings` object on the IO response gains one new field:

```js
fragment.settings = {
  // existing fields...
  secureLabel: string | undefined,
  displayAnnual: boolean,
  displayPlanType: boolean,
  quantitySelect: string | undefined,

  // NEW
  hideTrialCTAs: boolean  // true = strip trial CTAs from this fragment's ctas payload
}
```

### Fragment Fields (modified by strip logic)

The `fragment.fields.ctas` HTML string is modified in-place within the IO pipeline when `hideTrialCTAs` is `true`:

**Before strip (example):**
```html
<a href="https://commerce.adobe.com/..." data-wcs-osi="ABC123" data-analytics-id="buy-now" class="accent">Buy now</a>
<a href="https://commerce.adobe.com/..." data-wcs-osi="DEF456" data-analytics-id="free-trial" class="primary-outline">Free trial</a>
```

**After strip:**
```html
<a href="https://commerce.adobe.com/..." data-wcs-osi="ABC123" data-analytics-id="buy-now" class="accent">Buy now</a>
```

---

## New Setting Definition Entry

Added to `SETTING_NAME_DEFINITIONS` in `io/www/src/fragment/transformers/settings.js`:

```js
{ name: 'hideTrialCTAs', valueType: 'boolean' }
```

### Resolution behavior (inherited from existing system)

| Scope | Behavior |
|-------|----------|
| Surface-level default | Applied to all fragments on the surface when no locale/tag override exists |
| Locale override | Scopes setting to specific locales (e.g., en_US, en_GB, fr_FR) |
| Tag override | Further scopes by AEM tag matching (e.g., `mas:product/photoshop`) |
| Template filter | Can restrict to specific card variants (e.g., `plans`, `catalog`) |
| Card-level override | `fragment.fields.hideTrialCTAs` on an individual fragment takes precedence over all surface/locale settings |

### Override precedence (highest to lowest)

1. Fragment field `hideTrialCTAs` (card-level, set by Content Author in Studio)
2. Locale + tag matched override entry
3. Locale-only matched override entry
4. Surface default entry
5. Not set → `false` (no change to CTA delivery)

---

## CTA Identification Schema

Trial CTAs are identified exclusively by `data-analytics-id`:

| `data-analytics-id` value | CTA type | Action when `hideTrialCTAs = true` |
|--------------------------|----------|-------------------------------------|
| `free-trial` | Trial | Strip from `fields.ctas` |
| `start-free-trial` | Trial | Strip from `fields.ctas` |
| `buy-now` | Buy | Keep |
| `save-now` | Buy | Keep |
| `get-started` | Buy | Keep |
| `upgrade-now` | Buy | Keep |
| `get-offer` | Buy | Keep |
| `select` | Buy | Keep |
| `learn-more` | Informational | Keep |
| *(any other value)* | Unknown | Keep (no-op) |

---

## State Transitions

### Setting activation flow

```
[Not created]
    → Admin creates setting with booleanValue=true, locales=[T1 list]
[Draft / Unpublished]
    → Visible on www.stage.adobe.com
    → QA validates
[Published]
    → Trial CTAs stripped from IO payload for targeted locales
    → End users see buy-only experience
[Unpublished / Toggled off]
    → Trial CTAs return to IO payload
    → End users see normal dual-CTA experience
```

### Card-level override flow

```
[No fragment field set]
    → Surface/locale setting applies
[fragment.fields.hideTrialCTAs = false]
    → Setting overridden → trial CTA preserved regardless of global mode
[fragment.fields.hideTrialCTAs = true]
    → Explicit card-level enforcement (same as surface setting being true)
```
