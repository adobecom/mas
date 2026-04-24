import { LitElement, html, css } from 'lit';

class MasBulkPublishSuccessBanner extends LitElement {
    static properties = {
        publishedAt: { type: String },
        publishedBy: { type: String },
    };

    static styles = css`
        :host {
            display: block;
            background: #e8f5e9;
            padding: 16px 24px;
            border-radius: 12px;
            margin-bottom: 16px;
        }
        h2 {
            margin: 0 0 4px;
            color: #2e7d32;
        }
    `;

    formatDate(iso) {
        if (!iso) return '';
        try {
            return new Date(iso).toISOString().slice(0, 10);
        } catch {
            return iso;
        }
    }

    render() {
        return html`
            <h2>Project published successfully</h2>
            <p>
                All items in this project were published on ${this.formatDate(this.publishedAt)} by ${this.publishedBy} and are
                now live across the selected locales.
            </p>
        `;
    }
}

customElements.define('mas-bulk-publish-success-banner', MasBulkPublishSuccessBanner);
