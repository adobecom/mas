import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import './mas-fragment-status.js';
import './render-view-item.js';
import { EVENT_CHANGE, EVENT_FRAGMENT_CHANGE, EVENT_LOAD } from '../events.js';

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
        this.handleFragmentChange = this.handleFragmentChange.bind(this);
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
        document.addEventListener(
            EVENT_FRAGMENT_CHANGE,
            this.handleFragmentChange,
        );
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(
            EVENT_FRAGMENT_CHANGE,
            this.handleFragmentChange,
        );
    }

    handleFragmentChange(e) {
        const {
            detail: {
                fragment: { id: fragmentId },
                selection,
            },
        } = e;
        if (!selection) {
            const aemFragment = this.querySelector(
                `aem-fragment[fragment="${fragmentId}"]`,
            )?.refresh(false);
        }
        this.querySelector(
            `render-view-item[fragment="${fragmentId}"]`,
        )?.requestUpdate();
    }

    async forceUpdate(e) {
        this.requestUpdate();
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
            (fragment) =>
                html`<render-view-item
                    fragment="${fragment.id}"
                    .fragment=${fragment}
                    @click="${this.handleClick}"
                    @mouseleave="${this.handleMouseLeave}"
                    @dblclick="${(e) => this.handleDoubleClick(e, fragment)}"
                ></render-view-item>`,
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
