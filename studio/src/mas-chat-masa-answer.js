import { html, css, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { MasaSessionElement } from './mas-chat/masa-session-element.js';
import { parseMarkdown } from './utils/markdown-parser.js';

const pendingStatus = ['queued', 'running'];

/** One MASA answer in the conversation thread: live job progress, the finding, or the labelled fallback. */
export class MasChatMasaAnswer extends MasaSessionElement {
    static properties = {
        ...MasaSessionElement.properties,
        recordId: { type: String },
        question: { type: String },
        failure: { type: String },
        fallback: { attribute: false },
    };

    static styles = css`
        :host {
            display: grid;
            gap: 12px;
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
        .finding,
        .evidence,
        .fallback {
            min-width: 0;
            overflow-wrap: anywhere;
        }
        .finding p,
        .evidence p {
            margin-block: 0 8px;
        }
        .finding > :last-child,
        .evidence li > :last-child {
            margin-block-end: 0;
        }
        .evidence summary {
            cursor: pointer;
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
    }

    get record() {
        return this.activeController?.records.find((item) => item.id === this.recordId);
    }

    get shouldPoll() {
        return Boolean(this.record && pendingStatus.includes(this.record.status));
    }

    openCard(item) {
        this.dispatchEvent(
            new CustomEvent('open-card', { detail: { fragment: { id: item.id } }, bubbles: true, composed: true }),
        );
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

    /**
     * The labelled built-in answer: progress while it is on its way, then the
     * answer and "Ask MASA again". A chat message that shows the answer itself
     * passes empty content, so only the label and the action are added.
     */
    get fallbackTemplate() {
        const { content, pending } = this.fallback;
        return html`<p class="placeholder">Answered from Studio's built-in knowledge, MASA unavailable</p>
            ${pending
                ? html`<sp-progress-circle size="s" indeterminate aria-label="Answer in progress"></sp-progress-circle>`
                : html`${content ? html`<div class="fallback">${unsafeHTML(parseMarkdown(content))}</div>` : nothing}
                  ${this.askAgainTemplate}`}`;
    }

    /** Before MASA accepts the job there is no record yet, only the submission in flight. */
    get submittingTemplate() {
        return html`<div class="status" aria-live="polite">
            <sp-progress-circle size="s" indeterminate aria-label="Investigation in progress"></sp-progress-circle>
            <span>MASA is working on it</span>
        </div>`;
    }

    renderRecord(record) {
        const controller = this.activeController;
        const pending = pendingStatus.includes(record.status);
        const active = controller.session?.status === 'active' && controller.session.id === record.sessionId;
        const missingFiles = record.files.filter(
            ({ name }) =>
                !controller.images.some((image) => image.name === name) &&
                !(record.artifacts ?? []).some((artifact) => artifact.filename === name && active),
        );
        return html`<div class="status" aria-live="polite">
                ${pending
                    ? html`<sp-progress-circle
                          size="s"
                          indeterminate
                          aria-label="Investigation in progress"
                      ></sp-progress-circle>`
                    : nothing}
                ${pending ? html`<span>MASA is working on it</span>` : html`<sp-badge>${record.status}</sp-badge>`}
                ${pending && record.progress ? html`<span>${record.progress.probeResults} checks completed</span>` : nothing}
                ${pending
                    ? html`<sp-button variant="secondary" ?disabled=${this.blocked} @click=${() => controller.cancel(record)}
                          >Cancel investigation</sp-button
                      >`
                    : nothing}
            </div>
            ${record.text ? html`<div class="finding">${unsafeHTML(parseMarkdown(record.text))}</div>` : nothing}
            ${record.evidence?.length
                ? html`<details class="evidence">
                      <summary>Evidence (${record.evidence.length})</summary>
                      <ul>
                          ${record.evidence.map(
                              ({ id, summary }) => html`<li><code>${id}</code> ${unsafeHTML(parseMarkdown(summary))}</li>`,
                          )}
                      </ul>
                  </details>`
                : nothing}
            ${record.status === 'failed' || record.status === 'interrupted'
                ? html`<p>MASA could not complete this investigation. You can submit a new question.</p>`
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
                        ? html`<a href=${download.url} download=${download.name}>Save ${download.name}</a>
                              ${download.mimetype === 'image/png'
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
            ${record.limitedContext || record.limitations?.length
                ? html`<details>
                      <summary>Investigation limits</summary>
                      ${record.limitedContext
                          ? html`<p>
                                Only recent findings that fit were included as context. Include any other relevant details in
                                your next question.
                            </p>`
                          : nothing}
                      <ul>
                          ${(record.limitations ?? []).map((item) => html`<li>${item.replaceAll('-', ' ')}</li>`)}
                      </ul>
                  </details>`
                : nothing}`;
    }

    render() {
        if (this.fallback) return this.fallbackTemplate;
        if (this.failure)
            return html`<p role="alert">${this.failure}</p>
                ${this.askAgainTemplate}`;
        const record = this.record;
        if (record) return this.renderRecord(record);
        if (this.activeController?.busy) return this.submittingTemplate;
        return nothing;
    }
}

customElements.define('mas-chat-masa-answer', MasChatMasaAnswer);
