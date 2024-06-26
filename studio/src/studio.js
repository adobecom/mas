import { html, css, LitElement, nothing } from 'lit';
import { Store } from './store/Store.js';
import { EVENT_SUBMIT } from './events.js';
import { repeat } from 'lit/directives/repeat.js';
import { Reaction } from 'mobx';
import { MobxReactionUpdateCustom } from '@adobe/lit-mobx/lib/mixin-custom.js';

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
        searchText: { type: String },
        store: { type: Object },
        bucket: { type: String, attribute: 'aem-bucket' },
    };

    constructor() {
        super();
    }

    connectedCallback() {
        super.connectedCallback();
        this.store = new Store({ bucket: this.bucket });
    }

    get search() {
        return this.shadowRoot.querySelector('sp-search');
    }

    get picker() {
        return this.shadowRoot.querySelector('sp-picker');
    }

    get result() {
        if (!this.store.search?.result) return nothing;
        return html`<ul>
            ${repeat(
                this.store.search.result,
                (item) => item.path,
                (item) => html` ${item.title}`,
            )}
        </ul>`;
    }

    render() {
        return html`
            <sp-theme color="light" scale="medium">
                <h1>Merch at Scale Hub</h1>
                <div>
                    <sp-search
                        placeholder="Search"
                        @input="${this.handleSearch}"
                        @submit="${this.handleSearch}"
                        value=""
                        size="m"
                    ></sp-search>
                    <sp-picker label="Fragment model" size="m">
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
            </sp-theme>
        `;
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
        const query = encodeURIComponent(this.searchText);
        const modelId = encodeURIComponent(this.picker.value);
        const path = '/content/dam/sandbox/mas';
        this.store.doSearch({ query, path, modelId });
    }
}

customElements.define('mas-studio', MasStudio);
