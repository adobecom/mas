import { html, LitElement, nothing } from 'lit';
import { EVENT_SUBMIT } from './events.js';
import { deeplink, pushState } from './deeplink.js';
import './editors/merch-card-editor.js';
import './rte/rte-field.js';
import './rte/rte-link-editor.js';
import './mas-top-nav.js';
import './mas-filter-panel.js';
import './mas-filter-toolbar.js';

const EVENT_LOAD_START = 'load-start';
const EVENT_LOAD_END = 'load-end';
const BUCKET_TO_ENV = {
    e155390: 'qa',
    e59471: 'stage',
    e59433: 'prod',
};

class MasStudio extends LitElement {
    static properties = {
        bucket: { type: String, attribute: 'aem-bucket' },
        searchText: { type: String, state: true },
        baseUrl: { type: String, attribute: 'base-url' },
        root: { type: String, state: true },
        path: { type: String, state: true },
        variant: { type: String, state: true },
        newFragment: { type: Object, state: true },
        showFilterPanel: { type: Boolean, state: true },
        showEditorPanel: { type: Boolean, state: true },
    };

    constructor() {
        super();
        this.bucket = 'e59433';
        this.newFragment = null;
        this.root = '/content/dam/mas';
        this.variant = 'all';
        this.searchText = '';
        this.path = '';
        this.showFilterPanel = false;
        this.showEditorPanel = false;
    }

    connectedCallback() {
        super.connectedCallback();
        this.registerListeners();
        this.startDeeplink();
        this.addEventListener('toggle-filter-panel', this.toggleFilterPanel);
        this.addEventListener('clear-search', this.clearSearch);
        this.addEventListener('search-fragments', this.doSearch);
        this.addEventListener('variant-changed', this.handleVariantChange);
        this.addEventListener(
            'search-text-changed',
            this.handleSearchTextChange,
        );
    }

    registerListeners() {
        this.addEventListener(EVENT_LOAD_START, () => {
            this.requestUpdate();
            this.updateDeeplink();
        });
        this.addEventListener(EVENT_LOAD_END, () => this.requestUpdate());

        // Listen for ESC key to close the fragment editor and quit selection mode
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeFragmentEditor();
                this.source.clearSelection();
                this.contentNavigation.toggleSelectionMode(false);
            }
        });

        this.addEventListener('select-fragment', (e) =>
            this.handleOpenFragment(e),
        );
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.deeplinkDisposer) {
            this.deeplinkDisposer();
        }
    }

    updateDeeplink() {
        const state = { ...this.source?.search };
        if (state.path === this.root) state.path = '';
        pushState(state);
    }

    toggleFilterPanel() {
        this.showFilterPanel = !this.showFilterPanel;
    }

    clearSearch() {
        this.searchText = '';
        pushState({
            query: undefined,
            path: undefined,
        });
    }

    handleSearchTextChange(e) {
        this.searchText = e.detail.searchText;
    }

    updated(changedProperties) {
        if (
            changedProperties.has('searchText') ||
            changedProperties.has('path') ||
            changedProperties.has('variant')
        ) {
            this.source?.sendSearch();
        }
    }

    get search() {
        return this.querySelector('sp-search');
    }

    get picker() {
        return this.querySelector('sp-picker');
    }

    get source() {
        return this.querySelector('aem-fragments');
    }

    get contentNavigation() {
        return this.querySelector('content-navigation');
    }

    get fragment() {
        return this.source?.fragment;
    }

    get env() {
        return BUCKET_TO_ENV[this.bucket] || BUCKET_TO_ENV.e59433;
    }

    createRenderRoot() {
        return this;
    }

    get selectFragmentDialog() {
        return html`
            ${this.newFragment
                ? html`<sp-overlay type="modal" open>
                      <sp-dialog-wrapper
                          headline="You have unsaved changes!"
                          underlay
                          @confirm=${() =>
                              this.saveAndEditFragment(this.newFragment)}
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
                  </sp-overlay>`
                : nothing}
        `;
    }

    get fragmentEditorToolbar() {
        return html`<div id="actions" slot="heading">
            <sp-action-group
                aria-label="Fragment actions"
                role="group"
                size="l"
                compact
                emphasized
                quiet
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
                    @click="${this.discardChanges}"
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
                <sp-action-button
                    label="Unpublish"
                    value="unpublish"
                    @click="${this.unpublishFragment}"
                >
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
            <sp-action-group size="l" quiet>
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
        if (!this.showEditorPanel) return nothing;
        return html`<div id="editor">
            ${this.fragment
                ? html`
                      ${this.fragmentEditorToolbar}
                      <merch-card-editor
                          .fragment=${this.fragment}
                          @refresh-fragment="${this.refreshFragment}"
                          @update-fragment="${this.updateFragment}"
                      >
                      </merch-card-editor>
                      <p>Fragment details (not shown on the card)</p>
                      <sp-divider size="s"></sp-divider>
                      <sp-field-label for="fragment-title"
                          >Fragment Title</sp-field-label
                      >
                      <sp-textfield
                          placeholder="Enter fragment title"
                          id="fragment-title"
                          data-field="title"
                          value="${this.fragment.title}"
                          @change="${this.updateFragmentInternal}"
                      ></sp-textfield>
                      <sp-field-label for="fragment-description"
                          >Fragment Description</sp-field-label
                      >
                      <sp-textfield
                          placeholder="Enter fragment description"
                          id="fragment-description"
                          data-field="description"
                          multiline
                          value="${this.fragment.description}"
                          @change="${this.updateFragmentInternal}"
                      ></sp-textfield>
                  `
                : nothing}
        </div>`;
    }

    get content() {
        return html`
            <aem-fragments
                id="aem"
                base-url="${this.baseUrl}"
                root="${this.root}"
                path="${this.path}"
                search="${this.searchText}"
                bucket="${this.bucket}"
                variant="${this.variant}"
            ></aem-fragments>
            <content-navigation source="aem" ?disabled=${this.fragment}>
                <table-view .customRenderItem=${this.customRenderItem}>
                    <sp-table-head-cell slot="headers"
                        >Variant</sp-table-head-cell
                    >
                </table-view>
                <render-view></render-view>
            </content-navigation>
        `;
    }

    customRenderItem(item) {
        if (!item) return html`<sp-table-cell></sp-table-cell>`;
        return html` <sp-table-cell>${item.variant}</sp-table-cell>`;
    }

    render() {
        return html`
            <mas-top-nav env="${this.env}"></mas-top-nav>
            <side-nav></side-nav>
            <mas-filter-toolbar></mas-filter-toolbar>
            ${this.showFilterPanel
                ? html`<mas-filter-panel></mas-filter-panel>`
                : nothing}
            ${this.content} ${this.fragmentEditor} ${this.selectFragmentDialog}
            ${this.toast} ${this.loadingIndicator}
        `;
    }

    get toast() {
        return html`<sp-toast timeout="6000" popover></sp-toast>`;
    }

    get loadingIndicator() {
        if (!this.source?.loading) return nothing;
        return html`<sp-progress-circle
            indeterminate
            size="l"
        ></sp-progress-circle>`;
    }

    get toastEl() {
        return this.querySelector('sp-toast');
    }

    startDeeplink() {
        this.deeplinkDisposer = deeplink(({ query, path }) => {
            this.searchText = query ?? '';
            this.path = path ?? '';
        });
    }

    showToast(message, variant = 'info') {
        const toast = this.toastEl;
        if (toast) {
            toast.textContent = message;
            toast.variant = variant;
            toast.open = true;
            toast.showPopover();
        }
    }

    /**
     * If the current fragment has unsaved changes, the user will be prompted to save them before editing the new fragment.
     * @param {Fragment} fragment
     * @param {boolean} force - discard unsaved changes
     */
    async editFragment(fragment, force = false) {
        if (fragment && fragment === this.fragment) {
            this.requestUpdate();
            return;
        }
        if (this.fragment?.hasChanges && !force) {
            this.newFragment = fragment;
        } else {
            this.newFragment = null;
            this.source?.setFragment(fragment);
        }
        this.requestUpdate();
    }

    async saveAndEditFragment(fragment) {
        await this.saveFragment();
        await this.editFragment(fragment, true);
    }

    async adjustEditorPosition(x) {
        await this.updateComplete;
        // reposition the editor
        const viewportCenterX = window.innerWidth / 2;
        const left = x > viewportCenterX ? '0' : 'inherit';
        const right = x <= viewportCenterX ? '0' : 'inherit';
        this.style.setProperty('--editor-left', left);
        this.style.setProperty('--editor-right', right);
    }

    async handleOpenFragment(e) {
        this.showEditorPanel = false;
        this.requestUpdate();
        await this.updateComplete;
        const { x, fragment } = e.detail;
        await this.adjustEditorPosition(x);
        this.showEditorPanel = true;
        await this.editFragment(fragment);
    }

    updateFragmentInternal(e) {
        const fieldName = e.target.dataset.field;
        let value = e.target.value;
        this.fragment.updateFieldInternal(fieldName, value);
    }

    updateFragment({ detail: e }) {
        if (!this.fragment) return;
        const fieldName = e.target.dataset.field;
        let value = e.target.value || e.detail?.value;
        value = e.target.multiline ? value?.split(',') : [value ?? ''];
        if (this.fragment.updateField(fieldName, value)) {
            this.fragmentElement?.refresh(false);
        }
    }

    get fragmentElement() {
        return this.querySelector(
            `aem-fragment[fragment="${this.fragment.id}"]`,
        );
    }

    /** Refresh the fragment with locally updated data and awaits until ready */
    async refreshFragment(e) {
        if (!this.fragmentElement) return;
        this.fragment.eventTarget ??= this.fragmentElement.parentElement;
        this.fragmentElement.refresh(false);
        await this.fragmentElement.updateComplete;
    }

    async saveFragment() {
        this.showToast('Saving fragment...');
        try {
            await this.source?.saveFragment();
            await this.refreshFragment();
            this.requestUpdate();
            this.showToast('Fragment saved', 'positive');
        } catch (e) {
            this.showToast('Fragment could not be saved', 'negative');
        }
    }

    async discardChanges() {
        await this.source?.discardChanges();
        this.showToast('Changes discarded', 'info');
    }

    async copyFragment() {
        this.showToast('Cloning fragment...');
        try {
            await this.source?.copyFragment();
            this.showToast('Fragment cloned', 'positive');
        } catch (e) {
            this.showToast('Fragment could not be cloned', 'negative');
        }
    }

    async closeFragmentEditor() {
        await this.source?.setFragment(null);
        this.showEditorPanel = false;
        this.requestUpdate();
    }

    closeConfirmSelect() {
        this.newFragment = null;
    }

    handleSearch(e) {
        this.searchText = this.search.value;
        if (!this.searchText) {
            pushState({
                query: undefined,
                path: undefined,
            });
        }
        if (e.type === EVENT_SUBMIT) {
            e.preventDefault();
            this.source?.searchFragments();
        }
    }

    handleVariantChange(e) {
        this.variant = e.target.value;
    }

    doSearch() {
        this.source?.searchFragments();
    }

    openFragmentInOdin() {
        window.open(
            `https://experience.adobe.com/?repo=${this.bucket}.adobeaemcloud.com#/@odin02/aem/cf/admin/?appId=aem-cf-admin&q=${this.fragment?.fragmentName}`,
            '_blank',
        );
    }

    async publishFragment() {
        this.showToast('Publishing fragment...');
        try {
            await this.source?.publishFragment();
            this.showToast('Publish request sent', 'positive');
        } catch (e) {
            this.showToast('Fragment could not be published', 'negative');
        }
    }

    async unpublishFragment() {
        this.showToast('Unpublishing fragment...');
        try {
            await this.source?.unpublishFragment();
            this.showToast('Unpublish request sent', 'positive');
        } catch (e) {
            this.showToast('Fragment could not be unpublished', 'negative');
        }
    }

    async deleteFragment() {
        if (confirm('Are you sure you want to delete this fragment?')) {
            try {
                await this.source?.deleteFragment();
                this.showToast('Fragment deleted', 'positive');
            } catch (e) {
                this.showToast('Fragment could not be deleted', 'negative');
            }
        }
    }

    async copyToUse() {
        const code = `<merch-card><aem-fragment fragment="${this.fragment?.id}"></aem-fragment></merch-card>`;
        try {
            await navigator.clipboard.writeText(code);
            this.showToast('Code copied to clipboard', 'positive');
        } catch (e) {
            this.showToast('Failed to copy code to clipboard', 'negative');
        }
    }
}

customElements.define('mas-studio', MasStudio);
