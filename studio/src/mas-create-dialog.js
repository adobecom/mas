import { LitElement, html, css, nothing } from 'lit';
import { EVENT_KEYDOWN, EVENT_OST_OFFER_SELECT, TAG_MODEL_ID_MAPPING } from './constants.js';
import router from './router.js';
import Store from './store.js';
import './rte/osi-field.js';
import './aem/aem-tag-picker-field.js';
import generateFragmentStore from './reactivity/source-fragment-store.js';

export class MasCreateDialog extends LitElement {
    static properties = {
        type: { type: String, reflect: true },
        title: { state: true },
        loading: { state: true },
    };

    static styles = css`
        :host {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 999;
            display: block;
        }

        .dialog-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .dialog-container {
            background: var(--spectrum-white);
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            padding: 24px;
            min-width: 400px;
            z-index: 1000;
            position: relative;
        }

        .dialog-header {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--spectrum-gray-200);
        }

        .dialog-footer {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 24px;
        }

        .form-field {
            margin-bottom: var(calc(var(--swc-scale-factor) * 32px));
        }

        sp-field-label {
            display: block;
            margin-bottom: var(calc(var(--swc-scale-factor) * 8px));
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
        this.loading = false;

        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.close = this.close.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleBackdropClick = this.handleBackdropClick.bind(this);
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener(EVENT_KEYDOWN, this.handleKeyDown);
        document.addEventListener(EVENT_OST_OFFER_SELECT, this.#onOstSelect);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener(EVENT_KEYDOWN, this.handleKeyDown);
        document.removeEventListener(EVENT_OST_OFFER_SELECT, this.#onOstSelect);
    }

    handleKeyDown(event) {
        if (event.key === 'Escape' && !this.loading) {
            this.close();
        }
    }

    handleBackdropClick(event) {
        if (event.target.classList.contains('dialog-backdrop')) {
            this.close();
        }
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

    #onOstSelect = ({ detail: { offerSelectorId, offer } }) => {
        if (!offer) return;
        this.osi = offerSelectorId;
    };

    _onTagSelect = ({ detail: { tags } }) => {
        this.tags = tags;
    };

    #handeTagsChange(e) {
        const value = e.target.getAttribute('value');
        this.tags = value ? value.split(',') : [];
    }

    async createFragment(masRepository, fragmentData) {
        const fragment = await masRepository.createFragment(fragmentData);
        const sourceStore = generateFragmentStore(fragment);
        sourceStore.new = true;
        const currentList = Store.fragments.list.data.get() ?? [];
        Store.fragments.list.data.set([...currentList, sourceStore]);
        this.close();
        await router.navigateToFragmentEditor(fragment.id);
    }

    async tryToCreateFragment(masRepository, fragmentData) {
        try {
            await this.createFragment(masRepository, fragmentData);
            return true;
        } catch (error) {
            console.error(`${error.message} Will try to create again`, error.stack);
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

        if (!this.title) {
            return;
        }

        const hasOfferlessTag = this.tags.some((tag) => tag?.includes('offerless'));
        if (this.type === 'merch-card' && !this.osi && !hasOfferlessTag) {
            return;
        }

        this.loading = true;

        const modelId =
            this.type === 'merch-card'
                ? TAG_MODEL_ID_MAPPING['mas:studio/content-type/merch-card']
                : TAG_MODEL_ID_MAPPING['mas:studio/content-type/merch-card-collection'];

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
        this.title = '';
        this.osi = '';
        this.loading = false;
        this.dispatchEvent(new CustomEvent('close'));
    }

    get dialogTitle() {
        const typeLabel = this.type === 'merch-card' ? 'Merch Card' : 'Merch Card Collection';
        return `Create New ${typeLabel}`;
    }

    render() {
        if (this.loading) {
            return html`
                <div class="loading-overlay">
                    <sp-progress-circle indeterminate size="l"></sp-progress-circle>
                </div>
            `;
        }

        return html`
            <div class="dialog-backdrop" @click=${this.handleBackdropClick}>
                <div class="dialog-container" @click=${(e) => e.stopPropagation()}>
                    <div class="dialog-header">${this.dialogTitle}</div>
                    <div class="dialog-content">
                        <form @submit=${this.handleSubmit}>
                            <div class="form-field">
                                <sp-field-label for="fragment-title" required>Internal title</sp-field-label>
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
                                          <sp-field-label for="osi" required>OSI Search</sp-field-label>
                                          <osi-field id="osi" data-field="osi"></osi-field>
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
                    <div class="dialog-footer">
                        <sp-button variant="secondary" @click=${this.close}>Cancel</sp-button>
                        <sp-button variant="accent" @click=${this.handleSubmit}>Create</sp-button>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('mas-create-dialog', MasCreateDialog);
