import { css, html, LitElement, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { EVENT_CHANGE, EVENT_LOAD } from '../events.js';

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
    }

    get currentRenderer() {
        return [...this.children].find((child) => child.canRender());
    }

    get searchInfo() {
        return html`<sp-icon-search></sp-icon-search> Search results for
            "${this.source.searchText}"`;
    }

    get breadcrumbs() {
        const path = this.source?.currentFolder?.path;
        if (!path) return nothing;
        const folders = path.split('/') ?? [];
        const breadcrumbs = folders.map((name) => {
            const [parent] = path.split(`/${name}/`);
            return html`<sp-breadcrumb-item
                value="${parent}/${name}"
                ?disabled=${this.inSelection || this.disabled}
                >${name}</sp-breadcrumb-item
            >`;
        });

        return html`<sp-breadcrumbs
            maxVisibleItems="10"
            @change=${this.handleBreadcrumbChange}
            value="${this.source.path}"
            >${breadcrumbs}</sp-breadcrumbs
        >`;
    }

    handleBreadcrumbChange(event) {
        this.source.path = event.detail.value;
        this.source.listFragments();
    }

    render() {
        return html`<div id="toolbar">
                ${this.source.searchText ? this.searchInfo : this.breadcrumbs}
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
