import { html, css, LitElement } from 'lit';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';
import { LOCALES } from '../constants.js';

export class MasNavLocalePicker extends LitElement {
    static properties = {
        disabled: { type: Boolean },
    };

    static styles = css`
        :host {
            --mod-actionbutton-min-width: auto;
            --mod-actionbutton-background-color-default: var(--spectrum-gray-800, #292929);
            --mod-actionbutton-background-color-hover: var(--spectrum-gray-900, #1e1e1e);
            --mod-actionbutton-background-color-down: var(--spectrum-gray-900, #1e1e1e);
            --mod-actionbutton-background-color-focus: var(--spectrum-gray-800, #292929);
            --mod-actionbutton-border-color-default: transparent;
            --mod-actionbutton-border-color-hover: transparent;
            --mod-actionbutton-border-color-down: transparent;
            --mod-actionbutton-border-color-focus: transparent;
            --mod-actionbutton-content-color-default: var(--spectrum-gray-50, #ffffff);
            --mod-actionbutton-content-color-hover: var(--spectrum-gray-50, #ffffff);
            --mod-actionbutton-content-color-down: var(--spectrum-gray-50, #ffffff);
            --mod-actionbutton-content-color-focus: var(--spectrum-gray-50, #ffffff);
            --mod-actionbutton-border-radius: 16px;
            --spectrum-actionbutton-height: 32px;
            --spectrum-actionbutton-min-width: auto;
        }

        .locale-picker-wrapper {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        :host([disabled]) sp-action-menu {
            cursor: not-allowed;
            pointer-events: none;
            opacity: 0.4;
            filter: none;
            color: var(--spectrum-gray-900, #1e1e1e);
        }

        :host([disabled]) sp-action-menu [slot='icon'] {
            color: var(--spectrum-gray-900, #1e1e1e);
            opacity: 0.4;
        }

        :host([disabled]) [slot='label'].locale-label {
            color: var(--spectrum-gray-900, #1e1e1e) !important;
        }

        :host([disabled]) {
            --mod-actionbutton-content-color-disabled: var(--spectrum-gray-900, #1e1e1e);
            --spectrum-actionbutton-content-color-disabled: var(--spectrum-gray-900, #1e1e1e);
        }

        :host([disabled]) sp-icon-chevron-down {
            color: var(--spectrum-gray-900, #1e1e1e) !important;
        }

        sp-action-menu [slot='icon'] {
            order: 2;
            margin-left: auto;
            color: var(--spectrum-gray-50, #ffffff);
        }

        [slot='label'].locale-label {
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--spectrum-gray-50, #ffffff);
            font-weight: 700;
            font-size: 14px;
            font-family: 'Adobe Clean', sans-serif;
        }

        sp-menu-item .locale-label {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .flag {
            font-size: 18px;
            line-height: 1;
        }

        sp-menu-item[selected] {
            font-weight: bold;
        }

        sp-menu-item {
            display: flex;
            align-items: center;
        }
    `;

    filters = new StoreController(this, Store.filters);

    handleLocaleChange(locale) {
        Store.filters.set((prev) => ({ ...prev, locale }));
    }

    get currentLocale() {
        return LOCALES.find((loc) => loc.code === this.filters.value.locale) || LOCALES.find((loc) => loc.code === 'en_US');
    }

    render() {
        const currentLocale = this.currentLocale;

        return html`
            <div class="locale-picker-wrapper">
                <sp-action-menu size="m" value=${currentLocale.code} ?disabled=${this.disabled}>
                    <sp-icon-chevron-down dir="ltr" class="chevron" slot="icon"></sp-icon-chevron-down>
                    <span slot="label" class="locale-label">
                        <span class="flag">${currentLocale.flag}</span>
                        <span>${currentLocale.code}</span>
                    </span>
                    <sp-menu size="m">
                        ${LOCALES.map(({ code, flag, name }) => {
                            return html`
                                <sp-menu-item
                                    .value=${code}
                                    ?selected=${this.filters.value.locale === code}
                                    @click=${() => this.handleLocaleChange(code)}
                                >
                                    <div class="locale-label">
                                        <span class="flag">${flag}</span>
                                        <span>${name} (${code})</span>
                                    </div>
                                </sp-menu-item>
                            `;
                        })}
                    </sp-menu>
                </sp-action-menu>
            </div>
        `;
    }
}

customElements.define('mas-nav-locale-picker', MasNavLocalePicker);
