---
topic: troubleshooting
keywords: error, fragment not found, publish failed, price not showing, 404, 401, 403, help, slack
---
# Troubleshooting MAS Studio

## Why is my card not showing on the page (fragment not found)?
A "fragment not found" or 404 error means the delivery API cannot find the fragment at the requested path. Check three things. First, the card must be Published, not Draft or Modified — unpublished fragments are not delivered. Second, the fragment path must be exact and is case-sensitive; it starts with /content/dam/mas/. Third, test delivery directly by opening https://www.adobe.com/mas/io/fragment with the path parameter set to your fragment path — a working fragment returns JSON. If the card was just published, edge caching can briefly serve stale results; hard refresh and retry after a minute or two. You can also ask the AI assistant to search for the card to confirm it exists and check its status.

## Why is the price not showing on my card?
Prices are fetched at render time from the Web Commerce Service (WCS) using the card's Offer Selector ID (OSI). Verify the OSI field has a value and that the card was saved after inserting it — the OSI only persists after a save. Then verify the offer is valid for the page's locale and country and that today falls within its availability dates; a WCS response of 200 with an empty body usually means the offer is not available for that locale. In the browser network tab, look for requests containing web_commerce_artifact and inspect the response. The AI assistant can resolve the OSI to its offer details so you can confirm the offer exists, and it can validate that the card and its linked offer are consistent.

## Why can't I publish my card?
The most common causes are missing permissions, validation errors, or a temporary backend issue. Publishing requires a publisher role through your IAM group membership — being able to edit does not imply being able to publish. Validation errors also block publishing: check for red error indicators and fill all required fields for the card's variant. If permissions and validation are fine, it may be a temporary issue in the AEM backend; retry later, and if it persists ask in the #merch-at-scale Slack channel. For publishing many cards, the AI assistant can show a preview of exactly which cards a bulk publish would affect before running it.

## Why don't I see Promotions or Global settings in the side navigation?
Those pages are group-gated, not broken. Promotions is only rendered for members of the MAS admins group. Global settings requires admin membership or the surface's power-users group, and on the sandbox, commerce, and nala surfaces it is admin-only; Masks is gated the same way. Collections appears in the navigation but is currently disabled for everyone. If you need one of these pages, request the matching group through IAM, then sign out of Studio and back in so the new membership is picked up.

## What do 401 and 403 errors mean?
A 401 means your IMS session token is expired or invalid: sign out of Studio and sign back in; clearing the browser's session storage for the site also helps. A 403 means you are authenticated but lack permission for the action: check your IAM group membership. If you can log in but see no content at all, you are likely missing the surface-specific author group for the surface you are browsing. Request the needed groups through Adobe's IAM system, allow time for provisioning, then log out and back in.

## Why does OST show no results for my search?
Several causes are common. The offer may not be valid for the locale you are authoring in — offers are onboarded per country. Its availability dates may exclude today. It may still be a draft offer, which only appears when searching the DRAFT landscape (add the commerce.landscape=DRAFT parameter). Or it may not exist yet. The AI assistant can search the offer catalog with filters and list matching products, which quickly confirms whether the offer exists at all before you dig further.

## The AI assistant gave an error or a wrong result — what should I do?
Retry the request once — transient backend errors happen. If the conversation seems stuck in the middle of a flow, ask to start over; this clears the chat and any in-progress flow state. Note that the assistant always asks for confirmation before publishing, updating, or creating anything, so an error never means something was changed without your approval. If a problem persists, report it in the #merch-at-scale Slack channel with what you asked and roughly when.

## Where do I get help?
The #merch-at-scale Slack channel is the main channel for all MAS questions: authoring help, Studio bugs, publishing problems, and access requests. The team has a no-direct-message policy, so post in the channel rather than messaging individuals — answers in channel help everyone. For pricing and offer catalog data issues use #catalog-support, and for adobe.com page integration questions use #milo-dev. Bugs are tracked in the Jira MWPW project; a good report includes steps to reproduce, the fragment path, the OSI if pricing-related, the environment, and screenshots.
