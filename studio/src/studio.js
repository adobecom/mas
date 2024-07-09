import { html, css, LitElement, nothing } from 'lit';
import { Store } from './store/Store.js';
import { EVENT_SUBMIT } from './events.js';
import { repeat } from 'lit/directives/repeat.js';
import { Reaction } from 'mobx';
import { MobxReactionUpdateCustom } from '@adobe/lit-mobx/lib/mixin-custom.js';
import { deeplink, pushState } from '@adobe/mas-commons';

const models = {
    merchCard: {
        path: '/conf/sandbox/settings/dam/cfm/models/merch-card',
        name: 'Merch Card',
    },
};
class MasStudio extends MobxReactionUpdateCustom(LitElement, Reaction) {
    static styles = css`
        :host {
            display: block;
        }

        sp-theme {
            display: contents;
        }
    `;

    static properties = {
        store: { type: Object },
        bucket: { type: String, attribute: 'aem-bucket' },
        searchText: { type: String },
    };

    constructor() {
        super();
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
        return this.shadowRoot.querySelector('sp-search');
    }

    get picker() {
        return this.shadowRoot.querySelector('sp-picker');
    }

    get result() {
        if (this.store.search.result.length === 0) return nothing;
        return html`<ul>
            ${repeat(
                this.store.search.result,
                (item) => item.path,
                (item) => {
                    switch (item.model.path) {
                        case models.merchCard.path:
                            return html`<merch-card>
                                <merch-datasource
                                    odin
                                    source="odin-author"
                                    path="${item.path}"
                                ></merch-datasource>
                            </merch-card>`;
                        default:
                            return nothing;
                    }
                },
            )}
        </ul>`;
    }

    render() {
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
                <sp-picker
                    label="Fragment model"
                    size="m"
                    value=${this.store.search.modelId}
                >
                    <sp-menu-item value="all">All</sp-menu-item>
                    <sp-menu-item
                        value="L2NvbmYvc2FuZGJveC9zZXR0aW5ncy9kYW0vY2ZtL21vZGVscy9tZXJjaC1jYXJk"
                        >Merch Card</sp-menu-item
                    >
                </sp-picker>
                <sp-button
                    ?disabled="${!this.searchText}"
                    @click=${this.doSearch}
                    >Search</sp-button
                >
            </div>
            ${this.result}
        `;
    }

    async startDeeplink() {
        this.deeplinkDisposer = deeplink(({ path, modelId, query }) => {
            this.searchText = query;
            this.store.search.update({ path, modelId });
        });
        if (this.searchText) {
            await this.updateComplete;
            this.doSearch();
        }
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
        const modelId = this.picker.value.replace('all', '');
        const path = '/content/dam/sandbox/mas';
        const search = { query, path, modelId };
        pushState(search);
        this.store.doSearch(search);
    }
}

customElements.define('mas-studio', MasStudio);
