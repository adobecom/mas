# Feature Flags

Feature flags can be set via a meta tag.

e.g `<meta name="mas-ff-defaults" content="on">`

| Flag Name | Description | Default Value | Valid Values |
|-----------|-------------|---------------|--------------|
| `mas-ff-defaults` | Enables good defaults for each locale and segment so that authors don't have to set them manually. This includes automatic tax display settings based on country and customer segment. | `off` | `on`, `off`, `true`, `false` |
| `mas-ff-3in1` | Controls the 3-in-1 modal checkout experience. When enabled, TWP (Trial With Purchase), D2P (Direct to Purchase), and CRM (Content Rich Modals) modals will use the unified 3-in-1 checkout flow. | `on` | `on`, `off` |
| `mas-ff-annual-price` | Enables the display of annual pricing alongside monthly prices. When enabled and `annual` parameter is not set to `false`, prices will show the calculated annual cost. | `off` | `on`, `off`, `true`, `false` |
| `mas-ff-copy-cta` | Adds a copy-to-clipboard button next to checkout CTAs. Useful for authors who need to copy CTA links for use in other contexts. | `off` | `on`, `off` |
| `mas-ff-mas-deps` | Controls whether MAS components are loaded from an external URL (when masLibs is present) or from local dependencies. When enabled, components load from external sources. | `off` | `on`, `off`, `true`, `false` |
| `mas-geo-detection` | Enables geographic locale detection using Akamai geolocation. When enabled, the user's actual geographic location is used to determine locale settings instead of the URL prefix. | `off` | `on`, `off`, `true`, `false` |

## Detailed Flag Descriptions

### mas-ff-defaults

**Purpose:** Eliminates the need for authors to manually configure tax display and pricing settings for each locale. This flag automatically applies region-appropriate defaults based on country, language, and customer segment.

**What it controls:**
- **Unit label display:** Automatically adds unit labels (e.g., "per license") for team offers across all countries.
- **Tax label display:** Automatically shows or hides tax labels ("incl. tax" or "excl. tax") based on country regulations.
  
**Tax Label Display by Country and Customer Segment:**
> **Note:** The settings in the table apply only to Milo.

| Country/Locale | INDIVIDUAL_COM | TEAM_COM | INDIVIDUAL_EDU | TEAM_EDU |
|----------------|----------------|----------|----------------|----------|
| **Europe** |
| AT_de (Austria) | inkl. MwSt. | inkl. MwSt. | inkl. MwSt. | zzgl. MwSt. |
| BE_en (Belgium) | incl. VAT | excl. VAT | incl. VAT | excl. VAT |
| BE_fr (Belgium) | TTC | HT | TTC | HT |
| BE_nl (Belgium) | incl. btw | excl. btw | incl. btw | excl. btw |
| BG_bg (Bulgaria) | с включен ДДС | без ДДС | с включен ДДС | без ДДС |
| CH_de (Switzerland) | inkl. MwSt. | zzgl. MwSt. | inkl. MwSt. | zzgl. MwSt. |
| CH_fr (Switzerland) | TTC | HT | TTC | HT |
| CH_it (Switzerland) | incl. IVA | escl. IVA | incl. IVA | escl. IVA |
| CZ_cs (Czech Republic) | včetně DPH | bez DPH | včetně DPH | bez DPH |
| DE_de (Germany) | inkl. MwSt. | zzgl. MwSt. | inkl. MwSt. | zzgl. MwSt. |
| DK_da (Denmark) | inkl. moms | ekskl. moms | inkl. moms | ekskl. moms |
| EE_et (Estonia) | käibemaksuga | käibemaksuta | käibemaksuga | käibemaksuta |
| ES_es (Spain) | IVA incluido | sin IVA | IVA incluido | sin IVA |
| FI_fi (Finland) | sis. ALV:n | ilman ALV:tä | sis. ALV:n | ilman ALV:tä |
| FR_fr (France) | TTC | HT | TTC | HT |
| GB_en (United Kingdom) | incl. VAT | excl. VAT | incl. VAT | excl. VAT |
| GR_el (Greece) | (συμπερ. ΦΠΑ) | (εξαιρ. ΦΠΑ) | (συμπερ. ΦΠΑ) | (εξαιρ. ΦΠΑ) |
| GR_en (Greece) | incl. VAT | excl. VAT | incl. VAT | excl. VAT |
| HU_hu (Hungary) | áfával | áfa nélkül | áfával | áfa nélkül |
| IE_en (Ireland) | incl. VAT | excl. VAT | incl. VAT | excl. VAT |
| IT_it (Italy) | incl. IVA | escl. IVA | incl. IVA | escl. IVA |
| LT_lt (Lithuania) | su PVM | be PVM | su PVM | – |
| LU_de (Luxembourg) | inkl. MwSt. | zzgl. MwSt. | inkl. MwSt. | zzgl. MwSt. |
| LU_en (Luxembourg) | incl. VAT | excl. VAT | incl. VAT | excl. VAT |
| LU_fr (Luxembourg) | TTC | HT | TTC | HT |
| LV_lv (Latvia) | ar PVN | bez PVN | ar PVN | – |
| NL_nl (Netherlands) | incl. btw | excl. btw | incl. btw | excl. btw |
| NO_nb (Norway) | inkl. mva | ekskl. mva | inkl. mva | ekskl. mva |
| PL_pl (Poland) | w tym VAT | bez VAT | w tym VAT | bez VAT |
| PT_pt (Portugal) | IVA incluso | IVA não incluso | IVA incluso | IVA não incluso |
| RO_ro (Romania) | cu TVA | fără TVA | cu TVA | fără TVA |
| SE_sv (Sweden) | inkl. moms | exkl. moms | inkl. moms | exkl. moms |
| SI_sl (Slovenia) | z DDV-jem | brez DDV-ja | z DDV-jem | brez DDV-ja |
| SK_sk (Slovakia) | vrátane DPH | bez DPH | vrátane DPH | bez DPH |
| TR_tr (Turkey) | KDV dahil | KDV hariç | KDV dahil | KDV hariç |
| UA_uk (Ukraine) | з ПДВ | без урахування ПДВ | з ПДВ | без урахування ПДВ |
| **Asia-Pacific** |
| AU_en (Australia) | incl. GST | incl. GST | incl. GST | incl. GST |
| ID_en (Indonesia) | incl. VAT | excl. VAT | incl. VAT | excl. VAT |
| ID_in (Indonesia) | termasuk PPN | sebelum PPN | termasuk PPN | sebelum PPN |
| IN_en (India) | incl. GST | excl. GST | incl. GST | excl. GST |
| IN_hi (India) | GST सहित | GST अतिरिक्त | GST सहित | GST अतिरिक्त |
| JP_ja (Japan) | 税込 | 税込 | 税込 | 税込 |
| KR_ko (South Korea) | 부가세 포함 | 부가세 별도 | – | 부가세 별도 |
| MY_en (Malaysia) | incl. SST | excl. SST | incl. SST | excl. SST |
| MY_ms (Malaysia) | termasuk SST | SST dikecualikan | termasuk SST | SST dikecualikan |
| NZ_en (New Zealand) | incl. GST | incl. GST | incl. GST | incl. GST |
| SG_en (Singapore) | incl. GST | – | incl. GST | excl. GST |
| TH_en (Thailand) | incl. VAT | incl. VAT | incl. VAT | incl. VAT |
| TH_th (Thailand) | รวม VAT | รวม VAT | รวม VAT | รวม VAT |
| **Middle East & Africa** |
| EG_ar (Egypt) | شاملاً الضريبة | باستثناء ضريبة | شاملاً الضريبة | باستثناء ضريبة |
| EG_en (Egypt) | incl. VAT | excl. VAT | incl. VAT | excl. VAT |
| MU_en (Mauritius) | incl. VAT | incl. VAT | – | – |
| NG_en (Nigeria) | incl. VAT | incl. VAT | – | – |
| SA_ar (Saudi Arabia) | شاملاً الضريبة | – | – | – |
| SA_en (Saudi Arabia) | incl. VAT | – | incl. VAT | – |
| ZA_en (South Africa) | incl. VAT | excl. VAT | incl. VAT | excl. VAT |
| **Latin America** |
| CO_es (Colombia) | – | IVA no incluido | – | – |

For the rest of the countries tax label is not displayed by default.

**Important:** Any card created in M@S Studio automatically has the `mas-ff-defaults` flag enabled, regardless of whether a meta tag is present on the page.

**Usage:**

Add the feature flag in the page metadata:

```html
<meta name="mas-ff-defaults" content="on">
```

Or on the commerce service element:

```html
<mas-commerce-service data-mas-ff-defaults="on"></mas-commerce-service>
```

---

### mas-ff-3in1

**Purpose:** Controls the unified 3-in-1 modal checkout experience that streamlines the purchase flow by combining multiple checkout steps into a single modal interface.

**What it controls:**
- **TWP (Trial With Purchase)**
- **D2P (Direct to Purchase)**
- **CRM (Content Rich Modals)**

**Behavior:**
- When enabled (default): Checkout links with modal types `twp`, `d2p`, or `crm` open in the unified 3-in-1 modal interface
- When disabled: The system uses fallback workflow steps based on product-specific configurations (segmentation, commitment, recommendation, or email steps)
- The checkout URL includes `cli=mini_plans` for TWP/D2P or `cli=creative` for CRM modals

**When to disable:** Use `off` when you need to bypass the 3-in-1 modal and use traditional multi-step checkout flows, or when testing specific workflow step configurations.

**Usage:**

```html
<!-- Disable 3-in-1 modal (enabled by default) -->
<meta name="mas-ff-3in1" content="off">
```

---

### mas-ff-annual-price

**Purpose:** Enables the display of annual pricing information alongside monthly prices, helping customers understand the total yearly cost of subscription products.

**What it controls:**
- **Annual price calculation:** For yearly commitment products billed monthly, calculates and displays the total annual cost (monthly price × 12)
- **Promotional pricing:** When promotions are active, calculates the blended annual price considering:
  - Discounted months during the promotion period
  - Regular price months after promotion ends
  - Example: 3 months at $9.99/mo + 9 months at $22.99/mo = $236.88/year
- **Price template rendering:** Adds annual price display in parentheses after the monthly price, e.g., "$22.99/mo ($275.88/yr)"
- **Mini compare chart styling:** Adds `annual-price-new-line` class to price headings for proper layout

**Usage:**

```html
<meta name="mas-ff-annual-price" content="on">
```

When enabled, individual price elements can opt out using the `annual=false` parameter in the merch link.

---

### mas-ff-copy-cta

**Purpose:** Adds a copy-to-clipboard utility button next to checkout CTA buttons, enabling content authors to easily copy CTA links for documentation or reuse in other contexts.

**What it controls:**
- **Copy button placement:** Adds a small clipboard icon button adjacent to each checkout CTA
- **Copy format:** Copies the CTA as an HTML anchor tag with the full checkout URL and text placeholder, e.g.:
  ```html
  <a href="https://commerce.adobe.com/..." title="Special Link">CTA {{Buy now}}</a>
  ```

**When to use:** Enable this flag during content authoring and review phases. This is primarily a development/authoring tool and is disabled in production.

**Usage:**

```html
<meta name="mas-ff-copy-cta" content="on">
```

---

### mas-ff-mas-deps

**Purpose:** Controls the source location for loading MAS (Merch at Scale) component dependencies, allowing teams to use either the centralized MAS repository or local Milo dependencies.

**What it controls:**
- **Component loading source:** Determines where MAS components (commerce service, merch cards, inline prices, checkout links) are loaded from
- **Loading priority:**
  1. If `masLibs` config is set: Load from the specified external URL
  2. If this flag is enabled: Load from `https://www.adobe.com/mas/libs/`
  3. Fallback: Load from local Milo deps (`../../deps/mas/`)
- **Error handling:** If external load fails, automatically falls back to local Milo dependencies with a console warning

**Components affected:**
- `mas-commerce-service`
- `merch-card`
- `inline-price`
- `checkout-link`

**When to use:** Enable when you want to use the latest MAS components from the centralized Adobe MAS repository instead of the bundled Milo versions.

**Usage:**

```html
<meta name="mas-ff-mas-deps" content="on">
```

---

### mas-geo-detection

**Purpose:** Enables automatic geographic locale detection using Akamai EdgeScape geolocation data, ensuring users see prices and checkout flows appropriate for their actual location rather than the URL-inferred locale.

**What it controls:**
- **Locale resolution:** Uses Akamai's geolocation (stored in `sessionStorage` as `akamai`, or provided in the page URL in the query parameter `akamaiLocale`) to determine the user's country
- **Language-first site handling:** Particularly useful for sites with URL structures like `/ar`, `/africa`, or `/langstore/[lang]` where the URL indicates language but not country
- **Price localization:** Ensures WCS (Web Commerce Service) calls use the correct country code for accurate pricing
- **Checkout flow:** Routes users to the appropriate regional checkout experience

**Behavior by URL pattern:**
- `/ar` (Argentina) + Akamai ES (Spain) → Uses `es_AR` locale with ES country for pricing
- `/africa` + Akamai ES → Uses `en_MU` locale with ES country
- `/langstore/en` + Akamai ES → Uses `en_US` locale with ES country
- Standard country-prefixed URLs (e.g., `/ae_ar`) → Uses URL locale regardless of Akamai

**When to use:** Enable for language-first sites or multi-region sites where users may access content from different geographic locations than the URL suggests.

**Usage:**

```html
<meta name="mas-geo-detection" content="on">
```

## Notes

- Feature flags default to `off` unless otherwise specified (except `mas-ff-3in1` which defaults to `on`)
- Values `on` and `true` are equivalent for enabling a flag
- Values `off` and `false` are equivalent for disabling a flag
- Feature flags can be overridden via URL parameters for testing purposes
- Changes to feature flags take effect on page load

