import { LitElement, html, css } from 'lit';

const EnvColorCode = {
    prod: 'negative',
    stage: 'notice',
    qa: 'positive',
};

class MasTopNav extends LitElement {
    static properties = {
        env: { type: String },
    };

    constructor() {
        super();
        this.env = 'prod';
    }

    get envIndicator() {
        return EnvColorCode[this.env];
    }

    static get styles() {
        return css`
            :host {
                width: 100%;
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
                gap: 10px;
                color: #eb1000;
                text-decoration: none;
            }

            #brand strong {
                font-size: 21px;
                font-weight: 800;
                line-height: 20px;
            }

            a {
                cursor: pointer;
            }

            a:nth-child(2) {
                margin-inline-start: auto;
            }
        `;
    }

    render() {
        return html`
            <nav>
                <a id="brand" href="#">
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
                </a>
                <a>
                    <sp-badge size="s" variant="${this.envIndicator}"
                        >${this.env}</sp-badge
                    >
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
