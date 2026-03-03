import { EVENT_AEM_LOAD } from './constants.js';

const MAS_FIELD_TAG = 'mas-field';

/**
 * Renders a single field from an AEM fragment inline on the page.
 * Wraps <aem-fragment> and listens for its aem:load event to extract
 * and display the specified field content.
 *
 * Usage: <mas-field field="prices"><aem-fragment fragment="id"></aem-fragment></mas-field>
 */
class MasField extends HTMLElement {
    #field = null;
    #loaded = false;
    #fields = null;
    #contentElement = null;

    static get observedAttributes() {
        return ['field'];
    }

    /** Stores the field name from the 'field' attribute. */
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'field') {
            this.#field = newValue;
            this.#renderField();
        }
    }

    /** Starts listening for aem:load events bubbling from child aem-fragment. */
    connectedCallback() {
        this.addEventListener(EVENT_AEM_LOAD, this.#onFragmentLoad);
        this.#ensureContentElement();
        this.aemFragment?.setAttribute('hidden', '');
    }

    /** Cleans up the event listener when removed from the DOM. */
    disconnectedCallback() {
        this.removeEventListener(EVENT_AEM_LOAD, this.#onFragmentLoad);
    }

    /** Resolves when the fragment data has loaded. Used by the autoblock timeout race. */
    checkReady() {
        if (this.#loaded) return Promise.resolve(true);
        return new Promise((resolve) => {
            this.addEventListener(EVENT_AEM_LOAD, () => resolve(true), {
                once: true,
            });
        });
    }

    /** Extracts the target field from the fragment data and renders it as innerHTML. */
    #onFragmentLoad = (event) => {
        if (event.target !== this.aemFragment) return;
        this.#fields = event.detail?.fields || null;
        this.#loaded = true;
        this.#renderField();
    };

    get aemFragment() {
        return this.querySelector('aem-fragment');
    }

    #ensureContentElement() {
        if (this.#contentElement?.isConnected) return this.#contentElement;
        const existing = this.querySelector(
            ':scope > span[data-role="mas-field-content"]',
        );
        if (existing) {
            this.#contentElement = existing;
            return existing;
        }
        const content = document.createElement('span');
        content.setAttribute('data-role', 'mas-field-content');
        this.append(content);
        this.#contentElement = content;
        return content;
    }

    #normalizeFieldValue(value) {
        if (value && typeof value === 'object' && 'value' in value)
            return value.value;
        return value;
    }

    #renderField() {
        if (!this.#fields || !this.#field) return;
        const fieldValue = this.#normalizeFieldValue(this.#fields[this.#field]);
        if (fieldValue === undefined) return;
        const content = this.#ensureContentElement();
        const html = this.#unwrapSingleParagraph(fieldValue);
        if (typeof html === 'string') {
            content.innerHTML = html;
            return;
        }
        content.textContent = html == null ? '' : String(html);
    }

    /** Strips <p> wrapper from single-paragraph AEM rich text so it renders inline. */
    #unwrapSingleParagraph(html) {
        if (typeof html !== 'string') return html;
        const trimmed = html.trim();
        const hasWrapper =
            trimmed.startsWith('<p>') && trimmed.endsWith('</p>');
        if (!hasWrapper) return html;
        const inner = trimmed.slice('<p>'.length, -'</p>'.length);
        return inner.includes('<p>') ? html : inner;
    }
}

customElements.define(MAS_FIELD_TAG, MasField);
