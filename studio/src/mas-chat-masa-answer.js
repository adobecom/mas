import { html, css, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { MasaSessionElement } from './mas-chat/masa-session-element.js';
import { isRunning } from './mas-chat/investigation-session.js';
import { parseAnswerMarkdown } from './utils/markdown-parser.js';

const STATUS_AFTER_MS = 15000;
const LONG_WAIT_AFTER_MS = 120000;
const clock = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

/** One MASA answer in the conversation thread: live job progress, the finding, or the labelled fallback. */
export class MasChatMasaAnswer extends MasaSessionElement {
    static properties = {
        ...MasaSessionElement.properties,
        recordId: { type: String },
        question: { type: String },
        failure: { type: String },
        fallback: { attribute: false },
        pending: { type: Boolean, reflect: true },
    };

    static styles = css`
        :host {
            display: grid;
            gap: 12px;
        }
        /* Mirrors chat.css: the answer renders in a shadow root, so those rules do not reach the chips. */
        .chat-button-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 12px;
        }
        .chat-option-pill {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            border: 1px solid var(--spectrum-gray-300, #d5d5d5);
            border-radius: 16px;
            background: var(--spectrum-white, #ffffff);
            cursor: pointer;
            font-size: 14px;
            color: var(--spectrum-gray-800, #2c2c2c);
            min-width: 0;
            overflow-wrap: anywhere;
        }
        .chat-option-pill:hover:not(.disabled) {
            border-color: var(--spectrum-gray-400, #b8b8b8);
        }
        .chat-option-pill.selected {
            border: 2px solid #1473e6;
            padding: 11px 15px;
            font-weight: 600;
        }
        .chat-option-pill.disabled {
            opacity: 0.4;
            cursor: default;
        }
        .chat-option-pill-label {
            flex: 1;
            min-width: 0;
            overflow-wrap: anywhere;
        }
        .chat-option-pill-check {
            color: #1473e6;
            flex-shrink: 0;
            margin-left: 8px;
        }
        p {
            margin: 0;
            line-height: 1.5;
        }
        h3 {
            margin: 0;
        }
        .actions,
        .status {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
        }
        .typing-status {
            color: var(--spectrum-global-color-gray-600, #6e6e6e);
            font-size: var(--spectrum-global-dimension-font-size-75, 12px);
        }
        .finding,
        .fallback {
            min-width: 0;
            overflow-wrap: anywhere;
        }
        .finding p {
            margin-block: 0 8px;
        }
        .finding > :last-child {
            margin-block-end: 0;
        }
        .visually-hidden {
            position: absolute;
            width: 1px;
            height: 1px;
            overflow: hidden;
            clip-path: inset(50%);
            white-space: nowrap;
        }
        code {
            font-family: var(--spectrum-code-font-family-stack, monospace);
            font-size: 0.9em;
            background: var(--spectrum-gray-100, #f8f8f8);
            padding: 2px 4px;
            border-radius: 4px;
        }
        pre {
            margin-block: 0 8px;
            padding: 8px 12px;
            background: var(--spectrum-gray-100, #f8f8f8);
            border: 1px solid var(--spectrum-gray-300, #d5d5d5);
            border-radius: 6px;
            white-space: pre;
            overflow-x: auto;
        }
        pre code {
            background: transparent;
            padding: 0;
        }
        .table-wrap {
            margin-block: 0 8px;
            overflow-x: auto;
            overflow-wrap: normal;
        }
        table {
            border-collapse: collapse;
        }
        th,
        td {
            padding: 4px 8px;
            border: 1px solid var(--spectrum-gray-300, #d5d5d5);
            text-align: start;
            vertical-align: top;
        }
        th {
            background: var(--spectrum-gray-100, #f8f8f8);
            font-weight: 600;
        }
        img {
            max-width: 100%;
            max-height: 200px;
            object-fit: contain;
        }
        .placeholder {
            color: var(--spectrum-gray-700, #555);
        }
        ul,
        ol {
            margin: 0;
            padding-inline-start: 24px;
        }
        li {
            margin-block: 6px;
        }
    `;

    constructor() {
        super();
        this.recordId = null;
        this.question = '';
        this.failure = null;
        this.fallback = null;
        this.pending = false;
    }

    get record() {
        return this.activeController?.records.find((item) => item.id === this.recordId);
    }

    get shouldPoll() {
        return Boolean(this.record && isRunning(this.record));
    }

    /** What to call the answer while it is on its way: the built-in fallback, the submission or a running job. */
    get workingLabel() {
        if (this.fallback) return this.fallback.pending ? 'Answer in progress' : null;
        if (this.failure) return null;
        if (this.record) return isRunning(this.record) ? 'MASA is working on it' : null;
        return this.activeController?.busy ? 'MASA is working on it' : null;
    }

    /** What the one live region says; it stays in place, so each change of state is announced. */
    get announcement() {
        if (this.workingLabel) return this.workingLabel;
        if (this.fallback || this.failure) return '';
        return this.record?.status ?? '';
    }

    /** Reflected as [pending] so chat.css can show a working answer as the ordinary typing row. */
    willUpdate(changed) {
        super.willUpdate(changed);
        this.pending = Boolean(this.workingLabel);
    }

    openCard(item) {
        this.dispatchEvent(
            new CustomEvent('open-card', { detail: { fragment: { id: item.id } }, bubbles: true, composed: true }),
        );
    }

    handleFollowUp(event) {
        event.stopPropagation();
        this.dispatchEvent(
            new CustomEvent('masa-follow-up', { detail: { question: event.detail.value }, bubbles: true, composed: true }),
        );
    }

    get followUpsTemplate() {
        const { record } = this;
        if (record?.status !== 'completed' || !record.followUps?.length) return nothing;
        if (this.activeController.records.at(-1) !== record) return nothing;
        return html`<mas-chat-button-group
            .buttons=${record.followUps.map((question) => ({ label: question, value: question }))}
            @button-selected=${this.handleFollowUp}
        ></mas-chat-button-group>`;
    }

    askAgain() {
        this.dispatchEvent(
            new CustomEvent('masa-retry', { detail: { question: this.question }, bubbles: true, composed: true }),
        );
    }

    get askAgainTemplate() {
        return html`<div class="actions">
            <sp-button variant="secondary" @click=${this.askAgain}>Ask MASA again</sp-button>
        </div>`;
    }

    /** Visible text for a long wait, so a quiet question does not look like a timed-out session. */
    waitStatus(record) {
        const elapsed = record.startedAt
            ? this.activeController.now() - Date.parse(record.startedAt)
            : (record.progress?.elapsedMs ?? 0);
        if (!(elapsed >= STATUS_AFTER_MS)) return '';
        const checks = record.progress?.probeResults;
        return [
            'Still checking',
            checks > 0 && `${checks} checks`,
            clock(elapsed),
            elapsed >= LONG_WAIT_AFTER_MS && 'Some answers take a few minutes',
        ]
            .filter(Boolean)
            .join(' · ');
    }

    /** While an answer is on its way: the chat's glowing dots, which the message slots in so chat.css styles them. */
    workingTemplate(action = nothing, status = '') {
        return html`<div class="status">
            <slot name="working"></slot>
            ${status ? html`<span class="typing-status">${status}</span>` : nothing} ${action}
        </div>`;
    }

    /**
     * The labelled built-in answer: the working indicator while it is on its way, then
     * the answer and "Ask MASA again". A chat message that shows the answer itself
     * passes empty content, so only the label and the action are added.
     */
    get fallbackTemplate() {
        const { content, pending, reason } = this.fallback;
        const label =
            reason === 'unfinished'
                ? "MASA couldn't finish this answer · answered from Studio's built-in knowledge"
                : "Answered from Studio's built-in knowledge, MASA unavailable";
        return html`<p class="placeholder">${label}</p>
            ${reason === 'unfinished'
                ? html`<p class="placeholder guidance">Ask again with the card ID or the page URL.</p>`
                : nothing}
            ${pending
                ? this.workingTemplate()
                : html`${content ? html`<div class="fallback">${unsafeHTML(parseAnswerMarkdown(content))}</div>` : nothing}
                  ${this.askAgainTemplate}`}`;
    }

    /** Before MASA accepts the job there is no record yet, only the submission in flight. */
    get submittingTemplate() {
        return this.workingTemplate();
    }

    /** A completed answer is just its finding; every other state says where the job stands. */
    statusTemplate(record) {
        if (record.status === 'completed') return nothing;
        if (!isRunning(record)) return html`<div class="status"><sp-badge>${record.status}</sp-badge></div>`;
        return this.workingTemplate(
            html`<sp-button
                size="s"
                variant="secondary"
                ?disabled=${this.blocked}
                @click=${() => this.activeController.cancel(record)}
                >Cancel</sp-button
            >`,
            this.waitStatus(record),
        );
    }

    renderRecord(record) {
        const controller = this.activeController;
        const active = controller.session?.status === 'active' && controller.session.id === record.sessionId;
        const missingFiles = record.files.filter(
            ({ name }) =>
                !controller.images.some((image) => image.name === name) &&
                !(record.artifacts ?? []).some((artifact) => artifact.filename === name && active),
        );
        return html`${this.statusTemplate(record)}
        ${record.text ? html`<div class="finding">${unsafeHTML(parseAnswerMarkdown(record.text))}</div>` : nothing}
        ${record.status === 'failed' || record.status === 'interrupted'
            ? html`<p>MASA could not finish this answer. You can ask a new question.</p>`
            : nothing}
        ${(record.lists ?? []).map(
            (list) =>
                html`<div>
                    <h3>${list.heading}</h3>
                    <ul>
                        ${list.items.map(
                            (item) =>
                                html`<li>
                                    ${item.title ?? item.id} ${item.detail ?? ''}
                                    ${/^[0-9a-f-]{36}$/i.test(item.id)
                                        ? html`<sp-action-button @click=${() => this.openCard(item)}
                                              >Open in Studio</sp-action-button
                                          >`
                                        : nothing}
                                </li>`,
                        )}
                    </ul>
                </div>`,
        )}
        ${(record.artifacts ?? []).map((artifact) => {
            const download = controller.downloads.get(artifact.id);
            return html`<div class="actions">
                <span>${artifact.filename}</span>
                ${download
                    ? html`<a href=${download.url} download=${download.name}>Save ${download.name}</a> ${download.mimetype ===
                          'image/png'
                              ? html`<img src=${download.url} alt=${artifact.title ?? artifact.filename} />`
                              : nothing}`
                    : html`<sp-button
                          variant="secondary"
                          ?disabled=${this.blocked || !active || !artifact.available}
                          @click=${() => controller.download(record, artifact)}
                          >Prepare download</sp-button
                      >`}
            </div>`;
        })}
        ${missingFiles.length
            ? html`<p class="placeholder">
                  Files from the earlier view are unavailable: ${missingFiles.map((file) => file.name).join(', ')}. Upload
                  images again if needed.
              </p>`
            : nothing}
        ${this.followUpsTemplate}`;
    }

    get bodyTemplate() {
        if (this.fallback) return this.fallbackTemplate;
        if (this.failure)
            return html`<p role="alert">${this.failure}</p>
                ${this.askAgainTemplate}`;
        const record = this.record;
        if (record) return this.renderRecord(record);
        if (this.activeController?.busy) return this.submittingTemplate;
        return nothing;
    }

    render() {
        return html`<p class="visually-hidden" aria-live="polite">${this.announcement}</p>
            ${this.bodyTemplate}`;
    }
}

customElements.define('mas-chat-masa-answer', MasChatMasaAnswer);
