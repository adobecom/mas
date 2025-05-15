import { LitElement, html, css, nothing } from 'lit';
import { EVENT_KEYDOWN, EVENT_OST_OFFER_SELECT, TAG_MODEL_ID_MAPPING } from './constants.js';
import { editFragment } from './store.js';
import './rte/osi-field.js';
import './aem/aem-tag-picker-field.js';

export class MasCreateDialog extends LitElement {
    static properties = {
        type: { type: String, reflect: true },
        title: { state: true },
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
        this.osi = '';
        this.tags = [];

        // Bind methods to ensure correct 'this' context
        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.close = this.close.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener(EVENT_KEYDOWN, this.handleKeyDown);
        document.addEventListener(EVENT_OST_OFFER_SELECT, this._onOstSelect);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(EVENT_KEYDOWN, this.handleKeyDown);
        document.removeEventListener(EVENT_OST_OFFER_SELECT, this._onOstSelect);
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
    }

    _onOstSelect = ({ detail: { offerSelectorId, offer } }) => {
        if (!offer) return;
        this.osi = offerSelectorId;
    }

    #handeTagsChange(e) {
        const value = e.target.getAttribute('value');
        this.tags = value ? value.split(',') : [];
    }

    async createFragment(masRepository, fragmentData) {
        const fragmentStore = await masRepository.createFragment(fragmentData);
        fragmentStore.new = true;
        editFragment(fragmentStore, 0);
        this.close();
    }

    async tryToCreateFragment(masRepository, fragmentData) {
        try {
            await this.createFragment(masRepository, fragmentData);
            return true;
        } catch (error) {
            console.error(
                `${error.message} Will try to create again`,
                error.stack,
            );
            return false;
        }
    }

    getSuffix(offset) {
        let suffix = '';
        const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        const length = offset + 3;
        for (let i = 0; i < length; i++) {
            suffix += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return suffix;
    }

    async handleSubmit(event) {
        if (event) {
            event.preventDefault();
        }

        // Validate form
        if (!this.title) {
            return;
        }

        if (this.type === 'merch-card' && !this.osi) {
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
            name: this.normalizeFragmentName(this.title),
        };
        if (this.type === 'merch-card') {
            fragmentData.data = {
                osi: this.osi,
                tags: this.tags,
            };
        }

        const masRepository = document.querySelector('mas-repository');
        const firstName = fragmentData.name;
        let nmbOfTries = 0;
        while (!(await this.tryToCreateFragment(masRepository, fragmentData)) && nmbOfTries < 10) {
            nmbOfTries += 1;
            fragmentData.name = `${firstName}-${this.getSuffix(nmbOfTries)}`;
        }
    }

    close() {
        // Reset form
        this.title = '';
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
                                @input=${(e) => this.handleTitleChange(e.target.value)}
                                required
                            ></sp-textfield>
                        </div>
                        ${this.type === 'merch-card'
                            ? html`
                                <div class="form-field">
                                    <sp-field-label for="osi" required
                                        >OSI Search</sp-field-label
                                    >
                                    <osi-field
                                        id="osi"
                                        data-field="osi"
                                    ></osi-field>
                                </div>
                                <aem-tag-picker-field
                                    label="Tags"
                                    namespace="/content/cq:tags/mas"
                                    multiple
                                    @change=${this.#handeTagsChange}
                                ></aem-tag-picker-field>
                                `
                            : nothing}
                    </form>
                </div>
            </sp-dialog-wrapper>
        `;
    }
}

customElements.define('mas-create-dialog', MasCreateDialog);
