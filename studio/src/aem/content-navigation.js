import { css, html, LitElement, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { EVENT_CHANGE, EVENT_LOAD } from '../events.js';
import { deeplink, pushState } from '../deeplink.js';
import { getTopFolder } from './aem-fragments.js';
import './mas-filter-panel.js';
import './mas-filter-toolbar.js';

const MAS_RENDER_MODE = 'mas-render-mode';

class ContentNavigation extends LitElement {
    static get styles() {
        return css`
            :host {
                display: block;
                padding: 0 10px;
            }

            #toolbar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                height: 48px;
            }

            .divider {
                flex: 1;
            }

            sp-action-bar {
                display: none;
                flex: 1;
            }

            sp-action-bar[open] {
                display: flex;
            }
        `;
    }

    static get properties() {
        return {
            mode: { type: String, attribute: true, reflect: true },
            source: { type: Object, attribute: false },
            topFolders: { type: Array, attribute: false },
            fragmentFromIdLoaded: { type: Boolean },
            disabled: { type: Boolean, attribute: true },
            showFilterPanel: { type: Boolean, state: true },
            inSelection: {
                type: Boolean,
                attribute: 'in-selection',
                reflect: true,
            },
        };
    }

    #initFromFragmentId = false;
    #initialFolder;

    constructor() {
        super();
        this.mode = sessionStorage.getItem(MAS_RENDER_MODE) ?? 'render';
        this.inSelection = false;
        this.disabled = false;
        this.showFilterPanel = false;
        this.forceUpdate = this.forceUpdate.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('toggle-filter-panel', this.toggleFilterPanel);
        this.registerToSource();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.unregisterFromSource();
    }

    toggleFilterPanel() {
        this.showFilterPanel = !this.showFilterPanel;
    }

    handlerSourceLoad() {
        if (this.#initFromFragmentId) {
            this.#initialFolder = getTopFolder(this.source.fragments[0]?.path);
            this.fragmentFromIdLoaded = true;
        }
        this.forceUpdate();
    }

    registerToSource() {
        this.source = document.getElementById(this.getAttribute('source'));
        if (!this.source) return;
        this.deeplinkDisposer = deeplink(({ path, query }) => {
            this.#initialFolder =
                path !== '/content/dam/mas' ? path?.split('/')?.pop() : null;
            if (!this.#initialFolder && this.source.isFragmentId(query)) {
                document.querySelector('mas-studio').searchText = query;
                this.source.searchFragments();
                this.#initFromFragmentId = true;
            }
        });
        this.boundHandlerSourceLoad = this.handlerSourceLoad.bind(this);
        this.source.addEventListener(EVENT_LOAD, this.boundHandlerSourceLoad);
        this.source.addEventListener(EVENT_CHANGE, this.forceUpdate);
        this.source.getTopFolders().then((folders) => {
            this.topFolders = folders;
        });
    }

    async forceUpdate() {
        this.requestUpdate();
    }

    unregisterFromSource() {
        if (this.deeplinkDisposer) {
            this.deeplinkDisposer();
        }
        this.source?.removeEventListener(
            EVENT_LOAD,
            this.boundHandlerSourceLoad,
        );
        this.source?.removeEventListener(EVENT_CHANGE, this.forceUpdate);
    }

    selectTopFolder(topFolder) {
        if (!topFolder) return;
        this.source.path = topFolder;
        pushState({
            path: this.source.path,
            query: this.source.searchText,
        });
    }

    handleTopFolderChange(event) {
        this.selectTopFolder(event.target.value);
    }

    get topFolderPicker() {
        return this.shadowRoot.querySelector('sp-picker');
    }

    toggleTopFoldersDisabled(disabled) {
        this.topFolderPicker.disabled = disabled;
    }

    renderTopFolders() {
        if (!this.topFolders) return '';
        const initialValue =
            this.#initialFolder && this.topFolders.includes(this.#initialFolder)
                ? this.#initialFolder
                : 'ccd';
        return html`<sp-picker
            @change=${this.handleTopFolderChange}
            label="TopFolder"
            class="topFolder"
            size="m"
            value="${initialValue}"
        >
            ${this.topFolders.map(
                (folder) =>
                    html`<sp-menu-item value="${folder}">
                        ${folder.toUpperCase()}
                    </sp-menu-item>`,
            )}
        </sp-picker>`;
    }

    updated(changedProperties) {
        if (changedProperties.size === 0) return;
        if (changedProperties.has('mode')) {
            sessionStorage.setItem(MAS_RENDER_MODE, this.mode);
        }
        this.forceUpdate();
        this.selectTopFolder(this.topFolderPicker?.value);
    }

    get currentRenderer() {
        return [...this.children].find((child) => child.canRender());
    }

    get toolbar() {
        return this.shadowRoot.querySelector('mas-filter-toolbar');
    }

    get searchInfo() {
        return html`<sp-icon-search></sp-icon-search> Search results for
            "${this.source.searchText}"`;
    }

    render() {
        if (this.#initFromFragmentId && !this.#initialFolder) return '';
        this.#initFromFragmentId = false;
        return html`<div id="toolbar">
                ${this.renderTopFolders()}
                <div class="divider"></div>
                ${this.actions}
            </div>
            ${this.showFilterPanel
                ? html`<mas-filter-panel
                      source="${this.getAttribute('source')}"
                  ></mas-filter-panel>`
                : nothing}
            ${this.selectionActions}
            ${this.source.searchText ? this.searchInfo : ''}
            <slot></slot> `;
    }

    toggleSelectionMode(force) {
        this.inSelection = force !== undefined ? force : !this.inSelection;
        if (!this.inSelection) {
            this.source.clearSelection();
        }
        this.toggleTopFoldersDisabled(this.inSelection);
        this.notify();
    }

    get selectionCount() {
        return this.source.selectedFragments.length ?? 0;
    }

    get selectionActions() {
        const hasSingleSelection = styleMap({
            display: this.selectionCount === 1 ? 'flex' : 'none',
        });
        const hasSelection = styleMap({
            display: this.selectionCount > 0 ? 'flex' : 'none',
        });

        return html`<sp-action-bar
            emphasized
            ?open=${this.inSelection}
            variant="fixed"
            @close=${() => this.toggleSelectionMode(false)}
        >
            ${this.selectionCount} selected
            <sp-action-button
                slot="buttons"
                style=${hasSingleSelection}
                label="Duplicate"
                disabled
            >
                <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
                <sp-tooltip self-managed placement="top">Duplicate</sp-tooltip>
            </sp-action-button>
            <sp-action-button
                slot="buttons"
                style=${hasSelection}
                label="Delete"
                disabled
            >
                <sp-icon-delete-outline slot="icon"></sp-icon-delete-outline>
                <sp-tooltip self-managed placement="top">Delete</sp-tooltip>
            </sp-action-button>
            <sp-action-button
                slot="buttons"
                style=${hasSelection}
                label="Publish"
                disabled
            >
                <sp-icon-publish-check slot="icon"></sp-icon-publish-check>
                <sp-tooltip self-managed placement="top">Publish</sp-tooltip>
            </sp-action-button>
            <sp-action-button
                slot="buttons"
                style=${hasSelection}
                label="Unpublish"
                disabled
            >
                <sp-icon-publish-remove slot="icon"></sp-icon-publish-remove>
                <sp-tooltip self-managed placement="top">Unpublish</sp-tooltip>
            </sp-action-button>
        </sp-action-bar>`;
    }

    get renderActions() {
        return [...this.children]
            .filter((child) => child.actionData)
            .map(
                ({ actionData: [mode, label, icon] }) =>
                    html`<sp-menu-item value="${mode}"
                        >${icon} ${label}</sp-menu-item
                    >`,
            );
    }

    get actions() {
        const inNoSelectionStyle = styleMap({
            display: !this.disabled && !this.inSelection ? 'flex' : 'none',
        });
        return html`<mas-filter-toolbar
                searchText=${this.source.searchText}
            ></mas-filter-toolbar>
            <sp-action-group emphasized>
                <slot name="toolbar-actions"></slot>
                <sp-action-button
                    emphasized
                    style=${inNoSelectionStyle}
                    disabled
                >
                    <sp-icon-new-item slot="icon"></sp-icon-new-item>
                    Create New Card
                </sp-action-button>
                <sp-action-button
                    style=${inNoSelectionStyle}
                    @click=${this.toggleSelectionMode}
                >
                    <sp-icon-selection-checked
                        slot="icon"
                    ></sp-icon-selection-checked>
                    Select
                </sp-action-button>
                <sp-action-menu
                    style=${inNoSelectionStyle}
                    selects="single"
                    value="${this.mode}"
                    placement="left-end"
                    @change=${this.handleRenderModeChange}
                >
                    ${this.renderActions}
                </sp-action-menu>
            </sp-action-group>`;
    }

    handleRenderModeChange(e) {
        this.mode = e.target.value;
        this.notify();
    }

    notify() {
        this.dispatchEvent(new CustomEvent(EVENT_CHANGE));
    }
}

customElements.define('content-navigation', ContentNavigation);
