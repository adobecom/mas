import { html, LitElement, nothing } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import './render-view-item.js';
import { litObserver } from 'picosm';

const MODE = 'render';

const models = {
    merchCard: {
        path: '/conf/mas/settings/dam/cfm/models/card',
        name: 'Merch Card',
    },
};

class RenderView extends LitElement {
    static get properties() {
        return {
            store: { type: Object, state: true },
        };
    }

    createRenderRoot() {
        return this;
    }

    render() {
        if (this.parentElement.mode !== MODE) return nothing;
        return html` ${repeat(
            this.store.fragments,
            (fragment) => fragment.id,
            (fragment) =>
                html`<render-view-item
                    .store=${this.store}
                    .fragment=${fragment}
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

customElements.define('render-view', litObserver(RenderView, ['store']));
