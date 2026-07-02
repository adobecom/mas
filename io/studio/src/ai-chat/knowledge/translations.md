---
topic: translations
keywords: translation, translate, localize, localization, locale, language, translation project, rollout
---
# Translations in MAS Studio

## How do I create a translation project?

Open the Translations page from the MAS Studio side navigation and click the "Create project" button. This opens the translation project editor, where you give the project a title, choose one or more target locales, and add the content to translate: cards (fragments), placeholders, and collections. A project cannot be saved until it has a title, at least one target locale, and at least one selected item. The title is used as the localization task name, so it must be at most 255 characters, contain at least one letter or number, and use only letters, numbers, hyphens, underscores, and dots (consecutive dots are not allowed). You can also ask the AI assistant to "create a translation project" with a title and target locales; it will ask for confirmation before creating it, and can optionally include specific card paths.

## What does a translation project contain?

A translation project is stored as a content fragment with these fields: title, status, fragments (the card paths to translate), placeholders, collections, targetLocales, submissionDate, and projectType. Target locales use the underscore format such as fr_FR, de_DE, or ja_JP. The projectType is "translation" by default; a second type, "rollout", exists for rollout-only projects that copy content to target locales without sending it for translation. The Translations page lists all projects in a table showing title, status, who last modified the project, and the "Sent on" date (the submission date, sortable). From the row action menu you can edit or delete a project; deleting is permanent.

## How do I send a translation project for localization?

After creating and saving the project, use the send-for-localization action in the translation project editor. Studio calls the translation-project-start backend action with the project ID and the current surface, authenticated with your IMS token. On success the submission date is stamped on the project, its status becomes Pending, and the project becomes read-only in the editor. The AI assistant can also do this: ask it to "submit translation project" with the project ID (submit_translation_project), and it will ask for confirmation first since submission changes state.

## What do the translation project statuses mean?

The status column on the Translations page maps internal states to labels. "Pending" (internal status QUEUED) means the submission was accepted and the job is waiting in the queue. "Running" (RUNNING) means the job is being processed, including content synchronization. "Sent to loc" (ASYNC_PROCESSING) means the content has been handed off to the localization service and is out for translation. "Failed" (FAILED) means the job did not complete; the project can be inspected and resubmitted. You can also ask the AI assistant to "check translation status" for a project ID or to "list translation projects", optionally filtered by status.

## What happens after I submit a translation project?

Submission is asynchronous. The translation-project-start action validates the request, marks the project QUEUED with a submission date, stores the job payload, enqueues the job, and invokes a dispatcher action in the background, returning immediately. The worker then runs a sync stage before localization: placeholder entries are added to the dictionary index of each target locale, and for grouped (pzn) variations the parent fragments in each target locale are updated to reference the translated variations so they stay linked. After syncing, the worker sends the localization request to the AEM/Odin localization endpoint with the task name, the content fragment paths, and the target locales. The translation flow is determined per surface (for example transcreation) unless human translation is configured.

## What is a rollout project?

A rollout project is a translation project whose projectType field is set to "rollout". Instead of sending content out for translation, the backend sends the selected content paths and target locales to the Odin locale-sync endpoint, which copies the content into the target locales as-is. This is useful when you need locale copies of fragments without changing the text, for example when the content is language-neutral or will be edited manually per locale. Rollout projects go through the same submission pipeline as translation projects: they are queued, synced, and dispatched asynchronously, and the same status labels apply on the Translations page.

## What can the AI assistant do with translations?

The assistant supports several translation intents. Read-only: "find untranslated cards" for a target locale (find_untranslated_cards, optionally scoped to a surface), "translation coverage report" across locales (translation_coverage_report), "get translation project" details by ID, "list translation projects" optionally by status, and "check translation status" of a job. State-changing, always confirmed before executing: "create a translation project" with a title and target locales (create_translation_project) and "submit translation project" by ID (submit_translation_project). For example, you can ask "which cards are missing a fr_FR variation in acom?" and then create a translation project for the results.

## Are prices and offers translated too?

No, and they do not need to be. Card prices come from the offer selector (OSI), which adapts automatically to the page locale: currency, tax labels, and checkout links are resolved at render time by the commerce backend. The same OSI works across locales as long as the offer is valid there. Commerce placeholders are likewise resolved by backend locale logic rather than translated. What translation projects handle is the authored card content itself — titles, descriptions, and other text fields — which is not auto-translated and must go through a translation project (or be authored separately per locale).
