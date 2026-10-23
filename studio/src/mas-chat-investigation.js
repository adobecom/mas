import { LitElement, html, css, nothing } from 'lit';
import { getInvestigationSession } from './mas-chat/investigation-session.js';
import { MasaClientError } from './mas-chat/masa-client.js';

/** A read-only investigation workspace inside the existing Studio conversation. */
export class MasChatInvestigation extends LitElement {
    static properties = {
        conversationId: { type: String },
        context: { type: String },
        controller: { attribute: false },
        question: { state: true },
    };

    static styles = css`
        :host {
            display: block;
            overflow: auto;
            flex: 1;
            min-height: 0;
        }
        section {
            padding: 20px;
            display: grid;
            gap: 16px;
        }
        h2,
        h3,
        p {
            margin: 0;
        }
        p {
            line-height: 1.5;
        }
        .toolbar,
        .actions,
        .images,
        .status {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
        }
        .toolbar {
            justify-content: space-between;
        }
        article,
        .notice {
            padding: 16px;
            border: 1px solid var(--spectrum-gray-300, #ddd);
            border-radius: 8px;
        }
        article {
            display: grid;
            gap: 12px;
        }
        .transcript {
            display: grid;
            gap: 16px;
        }
        .finding {
            white-space: pre-wrap;
            overflow-wrap: anywhere;
        }
        sp-textfield {
            width: 100%;
        }
        .images figure {
            margin: 0;
            max-width: 150px;
            overflow-wrap: anywhere;
        }
        img {
            max-width: 100%;
            max-height: 200px;
            object-fit: contain;
        }
        .placeholder {
            color: var(--spectrum-gray-700, #555);
        }
        label {
            font-weight: 600;
        }
        ul {
            margin: 0;
            padding-inline-start: 24px;
        }
        li {
            margin-block: 6px;
        }
        .file-input {
            max-width: 100%;
        }
    `;

    constructor() {
        super();
        this.question = '';
        this.context = '';
        this.controller = null;
        this.onChange = () => this.requestUpdate();
    }

    connectedCallback() {
        super.connectedCallback();
        if (this.activeController) this.subscribe();
    }

    willUpdate(changed) {
        if (changed.has('conversationId') || changed.has('controller')) {
            this.unsubscribe();
            this.activeController = this.controller ?? getInvestigationSession(this.conversationId);
            this.question = '';
            this.subscribe();
        }
    }

    subscribe() {
        this.activeController.addEventListener('change', this.onChange);
        this.detach = this.activeController.attach();
    }

    unsubscribe() {
        this.detach?.();
        this.detach = null;
        this.activeController?.removeEventListener('change', this.onChange);
    }

    disconnectedCallback() {
        this.unsubscribe();
        super.disconnectedCallback();
    }

    async send() {
        const controller = this.activeController;
        const count = controller.records.length;
        await controller.submit(this.question.trim(), this.context);
        if (this.activeController === controller && controller.records.length > count) this.question = '';
    }

    async chooseImages(event) {
        const controller = this.activeController;
        for (const file of event.target.files) {
            await controller.addImage(file);
            if (controller.error) break;
        }
        event.target.value = '';
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

    openCard(item) {
        this.dispatchEvent(
            new CustomEvent('open-card', { detail: { fragment: { id: item.id } }, bubbles: true, composed: true }),
        );
    }

    get blocked() {
        const controller = this.activeController;
        return controller.busy || controller.ending || controller.now() < controller.retryAt;
    }

    get composerTemplate() {
        const controller = this.activeController;
        const locked =
            this.blocked ||
            Boolean(controller.pending) ||
            controller.records.some((record) => ['queued', 'running'].includes(record.status));
        return html`
            <div class="images">
                ${controller.images.map(
                    (image) =>
                        html`<figure>
                            <img src=${image.preview} alt=${image.name} />
                            <figcaption>${image.name}</figcaption>
                            <sp-action-button ?disabled=${locked} @click=${() => controller.removeImage(image.id)}
                                >Remove image</sp-action-button
                            >
                        </figure>`,
                )}
            </div>
            <label for="question">What would you like to investigate?</label>
            <sp-textfield
                id="question"
                multiline
                rows="3"
                maxlength="6000"
                .value=${this.question}
                ?disabled=${locked}
                placeholder="Describe the problem and include a card ID or page URL."
                @input=${(event) => {
                    this.question = event.target.value;
                }}
            ></sp-textfield>
            <div class="actions">
                <input
                    class="file-input"
                    type="file"
                    aria-label="Attach investigation images"
                    multiple
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    ?disabled=${locked || Boolean(controller.uploadIntent) || controller.images.length >= 3}
                    @change=${this.chooseImages}
                />
                <sp-button
                    variant="accent"
                    ?disabled=${locked || !this.question.trim() || Boolean(controller.uploadIntent)}
                    @click=${this.send}
                    >Investigate</sp-button
                >
            </div>
            <p>Up to three images, 5 MB each. Images and generated files are available only during the active session.</p>
            ${controller.uploadIntent
                ? html`<div class="notice" role="status">
                      Upload not confirmed: ${controller.uploadIntent.file.name}.
                      <sp-button variant="secondary" ?disabled=${this.blocked} @click=${() => controller.retryUpload()}
                          >Retry upload</sp-button
                      >
                  </div>`
                : nothing}
            ${controller.pending
                ? html`<div class="notice" role="status">
                      Submission not confirmed. Retrying checks the same request; it does not start a second investigation.
                      <p>${controller.pending.question}</p>
                      <sp-button variant="secondary" ?disabled=${this.blocked} @click=${() => controller.retrySubmission()}
                          >Retry submission</sp-button
                      >
                  </div>`
                : nothing}
        `;
    }

    get sessionTemplate() {
        const controller = this.activeController;
        const session = controller.session;
        if (!session) return html`<p>A session starts when you investigate or attach an image.</p>`;
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

    renderRecord(record) {
        const controller = this.activeController;
        const pending = ['queued', 'running'].includes(record.status);
        const active = controller.session?.status === 'active' && controller.session.id === record.sessionId;
        const missingFiles = record.files.filter(
            ({ name }) =>
                !controller.images.some((image) => image.name === name) &&
                !(record.artifacts ?? []).some((artifact) => artifact.filename === name && active),
        );
        return html`<article>
            <h3>${record.question}</h3>
            <div class="status" aria-live="polite">
                ${pending
                    ? html`<sp-progress-circle
                          size="s"
                          indeterminate
                          aria-label="Investigation in progress"
                      ></sp-progress-circle>`
                    : nothing}
                <sp-badge>${record.status}</sp-badge>
                ${pending && record.progress ? html`<span>${record.progress.probeResults} checks completed</span>` : nothing}
                ${pending
                    ? html`<sp-button variant="secondary" ?disabled=${this.blocked} @click=${() => controller.cancel(record)}
                          >Cancel investigation</sp-button
                      >`
                    : nothing}
            </div>
            ${record.text ? html`<p class="finding">${record.text}</p>` : nothing}
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
                : nothing}
        </article>`;
    }

    render() {
        const controller = this.activeController;
        if (!controller) return nothing;
        return html`<section aria-label="MASA investigations">
            <div class="toolbar">
                <h2>Investigate with MASA</h2>
                <sp-badge variant="informative">Read only</sp-badge>
            </div>
            <p>Investigate live card and page behavior. Use Chat for authoring actions and ordinary Studio questions.</p>
            ${this.sessionTemplate}
            ${controller.error
                ? html`<sp-help-text variant="negative" role="alert"
                      >${controller.error.message}
                      ${controller.retryAt > controller.now()
                          ? html` Retry in ${Math.ceil((controller.retryAt - controller.now()) / 1000)} seconds.`
                          : nothing}
                  </sp-help-text>`
                : nothing}
            <div class="transcript">${controller.records.map((record) => this.renderRecord(record))}</div>
            ${controller.busy || controller.ending
                ? html`<sp-progress-circle indeterminate size="s" aria-label="Processing request"></sp-progress-circle>`
                : nothing}
            ${this.composerTemplate}
        </section>`;
    }
}

customElements.define('mas-chat-investigation', MasChatInvestigation);
