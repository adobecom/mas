# Translations

## What Are Translation Projects

A translation project bundles cards, collections, and placeholders together for translation into one or more target locales. Translation projects are the primary mechanism for localizing MAS content across regions and languages.

Each project tracks which content items need translation, which target languages are selected, and whether the project has been submitted to the localization vendor.

## Project Types

MAS Studio supports two translation project types:

| Type | Purpose |
|------|---------|
| **Translation** | Send content to an external localization vendor via the GlaaS pipeline. Used for professional human translation of content into new languages. |
| **Rollout** | Sync content across locales without external translation. Used when the same content applies to multiple regions (e.g., rolling out en_US content to en_GB, en_AU). |

## Navigating to Translations

1. Open MAS Studio.
2. Select the target surface from the surface picker.
3. Click "Translations" in the left side navigation.
4. The Translations page loads with a list of all translation projects.

Translation projects are only available for certain surfaces: ACOM, Express, Sandbox, and Nala.

## Browsing Translation Projects

The Translations page displays a table with the following columns:

| Column | Description |
|--------|-------------|
| Translation Project | The project title |
| Last updated by | The person who last modified the project |
| Sent on | The date the project was submitted to localization (or "N/A" if not yet sent) |
| Actions | Context menu for edit, duplicate, archive, delete, and cancel |

You can sort by the "Sent on" column in ascending or descending order.

The page shows a result count (e.g., "5 result(s)") below the search bar.

## Creating a Translation Project

1. Click the "Create project" button at the top right of the Translations page.
2. The Translation Editor opens with a blank project.
3. Fill in the project details:
   - **Title**: A descriptive name for the project (e.g., "Q4 2026 ACOM Card Updates").
   - **Project Type**: Choose Translation or Rollout.
4. Select target languages:
   - Open the language selector.
   - Check the locales you want to translate into.
   - The selected count updates in real time.
5. Select content items to include:
   - Browse and select cards from the fragment list.
   - Browse and select collections.
   - Browse and select placeholders.
   - Use the "Show selected" toggle to review your selections.
6. Click "Save" to create the project.

The project is saved as a draft translation project fragment in AEM.

## Editing a Translation Project

1. Double-click a project row in the Translations table, or click "Edit" from the action menu.
2. The Translation Editor opens with the existing project data loaded.
3. Modify the title, target languages, or content selections as needed.
4. Click "Save" to persist your changes.

If the project has already been submitted to localization (has a submission date), it enters read-only mode and cannot be edited further.

## Selecting Content Items

The Translation Editor provides a selector panel for choosing which items to include:

- **Cards**: Browse the fragment list filtered by current surface and locale. Check items to include them.
- **Collections**: Browse available collections. Check items to include them.
- **Placeholders**: Browse the placeholder dictionary. Check items to include them.

Each section shows a count of selected items. Use the "Show selected" toggle to filter the list to only show items you have already selected, making it easier to review large selections.

## Selecting Target Languages

The language selector shows all supported locales for the current surface:

1. Open the language selector panel.
2. Check the locales you want to translate into.
3. The selected languages appear as a comma-separated list in the project summary.

Selected languages persist across saves. When editing an existing project, previously selected languages are pre-checked.

## Sending to Localization

Once a project is ready, submit it to the translation vendor:

1. Open the translation project in the editor.
2. Click the "LOC" action button in the quick actions toolbar.
3. The system calls an I/O Runtime action that:
   - Sets the `submissionDate` field on the project fragment.
   - Sends the content bundle to the GlaaS pipeline.
   - Puts the project into read-only mode.
4. A success toast appears confirming submission.

After submission, the "Sent on" column in the project list shows the submission date.

## Locale Management

### Supported Locales

Each surface has a defined list of supported locales. The locale picker only shows locales valid for the current surface.

### Fallback Behavior

When content is not available in a specific locale, the system uses language-based fallback:

| Requested Locale | Falls Back To |
|------------------|---------------|
| en_AU | en_US |
| en_GB | en_US |
| en_CA | en_US |
| fr_CA | fr_FR |
| de_AT | de_DE |
| es_MX | es_ES |
| pt_BR | pt_PT |

Fallback ensures users always see content, even if a specific regional translation has not been completed.

### Source of Truth

The `en_US` locale serves as the source of truth for all content. All translations start from the en_US version of cards, collections, and placeholders.

## GlaaS Products

Translation projects use GlaaS product identifiers to route content to the correct translation workflow:

| Surface | GlaaS Product |
|---------|---------------|
| ACOM | MAS-ACOM-AEM |
| CCD | MAS-CCD-AEM |

These identifiers tell the GlaaS pipeline which translation memory and glossary to apply.

## Protecting Manual Changes

If you have manually edited a localized fragment and do not want translation to overwrite those changes:

1. Open the translation project in the editor.
2. Find the item in the content selection list.
3. Uncheck "Send to translation" for that specific item.
4. Save the project.

This prevents the GlaaS pipeline from overwriting your manual edits when translated content is delivered.

## Deleting a Translation Project

1. Click the action menu on the project row.
2. Select "Delete" from the dropdown.
3. A confirmation dialog appears: "Are you sure you want to delete the translation project [title]? This action cannot be undone."
4. Click "Delete" to confirm.

The project fragment is removed from AEM and disappears from the project list.

## Common Issues

**Localized content fragments not appearing on the live site:**
Translated fragments are not auto-published after translation delivery. You need to manually publish them or run a bulk publish script. Check the fragment status in Studio to verify.

**Translation project stuck in read-only mode:**
Once a project has a submission date, it cannot be edited. If you need to modify the project, create a new one with the updated selections.

**Missing locales in the language selector:**
Only locales supported by the current surface appear in the selector. Switch to a surface that supports your target locale, or request the locale be added to the surface configuration.

**Content not included in translation bundle:**
Verify the items are checked in the content selector. Use the "Show selected" toggle to confirm your selections before submitting.

**GlaaS submission failed:**
Check the I/O Runtime logs for errors. Common causes include expired authentication tokens, network timeouts, or invalid GlaaS product configuration. Contact the team in #merch-at-scale Slack for help.
