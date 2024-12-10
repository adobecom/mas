import { html, LitElement, nothing } from 'lit';
import { EVENT_CHANGE, EVENT_SUBMIT } from './events.js';
import { deeplink, pushState } from './deeplink.js';
import './editor-panel.js';
import './editors/merch-card-editor.js';
import './rte/rte-field.js';
import './rte/rte-link-editor.js';
import './mas-top-nav.js';
import './mas-recently-updated.js';
import './mas-folder-picker.js';
import { contentIcon } from './img/content-icon.js';
import { promosIcon } from './img/promos-icon.js';
import { ostIcon } from './img/ost-icon.js';
import { openOfferSelectorTool } from './rte/ost.js';

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
        showSplash: { type: Boolean, state: true },
    };

    constructor() {
        super();
        this.bucket = '';
        this.newFragment = null;
        this.variant = 'all';
        this.searchText = '';
        this.path = '';
        this.showEditorPanel = false;
        this.showSplash = true;
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
            changedProperties.has('variant') ||
            changedProperties.has('showSplash')
        ) {
            // Force search or reload when splash screen is toggled off
            if (!this.showSplash && this.source) {
                this.source.searchFragments();
            }
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
            <content-navigation
                class="${this.showSplash ? 'hide' : 'show'}"
                source="aem"
                ?disabled=${this.fragment}
            >
                <table-view .customRenderItem=${this.customRenderItem}>
                    <sp-table-head-cell slot="headers"
                        >Variant</sp-table-head-cell
                    >
                </table-view>
                <render-view></render-view>
            </content-navigation>
        `;
    }

    get recentlyUpdated() {
        return html`<mas-recently-updated
            source="aem"
            base-url="${this.baseUrl}"
            path="${this.path}"
        >
        </mas-recently-updated>`;
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

    goToContent() {
        this.showSplash = false;
        this.requestUpdate();
    }

    openOst() {
        openOfferSelectorTool();
    }

    handleHomeClick() {
        this.showSplash = true;
        this.requestUpdate();
    }

    renderSplashScreen() {
        return html`
            <div
                class="${this.showSplash ? 'show' : 'hide'}"
                id="splash-container"
            >
                <h1>Welcome, Axel</h1>
                <div class="quick-actions">
                    <h2>Quick Actions</h2>
                    <div class="actions-grid">
                        <div
                            class="quick-action-card"
                            @click=${this.goToContent}
                            heading="Go to Content"
                        >
                            <div slot="cover-photo">${contentIcon}</div>
                            <div slot="heading">Go To Content</div>
                        </div>
                        <div
                            class="quick-action-card"
                            @click=${this.viewPromotions}
                        >
                            <div slot="cover-photo">${promosIcon}</div>
                            <div slot="heading">View Promotions</div>
                        </div>
                        <div class="quick-action-card" @click=${this.openOst}>
                            <div slot="cover-photo">${ostIcon}</div>
                            <div slot="heading">Open Offer Selector Tool</div>
                        </div>
                    </div>
                </div>
                <div class="recently-updated">${this.recentlyUpdated}</div>
            </div>
        `;
    }

    render() {
        return html`
            <mas-top-nav env="${this.env}"></mas-top-nav>
            <div class="studio-content">
                <side-nav>
                    <div class="dropdown-container">
                        <mas-folder-picker
                            @picker-change=${this.handleFolderChange}
                        ></mas-folder-picker>
                    </div>
                    <sp-sidenav>
                        <sp-sidenav-item
                            label="Home"
                            value="home"
                            @click="${this.handleHomeClick}"
                            selected
                        >
                            <sp-icon-home slot="icon"></sp-icon-home>
                        </sp-sidenav-item>

                        <sp-sidenav-item label="Promotions" value="promotions">
                            <sp-icon-promote slot="icon"></sp-icon-promote>
                        </sp-sidenav-item>

                        <sp-sidenav-item label="Reporting" value="reporting">
                            <sp-icon-graph-bar-vertical
                                slot="icon"
                            ></sp-icon-graph-bar-vertical>
                        </sp-sidenav-item>

                        <sp-sidenav-divider></sp-sidenav-divider>

                        <sp-sidenav-item label="Support" value="support">
                            <sp-icon-help slot="icon"></sp-icon-help>
                        </sp-sidenav-item>
                    </sp-sidenav>
                </side-nav>
                <div class="content-container">
                    ${this.renderSplashScreen()}
                    <div class="content">
                        ${this.content} ${this.editorPanel}
                        ${this.selectFragmentDialog} ${this.toast}
                        ${!this.showSplash ? this.loadingIndicator : nothing}
                    </div>
                </div>
            </div>
            <side-nav></side-nav>
        `;
    }

    get toast() {
        return html`<sp-toast timeout="6000" popover></sp-toast>`;
    }

    handleFolderChange(event) {
        const selectedValue = event.detail.value;
        document.dispatchEvent(
            new CustomEvent('folder-change', {
                detail: { value: selectedValue },
            }),
        );
        this.bucket = selectedValue;
        this.requestUpdate();
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
