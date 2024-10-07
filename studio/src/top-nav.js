import { LitElement, html, css } from 'lit';

class TopNav extends LitElement {
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
                margin-inline-end: 20px;
            }
        `;
    }

    render() {
        return html`
            <sp-top-nav>
                <sp-top-nav-item
                    class="logo"
                    size="l"
                    href="#"
                    label="Home"
                    quiet
                >
                    <img class="logo" src="img/adobe-logo.svg" alt="Adobe" />
                    <strong>Merch @ Scale Studio</strong>
                </sp-top-nav-item>
                <sp-top-nav-item href="#" label="Help" placement="bottom-end">
                    <sp-icon-help-outline></sp-icon-help-outline>
                </sp-top-nav-item>
                <sp-top-nav-item href="#" label="Help" placement="bottom-end">
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

customElements.define('top-nav', TopNav);
