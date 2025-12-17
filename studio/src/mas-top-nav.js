import { ENVS, EnvColorCode, WCS_LANDSCAPE_DRAFT, PAGE_NAMES } from './constants.js';
import { LitElement, html } from 'lit';
import { until } from 'lit/directives/until.js';
import Store from './store.js';
import StoreController from './reactivity/store-controller.js';
import './mas-nav-folder-picker.js';
import './mas-locale-picker.js';

class MasTopNav extends LitElement {
    page = new StoreController(this, Store.page);

    createRenderRoot() {
        return this;
    }
    async profileBuilder() {
        try {
            const accessToken = window.adobeIMS.getAccessToken();
            const ioResp = await fetch(`https://${ENVS[this.aemEnv].adobeIO}/profile`, {
                headers: new Headers({
                    Authorization: `Bearer ${accessToken.token}`,
                }),
            });
            const profiles = {};
            profiles.ims = await window.adobeIMS.getProfile();
            profiles.io = await ioResp.json();
            const { displayName, email } = profiles.ims;
            const { user } = profiles.io;
            const { avatar } = user;
            const profileEl = document.createElement('div');
            profileEl.classList.add('profile');
            profileEl.innerHTML = `
            <button class="profile-button">
                    <img src="${avatar}" alt="${displayName}" height="26">
                </button>
                <div class="profile-body">
                    <div class="account-menu-header">
                        <div class="avatar-container"><img src="${avatar}" alt="${displayName}" class="avatar-image"></div>
                        <div class="account-info">
                            <h2>${displayName}</h2>
                            <p>${email}</p>
                            <a href="https://account.adobe.com" target="_blank">Manage account</a>
                        </div>
                    </div>
                    <div class="account-menu">
                        <hr>
                        <a class="signout-link">
                            <div class="account-menu-item">Sign out</div>
                        </a>
                    </div>
                </div>
            `;
            const profileButton = profileEl.querySelector('.profile-button');
            const profileBody = profileEl.querySelector('.profile-body');
            const signOutLink = profileEl.querySelector('.signout-link');
            const studioContentEl = document.querySelector('.studio-content');

            profileButton.addEventListener('click', () => {
                profileBody.classList.toggle('show');
            });
            signOutLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.adobeIMS.signOut();
            });
            studioContentEl.addEventListener('click', () => {
                profileBody.classList.remove('show');
            });

            return profileEl;
        } catch (error) {
            console.error('Failed to build profile:', error);
            const fallbackEl = document.createElement('div');
            fallbackEl.classList.add('profile-error');
            fallbackEl.innerHTML = '<div>Profile unavailable</div>';
            return fallbackEl;
        }
    }

    static properties = {
        aemEnv: { type: String, attribute: 'aem-env' },
        showPickers: { type: Boolean, attribute: 'show-pickers' },
    };

    constructor() {
        super();
        this.aemEnv = 'prod';
        this.showPickers = true;
        Store.search.subscribe(() => {
            this.requestUpdate();
        });
    }

    get envIndicator() {
        return EnvColorCode[this.aemEnv];
    }

    get shouldShowPickers() {
        return this.showPickers;
    }

    get isFragmentEditorPage() {
        return Store.page.value === PAGE_NAMES.FRAGMENT_EDITOR;
    }

    get isDraftLandscape() {
        return Store.landscape.value === WCS_LANDSCAPE_DRAFT;
    }

    render() {
        return html`
            <nav>
                <a id="brand" href="#page=welcome">
                    <svg
                        id="logo"
                        aria-label="Adobe"
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M26.3349 0.666667H5.66504C2.53633 0.666667 0 3.18733 0 6.29675V25.7033C0 28.8127 2.53633 31.3333 5.66504 31.3333H26.3349C29.4637 31.3333 32 28.8127 32 25.7033V6.29675C32 3.18733 29.4637 0.666667 26.3349 0.666667Z"
                            fill="#EB1000"
                        />
                        <path
                            d="M24.7188 23.9036H20.9785C20.6313 23.9036 20.3349 23.7067 20.2113 23.4121L16.1731 14.0141C16.1 13.8439 15.9049 13.8424 15.8304 14.0097L13.2999 20.2949C13.2403 20.4355 13.3441 20.5908 13.4976 20.5908H16.2791C16.4513 20.5908 16.6069 20.6932 16.6741 20.8508L17.8696 23.2123C18.0097 23.5409 17.7669 23.9036 17.4095 23.9036H7.28312C6.95989 23.9036 6.73789 23.5839 6.86155 23.264L13.3249 8.02212C13.45 7.70235 13.7719 7.48178 14.1427 7.48178H17.8577C18.2287 7.48178 18.5519 7.70235 18.6756 8.02212L25.1389 23.264C25.2625 23.5839 25.0407 23.9036 24.7188 23.9036L24.7188 23.9036Z"
                            fill="white"
                        />
                    </svg>
                    <span id="mas-studio">Merch At Scale Studio</span>
                </a>

                <div class="spacer"></div>

                <div class="right-section">
                    ${this.shouldShowPickers
                        ? html`
                              <mas-nav-folder-picker ?disabled=${this.isFragmentEditorPage}></mas-nav-folder-picker>
                              <mas-locale-picker
                                  displayMode="strong"
                                  @locale-changed=${(e) => {
                                      Store.filters.set((prev) => ({ ...prev, locale: e.detail.locale }));
                                  }}
                                  ?disabled=${this.isFragmentEditorPage}
                                  surface=${Store.surface()}
                              >
                              </mas-locale-picker>
                              <div class="divider"></div>
                              <div class="universal-elements">
                                  <button class="icon-button" title="Help">
                                      <sp-icon-help size="m"></sp-icon-help>
                                  </button>
                                  <button class="icon-button" title="Notifications">
                                      <sp-icon-bell size="m"></sp-icon-bell>
                                  </button>
                              </div>
                          `
                        : ''}
                    ${until(this.profileBuilder().then((profile) => html`${profile}`))}
                </div>
            </nav>
        `;
    }
}

customElements.define('mas-top-nav', MasTopNav);
