import { html, LitElement, nothing } from 'lit';
import { EVENT_CHANGE, EVENT_SUBMIT } from './events.js';
import { deeplink, pushState } from './deeplink.js';
import './editor-panel.js';
import './editors/merch-card-editor.js';
import './rte/rte-field.js';
import './rte/rte-link-editor.js';
import './mas-top-nav.js';

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
        path: { type: String, state: true },
        variant: { type: String, state: true },
        newFragment: { type: Object, state: true },
        showEditorPanel: { type: Boolean, state: true },
    };

    constructor() {
        super();
        this.bucket = '';
        this.newFragment = null;
        this.variant = 'all';
        this.searchText = '';
        this.path = '';
        this.showEditorPanel = false;
        this.showToast = this.showToast.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        this.registerListeners();
        this.addEventListener('clear-search', this.clearSearch);
        this.addEventListener('search-fragments', this.doSearch);
        this.addEventListener('variant-changed', this.handleVariantChange);
        this.addEventListener(
            'search-text-changed',
            this.handleSearchTextChange,
        );
        this.startDeeplink();
    }

    registerListeners() {
        this.addEventListener(EVENT_LOAD_START, () => {
            this.requestUpdate();
        });
        this.addEventListener(EVENT_LOAD_END, () => this.requestUpdate());
        this.addEventListener(EVENT_CHANGE, () => {
            if (!this.fragment) this.showEditorPanel = false;
            else this.requestUpdate();
        });

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

    get search() {
        return this.contentNavigation?.toolbar?.search;
    }

    clearSearch() {
        this.searchText = '';
        pushState({
            query: undefined,
            path: this.path,
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
            this.source?.searchFragments();
        }
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
        return BUCKET_TO_ENV[this.bucket] || 'proxy';
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

    get content() {
        return html`
            <aem-fragments
                id="aem"
                base-url="${this.baseUrl}"
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

    get editorPanel() {
        if (!this.showEditorPanel) return nothing;
        return html`<editor-panel
            .showToast=${this.showToast}
            .fragment=${this.fragment}
            .source=${this.source}
            .bucket=${this.bucket}
            @close=${this.closeFragmentEditor}
        ></editor-panel>`;
    }

    customRenderItem(item) {
        if (!item) return html`<sp-table-cell></sp-table-cell>`;
        return html` <sp-table-cell>${item.variant}</sp-table-cell>`;
    }

    render() {
        return html`
            <mas-top-nav env="${this.env}"></mas-top-nav>
            <side-nav></side-nav>
            ${this.content}${this.editorPanel} ${this.toast}
            ${this.loadingIndicator}
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

    async closeFragmentEditor() {
        this.source?.fragment?.discardChanges();
        await this.source?.setFragment(null);
        this.showEditorPanel = false;
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
}

customElements.define('mas-studio', MasStudio);
