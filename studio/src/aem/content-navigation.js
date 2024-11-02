import { css, html, LitElement } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { EVENT_CHANGE, EVENT_LOAD } from '../events.js';
import { deeplink } from '../deeplink.js';

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

            sp-tabs {
                margin-left: 32px;
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
            disabled: { type: Boolean, attribute: true },
            inSelection: {
                type: Boolean,
                attribute: 'in-selection',
                reflect: true,
            },
        };
    }

    constructor() {
        super();
        this.mode = sessionStorage.getItem(MAS_RENDER_MODE) ?? 'render';
        this.inSelection = false;
        this.disabled = false;
        this.forceUpdate = this.forceUpdate.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        this.registerToSource();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.unregisterFromSource();
    }

    registerToSource() {
        this.source = document.getElementById(this.getAttribute('source'));
        if (!this.source) return;
        this.source.addEventListener(EVENT_LOAD, this.forceUpdate);
        this.source.addEventListener(EVENT_CHANGE, this.forceUpdate);
        this.source.getTopFolders().then((folders) => {
            this.topFolders = folders;
        });
    }

    openTab(tab) {
        if (!tab) return;
        this.source.path = tab;
        this.source.openFolder(tab);
        this.source.searchFragments();
    }

    handleTabChange(event) {
        this.openTab(event.target.selected);
    }

    get tabs() {
        return this.shadowRoot.querySelector('sp-tabs');
    }

    toggleTabDisabled(disabled) {
        this.tabs.disabled = disabled;
        this.tabs.querySelectorAll('sp-tab').forEach((tab) => {
            tab.disabled = disabled;
        });
    }

    renderTabs() {
        if (!this.topFolders) return '';
        let initialSelection;
        deeplink(({ path }) => {
            initialSelection = path?.split('/')?.pop();
        });
        const selected =
            initialSelection && this.topFolders.includes(initialSelection)
                ? initialSelection
                : 'ccd';
        return html`<sp-tabs
            @change=${this.handleTabChange}
            emphasized
            size="l"
            selected="${selected}"
        >
            ${this.topFolders.map(
                (folder) =>
                    html`<sp-tab
                        label=${folder.toUpperCase()}
                        value=${folder}
                    ></sp-tab>`,
            )}
        </sp-tabs>`;
    }

    async forceUpdate() {
        this.requestUpdate();
    }

    unregisterFromSource() {
        this.source?.removeEventListener(EVENT_LOAD, this.forceUpdate);
        this.source?.removeEventListener(EVENT_CHANGE, this.forceUpdate);
    }

    updated(changedProperties) {
        if (changedProperties.size === 0) return;
        if (changedProperties.has('mode')) {
            sessionStorage.setItem(MAS_RENDER_MODE, this.mode);
        }
        this.forceUpdate();
        this.openTab(this.tabs?.selected);
    }

    get currentRenderer() {
        return [...this.children].find((child) => child.canRender());
    }

    get searchInfo() {
        return html`<sp-icon-search></sp-icon-search> Search results for
            "${this.source.searchText}"`;
    }

    render() {
        return html`${this.renderTabs()}
            <div id="toolbar">
                ${this.source.searchText ? this.searchInfo : ''}
                <div class="divider"></div>
                ${this.actions}
            </div>
            ${this.selectionActions}
            <slot></slot> `;
    }

    toggleSelectionMode(force) {
        this.inSelection = force !== undefined ? force : !this.inSelection;
        if (!this.inSelection) {
            this.source.clearSelection();
        }
        this.toggleTabDisabled(this.inSelection);
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
            >
                <sp-icon-duplicate slot="icon"></sp-icon-duplicate>
            </sp-action-button>
            <sp-action-button
                slot="buttons"
                style=${hasSelection}
                label="Delete"
            >
                <sp-icon-delete-outline slot="icon"></sp-icon-delete-outline>
            </sp-action-button>
            <sp-action-button
                slot="buttons"
                style=${hasSelection}
                label="Publish"
            >
                <sp-icon-publish-check slot="icon"></sp-icon-publish-check>
            </sp-action-button>
            <sp-action-button
                slot="buttons"
                style=${hasSelection}
                label="Unpublish"
            >
                <sp-icon-publish-remove slot="icon"></sp-icon-publish-remove>
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
        return html`<sp-action-group emphasized>
            <slot name="toolbar-actions"></slot>
            <sp-action-button emphasized style=${inNoSelectionStyle}>
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
