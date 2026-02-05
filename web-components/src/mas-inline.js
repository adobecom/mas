import { LitElement, html } from 'lit';
import { guard } from 'lit/directives/guard.js';
import {
    EVENT_AEM_LOAD,
    EVENT_AEM_ERROR,
} from './constants.js';
import { getService } from './utils.js';
import './aem-fragment.js';

const TAG_NAME = 'mas-inline';
const DEFAULT_FIELD = 'description';

/**
 * MAS Inline component - renders text content from a Card fragment.
 *
 * Designed for use cases where text content (with optional pricing/CTAs)
 * needs to be displayed outside of a full merch-card context, such as
 * FAQ answers, text blocks, promobars, etc.
 *
 * Uses existing Card fragment model - no new AEM model required.
 * Delegates fragment loading to aem-fragment for consistent behavior.
 * Supports regional variations via the MAS I/O customize.js pipeline.
 *
 * @element mas-inline
 *
 * @attr {string} fragment - Required. The fragment ID to load.
 * @attr {string} field - Optional. The field to render. Default: 'description'.
 *                        Other options: 'shortDescription', 'promoText', 'callout'
 *
 * @fires aem:load - When fragment loads successfully
 * @fires aem:error - When fragment fails to load
 */
export class MasInline extends LitElement {
    static properties = {
        fragment: { type: String, reflect: true },
        field: { type: String, reflect: true },
    };

    #log;
    #service = null;
    #content = '';
    #aemFragmentEl = null;

    constructor() {
        super();
        this.field = DEFAULT_FIELD;
    }

    /**
     * Returns the internal aem-fragment element (cached after first access)
     */
    get aemFragment() {
        return (this.#aemFragmentEl ??= this.querySelector('aem-fragment'));
    }

    /**
     * Access the fragment data after loading
     */
    get data() {
        return this.aemFragment?.data ?? null;
    }

    connectedCallback() {
        super.connectedCallback();
        this.#service ??= getService(this);
        this.#log ??= this.#service?.log?.module(`${TAG_NAME}[${this.fragment}]`);

        if (!this.fragment) {
            this.#fail('Missing fragment attribute');
            return;
        }

        // Listen for aem-fragment events in capture phase to handle before bubbling
        this.addEventListener(EVENT_AEM_LOAD, this.#handleLoad, true);
        this.addEventListener(EVENT_AEM_ERROR, this.#handleError, true);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener(EVENT_AEM_LOAD, this.#handleLoad, true);
        this.removeEventListener(EVENT_AEM_ERROR, this.#handleError, true);
        this.#aemFragmentEl = null;
    }

    /**
     * Refresh the fragment content (e.g., after locale change)
     */
    async refresh() {
        const aemFragment = this.aemFragment;
        if (aemFragment) {
            return aemFragment.refresh();
        }
    }

    #handleLoad = (e) => {
        // Only handle events from our direct aem-fragment child
        if (e.target !== this.aemFragment) return;

        this.classList.remove('error');
        this.#extractContent(e.detail);

        // Re-dispatch with additional context
        this.dispatchEvent(
            new CustomEvent(EVENT_AEM_LOAD, {
                detail: {
                    ...e.detail,
                    field: this.field,
                },
                bubbles: true,
                composed: true,
            })
        );

        // Stop the original event from bubbling further
        e.stopPropagation();
    };

    #handleError = (e) => {
        // Only handle events from our direct aem-fragment child
        if (e.target !== this.aemFragment) return;

        this.classList.add('error');
        this.#log?.error('Failed to load fragment', e.detail);

        // Re-dispatch with additional context
        this.dispatchEvent(
            new CustomEvent(EVENT_AEM_ERROR, {
                detail: {
                    ...e.detail,
                    element: TAG_NAME,
                },
                bubbles: true,
                composed: true,
            })
        );

        // Stop the original event from bubbling further
        e.stopPropagation();
    };

    #extractContent(eventDetail = null) {
        // Use event detail if available, otherwise fall back to getter
        const data = eventDetail?.fields ? eventDetail : this.data;
        if (!data?.fields) {
            this.#log?.warn('No fields in fragment data');
            return;
        }

        const fieldValue = data.fields[this.field];
        if (fieldValue === undefined) {
            this.#log?.warn(`Field "${this.field}" not found in fragment`);
            return;
        }

        // Unwrap single paragraph - AEM rich text fields often wrap content in <p> tags
        // which creates unwanted margins when used inline
        this.#content = this.#unwrapSingleParagraph(fieldValue);
        this.requestUpdate();
    }

    #unwrapSingleParagraph(html) {
        if (!html || typeof html !== 'string') return html;
        const trimmed = html.trim();
        // Check if content is wrapped in a single <p> tag
        if (trimmed.startsWith('<p>') && trimmed.endsWith('</p>')) {
            const inner = trimmed.slice(3, -4);
            // Only unwrap if there are no other <p> tags inside (single paragraph)
            if (!inner.includes('<p>') && !inner.includes('</p>')) {
                return inner;
            }
        }
        return html;
    }

    #fail(message) {
        this.classList.add('error');
        this.#log?.error(message);

        this.dispatchEvent(
            new CustomEvent(EVENT_AEM_ERROR, {
                detail: {
                    message,
                    fragment: this.fragment,
                },
                bubbles: true,
                composed: true,
            })
        );
    }

    // Disable Shadow DOM so content inherits page styles
    createRenderRoot() {
        return this;
    }

    render() {
        return html`
            <aem-fragment
                fragment="${this.fragment}"
                style="display: none"
            ></aem-fragment>
            <span .innerHTML="${guard([this.#content], () => this.#content)}"></span>
        `;
    }
}

if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, MasInline);
}
