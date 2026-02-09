import { EVENT_AEM_LOAD } from './constants.js';

const MAS_FIELD_TAG = 'mas-field';

class MasField extends HTMLElement {
    #field = null;

    static get observedAttributes() {
        return ['field'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'field') {
            this.#field = newValue;
        }
    }

    connectedCallback() {
        this.addEventListener(EVENT_AEM_LOAD, this.#onFragmentLoad);
    }

    disconnectedCallback() {
        this.removeEventListener(EVENT_AEM_LOAD, this.#onFragmentLoad);
    }

    checkReady() {
        return new Promise((resolve) => {
            this.addEventListener(EVENT_AEM_LOAD, () => resolve(true), {
                once: true,
            });
        });
    }

    #onFragmentLoad = (event) => {
        const fieldValue = event.detail?.fields?.[this.#field];
        if (fieldValue === undefined) return;
        this.innerHTML = this.#unwrapSingleParagraph(fieldValue);
    };

    // Rich text fields from AEM are wrapped in <p> tags. Strips the wrapper for
    // single-paragraph content so it renders inline, keeps multiple paragraphs intact.
    #unwrapSingleParagraph(html) {
        if (typeof html !== 'string') return html;
        const trimmed = html.trim();
        const hasWrapper = trimmed.startsWith('<p>') && trimmed.endsWith('</p>');
        if (!hasWrapper) return html;
        const inner = trimmed.slice('<p>'.length, -'</p>'.length);
        return inner.includes('<p>') ? html : inner;
    }
}

customElements.define(MAS_FIELD_TAG, MasField);
