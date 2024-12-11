import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { EVENT_CHANGE, EVENT_LOAD } from '../events.js';
import '../mas-fragment-status.js';

const MODE = 'render';

const models = {
    merchCard: {
        path: '/conf/mas/settings/dam/cfm/models/card',
        name: 'Merch Card',
    },
};

class RenderView extends LitElement {
    constructor() {
        super();
        this.forceUpdate = this.forceUpdate.bind(this);
        this.tooltipTimeout = null;
    }

    createRenderRoot() {
        return this;
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener('click', (e) => {
            e.preventDefault(); // prevent following links.
        });
        this.parentElement.addEventListener(EVENT_CHANGE, this.forceUpdate);
        this.parentElement.source.addEventListener(
            EVENT_LOAD,
            this.forceUpdate,
        );
        this.parentElement.source.addEventListener(
            EVENT_CHANGE,
            this.forceUpdate,
        );
    }

    async forceUpdate(e) {
        this.requestUpdate();
    }

    renderItem(fragment) {
        const selected =
            this.parentElement.source.selectedFragments.includes(fragment);
        return html`<div class="render-card">
            <div class="render-card-header">
                <div class="render-card-actions"></div>
                <mas-fragment-status
                    variant=${fragment.statusVariant}
                ></mas-fragment-status>
            </div>
            <overlay-trigger placement="top"
                ><merch-card
                    class="${selected ? 'selected' : ''}"
                    slot="trigger"
                    @click="${this.handleClick}"
                    @mouseleave="${this.handleMouseLeave}"
                    @dblclick="${(e) => this.handleDoubleClick(e, fragment)}"
                >
                    <aem-fragment
                        fragment="${fragment.id}"
                        ims
                        author
                    ></aem-fragment>
                    <div
                        class="overlay"
                        @click="${() => fragment.toggleSelection()}"
                    >
                        ${selected
                            ? html`<sp-icon-remove
                                  slot="icon"
                              ></sp-icon-remove>`
                            : html`<sp-icon-add slot="icon"></sp-icon-add>`}
                    </div>
                </merch-card>
                <sp-tooltip slot="hover-content" placement="top"
                    >Double click the card to start editing.</sp-tooltip
                >
            </overlay-trigger>
        </div>`;
    }

    handleClick(e) {
        if (this.parentElement.inSelection) return;
        clearTimeout(this.tooltipTimeout);
        const currentTarget = e.currentTarget;
        this.tooltipTimeout = setTimeout(() => {
            currentTarget.classList.add('has-tooltip');
        }, 500);
    }

    handleMouseLeave(e) {
        if (this.parentElement.inSelection) return;
        clearTimeout(this.tooltipTimeout);
        e.currentTarget.classList.remove('has-tooltip');
    }

    handleDoubleClick(e, fragment) {
        if (this.parentElement.inSelection) return;
        clearTimeout(this.tooltipTimeout);
        e.currentTarget.classList.remove('has-tooltip');
        this.parentElement.source.selectFragment(
            e.clientX,
            e.clientY,
            fragment,
        );
    }

    canRender() {
        return (
            this.parentElement?.mode === MODE &&
            this.parentElement.source?.fragments
        );
    }

    render() {
        if (!this.canRender()) return nothing;
        // TODO make me generic
        return html` ${repeat(
            this.parentElement.source.fragments,
            (fragment) => fragment.path,
            (fragment) => {
                switch (fragment.model.path) {
                    case models.merchCard.path:
                        return this.renderItem(fragment);
                    default:
                        return nothing;
                }
            },
        )}`;
    }

    get actionData() {
        return [
            MODE,
            'Render view',
            html`<sp-icon-view-card slot="icon"></sp-icon-view-card>`,
        ];
    }
}

customElements.define('render-view', RenderView);
