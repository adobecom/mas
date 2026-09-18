---
topic: promotions
keywords: promotion, promo, promo code, campaign, project, discount, offer substitution, promo variation, schedule, publish promotion
---
# Promotions in MAS Studio

## What is a promotion in MAS Studio?

A promotion (called a "project" in parts of the UI) is an AEM content fragment managed from the Promotions area of MAS Studio. It carries a title, a promo code, a start date and an end date, one or more promotion tags (mas:promotion), target geos (country tags), target surfaces, a list of attached offers (offer selector IDs), and attached fragments — merch cards and card collections. Dates entered in the editor are stored as UTC ISO timestamps. The promotions list can be filtered by lifecycle status such as draft, scheduled, active and expired.

## Why don't I see the Promotions page?
The Promotions entry in the side navigation is only rendered for members of the MAS admins group; for everyone else the page is hidden entirely. If you need to manage promotions and the page is missing, request MAS admin access and sign out of Studio and back in so the membership is picked up. The Promo Codes Manager inside the promotion editor is additionally permission-gated, so promo code exceptions can be unavailable even when you can edit the promotion itself.

## What does the promotions list show?
The Promotions page lists promotions in a table with columns for the promotion title, its timeline (sortable by dates), status, owner, and an actions menu. The actions menu always offers Edit; Publish appears for unpublished or modified promotions and is disabled for expired ones; Unpublish appears only for published promotions. Double-clicking a row opens the promotion in the editor, and opening a promotion that is published but already expired automatically unpublishes it. Duplicating requires saved changes and proposes the current title plus "copy" as the new name; deleting asks for confirmation first.

## How do I create a promotion?

Open the Promotions editor and start a new project. Fill in the title, promo code, start date and end date, add at least one promotion tag, at least one geo and at least one surface, then attach items. Offers are attached by OSI through the Offer Selector Tool; cards and collections are attached through the items picker, which accepts search text, Studio deep links, DAM paths, and fragment UUIDs. Saving creates the promotion fragment in AEM; on success Studio shows "Project successfully created." and keeps you in the editor. The editor's quick actions are Save, Duplicate, Publish, Unpublish, Copy link, Lock project, and Delete.

## What fields are required before a promotion can be saved?

Validation requires, in this order: a Title, a Promo Code, a Start Date, an End Date, at least one Promotion tag, at least one Geo, at least one Surface, and at least one attached fragment or collection. Each missing requirement produces its own message, for example "Please enter a Promo Code." or "Please add at least one Geo." The editor also tracks whether the attached items and offers differ from what is saved on the fragment, and prompts to discard changes if you try to leave the page with unsaved edits.

## What do the promotion statuses mean?

Status is computed from the promotion's dates and its AEM publication status. "unknown" means the start or end date is missing or invalid. "expired" means the end date is in the past. "modified" means it was published but changed since publishing. "draft" means it has never been published. "scheduled" means it is published and the start date is in the future. "active" means it is published and currently inside the date window. In the promotions list filter, a modified promotion is shown as scheduled when its start date is in the future, otherwise as active.

## How do I publish or schedule a promotion?

One action covers both: if the start date is in the future the promotion is scheduled, otherwise it is published immediately. Publishing is blocked when there are unsaved changes ("Save your changes before publishing."), when the start date is missing, when the promotion has expired ("This promotion has ended. Update the dates to publish again."), or when it is already published and unmodified. Before publishing, Studio checks the attached promo variations; if some are unpublished it asks whether to publish them together with the project and, when confirmed, publishes the promotion and those variations in a single AEM request. If some variations could not be included, a toast reports how many were skipped. Unpublish is available for published promotions.

## What are promo variations and where are they stored?

A promo variation is a promotion-specific copy of a default card. It lives under the surface and locale's promotions folder, in a subfolder named after the promotion; the folder name is derived from the promotion's mas:promotion tag. A fragment is recognized as a promo variation either by its path (inside the promotions folder) or by carrying a mas:promotion tag. Studio can resolve the default fragment path back from a promo variation path and the reverse, and the fragment editor's variations panel lists promo variations alongside locale variations and grouped variations.

## How do promo code exceptions and offer substitutions work?

A promotion has a single default promo code, but the promo codes manager lets you override it per offer and per country, and also substitute a different offer selector for a base offer in specific countries. These exceptions and substitutions are serialized into the promotion's offers field together with the plain selected offer IDs. The available countries come from the promotion's geos. When you remove an offer from a promotion, attached cards and collections that no longer match any remaining offer's product code tags are removed from the selection after a confirmation message. On a live page, the promotion code is applied to the rendered card's prices and checkout links, so buyers see the promotional price while the promotion is active.

## Can the AI assistant manage promotions?

The AI assistant does not currently create, edit, publish or unpublish promotions — there are no promotion intents in its registry. It can help prepare promotion content: it can search cards and collections, resolve and search offers, create an offer selector (returning an OSI that can be attached to a promotion), and open the Offer Selector Tool. Creating and publishing the promotion itself must be done in the Promotions editor in Studio.
