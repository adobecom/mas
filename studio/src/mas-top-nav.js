import { LitElement, html, css } from 'lit';
import { EVENT_COMMERCE_TOGGLE } from './events.js';

const EnvColorCode = {
    proxy: 'gray',
    prod: 'negative',
    stage: 'notice',
    qa: 'positive',
};
class MasTopNav extends LitElement {
    static properties = {
        aemEnv: { type: String, attribute: 'aem-env' },
        commerceEnv: { type: String, attribute: 'commerce-env' },
    };

    constructor() {
        super();
        this.aemEnv = 'prod';
        this.commerceEnv = 'prod';
    }

    get envIndicator() {
        return EnvColorCode[this.env];
    }

    static get styles() {
        return css`
            :host {
                display: block;
                width: 100%;
            }
            sp-top-nav {
                width: 100%;
            }

            sp-top-nav-item {
                margin-inline-end: auto;
                margin-inline-start: 20px;
            }

            sp-top-nav-item.logo {
                color: #eb1000;
                width: 24px;
            }

            sp-top-nav-item strong {
                font-size: 21px;
                font-weight: 800;
                line-height: 20px;
                vertical-align: top;
                padding-inline-start: 5px;
            }
            sp-top-nav-item[placement='bottom-end'] {
                margin-inline-end: 10px;
            }
        `;
    }

    toggleCommerce(e) {
        e.preventDefault();
        this.dispatchEvent(
            new CustomEvent(EVENT_COMMERCE_TOGGLE, {
                bubbles: true,
                composed: true,
            }),
        );
    }

    render() {
        const commerceEnvSwitch =
            this.commerceEnv === 'stage'
                ? html`<sp-switch label="Switch" checked>
                      Stage Commerce
                  </sp-switch>`
                : html`<sp-switch label="Switch"> Stage Commerce </sp-switch>`;
        return html`
            <sp-top-nav>
                <sp-top-nav-item
                    class="logo"
                    size="l"
                    href="#"
                    label="Home"
                    quiet
                >
                    <svg
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        x="0"
                        y="0"
                        viewBox="0 0 30 26"
                        width="24px"
                        xml:space="preserve"
                        role="img"
                        aria-label="Adobe"
                    >
                        <path
                            fill="#FA0F00"
                            d="M19 0h11v26zM11.1 0H0v26zM15 9.6L22.1 26h-4.6l-2.1-5.2h-5.2z"
                        ></path>
                    </svg>
                    <strong>Merch @ Scale Studio</strong>
                </sp-top-nav-item>
                <sp-top-nav-item href="#" label="Odin Env" placement="bottom-end">
                    <sp-badge size="s" variant="${this.envIndicator}">${this.aemEnv}</sp-badge>
                </sp-top-nav-item>
                <sp-top-nav-item href="#" label="Commerce Env" placement="bottom-end" @click="${this.toggleCommerce}">
                    ${commerceEnvSwitch}
                </sp-top-nav-item>
                <sp-top-nav-item href="#" label="Help" placement="bottom-end">
                    <sp-icon-help-outline></sp-icon-help-outline>
                </sp-top-nav-item>
                <sp-top-nav-item href="#" label="Notifications" placement="bottom-end">
                    <sp-icon-bell></sp-icon-bell>
                    <sp-top-nav-item
                        href="#"
                        label="Help"
                        placement="bottom-end"
                </sp-top-nav-item>
                </sp-top-nav-item>
            </sp-top-nav>
        `;
    }
}

customElements.define('mas-top-nav', MasTopNav);
