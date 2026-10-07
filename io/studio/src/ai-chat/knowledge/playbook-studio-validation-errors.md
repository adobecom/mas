---
topic: playbook-studio-validation-errors
keywords: platform, authoring, pricing, studio validation and price errors on a card
---
<!-- ported from the MASA knowledge corpus -->
# Studio validation and price errors on a card

## Symptom

Reports look like "I'm seeing a reference validation error on this card", "the card has a red alert icon in Studio", "there is a validation error on the CTA", or "the price shows an error icon". Studio shows two different alert icons on a card, and they come from different layers, so first find out which one the author sees.

## The two alert icons

1. **Validation error.** An alert icon next to the card's status (Draft, Published, Modified) in the content table, and a banner at the top of the card editor that reads "This fragment has validation errors." followed by one line per error in the form `property: message`. Hovering the table icon lists the same messages. These come from AEM author: the fragment carries a `validationStatus` list of `{ property, message }` entries, and Studio shows them verbatim.
2. **Price error.** An alert icon in place of the actions menu at the end of the card's table row. Studio shows it when it cannot resolve the card's `osi` field to an offer: the offer lookup returns nothing or throws. It has nothing to do with AEM validation; it is offer resolution (the OSI against WCS), and the price trouble playbook applies.

## How to read a validation message

The `property` names the part of the fragment AEM rejects. `fields.<name>` is a card field, so `fields.ctas` is the CTA field, `fields.prices` the price field, and `fields.variations` the list of variation references. An index such as `values[0]` points at the first entry of a multi-value field, and `<list element>` means the entry itself. Messages seen in Studio include `fields.ctas.values[0].<list element>: is not valid HTML` (AEM refuses the CTA markup) and `path: is required`.

Triage by what the property names:
- **A rich-text field (`fields.ctas`, `fields.prices`, `fields.description` and similar):** AEM rejects the stored markup of that field. The markup edited last is the first suspect, for example a CTA whose checkout link was edited by hand to add `data-extra-options` (such as an `svar` value). Ask the author to reopen that CTA or price in the editor, save it again through the link or price dialog, and check whether the banner clears.
- **`fields.osi`, or the price icon rather than the banner:** follow the price trouble playbook from the card's OSI.

## What this assistant can and cannot see

`validationStatus` exists only on the author (draft) side of AEM. So never guess the validation message: ask the author to copy the exact `property: message` lines from the banner in the card editor. If it is missing, the change was saved but never published, or the publish failed.

## Validation errors and publishing

Clear validation errors before publishing a card; a fragment AEM rejects may not publish, and then production keeps serving the previous version. Promo projects handle this explicitly: publishing a promo project skips each promo variation that has a validation error and reports "Project published, but N promo variation(s) could not be included."

## Investigation steps

1. Ask which icon the author sees, and for the exact banner lines if it is the validation banner. Get the card's fragment id from the Studio URL (`fragmentId=`).
2. Layer: `odin`.
3. Layer: `odin`.
4. Layer: `client` (offer resolution), or `odin` if the OSI itself is wrong.
5. If it is absent, the card needs a clean save and a publish once the validation errors are gone. If it is present, the problem is downstream of the fragment, for example checkout or the page. Layer: `odin`, then `client` or `milo`.
