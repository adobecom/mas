import { ENVS, EnvColorCode } from './constants.js';
import { LitElement, html, css, until } from 'lit';
import Store from './store.js';

class MasTopNav extends LitElement {
    async profileBuilder () {
        const accessToken = window.adobeIMS.getAccessToken();
        const ioResp = await fetch(`https://${ENVS[this.aemEnv].adobeIO}/profile`, { headers: new Headers({ Authorization: `Bearer ${accessToken.token}` }) });
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
                    <div style="width: 75px; height: 75px;"><img src="${avatar}" alt="${displayName}" width="100%"></div>
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

        profileButton.addEventListener('click', () => { profileBody.classList.toggle('show'); });
        signOutLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.adobeIMS.signOut();
        });
        studioContentEl.addEventListener('click', () => { profileBody.classList.remove('show'); });
        

        return profileEl;
    }

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

            .profile-button {
                padding: 0;
                cursor: pointer;
                border: 0;
                background: 0;
                position: relative
            }
            
            .profile-body {
                display: none;
                margin: 0;
                position: absolute;
                min-width: 280px;
                right: 30px;
                top: 45px;
                background: white;
                padding: 20px 0;
                border-radius: 10px;
                box-shadow: 5px 5px 5px #cfcfcf;
                z-index: 99;
            }

            .profile-body.show {
                display: block;
            }
            
            .account-menu-header {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 0 20px 20px;
            }

            .account-info h2 {
                margin: .5rem 0;
            }

            .account-info p {
                margin: 0 0 .5rem;
                font-size: 14px;
            }

            .profile-actions {
                list-style: none;
            }
            
            .account-menu hr {
                margin: 0 20px 10px;
            }

            .account-menu-item {
                font-size: 16px;
                padding: 5px 20px;
            }
            
            .account-menu-item:hover {
                background-color: var(--spectrum-global-color-gray-100);
                color: var(--spectrum-global-color-gray-800);
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
                ${until(
                    this.profileBuilder().then(profile => 
                    html`${profile}`),
                )}
            </nav>
            <sp-divider></sp-divider>
        `;
    }
}

customElements.define('mas-top-nav', MasTopNav);
