---
name: splunk-referer-analysis
description: Analyze one or more Splunk LANA CSV exports (one per referer URL) and decide whether the errors are an authoring issue or a code issue, with reproducible, owner-assigned calls to action.
---

Analyze the Splunk LANA export attached / referenced in the request and classify the
errors on that referer page as an **authoring** issue (content fragment misconfigured)
or a **code** issue (io pipeline / merch-card / mas.js bug), then give direct,
actionable calls to action.

Input: `$ARGUMENTS` — one or more paths to CSV exports (or attached to the message).
With several exports, run the whole workflow per export (each is usually one referer),
then merge the findings into a single report (see "Several exports").

## No reproduction, no call to action

**Every issue you put in a call to action must come with a URL that reproduces it, and
you must have opened that URL yourself and seen the failure** (headless Chrome via the
repo's Playwright, or the chrome-devtools MCP). Splunk tells you _that_ something broke;
only a reproduction tells you _what_ to fix and lets the owner confirm the fix.

- Reproduce with the top sample referer from the export, plus the market parameters
  `akamaiLocale=<geo>&country=<CC>` taken from the events' `facts` (country, locale).
  Keep the campaign query keys (`sdid`, `mv`, `mv2`, …) if the failures cluster on them.
- Count it as reproduced only when you observe the logged symptom on the page: the
  failing element (`.placeholder-failed`, empty price, missing label, broken card) or the
  same console/LANA message.
- If you **cannot** reproduce it after honest attempts (vary geo, cookies such as
  `ims_country_code`, device/user agent), **leave it out of the Slack message**. Say so
  explicitly in the engineering report under "Not reproduced": what the logs show, what
  you tried, and what is still needed to reproduce it (e.g. a HAR from an affected
  session). Never fill the gap with a guessed cause or an untested "How to check" URL.
- A wrong guess is worse than no call to action: it sends someone to fix the wrong thing.
  Only assert a cause (MEP, Target, promotion, author) after you've checked it against
  live data.

## What the data is

Each row is a client-side LANA event. The payload lives in `_raw` → JSON →
`log_message`, a `¦`-separated list of `key=value` pairs (`¶` precedes `page=` and
`facts=`). `facts` is a JSON array of per-fragment telemetry: `aem-fragment:status`,
`aem-fragment:serverTiming` (cdn-cache HIT/MISS/REVALIDATE), `aem-fragment:stale`,
`aem-fragment:retryCount`, `aem-fragment:etag`. The `message` field holds the
merch-card error text.

## Sampling — the counts are ~1% of reality

**Critical: every count in the parser output is a ~1% sample, not a headcount.** MAS
logs errors to LANA with `sampleRate: 1` (`web-components/src/lana.js`), and Milo's
lana treats `sampleRate` as a _percent_ — `sampleRate <= Math.random() * 100`
(`libs/utils/lana.js`), so roughly 1 in 100 client error events is actually forwarded
to Splunk. Info events (`errorType: 'i'`) use `implicitSampleRate: 1` — also ~1%.

Consequences for every number you report:

- **Scale up ~100×** for the real user-facing volume: a raw count of `k` ≈ `100·k`
  actual events. Always say "estimated" and give a round figure, never a false-precise
  one (`~64,000`, not `63,700`).
- **State the imprecision.** Relative uncertainty ≈ `1/√k`. So `k=600` is ±~4% (solid),
  `k=100` is ±~10%, `k=25` is ±~20%, and anything **below ~10 is not quantifiable** —
  report it as "seen, a handful of times" and never scale it to a headline number.
- The **verdict and classification never depend on scaling** — proportions between
  messages are unaffected by uniform sampling. Scaling only changes how you describe
  _magnitude/impact_. Do not let a scaled-up number inflate the severity of a
  low-count signal.
- Whenever you print a raw parser count, either scale it or flag it as a raw 1% sample.
  Never present a raw count as the number of affected users.

## Workflow

1. **Parse.** Run the bundled parser (do not re-implement it):

    ```sh
    python3 .github/skills/splunk-referer-analysis/parse_lana.py <csv>
    ```

    It emits JSON: event count, time range, referer(s), locales, an id-normalized
    message histogram, `card_ids`, `culprit_fragment_ids` (ids named inside the error
    text — the fragments to fix), and `fetched_fragments` (per-fragment fetch health).

2. **Classify** each dominant message with the decision table below.

3. **Verify** the top culprit fragment(s) against production before asserting a cause —
   fetch the live payload and inspect the field the code actually reads:

    ```sh
    curl -s "https://www.adobe.com/mas/io/fragment?id=<id>&api_key=wcms-commerce-ims-ro-user-milo&locale=<locale>" | python3 -m json.tool
    ```

    Compare the `etag` to the one in the report; check `fields.variant`, fetch status,
    `path`, `model`, and **`tags`**. A 200 + cdn HIT + stable etag means delivery is
    healthy and the fault is in the content or the client.

4. **Check whether the culprit is a variation** (see "Variations must never be served
   directly" below). This changes both the root cause and who owns the fix.

5. **Trace the referer's EDS/MEP source** when the error is a `merch-card` hydration
   failure but the live fragment looks field-only/headless (see "Headless / field-only
   fragment rendered as a card" below). This is what separates an authoring fault from a
   Milo autoblock/rollout fault — do it before you blame the author.

6. **Find the culprit card even when the parser finds none.** `culprit_fragment_ids` is
   empty for price/checkout errors (`Commerce offer not found`, `Failed to format
literal`): the id is not in the message. Read the OSI / promo code / country from the
   events' `facts`, open the referer, and find the `merch-card` / `mas-field` whose
   `data-wcs-osi` matches. Its fragment id (and `data-promotion-project` if any) is the
   culprit (see "Offer not found: trace the OSI back to a card or promotion").

7. **Reproduce** each issue you intend to report (see "No reproduction, no call to
   action"). Record the exact URL that shows the failure.

8. **Build a Studio link** for each culprit fragment so the author/engineer can open it
   in one click (see "Studio deep link" below).

9. **Name an owner for every action**: the author of the card, the owner of the
   promotion project, the MEP manifest owner, or the M@S engineering team. "Someone
   should…" is not a call to action.

10. **Report** in the output format below. Lead with the verdict. Present all volumes
    as sampling-scaled estimates per the "Sampling" section — never bare 1% counts.
    Whenever a human must fix content, the call to action is a Slack-ready message
    with human actions, cards to fix and sample pages (see "Whenever a human must act").

## Studio deep link

For every culprit fragment id, emit a link that opens it directly in the M@S Studio
fragment editor:

```
https://mas.adobe.com/studio.html#page=fragment-editor&fragmentId=<culprit-id>
```

(`page=fragment-editor` and `fragmentId` are the router's hash keys — `studio/src/mas-fragment-editor.js` `getFragmentEditorUrl`, `studio/src/router.js`. Everything lives after the `#`.) One link per `culprit_fragment_ids` entry; label it so a non-engineer knows it opens the card. This link is the one piece of "technical" output that **is** allowed in an AUTHORING report — it's the author's fix entry point, not jargon.

## Variations must never be served directly

**Core rule: a variation — promotion or grouped — must never be accessed directly.**
A variation is a partial overlay meant to be merged onto its base card; only the base
carries the card layout (`fields.variant`). So a variation served standalone has no
variant and hydration throws `no template found in payload`. **The missing variant is
the symptom; the root cause is that a variation is being rendered on its own** —
typically because MEP / personalization (or a hand-built link) points at the variation
id instead of the base card id.

Signals that the culprit fragment is a variation (from the live fetch, step 3):

- `path` sits under a `/promotions/<campaign>/` folder → **promotion variation**.
- `tags` include `mas:promotion/*` (promo) and/or `mas:pzn/*` (personalization target).
- Grouped variations follow the same rule — same fix, different origin.
- Corroborating (from the parser): `referer_query_keys` show campaign/paid-media
  markers (`sdid`, `mv2`, `gclid`, `mep`, …), consistent with a promo/MEP landing.

When these signals are present with a missing variant, classify the root cause as
**"a variation is being served directly"**, not "author forgot the layout". The fix is
to stop pointing at the variation (point MEP / the link at the base card so the overlay
merges correctly), and the recurring-risk note applies: any promo/grouped variation
reachable by a direct id is one MEP mistarget away from this same failure.

## Headless / field-only fragment rendered as a card

**A `no template found` error does NOT always mean the author did something wrong.** A
fragment authored to be consumed field-by-field through `<mas-field field="...">` (e.g.
a "Headless"/"Promobar" fragment supplying a `callout`, a price, or a `customFields`
string) legitimately has **no variant** — `mas-field` never touches the variant
(`web-components/src/mas-field.js` reads `event.detail.fields` and renders one field; no
`hydrate()`, no template lookup). Only `merch-card` throws `no template found in
payload`. So if a field-only fragment is producing a **`merch-card[...]`** hydration
error, something rendered it as a card that shouldn't have — that is usually **CODE**,
not authoring.

Before you write an AUTHORING verdict for `no template found`, trace how the referer
actually references the id:

1. **Fetch the referer's rendered HTML and its `.plain.html`.** An id absent from
   `.plain.html` but present in the rendered page is **injected by MEP/personalization**
   — look for a `*.json` manifest reference (`action: replace`, `selector`/`all`), and
   read that manifest to find the replacement EDS fragment.
2. **Open the replacement EDS fragment source** (`<host>/<path>.plain.html` on
   `main--<repo>--adobecom.aem.live` or `www.adobe.com`) and grep for the culprit id.
3. **Inspect how the id is referenced.** A Studio link that carries **`&field=<name>`**
   (e.g. `field=callout`, `field=customFields[...]`) is an intended **`mas-field`** — no
   variant needed, and correct authoring. A link with **no `field=`** is a full
   **`merch-card`** and does need a variant.

Milo routes these: `decorateAutoBlock` reroutes a `mas.adobe.com/studio.html` link with
`field=` in the hash to the lightweight `mas-field` path instead of
`merch-card-autoblock` (`libs/utils/utils.js`, the `if (key === 'merch-card-autoblock'
&& url.hash.includes('field='))` branch; landed in **MWPW-202286 / milo PR #6463,
2026-08-30**). If **every** authored reference to the culprit carries `field=` yet the
page still logged a `merch-card` hydration failure, the page was served a **Milo build
predating that reroute** (adobe.com's milo pin lags `main`). Verdict: **CODE / Milo
rollout** — self-heals as the pin advances; confirm `adobe.com/libs/utils/utils.js`
already contains the reroute. No content fix, and **do not** send the author a
"pick a layout" call to action.

## EDS / MEP related resources (for an authoring or MEP verdict)

When the fix lives in Edge Delivery content or a personalization manifest, hand the
owner concrete links, not just prose:

- **The referer page source:** `<referer>.plain.html` — the authored blocks.
- **The MEP manifest** driving the swap: the `*.json` referenced in the rendered page
  (`experiences[].selector` → `experiences[].all`). Cite the exact replacement fragment
  path that injects the culprit.
- **The EDS fragment** that carries the merch link: `<host>/<path>` (rendered) and
  `<host>/<path>.plain.html` (source). Prefer `main--<repo>--adobecom.aem.live`.
- **The card in Studio:** the `#page=fragment-editor&fragmentId=<id>` deep link (above).
- **MEP authoring guide:** https://milo.adobe.com/docs/authoring/features/personalization
  (manifest actions: `replace`, `updateMetadata`, selectors, page filters).
- If the swap targets the wrong fragment or a variation id, the fix is in the **manifest
  row** (change `all`/`selector`), not the card — say which row.

## Offer not found: trace the OSI back to a card or promotion

`inline-price` / `checkout-link: Failed to render: Commerce offer not found` means WCS
returned no offer for the OSI in the pricing country. The event `facts` carry
`offerSelectorIds`, `promotionCode`, `country`, `locale`, `language`.

1. **Check the OSI per country** against WCS (same api key as the page):

    ```sh
    curl -s "https://www.adobe.com/web_commerce_artifact?offer_selector_ids=<osi>&country=<CC>&locale=en_<CC>&language=MULT&landscape=PUBLISHED&api_key=<wcs-api-key>[&promotion_code=<code>]"
    ```

    `resolvedOffers: []` in the logged country but offers elsewhere = the OSI is
    market-restricted and is being priced in the wrong market.

2. **Find who put the OSI on the page.** It is often **not** in the authored page
   (`<referer>.plain.html`) nor in MEP manifests. io/www promotions substitute OSIs per
   geo (`io/www/src/fragment/transformers/promotions.js`, `wcs.js`): the rendered element
   carries `data-replaced-osi="<base osi>"` and its host carries
   `data-promotion-project="<project>"` / `data-promotion-code`. Open the page in the
   affected market and read those attributes; the fragment id on the host `mas-field` /
   `merch-card` is the card, the project is the promotion.

3. **Confirm delivery per country** — fetch the fragment with each relevant `country=`
   and grep for the OSI. If io/www only substitutes for the right markets, delivery is
   correct and the fault is a fragment-country vs pricing-country mismatch on the client
   (the fragment request may use the `ims_country_code` cookie — `aem-fragment.js` —
   while prices use the page country). That is a CODE finding, and it needs a
   reproduction before it reaches anyone's backlog.

## Literal formatting errors

`Failed to format literal:` (`web-components/src/price/template.js` `formatLiteral`)
logs only the literal text (in `facts[1]`); the label is replaced by `''`, so prices lose
"/mo", tax labels, strikethrough/discount labels. If **every** literal of a locale fails
(even `{discount}%`), the literals are fine and the problem is the locale passed to the
formatter (e.g. an invalid BCP-47 tag) — CODE. If only one literal fails, its ICU syntax
is broken — authoring of the price literals. Check the literal with
`formatMessage(literal, '<lang>-<CC>', params)` in Node before deciding.

## Decision table

Ground truth for the merch-card messages is `web-components/src/hydrate.js`.

| Message / signal                                                                                                                           | Meaning                                                                                                          | Verdict                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no template found in payload <id>` + culprit is a **variation** (promo/grouped — see signals above)                                       | a variation is being rendered standalone; it has no variant because the base does                                | **AUTHORING** — a variation is being served directly (MEP/link points at the variation, not the base card)                                                                                |
| `no template found in payload <id>` + culprit is a **base card**                                                                           | `fields.variant` is empty on the base fragment (`if (!variant) throw`)                                           | **AUTHORING** — base card published with no card layout selected                                                                                                                          |
| `merch-card[<id>]: … no template found` + the id is authored **only via `mas-field`** (`field=` links) / is a headless/field-only fragment | a field-only fragment was rendered as a full card by an old autoblock; it has no variant because it's not a card | **CODE / Milo rollout** — `field=` reroute (milo PR #6463 / MWPW-202286) not yet on the served build; self-heals. NOT authoring — see "Headless / field-only fragment rendered as a card" |
| `variant mapping not found for <id>`                                                                                                       | `fields.variant` is set but has no registered layout                                                             | **MIXED** — typo variant = authoring; brand-new variant = code (missing mapping)                                                                                                          |
| `Fragment is undefined` / `is missing 'fields'`                                                                                            | fetch returned empty/blank payload                                                                               | **CODE / pipeline** (or deleted id) — check fetch status                                                                                                                                  |
| `AEM fragment cannot be loaded`                                                                                                            | fetch failed                                                                                                     | inspect `fetched_fragments.status` (below)                                                                                                                                                |
| `MERCH-CARD/MAS-FIELD did not initialize … timeout`                                                                                        | element never upgraded / hydration never ran                                                                     | **CODE / client** (script load, timing) — usually secondary to a primary error                                                                                                            |
| fetch `status` 404                                                                                                                         | fragment unpublished / deleted / wrong id                                                                        | **AUTHORING** — broken reference; publish or fix the ref                                                                                                                                  |
| fetch `status` 401/403                                                                                                                     | auth / api_key                                                                                                   | **CODE / config**                                                                                                                                                                         |
| fetch `status` 5xx / 504 / timeout                                                                                                         | io pipeline failure                                                                                              | **CODE / pipeline** — investigate the fragment delivery pipeline                                                                                                                          |
| high `retryCount` / `stale=true` / many `REVALIDATE`                                                                                       | cache thrash / origin unhealthy                                                                                  | **CODE / pipeline**                                                                                                                                                                       |
| `status` 200 + cdn HIT + a client error message                                                                                            | delivery healthy                                                                                                 | **AUTHORING or client CODE** per the message                                                                                                                                              |
| `Commerce offer not found` (`inline-price` / `checkout-link`)                                                                              | WCS has no offer for the OSI in the pricing country                                                              | OSI authored for wrong market = **AUTHORING**; promotion targets wrong geos = **promotion owner**; fragment/pricing country mismatch = **CODE** — see "Offer not found"                   |
| `Failed to format literal:`                                                                                                                | ICU formatting of a price label threw; label rendered empty                                                      | all literals of a locale fail = **CODE** (locale); one literal fails = **AUTHORING** (literal syntax) — see "Literal formatting errors"                                                   |
| mostly bot user agents (`bot`, `spider`, `crawl`)                                                                                          | crawler environment, not shoppers                                                                                | **No action** — mention as noise only                                                                                                                                                     |

## Output format

**Do the classification and verification with the full technical picture, but tailor
the report to the audience of the verdict.**

### Whenever a human must act (AUTHORING verdict, or the content part of a MIXED one)

**Always** deliver the human call to action as a **Slack-ready message** in one fenced
code block the user can paste as-is. It has three parts: what a person must do, the
cards to fix, and sample pages where the breakage shows.

The reader is a content author, not an engineer. Strip all technical detail — no code
paths, field names, etags, cache/status codes, fragment ids in prose, or internal file
names. Name cards by their Studio **title** (fetch it from the live payload, step 3).

**Slack formatting rules** (the message is pasted into the Slack composer, which does not
parse link markup):

- `*bold*` (single asterisks), `•` bullets, `:emoji:` codes.
- **Plain, full URLs only** — Slack auto-links them. Never `<url|label>` (it pastes
  literally, leaving a stray `|label>` suffix) and never `[label](url)`.
- **One URL per line.** Never chain URLs on one line with `·` or commas; put each on its
  own indented line under its card.
- No `##` headings, no tables, no `**double**` bold.

**Sample pages:** for every card, list the referer pages where its failure was seen,
taken from the export (not guessed). Cross-tab culprit id × referer (strip query
strings); show up to ~5 pages per card, most frequent first, one per line. If several
cards share the same pages, list the pages once in a shared "Pages affected" block
instead of repeating them.

**How to check the fix:** never write "load it from <country>". Give ready-to-click test
URLs that simulate the affected market with the `akamaiLocale` (geo, lowercase) and
`country` (uppercase) query parameters, one per affected market seen in the export
(e.g. `country=IN` → `?akamaiLocale=in&country=IN`, `country=AU` →
`?akamaiLocale=au&country=AU`). Use the top sample page. **Every one of these URLs must
be one you opened and saw fail** (see "No reproduction, no call to action"); drop any you
could not reproduce.

```
:rotating_light: *<Short plain headline — what's broken, for whom>*

<1–2 plain sentences: what shoppers see and why, e.g. "these cards have no UK
English version, so those visitors see an empty space instead of the card.">
Scale: *an estimated ~<100·N rounded> <blank views/broken cards> in <window>* (<date>; rough figure from a 1% sample).

*What to do (per card):* <imperative steps joined with →, e.g. open it in Studio → choose the card layout → *publish*>. <Also check the other cards in the same set, if relevant.>

*Cards to fix:*
• *<Card title>* (~<est.> <blank views>)
   Studio: https://mas.adobe.com/studio.html#page=fragment-editor&fragmentId=<id>
   Seen on:
   https://www.adobe.com/<path-1>
   https://www.adobe.com/<path-2>
• <one bullet per culprit card, highest volume first; omit "Seen on" when using the shared block below>

*Pages affected:* <only when shared across cards>
https://www.adobe.com/<path-1>
https://www.adobe.com/<path-2>

*Also worth a look (seen only a handful of times):* <low-count (raw <~10) cases, same layout; no scaled number>

*How to check:* once published, open the page as a <market> visitor:
https://www.adobe.com/<top-sample-path>?akamaiLocale=<geo>&country=<CC>
<one line per affected market>

Thanks! :pray:
```

Always include the Studio link for each card: it takes the author straight to the card
that needs fixing. No MWPW code ticket for a pure authoring verdict.

### When the verdict is CODE or MIXED

The reader is an engineer. Include the evidence:

```
## Splunk referer analysis — <referer base URL>
**Window:** <start> → <end> · **Events:** ~<100·N estimated> (raw sample <N>, ~1% sampling ⇒ ±~<1/√N>) · **Severity:** <...> · **Locale(s):** <...>
**Verdict:** CODE | MIXED — <one-line root cause>

### Evidence
- Dominant message: "<msg>" — raw <count>/<N>, est. ~<100·count> occurrences
- Culprit fragment: <id> → https://mas.adobe.com/studio.html#page=fragment-editor&fragmentId=<id>
- Fetch health: <status / cdn / stale / retryCount / etag>
- Suspect area: <io/www, hydrate.js, mas-commerce-service, …>
- Note magnitude is a 1% sampling estimate; low-count secondary messages (raw <~10) are directional only.

### Calls to action
1. <owner> — <concrete engineering step>
2. Propose a MWPW ticket (offer to run the `mwpw-ticket` skill).

### Not reproduced
- <issue> — what the logs show · what you tried (URLs, geo, cookies, UA) · what is
  needed to reproduce. Not included in any Slack message.
```

For a **MIXED** verdict, follow the engineering report with the Slack-ready author
message above, covering only the content part of the fix.

### Several exports

Produce **one** engineering report with a section per referer, and **one** Slack message
that only contains reproduced issues, grouped by owner:

```
:rotating_light: *<N> merch issues on adobe.com — <window>*

*1. <Owner> — <plain headline>* (~<est.> <unit>)
<1 plain sentence: what shoppers see.>
*What to do:* <imperative steps joined with →>
   Studio: https://mas.adobe.com/studio.html#page=fragment-editor&fragmentId=<id>
   Reproduce:
   https://www.adobe.com/<path>?akamaiLocale=<geo>&country=<CC>

*2. …*

*Not included (could not reproduce yet):* <page> — <one plain line>, being investigated.

Thanks! :pray:
```

If nothing reproduces, say so instead of sending a message: no Slack message is better
than one that sends people after a guess.

### Before you answer — self-check

- Every action has an **owner**, imperative **steps**, a **Studio link** (if a card or
  promotion is involved) and a **reproduce URL you opened and saw fail**.
- Every asserted cause was verified against live data (fragment, WCS, page attributes).
- Unreproduced issues are listed under "Not reproduced", not in Slack.
- Author-facing text has no jargon (MEP, Target, OSI, locale, geo-IP, file names).
