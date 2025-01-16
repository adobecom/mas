import { LitElement, html, css } from 'lit';
import { navigateToPage } from './store.js';

class MasSideNav extends LitElement {
    static styles = css`
        side-nav {
            grid-column: 1 / 2;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
        }

        side-nav sp-sidenav {
            height: 100%;
            padding: 16px 0;
        }

        side-nav sp-sidenav-heading {
            font-size: 14px;
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
            padding: 0 16px;
        }

        .dropdown-container {
            display: flex;
            align-items: center;
            padding: 8px 16px;
            margin-top: 16px;
        }

        side-nav sp-sidenav-item {
            font-size: 14px;
            color: #292929;
            padding: 8px 16px;
            border-radius: 8px;
            transition:
                background-color 0.2s ease,
                color 0.2s ease;
        }

        sp-sidenav-item sp-icon {
            width: 20px;
            height: 20px;
            color: #292929;
        }

        side-nav sp-sidenav-item[selected] {
            font-weight: 800;
        }

        side-nav sp-sidenav-item:hover {
            cursor: pointer;
            font-weight: 700;
        }

        .side-nav-support {
            position: absolute;
            bottom: 0;
            width: 220px;
        }

        .side-nav-support .side-nav-new-window {
            position: absolute;
            right: 0;
            padding-right: 5px;
        }
    `;

    render() {
        return html`<side-nav>
            <div class="dropdown-container">
                <mas-folder-picker></mas-folder-picker>
            </div>
            <sp-sidenav>
                <sp-sidenav-item
                    label="Home"
                    value="home"
                    @click="${navigateToPage('welcome')}"
                    selected
                >
                    <sp-icon-home slot="icon"></sp-icon-home>
                </sp-sidenav-item>

                <sp-sidenav-item label="Promotions" value="promotions">
                    <sp-icon-promote slot="icon"></sp-icon-promote>
                </sp-sidenav-item>

                <sp-sidenav-item label="Reporting" value="reporting">
                    <sp-icon-graph-bar-vertical
                        slot="icon"
                    ></sp-icon-graph-bar-vertical>
                </sp-sidenav-item>
                <sp-sidenav-item
                    class="side-nav-support"
                    label="Support"
                    value="support"
                    @click="${() =>
                        window.open(
                            'https://adobe.enterprise.slack.com/archives/C02RZERR9CH',
                            '_blank',
                        )}"
                >
                    <sp-icon-help slot="icon"></sp-icon-help>
                    <sp-icon-link-out-light
                        class="side-nav-new-window"
                    ></sp-icon-link-out-light>
                </sp-sidenav-item>
            </sp-sidenav>
        </side-nav>`;
    }
}

customElements.define('mas-side-nav', MasSideNav);
