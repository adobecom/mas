import { html, css, nothing } from 'lit';
import { MasaSessionElement } from './mas-chat/masa-session-element.js';
import { MasaClientError } from './mas-chat/masa-client.js';

/** Session lease status, expiry warning and renewal for a conversation's MASA investigations. */
export class MasChatMasaSession extends MasaSessionElement {
    static styles = css`
        :host {
            display: block;
        }
        .notice {
            padding: 16px;
            border: 1px solid var(--spectrum-gray-300, #ddd);
            border-radius: 8px;
        }
        .actions {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
        }
        p {
            margin: 0;
            line-height: 1.5;
        }
    `;

    get shouldPoll() {
        return this.activeController?.session?.status === 'active';
    }

    async end() {
        try {
            await this.activeController.end();
        } catch (error) {
            if (!(error instanceof MasaClientError)) throw error;
            this.activeController.fail(error);
            this.activeController.notify();
        }
    }

    render() {
        const controller = this.activeController;
        const session = controller?.session;
        if (!session) return nothing;
        if (session.status !== 'active')
            return html`<div class="notice" role="status">
                Session ${session.status}. Saved findings remain; upload images again to start another investigation.
            </div>`;
        const remaining = Date.parse(session.expiresAt) - controller.now();
        return html`<div class="notice" role="status">
            ${remaining <= 120000
                ? html`<strong>Your session is about to expire.</strong>`
                : html`<span
                      >${session.activeInvestigations
                          ? 'Ongoing work keeps this session active.'
                          : 'This session stays active while you use this view.'}</span
                  >`}
            <p>Files are available until ${new Date(session.expiresAt).toLocaleTimeString()} unless the session is renewed.</p>
            <div class="actions">
                <sp-button variant="secondary" ?disabled=${this.blocked} @click=${() => controller.renew()}
                    >Keep session active</sp-button
                >
                <sp-button
                    variant="secondary"
                    ?disabled=${controller.ending || controller.now() < controller.retryAt}
                    @click=${this.end}
                    >End session and clear files</sp-button
                >
            </div>
        </div>`;
    }
}

customElements.define('mas-chat-masa-session', MasChatMasaSession);
