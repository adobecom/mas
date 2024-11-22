import { html, LitElement } from 'lit';
import './editors/merch-card-editor.js';
import './rte/rte-field.js';
import './rte/rte-link-editor.js';
import './mas-top-nav.js';
import './mas-toolbar.js';
import './mas-content.js';
import './mas-fetcher.js';
import './mas-toast.js';
import './mas-query-manager.js';

const BUCKET_TO_ENV = {
    e155390: 'qa',
    e59471: 'stage',
    e59433: 'prod',
};

class MasStudio extends LitElement {
    static properties = {
        bucket: { type: String, attribute: 'aem-bucket' },
        baseUrl: { type: String, attribute: 'base-url' },
    };

    constructor() {
        super();
        this.bucket = 'e59433';
    }

    createRenderRoot() {
        return this;
    }

    get env() {
        return BUCKET_TO_ENV[this.bucket] || BUCKET_TO_ENV.e59433;
    }

    render() {
        console.log('RERENDER studio');
        return html`
            <mas-top-nav env="${this.env}"></mas-top-nav>
            <mas-fetcher
                bucket="${this.bucket}"
                base-url="${this.baseUrl}"
            ></mas-fetcher>
            <mas-toolbar></mas-toolbar>
            <mas-content></mas-content>
            <merch-card-editor></merch-card-editor>
            <mas-toast></mas-toast>
            <mas-query-manager></mas-query-manager>
        `;
    }
}

customElements.define('mas-studio', MasStudio);
