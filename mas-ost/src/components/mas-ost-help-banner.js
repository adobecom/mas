import { LitElement, html, css, nothing } from 'lit';
import { store } from '../store/ost-store.js';
import { HELP_BANNERS } from '../data/help-content.js';

export class MasOstHelpBanner extends LitElement {
    static styles = css`
        :host {
            font-family: inherit;
            display: block;
        }

        .help-banner {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 10px 14px;
            background: var(--spectrum-blue-100, #e8f4fd);
            border-left: 3px solid var(--spectrum-blue-900, #1473e6);
            border-radius: 0 6px 6px 0;
        }

        .help-step {
            font-size: 14px;
            font-weight: 700;
            color: var(--spectrum-blue-900, #1473e6);
            min-width: 20px;
        }

        .help-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--spectrum-blue-900, #0d66d0);
        }

        .help-body {
            font-size: 12px;
            color: var(--spectrum-gray-800, #4b4b4b);
            margin-top: 4px;
            line-height: 1.4;
        }
    `;

    constructor() {
        super();
        this.handleStoreChange = this.handleStoreChange.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        store.subscribe(this.handleStoreChange);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        store.unsubscribe(this.handleStoreChange);
    }

    handleStoreChange() {
        this.requestUpdate();
    }

    render() {
        if (!store.helpMode) return nothing;
        const banner = HELP_BANNERS[store.viewState];
        if (!banner) return nothing;
        return html`
            <div class="help-banner">
                <span class="help-step">${banner.step}.</span>
                <div>
                    <div class="help-title">${banner.title}</div>
                    <div class="help-body">${banner.body}</div>
                </div>
            </div>
        `;
    }
}

customElements.define('mas-ost-help-banner', MasOstHelpBanner);
