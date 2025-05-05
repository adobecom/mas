import { LitElement, html, css } from 'lit';
import router from './router.js';
import StoreController from './reactivity/store-controller.js';
import Store from './store.js';
import { PAGE_NAMES } from './constants.js';

class MasSideNav extends LitElement {
    static styles = css`
        side-nav {
            grid-column: 1 / 2;
            display: flex;
            flex-direction: column;
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
            position: fixed;
            bottom: 0;
            width: 220px;
        }

        .side-nav-support .side-nav-new-window {
            position: absolute;
            right: 0;
            padding-right: 5px;
        }
    `;

    currentPage = new StoreController(this, Store.page);

    render() {
        return html`<side-nav>
            <div class="dropdown-container">
                <mas-folder-picker></mas-folder-picker>
            </div>
            <sp-sidenav>
                <sp-sidenav-item
                    label="Home"
                    value="home"
                    @click="${router.navigateToPage(PAGE_NAMES.WELCOME)}"
                    ?selected=${Store.page.get() === PAGE_NAMES.WELCOME}
                >
                    <sp-icon-home slot="icon"></sp-icon-home>
                </sp-sidenav-item>
                <sp-sidenav-item
                    label="Content"
                    value="content"
                    @click="${router.navigateToPage(PAGE_NAMES.CONTENT)}"
                    ?selected=${Store.page.get() === PAGE_NAMES.CONTENT}
                >
                    <sp-icon-view-grid slot="icon"></sp-icon-view-grid>
                </sp-sidenav-item>
                <sp-sidenav-item
                    label="Placeholders"
                    value="placeholders"
                    @click="${router.navigateToPage(PAGE_NAMES.PLACEHOLDERS)}"
                    ?selected=${Store.page.get() === PAGE_NAMES.PLACEHOLDERS}
                >
                    <sp-icon-cclibrary slot="icon"></sp-icon-cclibrary>
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
