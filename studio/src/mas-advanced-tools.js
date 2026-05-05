import { LitElement, html, css, nothing } from 'lit';
import router from './router.js';
import Store from './store.js';
import StoreController from './reactivity/store-controller.js';
import { PAGE_NAMES } from './constants.js';
import { canAccessSettings } from './groups.js';

class MasAdvancedTools extends LitElement {
    static styles = css`
        :host {
            display: block;
            height: 100%;
            overflow-y: auto;
            background: var(--spectrum-gray-50, #ffffff);
            border-top-left-radius: 16px;
            border-top-right-radius: 16px;
        }

        .container {
            max-width: 548px;
            margin: 0 auto;
            padding: 80px 24px 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 32px;
        }

        .header {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            width: 100%;
        }

        .briefcase-icon {
            width: 96px;
            height: 96px;
            color: var(--spectrum-gray-800, #292929);
        }

        .briefcase-icon sp-icon-briefcase {
            width: 96px;
            height: 96px;
        }

        .title {
            font-size: 16px;
            font-weight: 700;
            line-height: 20px;
            color: var(--spectrum-gray-800, #292929);
            margin: 0;
            text-align: center;
        }

        .subtitle {
            font-size: 12px;
            font-weight: 400;
            line-height: 1.5;
            color: var(--spectrum-gray-800, #292929);
            margin: 0;
            text-align: center;
        }

        .tool-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 100%;
        }

        .tool-card {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 20px;
            background: var(--spectrum-gray-25, #ffffff);
            border: 1px solid var(--spectrum-gray-300, #dadada);
            border-radius: 12px;
            cursor: pointer;
            color: inherit;
            text-decoration: none;
            transition:
                border-color 120ms ease,
                background-color 120ms ease;
        }

        .tool-card:hover {
            border-color: var(--spectrum-gray-500, #8c8c8c);
            background: var(--spectrum-gray-75, #fafafa);
        }

        .tool-card:focus-visible {
            outline: 2px solid var(--spectrum-blue-700, #1473e6);
            outline-offset: 2px;
        }

        .tool-card-icon {
            width: 40px;
            height: 40px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--spectrum-gray-800, #292929);
        }

        .tool-card-icon sp-icon-publish,
        .tool-card-icon sp-icon-settings {
            width: 100%;
            height: 100%;
        }

        .tool-card-text {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 2px;
        }

        .tool-card-title {
            font-size: 14px;
            font-weight: 700;
            line-height: 18px;
            color: var(--spectrum-gray-800, #292929);
        }

        .tool-card-description {
            font-size: 14px;
            font-weight: 400;
            line-height: 1.5;
            color: var(--spectrum-gray-800, #292929);
        }

        .tool-card-arrow {
            width: 20px;
            height: 20px;
            flex-shrink: 0;
            color: var(--spectrum-gray-800, #292929);
        }

        .tool-card-arrow svg {
            width: 100%;
            height: 100%;
        }
    `;

    page = new StoreController(this, Store.page);
    profile = new StoreController(this, Store.profile);
    users = new StoreController(this, Store.users);

    openBulkPublish = () => {
        router.navigateToPage(PAGE_NAMES.BULK_PUBLISH)();
    };

    openSettings = () => {
        router.navigateToPage(PAGE_NAMES.SETTINGS)();
    };

    handleKeyActivate(handler) {
        return (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handler();
            }
        };
    }

    get briefcaseIllustration() {
        return html`
            <div class="briefcase-icon" aria-hidden="true">
                <sp-icon-briefcase size="xxl"></sp-icon-briefcase>
            </div>
        `;
    }

    get arrowIcon() {
        return html`
            <span class="tool-card-arrow" aria-hidden="true">
                <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M11.47 4.47a.75.75 0 0 1 1.06 0l5 5a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 0 1-1.06-1.06L15.19 10.5H3.75a.75.75 0 0 1 0-1.5h11.44l-3.72-3.72a.75.75 0 0 1 0-1.06Z"
                        fill="currentColor"
                    />
                </svg>
            </span>
        `;
    }

    get bulkPublishCard() {
        return html`
            <a
                class="tool-card"
                role="button"
                tabindex="0"
                @click=${this.openBulkPublish}
                @keydown=${this.handleKeyActivate(this.openBulkPublish)}
            >
                <span class="tool-card-icon" aria-hidden="true">
                    <sp-icon-publish size="xxl"></sp-icon-publish>
                </span>
                <div class="tool-card-text">
                    <span class="tool-card-title">Bulk publish</span>
                    <span class="tool-card-description">Schedule and publish content items in bulk across regions.</span>
                </div>
                ${this.arrowIcon}
            </a>
        `;
    }

    get settingsCard() {
        if (!canAccessSettings(Store.surface())) return nothing;
        return html`
            <a
                class="tool-card"
                role="button"
                tabindex="0"
                @click=${this.openSettings}
                @keydown=${this.handleKeyActivate(this.openSettings)}
            >
                <span class="tool-card-icon" aria-hidden="true">
                    <sp-icon-settings size="xxl"></sp-icon-settings>
                </span>
                <div class="tool-card-text">
                    <span class="tool-card-title">Global settings</span>
                    <span class="tool-card-description">Configure environment-wide rules and defaults.</span>
                </div>
                ${this.arrowIcon}
            </a>
        `;
    }

    render() {
        return html`
            <div class="container">
                <div class="header">
                    ${this.briefcaseIllustration}
                    <h1 class="title">Advanced tools</h1>
                    <p class="subtitle">Access professional tools to speed up your workflow.</p>
                </div>
                <div class="tool-list">${this.bulkPublishCard} ${this.settingsCard}</div>
            </div>
        `;
    }
}

customElements.define('mas-advanced-tools', MasAdvancedTools);
