import { html, LitElement, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { Store } from './store/Store.js';
import { EVENT_SUBMIT } from './events.js';
import { repeat } from 'lit/directives/repeat.js';
import { Reaction } from 'mobx';
import { MobxReactionUpdateCustom } from '@adobe/lit-mobx/lib/mixin-custom.js';
import { deeplink, pushState } from '@adobe/mas-commons';
import { Fragment } from './store/Fragment.js';
import './rte-editor.js';
import { openAsDialog } from '../libs/ost.js';
import { classMap } from 'lit/directives/class-map.js';

const models = {
    merchCard: {
        path: '/conf/sandbox/settings/dam/cfm/models/merch-card',
        name: 'Merch Card',
    },
};

class MasStudio extends MobxReactionUpdateCustom(LitElement, Reaction) {
    static properties = {
        store: { type: Object, state: true },
        bucket: { type: String, attribute: 'aem-bucket' },
        searchText: { type: String, state: true },
        confirmSelect: {
            type: Boolean,
            state: true,
        } /* display dialog to save changes before selecting a new fragment */,
        fragment: {
            type: Object,
            state: true,
        } /* refence to fragment while the dialog is open */,
        fragmentOffsets: {
            type: Object,
            state: true,
        } /* the offset top of last clicked fragment */,
    };

    constructor() {
        super();
        this.confirmSelect = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.store = new Store(this.bucket);
        this.startDeeplink();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.deeplinkDisposer();
    }

    get search() {
        return this.querySelector('sp-search');
    }

    get picker() {
        return this.querySelector('sp-picker');
    }

    createRenderRoot() {
        return this;
    }

    get selectFragmentDialog() {
        if (!this.confirmSelect) return nothing;
        return html`
            <sp-underlay open></sp-underlay>
            <sp-dialog size="m">
                <h1 slot="heading">You have unsaved changes!</h1>
                <p>
                    Do you want to save your changes before selecting another
                    merch card?
                </p>
                <sp-button
                    slot="button"
                    @click="${(e) =>
                        this.editFragment(null, this.fragment, true)}"
                >
                    Save
                </sp-button>
                <sp-button
                    slot="button"
                    variant="primary"
                    @click="${(e) =>
                        this.editFragment(null, this.fragment, true)}"
                >
                    Discard
                </sp-button>
                <sp-button
                    slot="button"
                    variant="secondary"
                    @click="${this.closeConfirmSelect}"
                >
                    Cancel
                </sp-button>
            </sp-dialog>
        `;
    }

    get fragmentEditorToolbar() {
        if (!this.store.fragment) return nothing;
        return html`<div id="actions">
            <sp-action-group
                aria-label="Fragment actions"
                role="group"
                compact
                emphasized
            >
                <sp-action-button
                    label="Save"
                    title="Save changes"
                    value="save"
                >
                    <sp-icon-save-floppy slot="icon"></sp-icon-save-floppy>
                </sp-action-button>
                <sp-action-button
                    label="Discard"
                    title="Discard changes"
                    value="discard"
                >
                    <sp-icon-undo slot="icon"></sp-icon-undo>
                </sp-action-button>
                <sp-action-button label="Clone" value="clone">
                    <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
                </sp-action-button>
                <sp-action-button label="Publish" value="publish">
                    <sp-icon-publish-check slot="icon"></sp-icon-publish-check>
                </sp-action-button>
                <sp-action-button label="Unpublish" value="unpublish">
                    <sp-icon-publish-remove
                        slot="icon"
                    ></sp-icon-publish-remove>
                </sp-action-button>
            </sp-action-group>
            <sp-divider vertical></sp-divider>
            <sp-action-group>
                <sp-action-button
                    title="Offer Selector Tool"
                    label="Offer Selector Tool"
                    value="offer-selector"
                    @click="${this.editorActionClickHandler}"
                >
                    <sp-icon-star slot="icon"></sp-icon-star>
                </sp-action-button>
            </sp-action-group>
            <sp-divider vertical></sp-divider>
            <sp-action-group>
                <sp-action-button title="Close" label="Close" value="close">
                    <sp-icon-close-circle slot="icon"></sp-icon-close-circle>
                </sp-action-button>
            </sp-action-group>
        </div>`;
    }

    get fragmentEditor() {
        const classes = { open: this.store.fragment };
        return html`<div id="editor" class=${classMap(classes)}>
            ${this.merchCardFragmentEditor} ${this.fragmentEditorToolbar}
        </div>`;
    }

    get merchCardFragmentEditor() {
        const { fragment } = this.store;
        if (!fragment) return nothing;
        return html`<sp-field-label for="card-variant">Variant</sp-field-label>
            <sp-picker id="card-variant" value="${fragment.variant}">
                <span slot="label">Choose a variant:</span>
                <sp-menu-item value="ccd-action">CCD Action</sp-menu-item>
                <sp-menu-item>CCH</sp-menu-item>
                <sp-menu-item>Plans</sp-menu-item>
                <sp-menu-item>Catalog</sp-menu-item>
            </sp-picker>
            <sp-field-label for="card-title">Title</sp-field-label>
            <sp-textfield
                placeholder="Enter card title"
                id="card-title"
                data-field="title"
                value="${fragment.title}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="card-icon">Icons</sp-field-label>
            <sp-textfield
                placeholder="Enter icon URLs"
                id="card-icon"
                multiline
                data-field="icon"
                value="${fragment.icon}"
                @change="${this.updateFragment}"
            ></sp-textfield>
            <sp-field-label for="horizontal"> Prices </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-editor>${unsafeHTML(fragment.prices)}</rte-editor>
            </sp-field-group>
            <sp-field-label for="horizontal"> Description </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-editor>${unsafeHTML(fragment.description)}</rte-editor>
            </sp-field-group>
            <sp-field-label for="horizontal"> Footer </sp-field-label>
            <sp-field-group horizontal id="horizontal">
                <rte-editor>${unsafeHTML(fragment.ctas)}</rte-editor>
            </sp-field-group> `;
    }

    get fragmentEditorEl() {
        return this.querySelector('#editor');
    }

    get result() {
        if (this.store.search.result.length === 0) return nothing;
        return html`<ul id="result">
            ${repeat(
                this.store.search.result,
                (item) => item.path,
                (item) => {
                    switch (item.model.path) {
                        case models.merchCard.path:
                            return html`<merch-card
                                @dblclick="${(e) => this.editFragment(e, item)}"
                            >
                                <merch-datasource
                                    odin
                                    source="odin-author"
                                    path="${item.path}"
                                ></merch-datasource>
                            </merch-card>`;
                        default:
                            return nothing;
                    }
                },
            )}
        </ul>`;
    }

    render() {
        return html`
            <h1>Merch at Scale Studio</h1>
            <div>
                <sp-search
                    placeholder="Search"
                    @input="${this.handleSearch}"
                    @submit="${this.handleSearch}"
                    value=${this.searchText}
                    size="m"
                ></sp-search>
                <sp-picker
                    label="Fragment model"
                    size="m"
                    value=${this.store.search.modelId}
                >
                    <sp-menu-item value="all">All</sp-menu-item>
                    <sp-menu-item
                        value="L2NvbmYvc2FuZGJveC9zZXR0aW5ncy9kYW0vY2ZtL21vZGVscy9tZXJjaC1jYXJk"
                        >Merch Card</sp-menu-item
                    >
                </sp-picker>
                <sp-button
                    ?disabled="${!this.searchText}"
                    @click=${this.doSearch}
                    >Search</sp-button
                >
            </div>
            ${this.result} ${this.fragmentEditor} ${this.selectFragmentDialog}
        `;
    }

    async startDeeplink() {
        this.deeplinkDisposer = deeplink(({ path, modelId, query }) => {
            this.searchText = query;
            this.store.search.update({ path, modelId });
        });
        if (this.searchText) {
            await this.updateComplete;
            this.doSearch();
        } else {
            this.store.search.setResult([]);
        }
    }

    /**
     * @param {Event} e click event, maybe null
     * @param {Fragment} fragment
     * @param {boolean} force - discard unsaved changes
     */
    async editFragment(e, fragment, force = false) {
        if (e) {
            const merchCard = e.target.closest('merch-card');
            const { offsetTop, offsetLeft, offsetWidth } = merchCard;
            this.fragmentOffsets = [
                `${offsetTop}px`,
                `${offsetLeft + offsetWidth + 32}px`,
            ];
        }
        if (fragment && fragment === this.store.fragment) return;
        if (this.store.fragment?.hasChanges && !force) {
            this.fragment = fragment;
            this.confirmSelect = true;
        } else {
            this.store.selectFragment(fragment);
            this.fragment = undefined;
            this.confirmSelect = false;
            await this.updateComplete;
            this.fragmentEditorEl.style.top = this.fragmentOffsets[0];
            this.fragmentEditorEl.style.left = this.fragmentOffsets[1];
        }
    }

    updateFragment(e) {
        const fieldName = e.target.dataset.field;
        let { value } = e.target;
        if (e.target.multiline) {
            value = value.split('\n');
        }
        this.store.fragment[fieldName] = value;
        const merchDataSource = this.querySelector(
            `merch-datasource[path="${this.store.fragment.path}"]`,
        );
        merchDataSource.refresh(false);
    }

    closeConfirmSelect() {
        this.confirmSelect = false;
    }

    /**
     * @param {Event} e;
     */
    handleSearch(e) {
        this.searchText = this.search.value;
        if (e.type === EVENT_SUBMIT) {
            e.preventDefault();
            this.doSearch();
        }
    }

    async doSearch() {
        const query = this.searchText;
        const modelId = this.picker.value.replace('all', '');
        const path = '/content/dam/sandbox/mas';
        const search = { query, path, modelId };
        pushState(search);
        this.store.doSearch(search);
    }

    editorActionClickHandler(e) {
        const ostRoot = document.getElementById('ost');
        const accessToken = adobeIMS.getAccessToken().token;
        const closeDialog = openAsDialog(ostRoot, console.log, {
            zIndex: 20,
            accessToken,
        });
    }
}

customElements.define('mas-studio', MasStudio);
