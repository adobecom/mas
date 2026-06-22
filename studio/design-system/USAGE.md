# M@S Studio Design System — Usage Guide

This guide explains how to use the design system files to generate Spectrum 2-faithful UI mockups, annotated specs, and Lit scaffolds for new M@S Studio features.

## Setup (one-time per person)

Open a new conversation at [claude.ai](https://claude.ai) and attach these files:

| File | Why |
|---|---|
| `studio/design-system/scaffold.html` | The working Studio shell Claude uses as its base |
| `studio/design-system/components.md` | The full SWC component vocabulary |
| `studio/design-system/patterns.md` | The non-negotiable Lit/SWC rules |
| `studio/design-system/tokens.md` | Spectrum 2 token reference |

Optionally attach one or more `examples/*.html` files for the UI pattern closest to what you're designing:

| Example | When to attach |
|---|---|
| `examples/dialog.html` | Designing any modal, confirmation, or form dialog |
| `examples/toolbar.html` | Designing toolbar controls, search, or create flows |
| `examples/side-nav.html` | Designing nav items or action panels |
| `examples/fragment-editor.html` | Designing tabbed editor panels or field forms |
| `examples/data-table.html` | Designing list views, tables, or row actions |

## Starter prompt

Paste this at the top of every session, then describe your feature below it:

```
You are designing UI for M@S Studio — Adobe's platform for authoring
commerce content: product cards, pricing fragments, promotional offers,
and subscription plans that appear across adobe.com and Creative Cloud.

Use scaffold.html as your base. All components must come from components.md.
Follow every rule in patterns.md. Reference examples/ for real Studio patterns.

Every UI you generate is used by content authors and commerce managers,
not end consumers — prioritize clarity, density, and editorial efficiency
over marketing aesthetics.
```

## Example feature prompts

- *"Design a bulk-tag dialog. Authors select multiple fragments and apply taxonomy tags in bulk. Show a tag picker, an affected fragment count, and confirm/cancel actions."*
- *"Design a locale picker panel that shows available locales as a filterable list with publish status indicators."*
- *"Design an empty state for the fragment table when no results match the current search query."*
- *"Design a duplicate-fragment confirmation dialog that warns when the target folder already contains a fragment with the same name."*

## What you get back

Each session produces three outputs — ask for all three explicitly if Claude doesn't offer them:

- **HTML prototype** — open directly in a browser; uses real SWC components and Spectrum 2 tokens from `scaffold.html`
- **Annotated spec** — which components, slots, CSS custom properties, and Lit patterns to use; reference this during implementation
- **Lit scaffold** — a starter `.js` file following `mas-` conventions from `patterns.md`; paste into `studio/src/` and fill in the logic

## Designing against existing Studio components

Attach the actual source file you're modifying alongside the design system files. Claude will generate output that fits directly into the existing component rather than a standalone prototype.

Example: *"Here is `mas-fragment-editor.js`. Add a new 'Bulk Actions' tab panel that shows checkboxes for publish, unpublish, and delete. Follow the existing sp-tabs pattern in the file."*

## Iterating

Iterate in the same conversation — Claude retains the design system context across turns:

- *"Make the tag picker multiselect"*
- *"Add a warning banner when more than 50 fragments are affected"*
- *"Switch the layout to match the toolbar.html example instead"*

Each iteration stays within the real SWC component set because Claude has `components.md` loaded.

## Keeping the design system current

When you add or remove a component in `studio/src/swc.js`, update `studio/design-system/components.md` in the same PR. The build will warn you if they drift (`npm run build` runs `scripts/sync.js` automatically).

## Spec

This design system was designed in:  
`docs/superpowers/specs/2026-06-22-mas-studio-claude-design-system.md`
