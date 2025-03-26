import { LitElement, html, css } from 'lit';
import { EVENT_KEYDOWN, TAG_MODEL_ID_MAPPING } from './constants.js';
import { FragmentStore } from './reactivity/fragment-store.js';
import { editFragment } from './store.js';
import { Fragment } from './aem/fragment.js';

export class MasCreateDialog extends LitElement {
    static properties = {
        type: { type: String, reflect: true },
        title: { state: true },
        name: { state: true },
        nameModified: { state: true },
    };

    static styles = css`
        .form-field {
            margin-bottom: var(--spectrum-global-dimension-size-400);
        }

        sp-field-label {
            display: block;
            margin-bottom: var(--spectrum-global-dimension-size-100);
        }

        sp-picker,
        sp-textfield {
            width: 100%;
        }
    `;

    constructor() {
        super();
        this.type = 'merch-card';
        this.title = '';
        this.name = '';
        this.nameModified = false;

        // Bind methods to ensure correct 'this' context
        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleNameFocus = this.handleNameFocus.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.close = this.close.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener(EVENT_KEYDOWN, this.handleKeyDown);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(EVENT_KEYDOWN, this.handleKeyDown);
    }

    handleKeyDown(event) {
        if (event.key === 'Escape' && this.dialog?.open) {
            this.close();
        }
    }

    get dialog() {
        return this.shadowRoot.querySelector('sp-dialog-wrapper');
    }

    updated() {
        this.open();
    }

    async open() {
        await this.updateComplete;
        this.dialog.open = true;
    }

    /**
     * Normalizes a string to be used as a fragment name
     * Converts to lowercase, replaces spaces with hyphens, and removes special characters
     * @param {string} str - The string to normalize
     * @returns {string} - The normalized string
     */
    normalizeFragmentName(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    handleTitleChange(value) {
        this.title = value;
        // Only update name if it hasn't been modified by the user
        if (!this.nameModified) {
            this.name = this.normalizeFragmentName(value);
        }
    }

    handleNameChange(value) {
        this.name = value;
        this.nameModified = !!value;
    }

    handleNameFocus() {
        this.nameModified = true;
    }

    async handleSubmit(event) {
        if (event) {
            event.preventDefault();
        }

        // Validate form
        if (!this.title || !this.name) {
            return;
        }

        // Get the model ID based on the selected type
        const modelId =
            this.type === 'merch-card'
                ? TAG_MODEL_ID_MAPPING['mas:studio/content-type/merch-card']
                : TAG_MODEL_ID_MAPPING[
                      'mas:studio/content-type/merch-card-collection'
                  ];

        // Create fragment data
        const fragmentData = {
            modelId,
            title: this.title,
            name: this.name || this.normalizeFragmentName(this.title),
        };
        const masRepository = document.querySelector('mas-repository');
        const fragmentStore = await masRepository.createFragment(fragmentData);
        fragmentStore.new = true;
        editFragment(fragmentStore, 0);
        this.close();
    }

    close() {
        // Reset form
        this.title = '';
        this.name = '';
        this.nameModified = false;
        this.dispatchEvent(new CustomEvent('close'));
    }

    get dialogTitle() {
        const typeLabel =
            this.type === 'merch-card' ? 'Merch Card' : 'Merch Card Collection';
        return `Create New ${typeLabel}`;
    }

    render() {
        return html`
            <sp-dialog-wrapper
                type="modal"
                headline=${this.dialogTitle}
                underlay
                size="m"
                confirm-label="Create"
                cancel-label="Cancel"
                @close=${this.close}
                @confirm=${this.handleSubmit}
                @cancel=${this.close}
            >
                <div class="dialog-content">
                    <form @submit=${this.handleSubmit}>
                        <div class="form-field">
                            <sp-field-label for="fragment-title" required
                                >Internal title</sp-field-label
                            >
                            <sp-textfield
                                id="fragment-title"
                                placeholder="Enter internal fragment title"
                                value=${this.title}
                                @input=${(e) =>
                                    this.handleTitleChange(e.target.value)}
                                required
                            ></sp-textfield>
                        </div>
                        <div class="form-field">
                            <sp-field-label for="fragment-name" required
                                >Name</sp-field-label
                            >
                            <sp-textfield
                                id="fragment-name"
                                placeholder="Fragment name"
                                value=${this.name}
                                @input=${(e) =>
                                    this.handleNameChange(e.target.value)}
                                @focus=${this.handleNameFocus}
                                required
                                helptext="Auto-generated from title if not modified"
                            ></sp-textfield>
                        </div>
                    </form>
                </div>
            </sp-dialog-wrapper>
        `;
    }
}

customElements.define('mas-create-dialog', MasCreateDialog);
