import { html, css, nothing } from 'lit';
import { MasaSessionElement } from './mas-chat/masa-session-element.js';
import { MasaClientError } from './mas-chat/masa-client.js';

/** Session lease status, expiry warning and renewal for a conversation's MASA investigations. */
export class MasChatMasaSession extends MasaSessionElement {
    static styles = css`
        :host {
            display: block;
        }
        .strip {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 4px 8px;
            padding: 8px 12px;
            border-radius: 8px;
            background: var(--spectrum-gray-100, #f8f8f8);
            color: var(--spectrum-gray-800, #222);
            font-size: 12px;
            line-height: 1.4;
        }
        .strip.expiring {
            background: var(--spectrum-orange-100, #fff1e0);
            color: var(--spectrum-orange-900, #7a3300);
        }
        .strip.expiring sp-icon-alert {
            color: var(--spectrum-orange-800, #a14400);
        }
        .strip sp-icon-clock,
        .strip sp-icon-alert,
        .strip sp-icon-info {
            flex: none;
        }
        .message {
            flex: 1 1 160px;
            min-width: 0;
        }
        .actions {
            display: flex;
            flex: none;
            align-items: center;
            gap: 4px;
            margin-inline-start: auto;
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

    get fileCount() {
        const controller = this.activeController;
        return controller.images.length + controller.downloads.size;
    }

    render() {
        const controller = this.activeController;
        const session = controller?.session;
        if (!session) return nothing;
        if (session.status !== 'active')
            return html`<div class="strip">
                <sp-icon-info size="s" aria-hidden="true"></sp-icon-info>
                <span class="message" role="status">Session ended. Saved answers stay in this chat.</span>
            </div>`;
        const remaining = Date.parse(session.expiresAt) - controller.now();
        const expiring = remaining <= 120000;
        const working = session.activeInvestigations > 0;
        const until = new Date(session.expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        const files = this.fileCount;
        const kept = files && !expiring ? ` · ${files} ${files === 1 ? 'file' : 'files'} kept until ${until}` : '';
        let message = `MASA session active until ${until}`;
        if (expiring) message = `Session ends at ${until}`;
        else if (working) message = 'MASA is working · session stays active';
        return html`<div class="strip ${expiring ? 'expiring' : ''}">
            ${expiring
                ? html`<sp-icon-alert size="s" aria-hidden="true"></sp-icon-alert>`
                : html`<sp-icon-clock size="s" aria-hidden="true"></sp-icon-clock>`}
            <span class="message" role="status">${message}${kept}</span>
            <div class="actions">
                ${working
                    ? nothing
                    : html`<sp-action-button
                          size="s"
                          ?quiet=${!expiring}
                          ?emphasized=${expiring}
                          ?disabled=${this.blocked}
                          @click=${() => controller.renew()}
                          >Keep active</sp-action-button
                      >`}
                <sp-action-button
                    size="s"
                    quiet
                    ?disabled=${controller.ending || controller.now() < controller.retryAt}
                    @click=${this.end}
                    >End session
                    <sp-tooltip self-managed placement="top">Ends the MASA session and clears its files</sp-tooltip>
                </sp-action-button>
            </div>
        </div>`;
    }
}

customElements.define('mas-chat-masa-session', MasChatMasaSession);
