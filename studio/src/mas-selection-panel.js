import { LitElement, html, css, nothing } from 'lit';
import { EVENT_KEYDOWN, PAGE_NAMES } from './constants.js';
import Events from './events.js';
import ReactiveController from './reactivity/reactive-controller.js';
import Store from './store.js';
import { MODEL_WEB_COMPONENT_MAPPING } from './utils.js';

class MasSelectionPanel extends LitElement {
    static styles = css`
        sp-action-bar {
            bottom: 10px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
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

        const fragmentStore = Store.fragments.list.data
            .get()
            .find((store) => store.get().id === firstSelection || store.get().id === firstSelection?.id);

        const fragment = fragmentStore?.get() || firstSelection;
        this.onCopyToFolder(fragment);
    }

    async handlePublish(event) {
        if (!this.repository) {
            console.error('Repository not found');
            return;
        }

        const selection = this.selection;
        if (!selection || selection.length === 0) return;

        // Extract fragment IDs from selection (selection can be IDs or fragment objects)
        const fragmentIds = selection
            .map((item) => {
                if (typeof item === 'string') return item;
                if (item?.id) return item.id;
                if (item?.get?.()?.id) return item.get().id;
                return null;
            })
            .filter(Boolean);

        if (fragmentIds.length === 0) return;

        const success = await this.repository.bulkPublishFragments(fragmentIds);
        if (success) {
            // Clear selection after successful publish
            this.selectionStore.set([]);
        }
    }

    handleUnpublish(event) {
        this.onUnpublish(this.selection, event);
    }

    async handleCopyFragmentUrls() {
        const selection = this.selection;
        if (!selection || selection.length === 0) return;

        const path = Store.search.get().path;
        const fragments = selection
            .map((item) => {
                if (item?.get) return item.get();
                if (item?.id) return item;
                const id = typeof item === 'string' ? item : null;
                return (
                    Store.fragments.list.data
                        .get()
                        .find((s) => s.get().id === id)
                        ?.get() ?? null
                );
            })
            .filter(Boolean);

        const urls = fragments.map((fragment) => {
            const webComponentName = MODEL_WEB_COMPONENT_MAPPING[fragment?.model?.path];
            const params = new URLSearchParams();
            if (webComponentName) params.set('content-type', webComponentName);
            params.set('page', PAGE_NAMES.CONTENT);
            if (path) params.set('path', path);
            if (fragment.id) params.set('query', fragment.id);
            return `https://mas.adobe.com/studio.html#${params.toString()}`;
        });

        if (urls.length === 0) return;

        try {
            await navigator.clipboard.writeText(urls.join('\n'));
            Events.toast.emit({
                variant: 'positive',
                content: `Copied ${urls.length} fragment URL${urls.length > 1 ? 's' : ''} to clipboard`,
            });
        } catch {
            Events.toast.emit({ variant: 'negative', content: 'Failed to copy fragment URLs' });
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
                ? html`<sp-action-button slot="buttons" label="Delete" ?disabled=${!this.onDelete} @click=${this.handleDelete}>
                      <sp-icon-delete slot="icon"></sp-icon-delete>
                      <sp-tooltip self-managed placement="top">Delete</sp-tooltip>
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
                ? html`<sp-action-button slot="buttons" label="Copy Code" @click=${this.handleCopyFragmentUrls}>
                      <sp-icon-code slot="icon"></sp-icon-code>
                      <sp-tooltip self-managed placement="top">Copy Code</sp-tooltip>
                  </sp-action-button>`
                : nothing}
        </sp-action-bar>`;
    }
}

customElements.define('mas-selection-panel', MasSelectionPanel);
