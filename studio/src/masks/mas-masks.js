import { LitElement, html, css } from 'lit';
import Store from '../store.js';
import router from '../router.js';
import { PAGE_NAMES } from '../constants.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { canAccessMasks } from '../groups.js';
import { confirmation } from '../mas-confirm-dialog.js';
import { tableHeaderBaseStyles, tableBodyBaseStyles, tableCellBaseStyles } from '../common/styles/table-styles.css.js';
import { skeletonStyles } from '../common/skeleton-styles.css.js';
import '../mas-locale-picker.js';
import './mas-mask-editor.js';

/**
 * Per-surface "Masks" view: lists the card fragments under `<surface>/<locale>/masks` and routes to
 * the mask editor for create/edit. Reached from Advanced Tools.
 */
class MasMasks extends LitElement {
    static styles = [
        skeletonStyles,
        tableHeaderBaseStyles,
        tableBodyBaseStyles,
        tableCellBaseStyles,
        css`
            :host {
                display: block;
                box-sizing: border-box;
                padding: 32px;
                min-width: 800px;
            }

            #header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                margin-bottom: 12px;
                padding-bottom: 12px;
                border-bottom: 2px solid var(--spectrum-gray-100);
            }

            #title {
                margin: 0;
                font-size: 25px;
                font-weight: 700;
                line-height: 30px;
            }

            .toolbar {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .item-table {
                sp-table-head-cell:last-child,
                sp-table-cell:last-child {
                    max-width: 100px;
                }
            }

            .action-cell {
                display: flex;
                justify-content: center;
                --system-action-button-background-color-default: transparent;
            }

            .empty,
            .no-access {
                padding: 40px;
                text-align: center;
                color: var(--spectrum-gray-700, #4b4b4b);
            }
        `,
    ];

    static properties = {
        bucket: { type: String, attribute: true },
        baseUrl: { type: String, attribute: 'base-url' },
    };

    reactiveController = new ReactiveController(this, [
        Store.search,
        Store.filters,
        Store.page,
        Store.profile,
        Store.users,
        Store.masks.list,
        Store.masks.loading,
        Store.masks.fragmentId,
        Store.masks.creating,
    ]);

    constructor() {
        super();
        this.bucket = '';
        this.baseUrl = '';
        this.loadedKey = '';
    }

    get surface() {
        return Store.surface() || '';
    }

    get locale() {
        return Store.localeOrRegion();
    }

    get isEditorPage() {
        return Store.page.get() === PAGE_NAMES.MASKS_EDITOR;
    }

    update(changedProperties) {
        this.#loadMasks();
        super.update(changedProperties);
    }

    #loadMasks() {
        if (canAccessMasks(this.surface)) {
            const key = `${this.surface}:${this.locale}`;
            if (key === this.loadedKey) return;
            if (!this.surface || !this.locale) return;
            if (!Store.masks.aem) {
                Store.masks.initAem(this.bucket, this.baseUrl);
            }
            this.loadedKey = key;
            Store.masks.ensureLoaded(this.surface, this.locale).then(() => {
                if (`${this.surface}:${this.locale}` !== key) this.#loadMasks();
            });
        }
    }

    #create() {
        Store.masks.editing.set(null);
        Store.masks.fragmentId.set(null);
        Store.masks.editingName.set('');
        Store.masks.creating.set(true);
        router.navigateToPage(PAGE_NAMES.MASKS_EDITOR)();
    }

    #edit(fragment) {
        Store.masks.editing.set(fragment);
        Store.masks.fragmentId.set(fragment.id);
        Store.masks.editingName.set(fragment.fragmentName);
        Store.masks.creating.set(false);
        router.navigateToPage(PAGE_NAMES.MASKS_EDITOR)();
    }

    async #publish(fragment) {
        await Store.masks.publishMask(fragment.id);
    }

    async #delete(fragment) {
        const confirmed = await confirmation({
            title: 'Delete mask',
            content: `Are you sure you want to delete "${fragment.title || fragment.fragmentName}"? This action cannot be undone.`,
            confirmLabel: 'Delete',
        });
        if (!confirmed) return;
        await Store.masks.deleteMask(fragment.id);
    }

    get tableHead() {
        return html`
            <sp-table-head>
                <sp-table-head-cell class="name">Name</sp-table-head-cell>
                <sp-table-head-cell class="description">Description</sp-table-head-cell>
                <sp-table-head-cell class="lastUpdatedBy">Last updated by</sp-table-head-cell>
                <sp-table-head-cell class="lastPublishedBy">Last published by</sp-table-head-cell>
                <sp-table-head-cell class="status">Status</sp-table-head-cell>
                <sp-table-head-cell class="actions"></sp-table-head-cell>
            </sp-table-head>
        `;
    }

    get listTemplate() {
        const masks = Store.masks.list.get();
        if (Store.masks.loading.get() && masks.length === 0) {
            return html`
                <sp-table emphasized .scroller=${true} class="item-table">
                    ${this.tableHead}
                    <sp-table-body>
                        ${Array.from(
                            { length: 5 },
                            () => html`
                                <sp-table-row class="skeleton-row">
                                    <sp-table-cell><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
                                    <sp-table-cell><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
                                    <sp-table-cell><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
                                    <sp-table-cell><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
                                    <sp-table-cell><div class="skeleton-element skeleton-table-cell"></div></sp-table-cell>
                                    <sp-table-cell></sp-table-cell>
                                </sp-table-row>
                            `,
                        )}
                    </sp-table-body>
                </sp-table>
            `;
        }
        if (masks.length === 0) {
            return html`<div class="empty">No masks for this surface and locale yet.</div>`;
        }
        return html`
            <sp-table emphasized .scroller=${true} class="item-table">
                ${this.tableHead}
                <sp-table-body>
                    ${masks.map(
                        (fragment) => html`
                            <sp-table-row @dblclick=${() => this.#edit(fragment)}>
                                <sp-table-cell>${fragment.title || fragment.fragmentName}</sp-table-cell>
                                <sp-table-cell>${fragment.description || ''}</sp-table-cell>
                                <sp-table-cell>${fragment.modified?.fullName || fragment.modified?.by || ''}</sp-table-cell>
                                <sp-table-cell>${fragment.published?.fullName || fragment.published?.by || ''}</sp-table-cell>
                                <sp-table-cell>
                                    <sp-status-light
                                        size="s"
                                        variant=${fragment.status === 'PUBLISHED' ? 'positive' : 'notice'}
                                    >
                                        ${fragment.status || 'DRAFT'}
                                    </sp-status-light>
                                </sp-table-cell>
                                <sp-table-cell class="action-cell">
                                    <sp-action-menu size="m" label="More actions" placement="bottom-end" quiet>
                                        <sp-menu-item @click=${() => this.#edit(fragment)}>
                                            <sp-icon-edit slot="icon"></sp-icon-edit>
                                            Edit
                                        </sp-menu-item>
                                        <sp-menu-item @click=${() => this.#publish(fragment)}>
                                            <sp-icon-publish slot="icon"></sp-icon-publish>
                                            Publish
                                        </sp-menu-item>
                                        <sp-menu-item @click=${() => this.#delete(fragment)}>
                                            <sp-icon-delete slot="icon"></sp-icon-delete>
                                            Delete
                                        </sp-menu-item>
                                    </sp-action-menu>
                                </sp-table-cell>
                            </sp-table-row>
                        `,
                    )}
                </sp-table-body>
            </sp-table>
        `;
    }

    render() {
        if (!canAccessMasks(this.surface)) {
            return html`<div class="no-access">You do not have access to masks for this surface.</div>`;
        }
        if (this.isEditorPage) {
            return html`<mas-mask-editor></mas-mask-editor>`;
        }
        return html`
            <div id="header">
                <h1 id="title">Masks</h1>
                <div class="toolbar">
                    <mas-locale-picker
                        surface=${this.surface}
                        label="Region"
                        locale=${Store.localeOrRegion()}
                        mode="region"
                        searchplaceholder="Search region"
                        @locale-changed=${(event) => Store.search.set((prev) => ({ ...prev, region: event.detail.locale }))}
                    ></mas-locale-picker>
                    <sp-button variant="accent" @click=${this.#create}
                        ><sp-icon-add slot="icon"></sp-icon-add>Create mask</sp-button
                    >
                </div>
            </div>
            ${this.listTemplate}
        `;
    }
}

customElements.define('mas-masks', MasMasks);
