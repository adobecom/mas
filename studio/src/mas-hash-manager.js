import { LitElement, nothing } from 'lit';
import StoreController from './reactivity/store-controller.js';
import Store from './store.js';
import { setHashParams } from './utils.js';
import MasSearch from './entities/search.js';
import MasFilters from './entities/filters.js';
import { WCS_ENV_STAGE } from './constants.js';

class MasHashManager extends LitElement {
    constructor() {
        super();
        this.syncStore = this.syncStore.bind(this);
        this.getHashFromStore = this.getHashFromStore.bind(this);
    }

    filters = new StoreController(this, Store.filters);
    search = new StoreController(this, Store.search);
    commerceEnv = new StoreController(this, Store.commerceEnv);

    connectedCallback() {
        super.connectedCallback();
        window.addEventListener('hashchange', this.syncStore);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        window.removeEventListener('hashchange', this.syncStore);
    }

    update() {
        super.update();
        this.syncHash();
    }

    syncStore() {
        const hash = window.location.hash.slice(1);
        if (hash === this.getHashFromStore()) return;
        // Update search
        const newSearch = MasSearch.fromHash();
        if (!newSearch.equals(this.search.value)) Store.search.set(newSearch);
        // Update filters
        const newFilters = MasFilters.fromHash();
        if (!newFilters.equals(this.filters.value))
            Store.filters.set(newFilters);
    }

    syncHash() {
        const newHash = this.getHashFromStore();
        window.location.hash = newHash;
    }

    getHashFromStore() {
        const params = new URLSearchParams(window.location.hash.slice(1));
        setHashParams(params, this.search.value);
        setHashParams(params, this.filters.value);
        const isCommerceStage = this.commerceEnv.value === WCS_ENV_STAGE;
        setHashParams(params, {
            'commerce.env': isCommerceStage ? this.commerceEnv.value : null,
        });
        return params.toString();
    }

    render() {
        return nothing;
    }
}

customElements.define('mas-hash-manager', MasHashManager);
