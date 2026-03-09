## Overview

Translation Projects (Loc v2) enable bulk localization workflows in MAS Studio. Authors select multiple content items and target locales, bundle them into a project, and send the project to WorldServer for translation.

## Key Concepts

- **Project-based**: One project bundles multiple fragments, collections, and placeholders with target locales
- **Bulk selection**: Select items across content types in a single project
- **Lifecycle tracking**: Projects track submission date and become readonly after translation starts
- **Surface-aware**: Available on acom, express, sandbox, and nala surfaces

## Creating a Translation Project

1. Navigate to the Translations page (`#page=translations`)
2. Click "Create project"
3. Fill in the project title (required)
4. Select target languages from the locale grid
5. Select items to translate using the tabbed interface:
   - **Fragments tab**: Individual card fragments
   - **Collections tab**: Card collections
   - **Placeholders tab**: Dictionary/placeholder entries
6. Click "Save" to create the project in AEM

## Validation Requirements

- Title is required (cannot be empty)
- At least one target locale must be selected
- At least one item (fragment, collection, or placeholder) must be selected

## Sending to Localization

1. Open an existing translation project
2. Click the "LOC" (Send to localization) button in the quick actions bar
3. The backend performs these steps:
   - Validates project completeness
   - Creates "Pre-translation version" snapshots for all target fragments
   - Syncs dictionary placeholder entries to target locales
   - Sends the translation request to WorldServer
   - Sets the submission date on the project
4. The project becomes readonly after submission

## Project States

| State | Description |
|-------|-------------|
| Draft | Project created but not yet sent to translation |
| Submitted | Project sent to WorldServer (submissionDate is set) |
| Readonly | Same as submitted - form fields are locked |

## Translation Project Fragment Model

Translation projects are stored as AEM Content Fragments with these fields:

| Field | Type | Description |
|-------|------|-------------|
| title | text | Project name |
| status | text | Current status |
| fragments | content-fragment (multiple) | Card references to translate |
| placeholders | content-fragment (multiple) | Placeholder references |
| collections | content-fragment (multiple) | Collection references |
| targetLocales | text (multiple) | Target locale codes (e.g., pl_PL, fr_FR) |
| submissionDate | date-time | Set when project is sent to translation |

## Available Target Locales

Target locales are loaded dynamically per surface. The source locale (en_US) is excluded from selection. Authors can use "Select all" to choose all available locales at once.

## Storage Location

Translation projects are stored at: `/content/dam/mas/{surface}/translations/`

## WorldServer Integration

When sent to localization, the system creates a payload containing:
- Task name (project title)
- Content fragment paths to translate
- Target locale codes
- Translation flow configuration (if applicable)

This payload is sent to AEM's `/bin/sendToLocalisationAsync` endpoint for WorldServer processing.
