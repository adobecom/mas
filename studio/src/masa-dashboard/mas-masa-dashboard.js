import { LitElement, html, css, nothing } from 'lit';
import '@spectrum-web-components/button/sp-button.js';
import '@spectrum-web-components/progress-circle/sp-progress-circle.js';
import Store from '../store.js';
import StoreController from '../reactivity/store-controller.js';
import { isMasAdmin } from '../groups.js';
import './dashboard-view.js';

/** Loads the admin-only MASA snapshot and cancels requests when the page or identity changes. */
export class MasMasaDashboard extends LitElement {
    static properties = {
        snapshot: { state: true },
        loading: { state: true },
        error: { state: true },
        now: { state: true },
    };

    static styles = css`
        :host {
            display: block;
            height: 100%;
            overflow-y: auto;
            background: var(--spectrum-gray-100, #f5f5f5);
            border-radius: 16px 16px 0 0;
            color: var(--spectrum-gray-900, #222);
        }
        main {
            max-width: 1320px;
            margin: 0 auto;
            padding: 32px;
            font: 14px/1.5 var(--spectrum-font-family, Arial, sans-serif);
        }
        header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 24px;
        }
        h1 {
            font-size: 28px;
            margin: 0 0 4px;
        }
        p {
            margin: 0;
            color: var(--spectrum-gray-700, #595959);
        }
        .notice {
            padding: 20px;
            margin-bottom: 20px;
            background: var(--spectrum-gray-50, #fff);
            border: 1px solid var(--spectrum-gray-300, #dadada);
            border-radius: 10px;
        }
        .loading {
            padding: 64px;
            text-align: center;
        }
        @media (max-width: 560px) {
            main {
                padding: 20px 12px;
            }
            h1 {
                font-size: 24px;
            }
        }
    `;

    profile = new StoreController(this, Store.profile);
    users = new StoreController(this, Store.users);
    #controller = null;
    #timer;
    #identity = null;

    constructor() {
        super();
        this.snapshot = null;
        this.loading = false;
        this.error = '';
        this.now = Date.now();
    }

    connectedCallback() {
        super.connectedCallback();
        this.#timer = setInterval(() => {
            this.now = Date.now();
            if (!document.hidden) this.refresh();
        }, 60000);
        this.#identity = null;
        this.requestUpdate();
    }

    disconnectedCallback() {
        clearInterval(this.#timer);
        this.#controller?.abort();
        this.#controller = null;
        super.disconnectedCallback();
    }

    willUpdate() {
        const identity = Store.users.getMeta('loaded') && isMasAdmin() ? Store.profile.get().email : null;
        if (identity === this.#identity) return;
        this.#identity = identity;
        this.#controller?.abort();
        this.#controller = null;
        this.loading = false;
        this.snapshot = null;
        this.error = '';
        if (identity) this.refresh();
    }

    async refresh() {
        if (!this.isConnected || !this.#identity || this.#controller) return;
        const controller = new AbortController();
        this.#controller = controller;
        this.loading = true;
        const baseUrl = document.querySelector('meta[name="io-base-url"]')?.content;
        try {
            if (!baseUrl) throw new Error('Dashboard service is not configured for this Studio environment.');
            const response = await fetch(`${baseUrl}/masa-dashboard`, {
                headers: { Authorization: `Bearer ${window.adobeid.authorize()}`, Accept: 'application/json' },
                cache: 'no-store',
                signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
            });
            if (controller.signal.aborted) return;
            if (!response.ok) {
                if ([401, 403, 404].includes(response.status)) this.snapshot = null;
                const messages = {
                    401: 'Your session has expired. Sign in to Studio again.',
                    403: 'MAS administrator access is required to view this dashboard.',
                    404: 'No dashboard snapshot has arrived yet. The first snapshot appears after MASA is configured to send it.',
                };
                throw new Error(messages[response.status] ?? 'Dashboard is temporarily unavailable. Try refreshing.');
            }
            const snapshot = await response.json();
            if (controller.signal.aborted) return;
            this.snapshot = snapshot;
            this.error = '';
        } catch (error) {
            if (!controller.signal.aborted)
                this.error =
                    error instanceof TypeError || error.name === 'TimeoutError'
                        ? 'Could not reach the dashboard. Check your connection and try refreshing.'
                        : error.message;
        } finally {
            if (this.#controller === controller) {
                this.#controller = null;
                this.loading = false;
                this.now = Date.now();
            }
        }
    }

    render() {
        if (!Store.users.getMeta('loaded'))
            return html`<div class="loading">
                <sp-progress-circle indeterminate label="Checking dashboard access"></sp-progress-circle>
            </div>`;
        if (!isMasAdmin())
            return html`<main><div class="notice">MAS administrator access is required to view this dashboard.</div></main>`;
        return html`<main>
            <header>
                <div>
                    <h1>MASA dashboard</h1>
                    <p>Usage, outcomes and performance · snapshots every 5 minutes</p>
                </div>
                <sp-button variant="secondary" ?disabled=${this.loading} @click=${this.refresh}
                    >${this.loading ? 'Refreshing…' : 'Refresh'}</sp-button
                >
            </header>
            ${this.error
                ? html`<div class="notice" role="alert">
                      ${this.error}${this.snapshot ? html`<p>Showing the last available snapshot.</p>` : nothing}
                  </div>`
                : nothing}
            ${this.loading && !this.snapshot
                ? html`<div class="loading">
                      <sp-progress-circle indeterminate label="Loading dashboard"></sp-progress-circle>
                  </div>`
                : nothing}
            ${this.snapshot
                ? html`<masa-dashboard-view .snapshot=${this.snapshot} .now=${this.now}></masa-dashboard-view>`
                : nothing}
        </main>`;
    }
}

customElements.define('mas-masa-dashboard', MasMasaDashboard);
