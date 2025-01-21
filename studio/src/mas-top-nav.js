import { LitElement, html, css } from 'lit';
import Store from './store.js';

const EnvColorCode = {
    proxy: 'gray',
    prod: 'negative',
    stage: 'notice',
    qa: 'positive',
};
class MasTopNav extends LitElement {
    static properties = {
        aemEnv: { type: String, attribute: 'aem-env' },
    };

    constructor() {
        super();
        this.aemEnv = 'prod';
    }

    get envIndicator() {
        return EnvColorCode[this.aemEnv];
    }

    static get styles() {
        return css`
            :host {
                width: 100%;
                height: var(--mas-nav-height, 50px);
            }

            nav {
                display: flex;
                padding-block: 10px;
                padding-inline: 30px;
                gap: 20px;
                align-items: center;
            }

            #brand {
                display: flex;
                align-items: end;
                width: max-content;
                gap: 10px;
                text-decoration: none;
            }

            #logo {
                display: flex;
                width: 30px;
            }

            #mas-studio {
                font-size: 14px;
                font-weight: 400;
                line-height: 20px;
                color: var(--spectrum-global-color-gray-700);
                display: flex;
                align-self: center;
            }

            a {
                cursor: pointer;
            }

            a:nth-child(2) {
                margin-inline-start: auto;
            }
        `;
    }

    _toggleCommerce(e) {
        Store.commerceEnv.set(e.target.checked ? 'stage' : 'prod');
    }

    render() {
        return html`
            <nav>
                <a id="brand" href="#">
                    <svg
                        id="logo"
                        aria-label="Adobe"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M19.7512 0.5H4.24878C1.90225 0.5 0 2.3905 0 4.72256V19.2774C0 21.6095 1.90225 23.5 4.24878 23.5H19.7512C22.0978 23.5 24 21.6095 24 19.2774V4.72256C24 2.3905 22.0978 0.5 19.7512 0.5Z"
                            fill="#EB1000"
                        />
                        <path
                            d="M18.5391 17.9277H15.7339C15.4735 17.9277 15.2512 17.78 15.1585 17.5591L12.1298 10.5106C12.075 10.3829 11.9287 10.3818 11.8728 10.5073L9.9749 15.2212C9.93024 15.3266 10.0081 15.4431 10.1232 15.4431H12.2093C12.3385 15.4431 12.4552 15.5199 12.5056 15.6381L13.4022 17.4092C13.5073 17.6557 13.3252 17.9277 13.0571 17.9277H5.46234C5.21992 17.9277 5.05342 17.6879 5.14616 17.448L9.9937 6.01659C10.0875 5.77676 10.3289 5.61133 10.607 5.61133H13.3933C13.6715 5.61133 13.9139 5.77676 14.0067 6.01659L18.8542 17.448C18.9469 17.6879 18.7805 17.9277 18.5391 17.9277L18.5391 17.9277Z"
                            fill="white"
                        />
                    </svg>
                    <span id="mas-studio">M@S Studio</span>
                </a>
                <a>
                    <sp-badge size="s" variant="${this.envIndicator}"
                        >${this.aemEnv}</sp-badge
                    >
                </a>
                <a>
                    <sp-switch
                        label="Switch"
                        @change="${this._toggleCommerce}"
                        .checked=${Store.commerceEnv.value == 'stage'
                            ? true
                            : false}
                    >
                        Stage Commerce
                    </sp-switch>
                </a>
                <a>
                    <sp-icon-help-outline></sp-icon-help-outline>
                </a>
                <a>
                    <sp-icon-bell></sp-icon-bell>
                </a>
            </nav>
            <sp-divider></sp-divider>
        `;
    }
}

customElements.define('mas-top-nav', MasTopNav);
