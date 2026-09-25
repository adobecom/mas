import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import Store from '../store.js';
import router from '../router.js';
import { PAGE_NAMES, QUICK_ACTION } from '../constants.js';
import { Fragment } from '../aem/fragment.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import { normalizeKey } from '../utils.js';
import { confirmation } from '../mas-confirm-dialog.js';
import '../mas-quick-actions.js';
import '../rte/rte-field.js';
import '../rte/osi-field.js';
import '../fields/badge-section.js';
import '../fields/multifield.js';
import '../fields/variable-field.js';

// Plans-card field configuration, duplicated from the plans variant of merch-card-editor.
// Each field reuses the same widget the card editor uses and the same generic write path
// (data-field + value/multiline). Bespoke multi-value widgets (mnemonics, whats-included,
// badge colors, quantity/addon/secure/plan-type) are intentionally not duplicated here.
// Duplicated from PLANS_AEM_FRAGMENT_MAPPING.allowedBadgeColors / allowedBorderColors.
const PLANS_BADGE_COLORS = [
    'spectrum-yellow-300-plans',
    'spectrum-gray-300-plans',
    'spectrum-gray-700-plans',
    'spectrum-green-900-plans',
    'gradient-purple-blue',
];
const PLANS_BORDER_COLORS = [
    'spectrum-yellow-300-plans',
    'spectrum-gray-300-plans',
    'spectrum-green-900-plans',
    'gradient-purple-blue',
];

const prettyColor = (token) =>
    token
        .replace(/^spectrum-/, '')
        .replace(/-plans$/, '')
        .replace(/-/g, ' ');

const FIELD_SECTIONS = [
    {
        title: 'Content',
        fields: [
            { name: 'cardTitle', label: 'Title', widget: 'rte', rte: { inline: true, link: true, mnemonic: true } },
            { name: 'subtitle', label: 'Subtitle', widget: 'text' },
            { name: 'shortDescription', label: 'Short Description', widget: 'rte', rte: { link: true, multiline: true } },
            { name: 'description', label: 'Description', widget: 'rte', rte: { link: true, multiline: true } },
        ],
    },
    {
        title: 'Price and promo',
        fields: [
            {
                name: 'prices',
                label: 'Product price',
                widget: 'rte',
                rte: { styling: true, link: true, mnemonic: true, multiline: true },
            },
            { name: 'promoText', label: 'Promo text', widget: 'rte', rte: { link: true, multiline: true } },
        ],
    },
    {
        title: 'Footer',
        fields: [
            { name: 'ctas', label: 'Call to action', widget: 'rte', rte: { link: true, multiline: true } },
            { name: 'callout', label: 'Callout', widget: 'rte', rte: { multiline: true } },
        ],
    },
];

// Plans-template parts the blurred preview reveals.
const PREVIEW_PARTS = [
    { label: 'Badge', candidates: ['badge'], className: 'badge' },
    { label: 'Card title', candidates: ['cardTitle', 'title'], className: 'title' },
    { label: 'Subtitle', candidates: ['subtitle'], className: 'subtitle' },
    { label: 'Price', candidates: ['prices', 'price'], className: 'price' },
    { label: 'Promo', candidates: ['promoText'], className: 'promo' },
    { label: 'Description goes here, revealed as you add content.', candidates: ['description'], className: 'description' },
    { label: 'Call to action', candidates: ['ctas', 'cta'], className: 'cta' },
];

const asText = (value) => {
    if (value == null) return '';
    const raw = typeof value === 'object' ? (value.value ?? '') : value;
    return `${raw}`.replace(/<[^>]*>/g, '').trim();
};

const rawValue = (value) => {
    if (value == null) return '';
    return typeof value === 'object' ? (value.value ?? '') : value;
};

/**
 * Simple plans-card editor for masks: the plans field configuration on the left (General info +
 * the duplicated plans sections), a blurred plans-template card on the right that unblurs each part
 * as the matching field gains content.
 */
class MasMaskEditor extends LitElement {
    static styles = css`
        :host {
            display: grid;
            grid-template-columns: minmax(360px, 1fr) minmax(320px, 420px);
            gap: 32px;
            padding: 32px;
            box-sizing: border-box;
        }

        .panel-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
        }

        h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
        }

        .editor-form-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
            min-width: 0;
        }

        .section-title {
            font-size: 20px;
            font-weight: 700;
            margin-top: 8px;
            color: var(--spectrum-gray-800, #292929);
        }

        .two-column-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        /* Rich color-picker swatches rendered by badge-section. */
        .menu-item-container {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .color-swatch {
            width: 16px;
            height: 16px;
            border-radius: 3px;
            border: 1px solid var(--spectrum-gray-300, #dadada);
            background: var(--swatch-bg);
            flex-shrink: 0;
        }

        .color-name-text {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        sp-field-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 0;
        }

        sp-field-group sp-textfield,
        sp-field-group sp-picker,
        sp-field-group rte-field,
        sp-field-group osi-field {
            width: 100%;
        }

        .actions {
            display: flex;
            gap: 12px;
            margin-top: 8px;
        }

        /* plans-template facsimile */
        .preview-pane {
            position: sticky;
            top: 32px;
            align-self: start;
        }

        .plans-card {
            border: 1px solid var(--spectrum-gray-300, #dadada);
            border-radius: 16px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 14px;
            background: var(--spectrum-gray-50, #fff);
            min-height: 460px;
        }

        .part {
            transition:
                filter 200ms ease,
                opacity 200ms ease;
        }

        .part.blurred {
            filter: blur(5px);
            opacity: 0.5;
            user-select: none;
            pointer-events: none;
        }

        .part.badge {
            align-self: flex-start;
            background: var(--spectrum-yellow-300, #f8d904);
            border-radius: 4px;
            padding: 2px 10px;
            font-weight: 700;
            font-size: 12px;
        }

        .part.title {
            font-size: 22px;
            font-weight: 800;
        }

        .part.price {
            font-size: 28px;
            font-weight: 800;
        }

        .part.subtitle,
        .part.promo {
            color: var(--spectrum-gray-700, #4b4b4b);
        }

        .part.description {
            font-size: 14px;
            line-height: 1.5;
        }

        .part.cta {
            margin-top: auto;
            background: var(--spectrum-blue-900, #1473e6);
            color: #fff;
            border-radius: 16px;
            padding: 10px 16px;
            text-align: center;
            font-weight: 700;
        }
    `;

    static properties = {
        name: { state: true },
        title: { state: true },
        description: { state: true },
    };

    reactiveController = new ReactiveController(this, [
        Store.masks.fragmentId,
        Store.masks.editingName,
        Store.masks.creating,
        Store.masks.loading,
    ]);

    constructor() {
        super();
        this.name = '';
        this.title = '';
        this.description = '';
        this.nameEditedByUser = false;
        this.fragment = null;
        this.loadingId = null;
        this.loadingName = null;
    }

    get isCreating() {
        return Store.masks.creating.get() && !Store.masks.fragmentId.get();
    }

    update(changedProperties) {
        this.#syncFragment();
        super.update(changedProperties);
    }

    async #syncFragment() {
        const fragmentId = Store.masks.fragmentId.get();
        const maskName = Store.masks.editingName.get();
        if (!fragmentId && !maskName) {
            this.fragment = null;
            return;
        }
        if (this.fragment && (this.fragment.id === fragmentId || this.fragment.fragmentName === maskName)) return;

        if (fragmentId) {
            if (this.loadingId === fragmentId) return;
            const editing = Store.masks.editing.get();
            if (editing?.id === fragmentId) {
                this.fragment = editing instanceof Fragment ? editing : new Fragment(editing);
                return;
            }
            if (!Store.masks.aem) return;
            this.loadingId = fragmentId;
            try {
                const data = await Store.masks.aem.sites.cf.fragments.getById(fragmentId);
                this.fragment = new Fragment(data);
                this.requestUpdate();
            } finally {
                this.loadingId = null;
            }
            return;
        }

        // Deep link: resolve the mask by its node name under the current surface/locale.
        if (this.loadingName === maskName) return;
        this.loadingName = maskName;
        try {
            const fragment = await Store.masks.loadMaskByName(maskName, Store.surface(), Store.localeOrRegion());
            if (fragment) {
                this.fragment = fragment;
                Store.masks.editing.set(fragment);
                Store.masks.fragmentId.set(fragment.id);
            }
            this.requestUpdate();
        } finally {
            this.loadingName = null;
        }
    }

    fieldValue(name) {
        return this.fragment ? rawValue(this.fragment.getFieldValue(name)) : '';
    }

    /** Generic write path mirroring mas-fragment-editor.updateFragment (data-field + value/multiline). */
    #updateFragment = ({ target, detail, values }) => {
        const fieldName = target.dataset.field;
        if (!fieldName) return;
        let value = values;
        if (!value) {
            value = target.value ?? detail?.value ?? target.checked;
            value = target.multiline ? `${value ?? ''}`.split(',') : [value ?? ''];
        }
        const field = this.fragment.getField(fieldName);
        if (field) {
            field.values = value;
        } else {
            this.fragment.fields.push({ name: fieldName, type: 'text', multiple: target.multiline === true, values: value });
        }
        this.fragment.hasChanges = true;
        this.requestUpdate();
    };

    #onTitleInput(event) {
        this.fragment.title = event.target.value;
        this.fragment.hasChanges = true;
        this.requestUpdate();
    }

    #onDescriptionInput(event) {
        this.fragment.description = event.target.value;
        this.fragment.hasChanges = true;
        this.requestUpdate();
    }

    #setField(name, values) {
        const field = this.fragment.getField(name);
        if (field) {
            field.values = values;
        } else {
            this.fragment.fields.push({ name, type: 'text', multiple: false, values });
        }
        this.fragment.hasChanges = true;
        this.requestUpdate();
    }

    #partValue(part) {
        if (!this.fragment) return '';
        for (const candidate of part.candidates) {
            const value = asText(this.fragment.getFieldValue(candidate));
            if (value) return value;
        }
        return '';
    }

    #back() {
        router.navigateToPage(PAGE_NAMES.MASKS)();
    }

    async #createMask() {
        const name = this.name.trim();
        if (!name) return;
        const displayTitle = this.title.trim() || name;
        const id = await Store.masks.createMask({
            name,
            title: displayTitle,
            description: this.description.trim(),
            fields: [{ name: 'cardName', type: 'text', multiple: false, values: [displayTitle] }],
        });
        if (id) {
            Store.masks.creating.set(false);
            Store.masks.fragmentId.set(id);
            this.fragment = null;
            this.requestUpdate();
        }
    }

    #save = async () => {
        if (!this.fragment) return;
        const saved = await Store.masks.saveMask(this.fragment);
        if (saved) {
            this.fragment = new Fragment(saved);
            this.requestUpdate();
        }
    };

    #publish = async () => {
        if (!this.fragment) return;
        const fresh = await Store.masks.publishMask(this.fragment.id);
        if (fresh) {
            this.fragment = new Fragment(fresh);
            this.requestUpdate();
        }
    };

    #delete = async () => {
        if (!this.fragment) return;
        const confirmed = await confirmation({
            title: 'Delete mask',
            content: `Are you sure you want to delete "${this.fragment.title || this.fragment.fragmentName}"? This action cannot be undone.`,
            confirmLabel: 'Delete',
        });
        if (!confirmed) return;
        const deleted = await Store.masks.deleteMask(this.fragment.id);
        if (deleted) this.#back();
    };

    get disabledActions() {
        const disabled = new Set();
        const loading = Store.masks.loading.get();
        if (loading) {
            disabled.add(QUICK_ACTION.SAVE);
            disabled.add(QUICK_ACTION.PUBLISH);
            disabled.add(QUICK_ACTION.DELETE);
            return disabled;
        }
        if (!this.fragment?.hasChanges) disabled.add(QUICK_ACTION.SAVE);
        if (this.fragment?.hasChanges || !this.#canPublish) disabled.add(QUICK_ACTION.PUBLISH);
        return disabled;
    }

    get #canPublish() {
        const f = this.fragment;
        if (!f) return false;
        if (f.status === 'PUBLISHED') return false;
        if (f.status === 'MODIFIED') return true;
        // DRAFT or missing status: publishable only if never published
        return !f.published?.at;
    }

    /** Action bar for the edit form: save, publish, delete, and back to the masks list. */
    get toolbarTemplate() {
        return html`
            <mas-quick-actions
                drag-handle-style="bar"
                .actions=${[QUICK_ACTION.SAVE, QUICK_ACTION.PUBLISH, QUICK_ACTION.DELETE]}
                .disabled=${this.disabledActions}
                @save=${this.#save}
                @publish=${this.#publish}
                @delete=${this.#delete}
            ></mas-quick-actions>
        `;
    }

    #renderField(field) {
        const value = this.fieldValue(field.name);
        let control;
        if (field.widget === 'rte') {
            const { inline, link, mnemonic, multiline, styling } = field.rte ?? {};
            control = html`<rte-field
                id=${`f-${field.name}`}
                data-field=${field.name}
                ?inline=${inline}
                ?link=${link}
                ?mnemonic=${mnemonic}
                ?multiline=${multiline}
                ?styling=${styling}
                .value=${value || ''}
                @change=${this.#updateFragment}
            ></rte-field>`;
        } else if (field.widget === 'osi') {
            control = html`<osi-field
                id=${`f-${field.name}`}
                data-field=${field.name}
                .value=${value}
                @input=${this.#updateFragment}
                @change=${this.#updateFragment}
            ></osi-field>`;
        } else {
            control = html`<sp-textfield
                id=${`f-${field.name}`}
                data-field=${field.name}
                value=${value}
                @input=${this.#updateFragment}
            ></sp-textfield>`;
        }
        return html`
            <sp-field-group id=${`group-${field.name}`}>
                <sp-field-label for=${`f-${field.name}`}>${field.label}</sp-field-label>
                ${control}
            </sp-field-group>
        `;
    }

    #renderColorPicker(label, dataField, options, selected, onChange) {
        return html`
            <sp-field-group id=${`group-${dataField}`}>
                <sp-field-label for=${`f-${dataField}`}>${label}</sp-field-label>
                <sp-picker id=${`f-${dataField}`} value=${selected || 'Default'} @change=${onChange}>
                    <sp-menu-item value="Default">Default</sp-menu-item>
                    ${options.map((color) => html`<sp-menu-item value=${color}>${prettyColor(color)}</sp-menu-item>`)}
                </sp-picker>
            </sp-field-group>
        `;
    }

    get variablesTemplate() {
        const rawValues = this.fragment?.getFieldValues('variables') ?? [];
        const value = rawValues.map((v) => ({ value: v }));
        return html`
            <div class="section-title">Placeholders</div>
            <mas-multifield button-label="Add variable" .value=${value} @change=${this.#onVariablesChange}>
                <template>
                    <mas-variable-field></mas-variable-field>
                </template>
            </mas-multifield>
        `;
    }

    #onVariablesChange(e) {
        const values = e.target.value.map((entry) => entry.value ?? '');
        this.#setField('variables', values);
    }

    /** Badge (text + icon + colors) and the card border color — the plans color configuration. */
    get badgeTemplate() {
        return html`
            <div class="section-title">Badge &amp; colors</div>
            <badge-section
                field="badge"
                show-icon
                show-colors
                .value=${this.fieldValue('badge')}
                .colors=${PLANS_BADGE_COLORS}
                .borderColors=${PLANS_BORDER_COLORS}
                @change=${(e) => this.#setField('badge', [e.detail.value])}
            ></badge-section>
            ${this.#renderColorPicker(
                'Card border color',
                'borderColor',
                PLANS_BORDER_COLORS,
                this.fieldValue('borderColor'),
                (e) => this.#setField('borderColor', e.target.value === 'Default' ? [''] : [e.target.value]),
            )}
        `;
    }

    /** General info — Name is the technical node name (immutable once created), Title the display name. */
    get generalInfoTemplate() {
        const creating = this.isCreating;
        const technicalName = creating ? this.name : this.fragment.fragmentName || '';
        const displayTitle = creating ? this.title : this.fragment.title || '';
        return html`
            <div class="section-title">General info</div>
            <sp-field-group id="mask-title-group">
                <sp-field-label for="mask-title">Title</sp-field-label>
                <sp-textfield
                    id="mask-title"
                    placeholder="Display name"
                    .value=${displayTitle}
                    @input=${(e) => {
                        if (!creating) {
                            this.#onTitleInput(e);
                            return;
                        }
                        this.title = e.target.value;
                        if (!this.nameEditedByUser) this.name = normalizeKey(e.target.value);
                    }}
                ></sp-textfield>
            </sp-field-group>
            <sp-field-group id="mask-name-group">
                <sp-field-label for="mask-name">Name</sp-field-label>
                <sp-textfield
                    id="mask-name"
                    placeholder="technical-name"
                    ?disabled=${!creating}
                    .value=${technicalName}
                    @input=${(e) => {
                        if (!creating) return;
                        this.nameEditedByUser = true;
                        this.name = e.target.value;
                    }}
                ></sp-textfield>
            </sp-field-group>
            <sp-field-group id="mask-description-group">
                <sp-field-label for="mask-description">Description</sp-field-label>
                <sp-textfield
                    id="mask-description"
                    multiline
                    pattern="[\\s\\S]{0,500}"
                    placeholder="Description (optional)"
                    .value=${creating ? this.description : this.fragment?.description || ''}
                    @input=${(e) => (creating ? (this.description = e.target.value) : this.#onDescriptionInput(e))}
                ></sp-textfield>
            </sp-field-group>
        `;
    }

    get createTemplate() {
        return html`
            <div class="editor-form-container">
                <div class="panel-header">
                    <h1>New mask</h1>
                </div>
                ${this.generalInfoTemplate}
                <div class="actions">
                    <sp-button variant="accent" ?disabled=${!this.name.trim()} @click=${this.#createMask}> Create </sp-button>
                </div>
            </div>
        `;
    }

    get formTemplate() {
        if (!this.fragment) {
            return html`<sp-progress-circle indeterminate size="l" label="Loading mask"></sp-progress-circle>`;
        }
        const [contentSection, ...remainingSections] = FIELD_SECTIONS;
        return html`
            <div class="editor-form-container">
                <div class="panel-header">
                    <h1>${this.fragment.title || this.fragment.fragmentName}</h1>
                </div>
                ${this.generalInfoTemplate}
                <div class="section-title">${contentSection.title}</div>
                ${contentSection.fields.map((field) => this.#renderField(field))} ${this.badgeTemplate}
                ${remainingSections.map(
                    (section) => html`
                        <div class="section-title">${section.title}</div>
                        ${section.fields.map((field) => this.#renderField(field))}
                    `,
                )}
                ${this.variablesTemplate} ${this.toolbarTemplate}
            </div>
        `;
    }

    get previewTemplate() {
        return html`
            <div class="preview-pane">
                <div class="plans-card">
                    ${PREVIEW_PARTS.map((part) => {
                        const value = this.#partValue(part);
                        return html`<div class=${classMap({ part: true, [part.className]: true, blurred: !value })}>
                            ${value || part.label}
                        </div>`;
                    })}
                </div>
            </div>
        `;
    }

    render() {
        if (this.isCreating) {
            return html`${this.createTemplate} ${this.previewTemplate}`;
        }
        return html`${this.formTemplate} ${this.previewTemplate}`;
    }
}

customElements.define('mas-mask-editor', MasMaskEditor);
