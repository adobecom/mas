---
topic: howto-test-before-publish
keywords: authoring, platform, testing a card before and after publish
---
<!-- ported from the MASA knowledge corpus -->
# Testing a card before and after publish

## How do I preview a card before publishing it?

Use the card preview in MAS Studio. Preview runs the same IO pipeline in the browser through `fragment-client.js`, against the authoring tier, so unpublished drafts, draft settings and draft dictionaries all apply. The previewed fragment is rendered with the service in preview mode: in that mode a failing card is shown with its error instead of being hidden, which is what you want while authoring. Preview lets you set locale, `pzn` and `mask` explicitly — so set them to test a non-default region.

## How do I test a web-components change on a real page?

Add the `?maslibs=` parameter to a Milo page's URL on a stage, `.aem.page` or `.aem.live` host; Milo ignores it on `www.adobe.com`, so a branch can never be tried on production. Milo validates the value itself: `maslibs=<branch>` loads the bundles from `https://<branch>--mas--adobecom.aem.live/web-components/dist/` (`branch--repo` and `branch--repo--owner` are accepted for a fork), `maslibs=main` loads MAS main, and `maslibs=local` loads from `http://localhost:3000`, where you must serve the built `web-components/dist` yourself. `stage` is not special — it is read as a branch named `stage`. Milo always uses `.aem.live`, and the MAS web components resolve the same parameter to the same `localhost:3000` for their own preview pipeline (`fragment-client.js`), so one local server serves both. Without `maslibs`, every Milo host other than `www.adobe.com` already runs MAS main. After loading, verify in the Network tab that the MAS scripts actually came from the branch you expected, not a cached prod response.

## How do I test against stage?

Stage IO lives at `https://www.stage.adobe.com/mas/io` and answers on the corp network; stage content is the stage tier of Odin. Stage WCS always uses landscape `ALL`, so offers that are missing from the production landscape will still resolve on stage. Use stage to validate pipeline changes and staged content before prod.

## How do I verify what is actually live?

Probe the published delivery API directly with the exact `id`, `locale` and `country` the consumer page sends, and read the response fields (including settings and resolved placeholders) instead of the rendered card. If the published response is right but the page is wrong, the problem is in the client or the page; if the published response is wrong, the problem is content, settings or the pipeline. Remember the CDN caches IO responses for up to five minutes, so a freshly published change can take a few minutes to appear.
