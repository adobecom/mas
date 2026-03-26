# MWPW-190146: Onboard ACOM CC and ACOM DC Surfaces

## Context

MAS Studio currently has 7 surfaces (acom, adobe-home, ccd, commerce, express, nala, sandbox). All authenticated authors can edit cards across all surfaces. To support per-surface permissions, two new surfaces split ACOM by product cloud — ACOM CC (Creative Cloud) and ACOM DC (Document Cloud). The existing ACOM surface retains only plans/catalog card templates. Permission enforcement is a separate future ticket; this work onboards the surfaces and reassigns templates.

Jira: [MWPW-190146](https://jira.corp.adobe.com/browse/MWPW-190146)
Wiki: [Surface permissions table](https://wiki.corp.adobe.com/pages/viewpage.action?pageId=3330873329)

## Template-to-Surface Mapping

| Surface | Status | Templates | IAM Groups |
|---------|--------|-----------|------------|
| ACOM CC | NEW | product, segment, mini-compare-chart, image, special-offers | GRP-ODIN-MAS-ACOM-CC-EDITORS, GRP-ODIN-MAS-CC-POWERUSERS |
| ACOM DC | NEW | product, segment, mini-compare-chart, image | GRP-ODIN-MAS-ACOM-DC-EDITORS, GRP-ODIN-MAS-DC-POWERUSERS |
| ACOM | EXISTING (reduced) | plans, plans-v2, plans-students, plans-education, catalog, media, mini-compare-chart-mweb | GRP-ODIN-MAS-ACOM-POWERUSERS |

Key difference: ACOM DC does NOT get special-offers.

## Design

### 1. Surface Registry

Add `ACOM_CC` and `ACOM_DC` to the `SURFACES` constant in `studio/src/constants.js`:

```javascript
ACOM_CC: { label: 'ACOM CC', name: 'acom-cc' },
ACOM_DC: { label: 'ACOM DC', name: 'acom-dc' },
```

Add both to `TRANSLATIONS_ALLOWED_SURFACES` since they need translation workflows.

### 2. Locale Configuration

Add entries in `io/www/src/fragment/locales.js` `DEFAULT_LOCALES` mapping to the existing `ACOM` array — same pattern as `nala` and `sandbox`:

```javascript
'acom-cc': ACOM,
'acom-dc': ACOM,
```

This gives both surfaces the full set of 34+ ACOM locales with regional variants.

### 3. Template Reassignment (Allowlist Approach)

In `studio/src/editors/variant-picker.js`, add two allowlist Sets that define which ACOM-origin templates each new surface can use:

```javascript
const ACOM_CC_TEMPLATES = new Set([
    VARIANT_NAMES.PRODUCT,
    VARIANT_NAMES.SEGMENT,
    VARIANT_NAMES.MINI_COMPARE_CHART,
    VARIANT_NAMES.IMAGE,
    VARIANT_NAMES.SPECIAL_OFFERS,
]);

const ACOM_DC_TEMPLATES = new Set([
    VARIANT_NAMES.PRODUCT,
    VARIANT_NAMES.SEGMENT,
    VARIANT_NAMES.MINI_COMPARE_CHART,
    VARIANT_NAMES.IMAGE,
]);
```

Update `getVariantTreeData` to check these sets when the surface is `acom-cc` or `acom-dc`, matching against ACOM-origin variants.

Reassign ACOM: remove product, segment, mini-compare-chart, image, special-offers. ACOM keeps plans, plans-v2, plans-students, plans-education, catalog, media, mini-compare-chart-mweb.

### 4. Translation Onboarding

Three touchpoints:

**a) Studio UI gate** — `TRANSLATIONS_ALLOWED_SURFACES` in `studio/src/constants.js` (covered in section 1).

**b) Side nav** — Add both surfaces to the `isTranslationEnabled` check in `studio/src/mas-side-nav.js`.

**c) Translation flow mapping** — Add entries in `io/studio/app.config.yaml` under `translationMapping`:

```yaml
translationMapping:
    acom: transcreation
    acom-cc: transcreation
    acom-dc: transcreation
    express: transcreation
    sandbox: machineTranslation
```

**d) AEM content folders** — `/content/dam/mas/acom-cc/` and `/content/dam/mas/acom-dc/` must exist in Odin. This is an AEM admin task outside this PR's scope.

### 5. LDAP Tenant Registration

Add `'ACOM-CC'` and `'ACOM-DC'` to the tenants array in `scripts/app/refreshUsers.mjs`. This causes the refresh script to query `GRP-ODIN-MAS-ACOM-CC-EDITORS` and `GRP-ODIN-MAS-ACOM-DC-EDITORS`. The existing `memberOf` query already picks up `CC-POWERUSERS` / `DC-POWERUSERS` via the `/-MAS-/` regex filter.

No permission enforcement changes — deferred to a future ticket.

### 6. No-Change Areas

These work automatically with no code modifications:

- **Dictionary/placeholder fallback** (`studio/src/mas-repository.js`): Non-ACOM surfaces already fall back to ACOM dictionary.
- **Corrector** (`io/www/src/fragment/transformers/corrector.js`): ACOM is not in `SURFACES_TO_CORRECT`; neither should CC/DC.
- **Promotions editor** (`studio/src/mas-promotions-editor.js`): Uses `Object.values(SURFACES)` dynamically.
- **Translation action** (`io/studio/src/translation/project-start.js`): Constructs paths dynamically from the surface parameter — no hardcoded surface list.

## Files Modified

| File | Change |
|------|--------|
| `studio/src/constants.js` | Add ACOM_CC, ACOM_DC to SURFACES; add to TRANSLATIONS_ALLOWED_SURFACES |
| `io/www/src/fragment/locales.js` | Add acom-cc, acom-dc to DEFAULT_LOCALES |
| `studio/src/editors/variant-picker.js` | Add allowlist sets; update getVariantTreeData; reassign ACOM templates |
| `studio/src/mas-side-nav.js` | Add new surfaces to isTranslationEnabled |
| `scripts/app/refreshUsers.mjs` | Add ACOM-CC, ACOM-DC to tenants array |
| `io/studio/app.config.yaml` | Add acom-cc, acom-dc to translationMapping |

## Open Items

- `media` and `mini-compare-chart-mweb` are not listed in the wiki table for any surface — keeping on ACOM for now. May need clarification from product.
- Existing ACOM cards with product/segment/image templates remain in `/content/dam/mas/acom/` — content migration path is outside this ticket's scope.
- AEM folder creation for `/content/dam/mas/acom-cc/` and `/content/dam/mas/acom-dc/` is an admin task.

## Verification

1. Start MAS Studio locally
2. Navigate to `#path=acom-cc` — locale picker shows ACOM locales
3. Create card on ACOM CC — template picker shows: product, segment, mini-compare-chart, image, special-offers
4. Create card on ACOM DC — template picker shows: product, segment, mini-compare-chart, image (no special-offers)
5. Navigate to `#path=acom` — template picker shows: plans, plans-v2, plans-students, plans-education, catalog, media, mini-compare-chart-mweb
6. Translation tab visible for acom-cc and acom-dc surfaces
7. Run `npm run test:ci` in studio/
8. Run `npm test` in io/www/
