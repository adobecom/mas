import { LitElement, html, css } from 'lit';
import Store from './store.js';

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
    `;

    navigateTo(target) {
        return function () {
            Store.currentPage.set(target);
        };
    }

    render() {
        return html`<side-nav>
            <div class="dropdown-container">
                <mas-folder-picker></mas-folder-picker>
            </div>
            <sp-sidenav>
                <sp-sidenav-item
                    label="Home"
                    value="home"
                    @click="${this.navigateTo('splash')}"
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

                <sp-sidenav-divider></sp-sidenav-divider>

                <sp-sidenav-item label="Support" value="support">
                    <sp-icon-help slot="icon"></sp-icon-help>
                </sp-sidenav-item>
            </sp-sidenav>
        </side-nav>`;
    }
}

customElements.define('mas-side-nav', MasSideNav);