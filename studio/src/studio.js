import { html, LitElement, nothing } from 'lit';
import { Store } from './store/Store.js';
import { EVENT_SUBMIT } from './events.js';
import { repeat } from 'lit/directives/repeat.js';
import { Reaction } from 'mobx';
import { MobxReactionUpdateCustom } from '@adobe/lit-mobx/lib/mixin-custom.js';
import {
    deeplink,
    pushState,
} from '@adobecom/milo/libs/features/mas/web-components/src/deeplink.js';
import { Fragment } from './store/Fragment.js';
import './editors/merch-card-editor.js';
import './rte-editor.js';

import { getOffferSelectorTool, openOfferSelectorTool } from './ost.js';

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
        variant: { type: String, state: true },
        newFragment: {
            type: Object,
            state: true,
        } /* display dialog to save changes before selecting a new fragment */,
    };

    constructor() {
        super();
        this.newFragment = null;
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
        return html`
            <sp-overlay type="modal" ?open=${this.fragment}>
                <sp-dialog-wrapper
                    headline="You have unsaved changes!"
                    underlay
                    @confirm=${() => this.saveAndEditFragment(this.newFragment)}
                    @secondary="${() =>
                        this.editFragment(this.newFragment, true)}"
                    @cancel="${this.closeConfirmSelect}"
                    confirm-label="Save"
                    secondary-label="Discard"
                    cancel-label="Cancel"
                >
                    <p>
                        Do you want to save your changes before selecting
                        another merch card?
                    </p>
                </sp-dialog-wrapper>
            </sp-overlay>
        `;
    }

    get fragmentEditorToolbar() {
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
                    @click="${this.saveFragment}"
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
                <sp-action-button
                    label="Clone"
                    value="clone"
                    @click="${this.copyFragment}"
                >
                    <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
                </sp-action-button>
                <sp-action-button
                    label="Publish"
                    value="publish"
                    @click="${this.publishFragment}"
                >
                    <sp-icon-publish-check slot="icon"></sp-icon-publish-check>
                </sp-action-button>
                <sp-action-button label="Unpublish" value="unpublish">
                    <sp-icon-publish-remove
                        slot="icon"
                    ></sp-icon-publish-remove>
                </sp-action-button>
                <sp-action-button
                    label="Open in Odin"
                    value="open"
                    @click="${this.openFragmentInOdin}"
                >
                    <sp-icon-open-in slot="icon"></sp-icon-open-in>
                </sp-action-button>
                <sp-action-button
                    label="Use"
                    value="use"
                    @click="${this.copyToUse}"
                >
                    <sp-icon-code slot="icon"></sp-icon-code>
                </sp-action-button>
                <sp-action-button
                    label="Delete fragment"
                    value="delete"
                    @click="${this.deleteFragment}"
                >
                    <sp-icon-delete-outline
                        slot="icon"
                    ></sp-icon-delete-outline>
                </sp-action-button>
            </sp-action-group>
            <sp-divider vertical></sp-divider>
            <sp-action-group>
                <sp-action-button
                    title="Close"
                    label="Close"
                    value="close"
                    @click="${this.closeFragmentEditor}"
                >
                    <sp-icon-close-circle slot="icon"></sp-icon-close-circle>
                </sp-action-button>
            </sp-action-group>
        </div>`;
    }

    get fragmentEditor() {
        return html`<sp-overlay type="manual" ?open=${this.store.isEditing}>
            <sp-popover id="editor">
                <sp-dialog no-divider>
                    ${this.store.fragment &&
                    html`
                        <merch-card-editor
                            .fragment=${this.store.fragment}
                            @ost-open="${this.openOfferSelectorTool}"
                            @update-fragment="${this.updateFragment}"
                        >
                        </merch-card-editor>
                        ${this.fragmentEditorToolbar}
                    `}
                </sp-dialog>
            </sp-popover>
        </sp-overlay>`;
    }

    get result() {
        if (this.store.search.result.length === 0) return nothing;
        // TODO make me generic
        return html`<ul id="result">
            ${repeat(
                this.store.search.result,
                (item) => item.path,
                (item) => {
                    switch (item.model.path) {
                        case models.merchCard.path:
                            return html`<merch-card
                                class="${item.isSelected ? 'selected' : ''}"
                                @dblclick="${(e) =>
                                    this.editFragment(
                                        item,
                                        false,
                                        e.currentTarget,
                                    )}"
                            >
                                <merch-datasource
                                    aem-bucket="${this.bucket}"
                                    path="${item.path}"
                                ></merch-datasource>
                                <sp-status-light
                                    size="l"
                                    variant="${item.statusVariant}"
                                ></sp-status-light>
                            </merch-card>`;
                        default:
                            return nothing;
                    }
                },
            )}
        </ul>`;
    }

    render() {
        if (!this.store) return nothing;
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
                <sp-picker label="Card Variant" size="m" value=${this.variant}>
                    <sp-menu-item value="all">All</sp-menu-item>
                    <sp-menu-item value="special-offers"
                        >Special Offers</sp-menu-item
                    >
                    <sp-menu-item value="ccd-action">CCD Action</sp-menu-item>
                    <sp-menu-item value="catalog">Catalog</sp-menu-item>
                </sp-picker>
                <sp-button
                    ?disabled="${!this.searchText}"
                    @click=${this.doSearch}
                    >Search</sp-button
                >
            </div>
            ${this.result} ${this.fragmentEditor} ${this.selectFragmentDialog}
            ${this.toast} ${this.loadingIndicator} ${getOffferSelectorTool()}
        `;
    }

    get toast() {
        return html`<sp-toast timeout="6000" popover></sp-toast>`;
    }

    get loadingIndicator() {
        if (!this.store.loading) return nothing;
        return html`<sp-progress-circle
            indeterminate
            size="l"
        ></sp-progress-circle>`;
    }

    get toastEl() {
        return this.querySelector('sp-toast');
    }

    async startDeeplink() {
        this.deeplinkDisposer = deeplink(async ({ variant, query }) => {
            this.searchText = query;
            this.variant = variant;
            await this.updateComplete;
            this.doSearch();
        });
        if (!this.searchText) {
            this.store.search.setResult([]);
        }
    }

    showToast(message, variant = 'info') {
        this.toastEl.innerHTML = message;
        this.toastEl.variant = variant;
        this.toastEl.open = true;
        this.toastEl.showPopover();
    }

    /**
     * @param {Fragment} fragment
     * @param {boolean} force - discard unsaved changes
     */
    async editFragment(fragment, force) {
        if (fragment && fragment === this.store.fragment) return;
        if (this.store.fragment?.hasChanges && !force) {
            this.newFragment = fragment;
        } else {
            await this.store.selectFragment(fragment);
            this.newFragment = null;
        }
    }

    async saveAndEditFragment(fragment) {
        await this.saveFragment();
        await this.editFragment(fragment, true);
    }

    async adjustEditorPosition() {
        await this.updateComplete;
        const target = this.querySelector('merch-card.selected');
        if (target === null) return;
        // reposition the editor
        const viewportCenterX = window.innerWidth / 2;
        const [left, right] =
            target.offsetLeft < viewportCenterX
                ? ['inherit', '1em']
                : ['1em', 'inherit'];
        this.style.setProperty('--editor--left', left);
        this.style.setProperty('--editor--right', right);
        const viewportCenterY = window.innerHeight / 2;
        const [top, bottom] =
            target.offsetTop < viewportCenterY
                ? ['inherit', '1em']
                : ['1em', 'inherit'];
        this.style.setProperty('--editor--top', top);
        this.style.setProperty('--editor--bottom', bottom);
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        this.adjustEditorPosition();
    }

    updateFragment({ detail: e }) {
        const fieldName = e.target.dataset.field;
        let value = e.target.value || e.detail?.value;
        value = e.target.multiline ? value?.split(',') : [value ?? ''];
        if (this.store.fragment.updateField(fieldName, value)) {
            const merchDataSource = this.querySelector(
                `merch-datasource[path="${this.store.fragment.path}"]`,
            );
            merchDataSource.refresh(false);
        }
    }

    async saveFragment() {
        this.showToast('Saving fragment...');
        try {
            await this.store.saveFragment();
            this.showToast('Fragment saved', 'positive');
        } catch (e) {
            this.showToast('Fragment could not be  saved', 'negative');
        }
    }

    async copyFragment() {
        this.showToast('Cloning fragment...');
        try {
            await this.store.copyFragment();
            this.showToast('Fragment cloned', 'positive');
        } catch (e) {
            this.showToast('Fragment could not be cloned', 'negative');
        }
    }

    async closeFragmentEditor() {
        await this.store.selectFragment();
    }

    closeConfirmSelect() {
        this.newFragment = null;
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
        const variant = this.picker.value.replace('all', '');
        const path = '/content/dam/mas';
        const search = { query, path, variant };
        pushState(search);
        this.store.doSearch(search);
    }

    openFragmentInOdin() {
        // TODO make me generic
        window.open(
            `https://experience.adobe.com/?repo=${this.bucket}.adobeaemcloud.com#/@odin02/aem/cf/admin/?appId=aem-cf-admin&q=${this.store.fragment.fragmentName}`,
            '_blank',
        );
    }

    async publishFragment() {
        this.showToast('Publishing fragment...');
        try {
            await this.store.publishFragment();
            this.showToast('Fragment published', 'positive');
        } catch (e) {
            this.showToast('Fragment could not be published', 'negative');
        }
    }

    async deleteFragment() {
        // uncomment to use the feature  :)
        this.store.deleteFragment();
    }

    async copyToUse() {
        const code = `<merch-card><merch-datasource path="${this.store.fragment.path}"></merch-datasource></merch-card>`;
        const link = document.createElement('a');
        link.href = `https://www.adobe.com/mas/studio.html#path=${this.store.fragment.path}`;
        link.innerHTML =
            '<strong>Merch Card</strong>: ' + this.store.fragment.path;
        const linkBlob = new Blob([link.outerHTML], { type: 'text/html' });
        const textBlob = new Blob([code], { type: 'text/plain' });
        const data = [
            new ClipboardItem({
                [linkBlob.type]: linkBlob,
                [textBlob.type]: textBlob,
            }),
        ];
        navigator.clipboard.write(data, console.debug, console.error);
    }

    openOfferSelectorTool(e) {
        openOfferSelectorTool(e, e.target, this.store.fragment.variant);
    }
}

customElements.define('mas-studio', MasStudio);
