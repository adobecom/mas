import { LitElement, html, css, nothing } from 'lit';
import '@spectrum-web-components/picker/sp-picker.js';
import '@spectrum-web-components/menu/sp-menu-item.js';
import '@spectrum-web-components/switch/sp-switch.js';
import '@spectrum-web-components/textfield/sp-textfield.js';
import { store } from '../store/ost-store.js';
import { countries as staticCountries } from '../data/countries.js';
import { HELP_TOOLTIPS } from '../data/help-content.js';
import './mas-ost-help-icon.js';

const COUNTRIES_API =
    'https://countries-stage.adobe.io/v2/countries?api_key=dexter-commerce-offers';

function mapCountries(data) {
    return data.map((obj) => obj['iso2-code'] || obj).sort();
}

export class MasOstCountryPicker extends LitElement {
    static properties = {
        countries: { type: Array, state: true },
        countryInput: { type: String, state: true },
        showDropdown: { type: Boolean, state: true },
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

        .country-wrapper {
            position: relative;
        }

        .country-input {
            width: 72px;
            --mod-textfield-height: 28px;
            --mod-textfield-font-size: 13px;
            text-transform: uppercase;
        }

        .country-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            min-width: 80px;
            max-height: 200px;
            overflow-y: auto;
            background: var(--spectrum-white, #fff);
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10;
            margin-top: 2px;
        }

        .country-option {
            padding: 6px 10px;
            font-size: 13px;
            cursor: pointer;
            color: var(--spectrum-gray-800);
        }

        .country-option:hover,
        .country-option[data-selected] {
            background: var(--spectrum-blue-100);
            color: var(--spectrum-blue-900);
        }

        .country-no-match {
            padding: 8px 10px;
            font-size: 12px;
            color: var(--spectrum-gray-500);
            font-style: italic;
        }
    `;

    constructor() {
        super();
        this.countries = mapCountries(staticCountries);
        this.countryInput = '';
        this.showDropdown = false;
        this.handleStoreChange = this.handleStoreChange.bind(this);
        this.handleDocumentClick = this.handleDocumentClick.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        store.subscribe(this.handleStoreChange);
        this.fetchCountries();
        document.addEventListener('click', this.handleDocumentClick);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        store.unsubscribe(this.handleStoreChange);
        document.removeEventListener('click', this.handleDocumentClick);
    }

    handleDocumentClick(e) {
        if (this.showDropdown && !e.composedPath().includes(this)) {
            this.showDropdown = false;
        }
    }

    handleStoreChange() {
        this.requestUpdate();
    }

    async fetchCountries() {
        if (window.location.hostname === 'localhost') {
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

    handleCountryInputFocus() {
        this.countryInput = '';
        this.showDropdown = true;
    }

    handleCountryInput(e) {
        this.countryInput = e.target.value.toUpperCase();
        this.showDropdown = true;
    }

    selectCountry(code) {
        store.setCountry(code);
        this.countryInput = '';
        this.showDropdown = false;
    }

    handleCountryKeydown(e) {
        if (e.key === 'Escape') {
            this.showDropdown = false;
            return;
        }
        if (e.key === 'Enter') {
            const filtered = this.getFilteredCountries();
            if (filtered.length === 1) {
                this.selectCountry(filtered[0]);
            } else if (filtered.includes(this.countryInput)) {
                this.selectCountry(this.countryInput);
            }
        }
    }

    getFilteredCountries() {
        const query = this.countryInput;
        if (!query) return this.countries;
        return this.countries.filter((c) => c.startsWith(query));
    }

    handleEnvToggle(event) {
        const env = event.target.checked ? 'STAGE' : 'PRODUCTION';
        store.init({ env });
    }

    render() {
        const isStage = store.env === 'STAGE';
        const filtered = this.getFilteredCountries();

        return html`
            <div class="picker-group">
                <span class="picker-label">Landscape</span>
                <sp-picker
                    value=${store.landscape}
                    size="s"
                    label="Landscape"
                    @change=${this.handleLandscapeChange}
                >
                    <sp-menu-item value="PUBLISHED">Published</sp-menu-item>
                    <sp-menu-item value="DRAFT">Draft</sp-menu-item>
                </sp-picker>
            </div>
            <div class="picker-group">
                <span class="picker-label">Country</span>
                <div class="country-wrapper">
                    <sp-textfield
                        class="country-input"
                        size="s"
                        placeholder=${store.country}
                        .value=${this.countryInput}
                        @focus=${this.handleCountryInputFocus}
                        @input=${this.handleCountryInput}
                        @keydown=${this.handleCountryKeydown}
                    ></sp-textfield>
                    ${this.showDropdown ? html`
                        <div class="country-dropdown">
                            ${filtered.length > 0
                                ? filtered.map((code) => html`
                                    <div
                                        class="country-option"
                                        ?data-selected=${code === store.country}
                                        @click=${() => this.selectCountry(code)}
                                    >${code}</div>
                                `)
                                : html`<div class="country-no-match">No match</div>`
                            }
                        </div>
                    ` : nothing}
                </div>
            </div>
            <sp-switch
                size="s"
                ?checked=${isStage}
                @change=${this.handleEnvToggle}
            >Stage</sp-switch>
            <mas-ost-help-icon text="${HELP_TOOLTIPS.landscapeEnv}"></mas-ost-help-icon>
        `;
    }
}

customElements.define('mas-ost-country-picker', MasOstCountryPicker);
