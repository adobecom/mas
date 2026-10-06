---
topic: playbook-settings-trial-ctas
keywords: platform, settings and trial ctas
---
<!-- ported from the MASA knowledge corpus -->
# Settings and trial CTAs

## Symptom: trial CTAs do not hide for a country

Reports look like "trial CTAs don't hide on catalog.html?country=kr" or "the free trial button still shows in Korea". Whether a card hides its trial CTAs comes from the `hideTrialCTAs` setting that MAS IO resolves per card, region locale, and country. `displayPlanType`, `secureLabel`, `displayAnnual`, `quantitySelect`, and `addon` resolve the same way.

## How IO resolves hideTrialCTAs

1. IO computes the region locale from `locale` and `country`: `locale=en_US&country=KR` becomes region locale `en_KR` because KR is a region of `en_US` on the surface.
2. IO reads `/content/dam/mas/<surface>/settings/index` and groups the entries of each setting into one default entry and its override entries.
3. An override applies when its `geos` match the region locale and country (or its `locales` list contains the region locale) and its `tags` and `templates` match the card. The best geo match wins; tag matches break ties.
4. With no matching override the default entry applies. A value set on the card fragment itself (a `hideTrialCTAs` field on the card) takes precedence over the value of the settings entry.
5. IO returns the result in `settings.hideTrialCTAs`; web components hide the trial CTAs when it is `true`.

## When hideTrialCTAs is true but trial CTAs still show

Web components (`processCTAs` in `hydrate.js`) drop every CTA whose `data-analytics-id` is a trial id (`free-trial`, `start-free-trial`, `seven-day-trial`, and similar; the full allowlist is `TRIAL_ANALYTICS_IDS` in `constants.js`) only when at least one other CTA remains. If every CTA on the card or on its locale variation is a trial CTA, for example because the variation was authored without its buy CTA, all CTAs stay visible even though the setting is `true`. When the setting is `true` and a non-trial CTA remains, web components also hide each remaining checkout CTA (a checkout link or button; other CTAs are left alone) until its checkout resolves, then remove it if its resolved offer has `offerType` `TRIAL` and another CTA is still visible, and show it again otherwise.

A CTA can also look like a trial offer (its visible text says "Free trial") but not be recognized as one at the first filtering pass: the `TRIAL_ANALYTICS_IDS` match is on `data-analytics-id`, not on the button's text. A CTA authored with no `data-analytics-id` (or one outside the allowlist) survives that pass and falls through to the async offer-type fallback described above, which has a timing gap: if the other CTA's checkout has not settled yet when the check runs, `othersVisible` reads `false` and the trial CTA is shown instead of removed, even though its `offerType` did resolve to `TRIAL`. So a trial CTA that is still visible does not mean its offer type went unrecognized.

## Investigation steps

1. Read `settings.hideTrialCTAs` and the CTA analytics ids.
2.
3. If the KR value is `true` and every CTA is a trial CTA, the card or its KR variation is missing a buy CTA. Layer: `odin`.
4. If the KR value is `true` and a non-trial CTA exists but a trial CTA is still visible, read that CTA's `data-analytics-id` before assuming a locale or country mismatch. A missing or non-allowlisted id routes the CTA into the async offer-type fallback, which can leave it visible even when its offer resolves as `TRIAL`; authoring an allowlisted id is the fix either way. Layer: `odin`.
5. If that CTA's analytics id is set and allowlisted and it is still visible, compare the locale, country, and fragment id the page requests with what you probed. Layer: `milo` or `client`.
6. It lists the matched entry, every candidate override with its geo score, and whether the reconstruction agrees with live IO.
7. If no override targets `KR` or `en_KR`, the settings content lacks the override. Layer: `odin`. If an override matches but IO does not apply it, layer: `io`.

## Reference case: KR trial CTAs on the catalog page, 2026-09-14

The settings were correct. The catalog page with `?country=kr` still showed trial CTAs because the card's KR variation was authored without its buy CTA; with only trial CTAs left, web components keep them visible. Layer: `odin`. An earlier guess that the `ims_country_code` cookie overrode `?country=kr` was wrong.

## Reference case: KR Free Trial button on acrobat pages, 2026-09-21

Reported for `stage.adobe.com/acrobat.html`, `acrobat/plans.html`, and `acrobat/pdf-and-document-essentials.html` with `?akamaiLocale=kr`. Live inspection of card `0a1fb174-fc95-4712-9f7d-0aea79d30113` showed `country` resolving to `KR` and `settings.hideTrialCTAs` already `true`, with both a "Free trial" and a "Buy now" CTA visible, so this was neither a country mismatch nor a card left with only trial CTAs. The "Free trial" link had no `data-analytics-id` while "Buy now" had `data-analytics-id="buy-now"`, so the "Free trial" CTA fell through to the async offer-type fallback instead of being excluded outright. Its resolved checkout confirmed `offerType: 'TRIAL'`, yet the CTA still rendered visible, because "Buy now" was still `hidden` at the instant the "Free trial" check ran, so `othersVisible` read `false`. Layer: `odin`. The fix is authoring `data-analytics-id="free-trial"` (or another `TRIAL_ANALYTICS_IDS` value) on that CTA, so it is excluded at the first pass and never depends on the fallback's timing. An earlier guess that MAS reads `akamaiLocale` or a `?country=` parameter, so that adding `?country=KR` would fix it, was wrong: MAS reads only the `country` attribute Milo sets on `mas-commerce-service`.
