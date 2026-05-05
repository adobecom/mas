import { LitElement, html, css } from 'lit';

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
    `;

    constructor() {
        super();
        this.publishedAt = '';
        this.publishedBy = '';
        this.error = '';
        this.variant = 'success';
    }

    willUpdate(changed) {
        if (changed.has('error')) this.variant = this.error ? 'error' : 'success';
    }

    formatDate(iso) {
        if (!iso) return '';
        try {
            return DATE_FORMATTER.format(new Date(iso));
        } catch {
            return iso;
        }
    }

    render() {
        if (this.error) {
            return html`
                <div class="header">
                    <sp-icon-alert></sp-icon-alert>
                    <p class="title">Publish failed</p>
                </div>
                <p class="body">${this.error}</p>
            `;
        }
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
