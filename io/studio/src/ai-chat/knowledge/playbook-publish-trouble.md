---
topic: playbook-publish-trouble
keywords: platform, authoring, publish and content-delivery trouble
---
<!-- ported from the MASA knowledge corpus -->
# Publish and content-delivery trouble

## About Publish and content-delivery trouble

Three failures all present as "my content isn't showing up": the Odin publish workflow not completing, Studio not reflecting a fragment Odin has already published, and a consumer page serving stale or wrong content. They sit at separate layers and each has its own check. For how publishing a card from Studio normally works, see the how-to on publishing a card; this playbook is for when that action does not have the effect it should.

## Symptom: the publish workflow does not complete

An author publishes and nothing goes live, with no obvious error.

1. Filter the Network tab for the `publish` POST request. A successful (200) response only means Odin scheduled the job — it does not mean the job finished or that the content is actually live.
2. Copy the workflow instance path from the response, for example `/var/workflow/instances/server765/2026-07-29/scheduled_activation_with_references_5`, and check its status at `https://author-p22655-e59433.adobeaemcloud.com<that path>.json`. Wait for `"state": "COMPLETED"`. The workflow archive console (`/libs/cq/workflow/admin/console/content/archive.html` on the author host) also lists finished jobs; a line reading "Skipped invalid content fragments: `<path>`" names the fragment that blocked the job.
3. If the workflow completed but the content is still not published, the fragment itself is likely invalid. **Before opening it in the Odin editor to check, keep the cursor away from every field.** The editor autosaves on focus, and that save writes the broken markup back, which can corrupt production content. Clone the fragment to a sandbox path and inspect the clone first, especially if this is a production card. In the editor, an invalid fragment shows a warning icon and any offending fields are outlined in red.

## Symptom: Studio does not reflect a fragment that is already published on Odin

The fragment looks published when checked directly against Odin, but Studio still shows it as unpublished or stale.

1. Confirm the publish POST to Odin author returned 200.
2. If it returned 200, get the fragment id from the request/response and read the fragment directly: `https://author-p22655-e59433.adobeaemcloud.com/adobe/sites/cf/fragments/<fragmentId>`. Copy its content path from that response, then read `https://author-p22655-e59433.adobeaemcloud.com<path>/jcr:content.json`.
3. If `cq:lastReplicated` is present, Odin considers the fragment published and the gap is on the Studio side. That case has no confirmed root cause yet, so treat it as a fresh investigation.

## Symptom: a consumer page shows missing or wrong content

A report comes in that a card is not rendering, or that a collection shows the wrong card. Before assuming the fragment or the settings content is actually wrong, rule out Akamai's cache of the `/mas/io` response: add `?mas-io-url=https://14257-merchatscale.adobeioruntime.net/api/v1/web/MerchAtScale` to the page URL. This routes the page around Akamai and straight to IO production. If the content is correct with that parameter but wrong without it, the problem is cache staleness, which clears on its own within the CDN's normal cache window; if it is still wrong with the parameter, the problem is upstream of the cache — the fragment, the settings, or the pipeline itself.
