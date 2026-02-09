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

    static get observedAttributes() {
        return ['field'];
    }

    /** Stores the field name from the 'field' attribute. */
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'field') {
            this.#field = newValue;
        }
    }

    /** Starts listening for aem:load events bubbling from child aem-fragment. */
    connectedCallback() {
        this.addEventListener(EVENT_AEM_LOAD, this.#onFragmentLoad);
    }

    /** Cleans up the event listener when removed from the DOM. */
    disconnectedCallback() {
        this.removeEventListener(EVENT_AEM_LOAD, this.#onFragmentLoad);
    }

    /** Resolves when the fragment data has loaded. Used by the autoblock timeout race. */
    checkReady() {
        return new Promise((resolve) => {
            this.addEventListener(EVENT_AEM_LOAD, () => resolve(true), {
                once: true,
            });
        });
    }

    /** Extracts the target field from the fragment data and renders it as innerHTML. */
    #onFragmentLoad = (event) => {
        const fieldValue = event.detail?.fields?.[this.#field];
        if (fieldValue === undefined) return;
        this.innerHTML = this.#unwrapSingleParagraph(fieldValue);
    };

    /** Strips <p> wrapper from single-paragraph AEM rich text so it renders inline. */
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
