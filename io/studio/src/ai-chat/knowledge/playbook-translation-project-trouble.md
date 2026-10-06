---
topic: playbook-translation-project-trouble
keywords: platform, authoring, translation project trouble
---
<!-- ported from the MASA knowledge corpus -->
# Translation project trouble

## About Translation project trouble

For how a translation project is normally built and sent, see the how-to on sending a fragment for translation. This playbook is for when that flow fails: a project that will not save, a project that will not send, or one that has to be resent after something goes wrong on the localization side.

## Symptom: saving a project doesn't work

Check the Network tab for the failing request. One possible cause is a project name that isn't unique. Studio does not check this up front: it names the new project fragment after its title, and when the translations folder already holds a project with that name, the create request fails with a 409 and Studio shows "Project with this name already exists."

**Symptom: "Send for Localization" doesn't work.** Filter the Network tab for the `translation-project-start` request and inspect its POST.

## Resending a translation project

If CATS-I or Odin reports something went wrong during translation and asks for the project to be resent, Studio's own "sent" lock normally prevents that. The workaround:
1. Open the translation project fragment in the Odin editor.
2. Clear the `submissionDate` field.
3. Move the cursor to another field to trigger the editor's autosave (autosave is always on in the Odin editor).
4. Open the same project in Studio (`https://mas.adobe.com/studio.html#content-type=merch-card&page=translation-editor&path=<surface>&translationProjectId=<id>`) and click Submit — the Submit button is available again because Studio now treats it as unsent.

Odin treats this as a new project and appends a new timestamp, but the project title still starts with the same authored text, so resends of the same project differ only by that timestamp and are hard to tell apart. Duplicating the project under a new title would be the cleaner fix long-term, but that is not implemented.

**If the issue isn't on the content or MAS code side.** 
