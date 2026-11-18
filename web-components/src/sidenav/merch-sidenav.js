import { html, LitElement, nothing, unsafeCSS } from 'lit';
import { MatchMediaController } from '@spectrum-web-components/reactive-controllers/src/MatchMedia.js';
import '../merch-search.js';
import './merch-sidenav-list.js';
import './merch-sidenav-checkbox-group.js';
import { SPECTRUM_MOBILE_LANDSCAPE, TABLET_DOWN } from '../media.js';
import { EVENT_MERCH_SIDENAV_SELECT } from '../constants.js';
import { styles } from './merch-sidenav.css.js';

const SEARCH_SIZE = {
    catalog: 'l',
};

const CHECKBOX_SIZE = {
    catalog: 'xl',
};

export class MerchSideNav extends LitElement {
    static properties = {
        sidenavTitle: { type: String },
        closeText: { type: String, attribute: 'close-text' },
        modal: { type: Boolean, reflect: true },
        open: { type: Boolean, state: true, reflect: true },
        autoclose: { type: Boolean, attribute: 'autoclose', reflect: true },
        dir: { type: String, state: true },
    };

    constructor() {
        super();
        this.open = false;
        this.autoclose = false;
        this.variant = null;
        this.dir = document.documentElement.dir || 'ltr';
        this.closeModal = this.closeModal.bind(this);
        this.handleSelection = this.handleSelection.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener(EVENT_MERCH_SIDENAV_SELECT, this.handleSelection);
        // Observe document direction changes
        this.dirObserver = new MutationObserver(() => {
            const newDir = document.documentElement.dir || 'ltr';
            if (this.dir !== newDir) {
                this.dir = newDir;
                this.requestUpdate();
            }
        });
        this.dirObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['dir'],
        });
    }

    disconnectedCallback() {
        this.dirObserver?.disconnect();
        super.disconnectedCallback();
        this.removeEventListener(
            EVENT_MERCH_SIDENAV_SELECT,
            this.handleSelection,
        );
    }

    firstUpdated() {
        /* Adjust search size */
        const searchSize = SEARCH_SIZE[this.variant];
        if (searchSize) {
            const search = this.querySelector('merch-search sp-search');
            if (search) {
                search?.setAttribute('size', searchSize);
            }
        }

        /* Adjust checkboxes size */
        const checkboxSize = CHECKBOX_SIZE[this.variant];
        if (checkboxSize) {
            const checkboxes = this.querySelectorAll(
                'merch-sidenav-checkbox-group sp-checkbox',
            );
            checkboxes.forEach((checkbox) => {
                checkbox.setAttribute('size', checkboxSize);
            });
        }
    }

    updated() {
        if (this.mobileAndTablet.matches) {
            this.modal = true;
            this.style.padding = 0;
            this.style.margin = 0;
        } else {
            this.modal = false;
            this.style.removeProperty('padding');
            this.style.removeProperty('margin');
            if (this.open) this.closeModal();
        }
    }

    mobileDevice = new MatchMediaController(this, SPECTRUM_MOBILE_LANDSCAPE);
    mobileAndTablet = new MatchMediaController(this, TABLET_DOWN);

    get filters() {
        return this.querySelector('merch-sidenav-list');
    }

    get search() {
        return this.querySelector('merch-search');
    }

    render() {
        return this.mobileAndTablet.matches ? this.asDialog : this.asAside;
    }

    get asDialog() {
        if (!this.open) return nothing;
        const closeButton = !this.autoclose
            ? html`<sp-link @click="${this.closeModal}"
                  >${this.closeText || 'Close'}</sp-link
              >`
            : nothing;
        return html`
            <sp-theme color="light" scale="medium" dir="${this.dir}">
                <sp-overlay type="modal" open @sp-closed=${this.closeModal}>
                    <sp-dialog-base
                        dismissable
                        underlay
                        no-divider
                        @close=${this.closeModal}
                    >
                        <div id="content">
                            <div id="sidenav">
                                <div>
                                    <h2>${this.sidenavTitle}</h2>
                                    <slot></slot>
                                </div>
                                ${closeButton}
                            </div>
                        </div>
                    </sp-dialog-base>
                </sp-overlay>
            </sp-theme>
        `;
    }

    get asAside() {
        return html`<sp-theme color="light" scale="medium" dir="${this.dir}"
            ><h2>${this.sidenavTitle}</h2>
            <slot></slot
        ></sp-theme>`;
    }

    get dialog() {
        return this.shadowRoot.querySelector('sp-dialog-base');
    }

    handleSelection() {
        if (this.autoclose) this.closeModal();
    }

    closeModal() {
        this.open = false;
        document.querySelector('body')?.classList.remove('merch-modal');
    }

    showModal() {
        this.open = true;
        document.querySelector('body')?.classList.add('merch-modal');
    }

    static styles = unsafeCSS(styles);
}

customElements.define('merch-sidenav', MerchSideNav);
