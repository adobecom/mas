import { html, LitElement, css } from 'lit';
import { pushStateFromComponent, parseState } from './deeplink';
import { debounce } from './utils';
import { deeplink } from './deeplink.js';

export class MerchSearch extends LitElement {
    static properties = {
        deeplink: { type: String },
    };

    get search() {
        return this.querySelector(`sp-search`);
    }

    constructor() {
        super();
        this.handleInput = () =>
            pushStateFromComponent(this, this.search.value);
        this.handleInputDebounced = debounce(this.handleInput.bind(this));
    }

    connectedCallback() {
        super.connectedCallback();
        if (!this.search) return;
        this.search.addEventListener('input', this.handleInputDebounced);
        this.search.addEventListener('change', this.handleInputDebounced);
        this.search.addEventListener('submit', this.handleInputSubmit);
        this.updateComplete.then(() => {
            this.setStateFromURL();
        });
        this.startDeeplink();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.search.removeEventListener('input', this.handleInputDebounced);
        this.search.removeEventListener('change', this.handleInputDebounced);
        this.search.removeEventListener('submit', this.handleInputSubmit);
        this.stopDeeplink?.();
    }

    /*
     * set the state of the search based on the URL
     */
    setStateFromURL() {
        const state = parseState();
        const value = state[this.deeplink];
        if (value) {
            this.search.value = value;
        }
    }

    startDeeplink() {
        this.stopDeeplink = deeplink(({ search }) => {
            this.search.value = search ?? '';
        });
    }

    handleInputSubmit(event) {
        event.preventDefault();
    }

    render() {
        return html`<slot></slot>`;
    }
}

customElements.define('merch-search', MerchSearch);
