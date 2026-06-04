import { LitElement, html, css } from 'lit';
import { store } from '../store/ost-store.js';
import { countries as staticCountries } from '../data/countries.js';
import { HELP_TOOLTIPS } from '../data/help-content.js';
import './ost-help-icon.js';

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
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .picker-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .picker-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--spectrum-gray-600);
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        sp-picker {
            min-width: 80px;
        }

        sp-switch {
            --spectrum-switch-font-size: 11px;
        }

        .country-input {
            min-width: 72px;
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
                    class="country-input"
                    size="s"
                    label="Country"
                    value=${store.country}
                    @change=${this.handleCountryChange}
                >
                    ${this.countries.map((code) => html`<sp-menu-item value=${code}>${code}</sp-menu-item>`)}
                </sp-picker>
            </div>
            <sp-switch size="s" ?checked=${isStage} @change=${this.handleEnvToggle}>Stage</sp-switch>
            <ost-help-icon text="${HELP_TOOLTIPS.landscapeEnv}"></ost-help-icon>
        `;
    }
}

customElements.define('ost-country-picker', OstCountryPicker);
