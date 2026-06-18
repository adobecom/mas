import { LitElement, html, css } from 'lit';
import { store } from '../store/ost-store.js';
import { countries as staticCountries } from '../data/countries.js';

const COUNTRIES_API = 'https://countries-stage.adobe.io/v2/countries?api_key=dexter-commerce-offers';

function mapCountries(data) {
    return data.map((obj) => obj['iso2-code'] || obj).sort();
}

export class OstCountryPicker extends LitElement {
    static properties = {
        countries: { type: Array, state: true },
    };

    static styles = css`
        :host {
            font-family: inherit;
            display: block;
        }

        .picker-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            align-items: end;
        }

        .picker-group {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
        }

        .picker-label {
            font-size: 10px;
            font-weight: 600;
            color: #6e6e6e;
        }

        sp-picker {
            width: 100%;
        }

        .picker-env {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 8px;
        }

        sp-switch {
            --spectrum-switch-font-size: 11px;
        }
    `;

    constructor() {
        super();
        this.countries = mapCountries(staticCountries);
        this.handleStoreChange = this.handleStoreChange.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        store.subscribe(this.handleStoreChange);
        this.fetchCountries();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        store.unsubscribe(this.handleStoreChange);
    }

    handleStoreChange() {
        this.requestUpdate();
    }

    isLocalhost() {
        return window.location.hostname === 'localhost';
    }

    async fetchCountries() {
        if (this.isLocalhost()) {
            return;
        }
        try {
            const response = await fetch(COUNTRIES_API);
            if (!response.ok) {
                throw new Error(`Countries request failed (${response.status})`);
            }
            const data = await response.json();
            const fetched = mapCountries(data);
            if (!fetched.includes(store.country)) {
                fetched.push(store.country);
                fetched.sort();
            }
            this.countries = fetched;
        } catch {
            /* keep static fallback */
        }
    }

    handleLandscapeChange(e) {
        store.landscape = e.target.value;
        store.notify();
    }

    handleCountryChange(e) {
        store.setCountry(e.target.value);
    }

    handleEnvToggle(event) {
        const env = event.target.checked ? 'STAGE' : 'PRODUCTION';
        store.setEnv(env);
    }

    render() {
        const isStage = store.env === 'STAGE';

        return html`
            <div class="picker-grid">
                <div class="picker-group">
                    <span class="picker-label">Landscape</span>
                    <sp-picker
                        data-testid="ost-filter-landscape"
                        value=${store.landscape}
                        size="s"
                        label="Landscape"
                        @change=${this.handleLandscapeChange}
                    >
                        <sp-menu-item value="PUBLISHED">Published</sp-menu-item>
                        <sp-menu-item value="DRAFT">Draft</sp-menu-item>
                        <sp-menu-item value="BOTH">Both (published + draft)</sp-menu-item>
                    </sp-picker>
                </div>
                <div class="picker-group">
                    <span class="picker-label">Country</span>
                    <sp-picker
                        data-testid="ost-filter-country"
                        size="s"
                        label="Country"
                        value=${store.country}
                        @change=${this.handleCountryChange}
                    >
                        ${this.countries.map((code) => html`<sp-menu-item value=${code}>${code}</sp-menu-item>`)}
                    </sp-picker>
                </div>
            </div>
            <div class="picker-env">
                <sp-switch size="s" ?checked=${isStage} @change=${this.handleEnvToggle}>Stage</sp-switch>
            </div>
        `;
    }
}

customElements.define('ost-country-picker', OstCountryPicker);
