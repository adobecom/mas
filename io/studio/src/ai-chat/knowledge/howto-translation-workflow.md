---
topic: howto-translation-workflow
keywords: authoring, sending a fragment for translation
---
<!-- ported from the MASA knowledge corpus -->
# Sending a fragment for translation

## What a translation project is

A translation project is its own kind of item in Studio, separate from the cards and collections it carries. You create one from the Translations page, give it a title, pick target languages, and add the cards, collections or placeholders you want translated. A project stays editable, and reusable, until it is actually sent.

## Choosing what to translate and which languages

Studio will not let a project be sent until it has a title, at least one target language, and at least one card, collection or placeholder attached. The title follows plain rules: it must have at least one letter or number, can only use letters, numbers, hyphens, underscores and dots, and can't contain two dots in a row. The language list Studio offers is each surface's own set of default languages, not every regional variation locale, and it leaves out the English source language by default so you only pick the languages you actually want translated into.

## Sending the project and what happens after

Sending a project calls an IO action, passing along the surface you're working in, which kicks off the actual localization job and stamps the project with a submission date. Once sent, the project becomes read only, so building a new batch of translations means creating a new project rather than reopening an old one. A sent project's status reads Pending while it's queued, Running while it's in progress, "Sent to loc" once it has been handed off to the localization system, or Failed if that handoff didn't go through.

## Common questions

Why can't I click send on a translation project: check that it has a title, at least one target language and at least one card, collection or placeholder, all three are required. Why can I no longer edit a translation project I just sent: sending locks the project, start a new one for further changes. Why don't I see every regional locale in the language list: the picker only offers each surface's default languages, not the full set of regional variations.
