import { LitElement, html, css, nothing } from 'lit';
import { EVENT_KEYDOWN, PAGE_NAMES, STAGED, CARD_MODEL_PATH } from './constants.js';
import { Fragment } from './aem/fragment.js';
import Events from './events.js';
import ReactiveController from './reactivity/reactive-controller.js';
import Store from './store.js';
import { findFragmentDataById, resolveFragmentsFromSelection } from './common/utils/fragment-selection-utils.js';
import { generateLinkToUse, showToast } from './utils.js';
import { fileSendIcon } from './icons.js';

class MasSelectionPanel extends LitElement {
    static styles = css`
        sp-action-bar {
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
        }

        .button-staged svg {
            position: relative;
            top: 5px;
        }
    `;

    static properties = {
        open: { type: Boolean, attribute: true },
        selectionStore: { type: Object, attribute: false },
        repository: { type: Object, attribute: false },
        onDuplicate: { type: Function, attribute: false },
        onDelete: { type: Function, attribute: false },
        onPublish: { type: Function, attribute: false },
        onUnpublish: { type: Function, attribute: false },
        onCopyToFolder: { type: Function, attribute: false },
        onCopyStudioLinks: { type: Function, attribute: false },
    };

    constructor() {
        super();

        this.open = false;
        this.selectionStore = null;
        this.repository = null;
        this.onDuplicate = null;
        this.onDelete = null;
        this.onPublish = null;
        this.onUnpublish = null;
        this.onCopyToFolder = null;
        this.onCopyStudioLinks = null;

        this.close = this.close.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener(EVENT_KEYDOWN, this.close);
        this.reactiveController = new ReactiveController(this, [this.selectionStore]);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener(EVENT_KEYDOWN, this.close);
    }

    close(event) {
        if (!this.open) return;
        if (event instanceof KeyboardEvent && event.code !== 'Escape') return;
        this.dispatchEvent(new CustomEvent('close'));
        this.selectionStore.set([]);
    }

    get selection() {
        return this.selectionStore.get();
    }

    // #region Handlers

    handleDuplicate(event) {
        this.onDuplicate(this.selection, event);
    }

    handleDelete(event) {
        this.onDelete(this.selection, event);
    }

    handleCopyToFolder() {
        const firstSelection = this.selection[0];
        if (!firstSelection) return;

        if (firstSelection?.get) {
            return this.onCopyToFolder(firstSelection.get());
        }

        const fragment =
            firstSelection?.id && typeof firstSelection !== 'string'
                ? firstSelection
                : findFragmentDataById(
                      typeof firstSelection === 'string' ? firstSelection : firstSelection?.id,
                      Store.fragments.list.data.get(),
                  );

        if (!fragment) return;
        this.onCopyToFolder(fragment);
    }

    async handlePublish() {
        if (!this.repository) {
            console.error('Repository not found');
            return;
        }

        const selection = this.selection;
        if (!selection || selection.length === 0) return;

        const fragmentIds = selection
            .map((item) => {
                if (typeof item === 'string') return item;
                if (item?.id) return item.id;
                if (item?.get?.()?.id) return item.get().id;
                return null;
            })
            .filter(Boolean);

        if (fragmentIds.length === 0) return;

        const allVariations = [];
        const allCards = [];
        const seen = new Set();

        const hydratedFragments = await Promise.all(
            fragmentIds.map((id) => this.repository.aem.sites.cf.fragments.getById(id).catch(() => null)),
        );

        for (const fragmentData of hydratedFragments) {
            if (!fragmentData) continue;
            const variationPaths = new Set(fragmentData.fields?.find((f) => f.name === 'variations')?.values ?? []);
            const cardPaths = new Set([
                ...(fragmentData.fields?.find((f) => f.name === 'cards')?.values ?? []),
                ...(fragmentData.fields?.find((f) => f.name === 'collections')?.values ?? []),
            ]);
            for (const ref of fragmentData.references || []) {
                if (!ref?.id || seen.has(ref.id)) continue;
                if (variationPaths.has(ref.path)) {
                    seen.add(ref.id);
                    allVariations.push(ref);
                } else if (cardPaths.has(ref.path)) {
                    seen.add(ref.id);
                    allCards.push(ref);
                }
            }
        }

        if (allVariations.length || allCards.length) {
            const { MasPublishDialog } = await import('./publish/mas-publish-dialog.js');
            const result = await MasPublishDialog.show({ variations: allVariations, cards: allCards });
            if (!result.confirmed) return;
            for (const id of result.selectedIds) {
                if (!fragmentIds.includes(id)) fragmentIds.push(id);
            }
        }

        const anyStaged = [...hydratedFragments, ...allCards, ...allVariations].some((fragment) => {
            let staged = false;
            if (!staged && fragmentIds.includes(fragment.id)) {
                fragment.fields.forEach((field) => {
                    if (field.name === 'tags' && field.values.includes(STAGED.TAG)) {
                        staged = true;
                    }
                });
            }
            return staged;
        });
        if (anyStaged) {
            const { MasPublishStagedDialog } = await import('./publish/mas-publish-staged-dialog.js');
            const result = await MasPublishStagedDialog.show(true);
            if (!result.confirmed) return;
        }

        const success = await this.repository.bulkPublishFragments(fragmentIds);
        if (success) {
            this.selectionStore.set([]);
        }
    }

    async handleMarkStaged() {
        if (!this.repository) {
            console.error('Repository not found');
            return;
        }

        const saved = [];
        await Promise.all(
            this.selection.map(async (id) => {
                const data = await this.repository.aem.sites.cf.fragments.getById(id);
                const fragment = new Fragment(data);
                if (fragment.isStaged || fragment.model.path !== CARD_MODEL_PATH) return;
                const oldTags = fragment.getFieldValues('tags') || [];
                const tags = [...oldTags];
                tags.push(STAGED.TAG);
                fragment.updateField('tags', tags);
                this.repository.aem.sites.cf.fragments.save(fragment);
                saved.push(id);
            }),
        );

        Store.fragments.list.data.set((prev) => {
            return [...prev].map((fragmentStore) => {
                const fragment = fragmentStore.get();
                if (saved.includes(fragment?.id)) {
                    const tags = fragment.getFieldValues('tags') || [];
                    tags.push(STAGED.TAG);
                    fragment.updateField('tags', tags);
                }
                return fragmentStore;
            });
        });

        this.selectionStore.set([]);
        showToast('Fragments marked as Staged.', 'positive');
    }

    handleUnpublish(event) {
        this.onUnpublish(this.selection, event);
    }

    handleCopyStudioLinks(event) {
        this.onCopyStudioLinks?.(this.selection, event);
    }

    async handleCopyFragmentUrls() {
        const selection = this.selection;
        if (!selection || selection.length === 0) return;

        const path = Store.search.get().path;
        const fragments = resolveFragmentsFromSelection(selection, Store.fragments.list.data.get());

        const results = fragments
            .map((fragment) => generateLinkToUse(fragment, path, PAGE_NAMES.CONTENT))
            .filter((result) => result?.code && result?.richText && result?.href);

        if (results.length === 0) return;

        const plainText = results.map(({ href }) => href).join('\n');
        const htmlText = results.map(({ richText }) => richText).join('<br>');

        try {
            await navigator.clipboard.write([
                new ClipboardItem({
                    'text/plain': new Blob([plainText], { type: 'text/plain' }),
                    'text/html': new Blob([htmlText], { type: 'text/html' }),
                }),
            ]);
            Events.toast.emit({
                variant: 'positive',
                content: `Copied ${results.length} link${results.length > 1 ? 's' : ''} to clipboard`,
            });
        } catch {
            Events.toast.emit({ variant: 'negative', content: 'Failed to copy link to clipboard' });
        }
    }

    // #endregion

    render() {
        const count = this.selection.length;
        return html`<sp-action-bar emphasized ?open=${this.open} variant="fixed" @close=${this.close}>
            ${count} selected
            ${count === 1
                ? html`<sp-action-button
                          slot="buttons"
                          label="Duplicate"
                          ?disabled=${!this.onDuplicate}
                          @click=${this.handleDuplicate}
                      >
                          <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
                          <sp-tooltip self-managed placement="top">Duplicate</sp-tooltip>
                      </sp-action-button>
                      <sp-action-button
                          slot="buttons"
                          label="Copy to folder"
                          ?disabled=${!this.onCopyToFolder}
                          @click=${() => this.handleCopyToFolder()}
                      >
                          <sp-icon-folder-add slot="icon"></sp-icon-folder-add>
                          <sp-tooltip self-managed placement="top">Copy to folder</sp-tooltip>
                      </sp-action-button>`
                : nothing}
            ${count > 0
                ? html`<sp-action-button
                      slot="buttons"
                      class="button-staged"
                      label="Mark as Staged"
                      @click=${this.handleMarkStaged}
                  >
                      ${fileSendIcon}
                      <sp-tooltip self-managed placement="top">Mark as Staged</sp-tooltip>
                  </sp-action-button>`
                : nothing}
            ${count > 0
                ? html`<sp-action-button slot="buttons" label="Delete" ?disabled=${!this.onDelete} @click=${this.handleDelete}>
                      <sp-icon-delete slot="icon"></sp-icon-delete>
                      <sp-tooltip self-managed placement="top">Delete</sp-tooltip>
                  </sp-action-button>`
                : nothing}
            ${count > 0 && this.onCopyStudioLinks
                ? html`<sp-action-button slot="buttons" label="Copy Studio Link(s)" @click=${this.handleCopyStudioLinks}>
                      <sp-icon-copy slot="icon"></sp-icon-copy>
                      <sp-tooltip self-managed placement="top">Copy link(s) to open in Studio editor</sp-tooltip>
                  </sp-action-button>`
                : nothing}
            ${count > 0
                ? html`<sp-action-button
                      slot="buttons"
                      label="Publish"
                      ?disabled=${!this.repository}
                      @click=${this.handlePublish}
                  >
                      <sp-icon-publish slot="icon"></sp-icon-publish>
                      <sp-tooltip self-managed placement="top">Publish</sp-tooltip>
                  </sp-action-button>`
                : nothing}
            ${count > 0
                ? html`<sp-action-button
                      slot="buttons"
                      label="Unpublish"
                      ?disabled=${!this.onUnpublish}
                      @click=${this.handleUnpublish}
                  >
                      <sp-icon-publish-remove slot="icon"></sp-icon-publish-remove>
                      <sp-tooltip self-managed placement="top">Unpublish</sp-tooltip>
                  </sp-action-button>`
                : nothing}
            ${count > 0
                ? html`<sp-action-button slot="buttons" label="Copy Content Link(s)" @click=${this.handleCopyFragmentUrls}>
                      <sp-icon-link slot="icon"></sp-icon-link>
                      <sp-tooltip self-managed placement="top">Copy link(s) to paste into authored documents</sp-tooltip>
                  </sp-action-button>`
                : nothing}
        </sp-action-bar>`;
    }
}

customElements.define('mas-selection-panel', MasSelectionPanel);
