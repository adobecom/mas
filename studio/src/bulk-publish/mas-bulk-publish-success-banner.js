import { LitElement, html, css, nothing } from 'lit';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
});

class MasBulkPublishSuccessBanner extends LitElement {
    static properties = {
        publishedAt: { type: String },
        publishedBy: { type: String },
        error: { type: String },
        variant: { type: String, reflect: true },
        result: { type: Object },
    };

    static styles = css`
        :host {
            display: block;
            border-radius: 8px;
            padding: 20px 24px;
            margin-bottom: 16px;
        }
        :host([variant='success']) {
            background: var(--spectrum-semantic-positive-background-color-default, #e8f5e9);
        }
        :host([variant='error']) {
            background: var(--spectrum-semantic-negative-background-color-default, #fde8e8);
        }
        :host([variant='publishing']) {
            background: var(--spectrum-semantic-informative-background-color-default, #e0f0ff);
        }
        :host([variant='partial']) {
            background: var(--spectrum-semantic-notice-background-color-default, #fff4e0);
        }
        sp-icon-refresh {
            color: var(--spectrum-semantic-informative-color-icon, #1473e6);
        }
        .header {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 8px;
        }
        .title {
            font-size: 16px;
            font-weight: 700;
            line-height: 20px;
            color: var(--spectrum-alias-text-color, #292929);
            margin: 0;
        }
        .body {
            font-size: 14px;
            line-height: 18px;
            color: var(--spectrum-alias-text-color, #292929);
            margin: 0;
        }
        sp-icon-checkmark-circle {
            color: var(--spectrum-semantic-positive-color-icon, #2d9d78);
        }
        sp-icon-alert {
            color: var(--spectrum-semantic-negative-color-icon, #d7373f);
        }
        .failure-list {
            margin: 4px 0 0 0;
            padding-left: 20px;
        }
        .failure-list li {
            font-size: 13px;
            line-height: 18px;
            color: var(--spectrum-alias-text-color, #292929);
            word-break: break-all;
        }
    `;

    constructor() {
        super();
        this.publishedAt = '';
        this.publishedBy = '';
        this.error = '';
        this.variant = 'success';
        this.result = null;
    }

    willUpdate(changed) {
        if (changed.has('error') || changed.has('result')) {
            if (this.variant === 'publishing') return;
            if (this.error) this.variant = 'error';
            else if (this.result && this.result.failed > 0) this.variant = 'partial';
            else this.variant = 'success';
        }
    }

    formatDate(iso) {
        if (!iso) return '';
        try {
            return DATE_FORMATTER.format(new Date(iso));
        } catch {
            return iso;
        }
    }

    get isRevertError() {
        return this.error.startsWith('REVERT:\n');
    }

    get revertFailures() {
        return this.error.slice('REVERT:\n'.length).split('\n').filter(Boolean);
    }

    renderPartial() {
        const { published, failed, failures = [], failuresTruncated } = this.result;
        return html`
            <div class="header">
                <sp-icon-alert></sp-icon-alert>
                <p class="title">Project partially published</p>
            </div>
            <p class="body">${published} published, ${failed} failed.</p>
            <ul class="failure-list">
                ${failures.map((f) => html`<li>${f.path} — ${f.reason}</li>`)}
            </ul>
            ${failuresTruncated ? html`<p class="body">Showing ${failures.length} of ${failed} failures.</p>` : nothing}
        `;
    }

    render() {
        if (this.variant === 'publishing') {
            return html`
                <div class="header">
                    <sp-icon-refresh></sp-icon-refresh>
                    <p class="title">Publishing in progress…</p>
                </div>
                <p class="body">This project is currently being published. Fields are read-only.</p>
            `;
        }
        if (this.error) {
            const title = this.isRevertError ? 'Revert failed' : 'Publish failed';
            const body = this.isRevertError
                ? html`
                      <p class="body">The following fragments could not be reverted:</p>
                      <ul class="failure-list">
                          ${this.revertFailures.map((line) => html`<li>${line}</li>`)}
                      </ul>
                  `
                : html`<p class="body">${this.error}</p>`;
            return html`
                <div class="header">
                    <sp-icon-alert></sp-icon-alert>
                    <p class="title">${title}</p>
                </div>
                ${body}
            `;
        }
        if (this.variant === 'partial') return this.renderPartial();
        return html`
            <div class="header">
                <sp-icon-checkmark-circle></sp-icon-checkmark-circle>
                <p class="title">Project published successfully</p>
            </div>
            <p class="body">
                All items in this project were published on ${this.formatDate(this.publishedAt)} by ${this.publishedBy}.
            </p>
        `;
    }
}

customElements.define('mas-bulk-publish-success-banner', MasBulkPublishSuccessBanner);
