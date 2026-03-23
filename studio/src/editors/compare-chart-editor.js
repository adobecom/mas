import { css, html, LitElement, nothing } from 'lit';
import { CARD_MODEL_PATH, TAG_MODEL_ID_MAPPING } from '../constants.js';
import '../fields/multifield.js';
import '../fields/icon-picker-field.js';
import { getFromFragmentCache, prepopulateFragmentCache } from '../mas-repository.js';
import Store from '../store.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import generateFragmentStore from '../reactivity/source-fragment-store.js';
import { getSpectrumVersion } from '../constants/icon-library.js';
import { dragHandleIcon } from '../icons.js';
import { VARIANT_NAMES } from './variant-picker.js';
import './merch-card-editor.js';

const COMPARE_CHART_FIELD = 'compareChart';
const CARD_SELECT_EVENT = 'compare-chart-select-card';
const CARD_MODEL_ID = TAG_MODEL_ID_MAPPING['mas:studio/content-type/merch-card'];
const NEW_CARD_TITLE = 'New Compare Card';
const DRAFT_CARD_PREFIX = '__compare-chart-draft__';

const cloneValues = (values = []) =>
    values.map(({ icon = '', description = '', alt = '', link = '' }) => ({
        icon,
        description,
        alt,
        link,
    }));

const extractPlainText = (value = '') => {
    if (!value) return '';
    if (!value.includes('<')) return value;
    const doc = new DOMParser().parseFromString(value, 'text/html');
    return doc.body.textContent?.trim() || '';
};

const getField = (fragment, fieldName) => fragment?.fields?.find(({ name }) => name === fieldName);

const getFieldValue = (fragment, fieldName) => getField(fragment, fieldName)?.values?.[0] || '';

const getFieldValues = (fragment, fieldName) => getField(fragment, fieldName)?.values || [];

const getCardTitle = (fragment) => {
    const cardTitle = extractPlainText(getFieldValue(fragment, 'cardTitle'));
    if (cardTitle) return cardTitle;
    const title = extractPlainText(fragment?.title || '');
    if (title) return title;
    return fragment?.name || 'Card';
};

const getCardLabel = ({ path, fragmentStore }) => {
    if (fragmentStore?.get()) {
        return getCardTitle(fragmentStore.get());
    }

    return path?.split('/').pop()?.replace(/-/g, ' ') || 'Card';
};

const createEmptyEntry = () => ({
    label: '',
    values: [],
});

const getFeatureValue = (element) => {
    const description = element.querySelector('[slot="description"]')?.textContent?.trim() || '';
    const merchIcon = element.querySelector('merch-icon');
    if (merchIcon) {
        const anchor = element.querySelector('[slot="icon"] a');
        return {
            icon: merchIcon.getAttribute('src') || '',
            description,
            alt: merchIcon.getAttribute('alt') || '',
            link: anchor?.getAttribute('href') || '',
        };
    }

    const spectrumIcon = element.querySelector('[slot="icon"] .sp-icon');
    if (spectrumIcon) {
        return {
            icon: spectrumIcon.tagName.toLowerCase(),
            description,
            alt: '',
            link: '',
        };
    }

    return {
        icon: '',
        description,
        alt: '',
        link: '',
    };
};

const parseCompareChart = (compareChartHtml = '') => {
    if (!compareChartHtml) return {};

    const doc = new DOMParser().parseFromString(compareChartHtml, 'text/html');
    const entries = {};

    doc.querySelectorAll('.compare-chart-card[data-card-path]').forEach((cardElement) => {
        const cardPath = cardElement.getAttribute('data-card-path');
        if (!cardPath) return;

        const whatsIncluded = cardElement.querySelector('merch-whats-included');
        if (!whatsIncluded) {
            entries[cardPath] = createEmptyEntry();
            return;
        }

        const label = whatsIncluded.querySelector('[slot="heading"]')?.textContent?.trim() || '';
        const values = [];
        whatsIncluded.querySelectorAll('[slot="content"] merch-mnemonic-list').forEach((listElement) => {
            values.push(getFeatureValue(listElement));
        });

        entries[cardPath] = {
            label,
            values,
        };
    });

    return entries;
};

const createMnemonicList = (value) => {
    const list = document.createElement('merch-mnemonic-list');
    const iconSlot = document.createElement('div');
    iconSlot.setAttribute('slot', 'icon');

    if (value.icon?.startsWith('sp-icon-')) {
        const icon = document.createElement(value.icon);
        icon.setAttribute('class', 'sp-icon');
        iconSlot.append(icon);
    } else if (value.icon) {
        const merchIcon = document.createElement('merch-icon');
        merchIcon.setAttribute('size', 's');
        merchIcon.setAttribute('src', value.icon);
        merchIcon.setAttribute('alt', value.alt || '');

        if (value.link) {
            const anchor = document.createElement('a');
            anchor.setAttribute('href', value.link);
            anchor.append(merchIcon);
            iconSlot.append(anchor);
        } else {
            iconSlot.append(merchIcon);
        }
    }

    const description = document.createElement('p');
    description.setAttribute('slot', 'description');
    const span = document.createElement('span');
    span.textContent = value.description || value.alt || '';
    description.append(span);

    list.append(iconSlot);
    list.append(description);
    return list;
};

const createWhatsIncludedElement = (label, values) => {
    if (!label && !values?.length) return undefined;

    const element = document.createElement('merch-whats-included');
    const heading = document.createElement('div');
    heading.setAttribute('slot', 'heading');
    heading.textContent = label || '';
    element.append(heading);

    const contentBullets = document.createElement('div');
    contentBullets.setAttribute('slot', 'contentBullets');
    element.append(contentBullets);

    const content = document.createElement('div');
    content.setAttribute('slot', 'content');
    element.append(content);
    values.forEach((value) => {
        content.append(createMnemonicList(value));
    });

    return element;
};

const serializeCompareChart = (entriesByPath, cardPaths) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'compare-chart';
    wrapper.setAttribute('data-editor', 'mini-compare-chart');

    let hasContent = false;
    for (const cardPath of cardPaths) {
        const entry = entriesByPath[cardPath];
        if (!entry) continue;

        const element = createWhatsIncludedElement(entry.label, entry.values);
        if (!element) continue;

        hasContent = true;
        const card = document.createElement('div');
        card.className = 'compare-chart-card';
        card.setAttribute('data-card-path', cardPath);
        card.append(element);
        wrapper.append(card);
    }

    return hasContent ? wrapper.outerHTML : '';
};

const normalizeFragmentName = (value = '') =>
    value
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

const createNameSlug = (length = 4) => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
};

const createField = (name, values, type = 'text', multiple = false, mimeType = null) => {
    const field = {
        name,
        type,
        multiple,
        values,
    };
    if (mimeType) field.mimeType = mimeType;
    return field;
};

const getCompareChartCardItems = (fragmentStore) => {
    const fragment = fragmentStore?.get();
    const referencesByPath = new Map((fragment?.references || []).map((reference) => [reference.path, reference]));
    const draftContext = fragmentStore?.compareChartDraftContext;

    return getFieldValues(fragment, 'cards').map((path) => ({
        path,
        fragmentStore: draftContext?.cardStoresByPath.get(path) || null,
        reference: referencesByPath.get(path) || null,
    }));
};

const buildFallbackHeadingCell = (cardItem) => {
    const cell = document.createElement('div');
    const title = document.createElement('p');
    title.textContent = getCardLabel(cardItem);
    cell.append(title);
    return cell;
};

const buildPlaceholderCell = (value = '') => {
    const cell = document.createElement('div');
    if (!value) return cell;
    const text = document.createElement('div');
    text.textContent = value;
    cell.append(text);
    return cell;
};

const buildFeatureCell = (value) => {
    const cell = document.createElement('div');
    if (!value) {
        const empty = document.createElement('p');
        empty.textContent = '-';
        cell.append(empty);
        return cell;
    }

    cell.append(createMnemonicList(value));
    return cell;
};

const buildTableMarkup = (fragmentStore) => {
    const table = document.createElement('div');
    table.className = 'table';
    const fragment = fragmentStore?.get();
    const compareEntriesByPath = parseCompareChart(getFieldValue(fragment, COMPARE_CHART_FIELD));
    const cardItems = getCompareChartCardItems(fragmentStore);
    const labelValues = cardItems.map(({ path }) => compareEntriesByPath[path]?.label || '');
    const hasLabelRow = labelValues.some(Boolean);

    const highlightRow = document.createElement('div');
    cardItems.forEach(() => {
        highlightRow.append(buildPlaceholderCell());
    });
    table.append(highlightRow);

    const headingRow = document.createElement('div');
    cardItems.forEach((cardItem) => {
        headingRow.append(buildFallbackHeadingCell(cardItem));
    });
    table.append(headingRow);

    const dividerRow = document.createElement('div');
    cardItems.forEach(() => {
        const cell = document.createElement('div');
        cell.append(document.createElement('hr'));
        dividerRow.append(cell);
    });
    table.append(dividerRow);

    if (hasLabelRow) {
        const labelRow = document.createElement('div');
        labelValues.forEach((label) => {
            labelRow.append(buildPlaceholderCell(label));
        });
        table.append(labelRow);
    }

    const maxFeatureCount = Math.max(
        0,
        ...cardItems.map(({ path }) => (compareEntriesByPath[path] || createEmptyEntry()).values.length),
    );

    for (let index = 0; index < maxFeatureCount; index += 1) {
        const row = document.createElement('div');
        cardItems.forEach(({ path }) => {
            const entry = compareEntriesByPath[path] || createEmptyEntry();
            row.append(buildFeatureCell(entry.values[index]));
        });
        table.append(row);
    }

    return table.outerHTML;
};

const buildTablePreviewReference = (cardItem) => {
    const fragment = structuredClone(
        cardItem.fragmentStore?.previewStore.get() || cardItem.fragmentStore?.get() || cardItem.reference,
    );
    return {
        type: 'content-fragment',
        value: {
            id: fragment.id,
            title: fragment.title || fragment.name || getCardLabel(cardItem),
            fields: fragment.fields,
        },
    };
};

/**
 * Builds a transient table fragment for compare-chart preview rendering.
 * The output is intended for `mas-table` preview only and is not persisted.
 * @param {import('../reactivity/source-fragment-store.js').SourceFragmentStore} fragmentStore
 * @returns {object}
 */
export const buildCompareChartPreviewFragment = (fragmentStore) => {
    const fragment = fragmentStore?.get();
    const cardItems = getCompareChartCardItems(fragmentStore);
    const cardsParentPath = fragment?.path?.split('/').slice(0, -1).join('/') || '';

    return {
        id: `compare-table-preview-${fragment?.id || 'collection'}`,
        path: `${cardsParentPath}/compare-table-preview`,
        title: fragment?.title || 'Compare Chart Preview',
        model: { id: 'table' },
        fields: [
            createField('blockName', ['Table']),
            createField('selectedVariantNames', ['merch', 'highlight'], 'text', true),
            createField(
                'cards',
                cardItems.map(
                    ({ fragmentStore: cardStore, reference, path }) =>
                        cardStore?.get()?.id || reference?.id || path.split('/').pop(),
                ),
                'content-fragment',
                true,
            ),
            createField('compareChart', [buildTableMarkup(fragmentStore)], 'long-text', false, 'text/html'),
        ],
        references: cardItems
            .filter(({ fragmentStore: cardStore, reference }) => cardStore || reference)
            .map((cardItem) => buildTablePreviewReference(cardItem)),
    };
};

class CompareChartEditor extends LitElement {
    static properties = {
        fragmentStore: { type: Object, attribute: false },
        previewOnly: { type: Boolean, attribute: 'preview-only', reflect: true },
        selectedCardPath: { type: String, state: true },
        draggedCardPath: { type: String, state: true },
        dropIndicatorIndex: { type: Number, state: true },
    };

    static styles = css`
        :host {
            display: block;
        }

        .editor-stack {
            display: grid;
            gap: 24px;
        }

        .panel-card {
            padding: 24px;
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 16px;
            background: var(--spectrum-gray-50);
            box-shadow:
                0 0 1px 0 rgba(0, 0, 0, 0.08),
                0 4px 16px 0 rgba(0, 0, 0, 0.05);
        }

        .section-title {
            margin: 0 0 8px;
            font-size: 20px;
            font-weight: 700;
            color: var(--spectrum-gray-900);
            letter-spacing: -0.01em;
        }

        .section-description {
            margin: 0 0 20px;
            font-size: 13px;
            line-height: 1.5;
            color: var(--spectrum-gray-700);
        }

        .panel-title {
            margin: 0 0 6px;
            font-size: 14px;
            font-weight: 700;
            color: var(--spectrum-gray-900);
        }

        .panel-copy {
            margin: 0 0 16px;
            font-size: 12px;
            line-height: 1.5;
            color: var(--spectrum-gray-700);
        }

        .field-grid {
            display: grid;
            gap: 16px;
        }

        sp-field-group sp-picker,
        sp-field-group sp-textfield {
            width: 100%;
        }

        .cards-toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            margin-bottom: 14px;
            flex-wrap: wrap;
        }

        .cards-count {
            font-size: 12px;
            font-weight: 700;
            color: var(--spectrum-gray-700);
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .cards-strip {
            display: grid;
            gap: 10px;
            margin-bottom: 16px;
        }

        .card-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 12px;
            align-items: center;
            position: relative;
        }

        .card-row.is-dragging {
            opacity: 0.55;
        }

        .drop-indicator {
            position: relative;
            height: 0;
            margin: -2px 0 2px;
            opacity: 0;
            transition: opacity 120ms ease;
            pointer-events: none;
        }

        .drop-indicator.is-visible {
            opacity: 1;
        }

        .drop-indicator::before {
            content: '';
            position: absolute;
            inset-inline: 0;
            top: -1px;
            height: 2px;
            border-radius: 999px;
            background: var(--spectrum-blue-600);
            box-shadow: 0 0 0 1px color-mix(in srgb, var(--spectrum-blue-600) 16%, transparent);
        }

        .drop-indicator::after {
            content: '';
            position: absolute;
            top: -5px;
            left: 0;
            width: 10px;
            height: 10px;
            border-radius: 999px;
            background: var(--spectrum-blue-600);
        }

        .card-chip {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            border: 1px solid var(--spectrum-gray-300);
            background: var(--spectrum-white);
            border-radius: 12px;
            padding: 12px 14px;
            cursor: pointer;
            text-align: left;
        }

        .card-chip:hover {
            border-color: var(--spectrum-blue-500);
        }

        .card-chip.is-selected {
            border-color: var(--spectrum-blue-500);
            background: var(--spectrum-blue-75);
        }

        .card-chip-title {
            font-size: 14px;
            font-weight: 700;
            color: var(--spectrum-gray-900);
        }

        .drag-handle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 44px;
            border-radius: 10px;
            border: 1px solid var(--spectrum-gray-300);
            background: var(--spectrum-gray-75);
            cursor: grab;
            flex-shrink: 0;
            color: var(--spectrum-gray-700);
        }

        .drag-handle:hover {
            border-color: var(--spectrum-blue-500);
            color: var(--spectrum-blue-700);
        }

        .drag-handle:active {
            cursor: grabbing;
        }

        .drag-handle svg {
            display: block;
        }

        .cards-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .selection-title {
            font-size: 14px;
            font-weight: 700;
            color: var(--spectrum-gray-900);
        }

        .feature-editor mas-multifield {
            margin-top: 8px;
        }

        .preview-shell {
            padding: 16px;
            border-radius: 18px;
            background: radial-gradient(circle at top left, rgba(20, 115, 230, 0.08), transparent 30%),
                linear-gradient(180deg, #ffffff 0%, #f3f3f3 100%);
            border: 1px solid rgba(0, 0, 0, 0.08);
            overflow: auto;
        }

        .preview-table {
            display: block;
            width: min(100%, 900px);
            margin: 0 auto;
        }

        .preview-table ::part(base) {
            width: 100%;
        }

        .empty-state {
            padding: 32px 20px;
            text-align: center;
            border: 1px dashed var(--spectrum-gray-300);
            border-radius: 14px;
            color: var(--spectrum-gray-700);
            background: var(--spectrum-gray-75);
        }

        .empty-state strong {
            display: block;
            margin-bottom: 6px;
            color: var(--spectrum-gray-900);
        }
    `;

    reactiveController = new ReactiveController(this, []);
    #fragmentReferencesMap = new Map();
    #cachedCompareChartHtml = null;
    #cachedCompareEntries = {};
    #lastCardPathsSignature = '';
    #previewRefreshFrame = 0;

    constructor() {
        super();
        this.fragmentStore = null;
        this.previewOnly = false;
        this.selectedCardPath = '';
        this.draggedCardPath = '';
        this.dropIndicatorIndex = -1;
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener(CARD_SELECT_EVENT, this.#handleExternalCardSelect);
        if (this.fragmentStore) {
            void this.initFragmentReferencesMap();
        }
    }

    disconnectedCallback() {
        cancelAnimationFrame(this.#previewRefreshFrame);
        document.removeEventListener(CARD_SELECT_EVENT, this.#handleExternalCardSelect);
        super.disconnectedCallback();
    }

    update(changedProperties) {
        if (changedProperties.has('fragmentStore') && this.fragmentStore) {
            void this.initFragmentReferencesMap();
        }

        super.update(changedProperties);
    }

    async initFragmentReferencesMap() {
        if (!this.fragmentStore) return;

        this.#fragmentReferencesMap.clear();
        const previewStores = [this.fragmentStore];
        const cardPaths = getFieldValues(this.fragment, 'cards');
        const referencesByPath = new Map((this.fragment?.references || []).map((reference) => [reference.path, reference]));
        const draftContext = this.#getDraftContext();

        for (const cardPath of cardPaths) {
            const fragmentData = await this.#resolveCardFragmentData(cardPath, referencesByPath.get(cardPath));
            const draftStore = this.#ensureDraftStore(cardPath, fragmentData);
            if (!draftStore) continue;

            this.#fragmentReferencesMap.set(cardPath, draftStore);
            previewStores.push(draftStore);
            previewStores.push(draftStore.previewStore);
        }

        for (const stalePath of [...draftContext.cardStoresByPath.keys()]) {
            if (cardPaths.includes(stalePath)) continue;
            this.#removeDraftStore(stalePath);
        }

        this.reactiveController.updateStores(previewStores);
        this.requestUpdate();
    }

    willUpdate() {
        const cardPaths = this.cardItems.map(({ path }) => path);
        if (!cardPaths.includes(this.selectedCardPath)) {
            this.selectedCardPath = cardPaths[0] || '';
        }
    }

    updated() {
        const cardPathsSignature = this.cardItems.map(({ path }) => path).join('|');
        if (cardPathsSignature !== this.#lastCardPathsSignature) {
            this.#lastCardPathsSignature = cardPathsSignature;
            void this.initFragmentReferencesMap();
            if (!this.previewOnly) {
                this.#normalizeCompareChart();
            }
            this.#refreshPreviewFragments();
        }

        if (this.previewOnly && this.canRenderPreview) {
            this.#refreshPreviewFragments();
        }
    }

    get fragment() {
        return this.fragmentStore?.get();
    }

    get cardItems() {
        const cardsField = getField(this.fragment, 'cards');
        if (!cardsField?.values?.length) return [];

        return cardsField.values.map((path) => ({
            path,
            fragmentStore: this.#fragmentReferencesMap.get(path) || null,
        }));
    }

    get compareChartHtml() {
        return getFieldValue(this.fragment, COMPARE_CHART_FIELD);
    }

    get compareEntriesByPath() {
        if (this.compareChartHtml === this.#cachedCompareChartHtml) {
            return this.#cachedCompareEntries;
        }

        this.#cachedCompareChartHtml = this.compareChartHtml;
        this.#cachedCompareEntries = parseCompareChart(this.compareChartHtml);
        return this.#cachedCompareEntries;
    }

    get selectedCard() {
        return this.cardItems.find(({ path }) => path === this.selectedCardPath) || null;
    }

    get selectedCardStore() {
        return this.selectedCard?.fragmentStore || null;
    }

    get selectedEntry() {
        return this.compareEntriesByPath[this.selectedCardPath] || createEmptyEntry();
    }

    get canRenderPreview() {
        const commerceService = document.querySelector('mas-commerce-service');
        return Boolean(
            customElements.get('mas-table') &&
                customElements.get('aem-fragment') &&
                commerceService?.providers &&
                commerceService?.settings,
        );
    }

    get repository() {
        return this.closest('mas-fragment-editor')?.repository || document.querySelector('mas-repository');
    }

    get cardsParentPath() {
        return this.fragment?.path?.split('/').slice(0, -1).join('/') || '';
    }

    get emptyEditorTemplate() {
        return html`
            <div class="panel-card">
                <div class="empty-state">
                    <strong>No cards to compare</strong>
                    Add a card to start building the compare chart.
                </div>
            </div>
        `;
    }

    get cardsManagerTemplate() {
        return html`
            <div class="panel-card">
                <h2 class="section-title">Cards</h2>
                <div class="cards-toolbar">
                    <div class="cards-count">${this.cardItems.length} card${this.cardItems.length === 1 ? '' : 's'}</div>
                    <div class="cards-actions">
                        <sp-button variant="accent" size="s" @click=${this.#createNewCard}>New Card</sp-button>
                        <sp-button
                            variant="secondary"
                            size="s"
                            ?disabled=${!this.selectedCardPath}
                            @click=${this.#removeSelectedCard}
                        >
                            Remove Selected Card
                        </sp-button>
                    </div>
                </div>
                ${this.cardItems.length
                    ? html`
                          <div class="cards-strip">
                              ${this.cardItems.map(
                                  (cardItem, index) => html`
                                      <div
                                          class="drop-indicator ${this.dropIndicatorIndex === index ? 'is-visible' : ''}"
                                      ></div>
                                      <div
                                          class="card-row ${cardItem.path === this.draggedCardPath ? 'is-dragging' : ''}"
                                          @dragover=${(event) => this.#handleCardDragOver(index, event)}
                                          @drop=${(event) => this.#handleCardDrop(index, event)}
                                      >
                                          <button
                                              type="button"
                                              class="card-chip ${cardItem.path === this.selectedCardPath ? 'is-selected' : ''}"
                                              @click=${() => this.#broadcastCardSelection(cardItem.path)}
                                          >
                                              <div class="card-chip-title">${getCardLabel(cardItem)}</div>
                                          </button>
                                          <button
                                              type="button"
                                              class="drag-handle"
                                              aria-label="Reorder ${getCardLabel(cardItem)}"
                                              draggable="true"
                                              @dragstart=${(event) => this.#handleCardDragStart(cardItem.path, event)}
                                              @dragend=${this.#handleCardDragEnd}
                                          >
                                              ${dragHandleIcon}
                                          </button>
                                      </div>
                                  `,
                              )}
                              <div
                                  class="drop-indicator ${this.dropIndicatorIndex === this.cardItems.length
                                      ? 'is-visible'
                                      : ''}"
                                  @dragover=${(event) => this.#handleCardDragOver(this.cardItems.length, event)}
                                  @drop=${(event) => this.#handleCardDrop(this.cardItems.length, event)}
                              ></div>
                          </div>
                      `
                    : nothing}
            </div>
        `;
    }

    get compareFeaturesTemplate() {
        if (!this.selectedCard) return nothing;

        return html`
            <div class="panel-card">
                <h3 class="section-title">Mini Compare Content</h3>
                <p class="section-description">
                    These fields stay on the collection. Card references stay in <code>cards</code>. Compare feature content is
                    serialized into <code>compareChart</code> as HTML.
                </p>
                <div class="field-grid">
                    <div class="selection-meta">
                        <div class="selection-title">${getCardLabel(this.selectedCard)}</div>
                    </div>
                    <sp-field-group>
                        <sp-field-label for="compare-chart-heading">Feature list heading</sp-field-label>
                        <sp-textfield
                            id="compare-chart-heading"
                            placeholder="What's included"
                            .value=${this.selectedEntry.label}
                            @input=${this.#handleLabelInput}
                        ></sp-textfield>
                    </sp-field-group>
                    <sp-field-group class="feature-editor">
                        <sp-field-label>Features</sp-field-label>
                        <mas-multifield
                            button-label="Add feature"
                            .value=${cloneValues(this.selectedEntry.values)}
                            @change=${this.#handleFeatureValuesChange}
                            @input=${this.#handleFeatureValuesChange}
                        >
                            <template>
                                <mas-icon-picker-field></mas-icon-picker-field>
                            </template>
                        </mas-multifield>
                    </sp-field-group>
                </div>
            </div>
        `;
    }

    get selectedCardEditorTemplate() {
        if (!this.selectedCardStore) return nothing;

        return html`
            <merch-card-editor
                .fragmentStore=${this.selectedCardStore}
                .updateFragment=${this.#updateSelectedCardFragment}
                .localeDefaultFragment=${null}
                .isVariation=${false}
            ></merch-card-editor>
        `;
    }

    get editorTemplate() {
        if (!this.cardItems.length) {
            return html`<div class="editor-stack">${this.cardsManagerTemplate} ${this.emptyEditorTemplate}</div>`;
        }

        return html`
            <div class="editor-stack">
                ${this.cardsManagerTemplate} ${this.compareFeaturesTemplate} ${this.selectedCardEditorTemplate}
            </div>
        `;
    }

    get previewTemplate() {
        if (!this.cardItems.length) {
            return this.emptyEditorTemplate;
        }

        if (!this.canRenderPreview) {
            return html`
                <div class="panel-card">
                    <h3 class="panel-title">Live Preview</h3>
                    <p class="panel-copy">
                        Preview is available once <code>mas-commerce-service</code>, <code>mas-table</code>, and
                        <code>aem-fragment</code> are loaded in the current view.
                    </p>
                </div>
            `;
        }

        const previewFragment = this.#buildTablePreviewFragment();
        prepopulateFragmentCache(previewFragment.id, previewFragment);

        return html`
            <div class="panel-card">
                <h3 class="panel-title">Live Preview</h3>
                <p class="panel-copy">Preview updates automatically as you edit the compare chart.</p>
                <div class="preview-shell">
                    <sp-theme color="light" scale="medium" system="${getSpectrumVersion(VARIANT_NAMES.MINI_COMPARE_CHART)}">
                        <mas-table class="preview-table">
                            <aem-fragment ?author=${true} loading="cache" fragment="${previewFragment.id}"></aem-fragment>
                        </mas-table>
                    </sp-theme>
                </div>
            </div>
        `;
    }

    getPendingSaveStores() {
        const changedCardStores = this.cardItems
            .map(({ fragmentStore }) => fragmentStore)
            .filter((store) => store?.get()?.hasChanges && !store.new);
        const stores = [...changedCardStores, ...(this.fragmentStore?.get()?.hasChanges ? [this.fragmentStore] : [])];

        return [...new Map(stores.map((store) => [store.get().id, store])).values()];
    }

    async savePendingChanges(repository = this.repository) {
        const createdCardStores = await this.#persistNewCards(repository);

        for (const store of createdCardStores) {
            const saved = await repository.saveFragment(store, false);
            if (!saved) {
                throw new Error(`Failed to save ${store.get()?.title || store.get()?.name || 'fragment'}`);
            }
        }

        const pendingStores = this.getPendingSaveStores().filter((store) => !createdCardStores.includes(store));

        for (const store of pendingStores) {
            const saved = await repository.saveFragment(store, false);
            if (!saved) {
                throw new Error(`Failed to save ${store.get()?.title || store.get()?.name || 'fragment'}`);
            }
        }
    }

    discardPendingChanges() {
        const draftContext = this.#getDraftContext();
        for (const [path, draftStore] of draftContext.cardStoresByPath.entries()) {
            if (draftStore.new) {
                this.#removeDraftStore(path);
                this.#removeFragmentReference(path);
                continue;
            }
            if (!draftStore.get()?.hasChanges) continue;
            draftStore.discardChanges();
        }
        this.selectedCardPath = this.cardItems[0]?.path || '';
    }

    #getDraftContext() {
        if (!this.fragmentStore) {
            return {
                cardStoresByPath: new Map(),
                subscriptions: new Map(),
            };
        }

        this.fragmentStore.compareChartDraftContext ??= {
            cardStoresByPath: new Map(),
            subscriptions: new Map(),
        };

        return this.fragmentStore.compareChartDraftContext;
    }

    #markHostFragmentDirty() {
        const fragment = this.fragmentStore?.get();
        if (!fragment) return;
        fragment.hasChanges = true;
        this.fragmentStore.notify();
    }

    async #resolveCardFragmentData(path, fallbackFragment = null) {
        if (fallbackFragment) return structuredClone(fallbackFragment);

        const matchingStore = Store.fragments.list.data.get().find((store) => store.get().path === path);
        if (matchingStore) {
            return structuredClone(matchingStore.get());
        }

        const matchingReference = this.fragment?.references?.find((reference) => reference.path === path);
        if (matchingReference) {
            return structuredClone(matchingReference);
        }

        const cardId = path?.split('/').pop();
        if (!cardId) return null;

        const cachedFragment = await getFromFragmentCache(cardId);
        return cachedFragment ? structuredClone(cachedFragment) : null;
    }

    #ensureDraftStore(path, fragmentData) {
        const draftContext = this.#getDraftContext();
        const existingStore = draftContext.cardStoresByPath.get(path);
        if (existingStore) {
            return existingStore;
        }

        if (!fragmentData) return null;

        const draftStore = generateFragmentStore(fragmentData);
        draftContext.cardStoresByPath.set(path, draftStore);
        draftContext.subscriptions.set(path, {
            source: draftStore.subscribe(() => {
                if (draftStore.get()?.hasChanges) {
                    this.#markHostFragmentDirty();
                }
                this.#syncDraftReference(path, draftStore);
                this.#refreshPreviewFragments();
            }),
            preview: draftStore.previewStore.subscribe(() => {
                this.#syncDraftReference(path, draftStore);
                this.#refreshPreviewFragments();
            }),
        });
        this.#syncDraftReference(path, draftStore);
        return draftStore;
    }

    #removeDraftStore(path) {
        const draftContext = this.#getDraftContext();
        const subscriptions = draftContext.subscriptions.get(path);
        subscriptions?.source?.unsubscribe?.();
        subscriptions?.preview?.unsubscribe?.();
        draftContext.subscriptions.delete(path);
        draftContext.cardStoresByPath.delete(path);
        this.#fragmentReferencesMap.delete(path);
    }

    #syncDraftReference(path, draftStore = this.#fragmentReferencesMap.get(path)) {
        if (!path || !draftStore) return;

        const updateReferences = (hostFragment, nextReference) => {
            if (!hostFragment || !nextReference) return;

            hostFragment.references ??= [];
            const nextReferences = [...hostFragment.references];
            const existingIndex = nextReferences.findIndex((reference) => reference.path === path);
            const normalizedReference = {
                ...nextReference,
                path: nextReference.path || path,
            };

            if (existingIndex === -1) {
                nextReferences.push(normalizedReference);
            } else {
                nextReferences[existingIndex] = normalizedReference;
            }

            hostFragment.references = nextReferences;
        };

        updateReferences(this.fragmentStore?.get(), structuredClone(draftStore.get()));
        updateReferences(
            this.fragmentStore?.previewStore?.get(),
            structuredClone(draftStore.previewStore?.get() || draftStore.get()),
        );
    }

    #ensureFragmentReference(fragmentData) {
        if (!fragmentData?.path) return;
        for (const store of [this.fragmentStore?.get(), this.fragmentStore?.previewStore?.get()]) {
            if (!store) continue;
            store.references ??= [];
            if (store.references.find((reference) => reference.path === fragmentData.path)) continue;
            store.references = [...store.references, structuredClone(fragmentData)];
        }
    }

    #removeFragmentReference(path) {
        if (!path) return;
        for (const store of [this.fragmentStore?.get(), this.fragmentStore?.previewStore?.get()]) {
            if (!store?.references?.length) continue;
            store.references = store.references.filter((reference) => reference.path !== path);
        }
    }

    #replaceDraftPath(previousPath, nextFragment, draftStore) {
        const draftContext = this.#getDraftContext();
        const subscriptions = draftContext.subscriptions.get(previousPath);
        const nextPath = nextFragment.path;

        draftContext.cardStoresByPath.delete(previousPath);
        draftContext.cardStoresByPath.set(nextPath, draftStore);
        draftContext.subscriptions.delete(previousPath);
        if (subscriptions) {
            draftContext.subscriptions.set(nextPath, subscriptions);
        }

        this.#fragmentReferencesMap.delete(previousPath);
        this.#fragmentReferencesMap.set(nextPath, draftStore);
        this.#removeFragmentReference(previousPath);
        this.#ensureFragmentReference(nextFragment);

        const nextCardPaths = this.cardItems.map(({ path }) => (path === previousPath ? nextPath : path));
        const nextEntries = { ...this.compareEntriesByPath };
        if (nextEntries[previousPath]) {
            nextEntries[nextPath] = nextEntries[previousPath];
            delete nextEntries[previousPath];
        }

        this.fragmentStore.updateField('cards', nextCardPaths);
        this.#writeCompareChart(nextEntries, nextCardPaths);
        if (this.selectedCardPath === previousPath) {
            this.selectedCardPath = nextPath;
        }
    }

    #broadcastCardSelection(cardPath) {
        document.dispatchEvent(
            new CustomEvent(CARD_SELECT_EVENT, {
                detail: {
                    collectionId: this.fragment?.id,
                    cardPath,
                },
            }),
        );
    }

    #handleExternalCardSelect = ({ detail }) => {
        if (detail?.collectionId !== this.fragment?.id || !detail?.cardPath) return;
        this.selectedCardPath = detail.cardPath;
    };

    #createNewCard = () => {
        const currentPaths = this.cardItems.map(({ path }) => path);
        const draftFragment = this.#createDraftCardFragment(currentPaths.length + 1);
        const draftStore = this.#ensureDraftStore(draftFragment.path, draftFragment);
        draftStore.new = true;
        draftStore.tempPath = draftFragment.path;

        this.#ensureFragmentReference(draftFragment);
        this.fragmentStore.updateField('cards', [...currentPaths, draftFragment.path]);
        this.selectedCardPath = draftFragment.path;
        this.requestUpdate();
    };

    #moveCardToIndex(cardPath, targetIndex) {
        const currentPaths = this.cardItems.map(({ path }) => path);
        const currentIndex = currentPaths.indexOf(cardPath);
        if (currentIndex === -1) return;

        const nextCardPaths = [...currentPaths];
        const boundedTargetIndex = Math.max(0, Math.min(targetIndex, nextCardPaths.length));
        const [movedPath] = nextCardPaths.splice(currentIndex, 1);
        const insertionIndex = currentIndex < boundedTargetIndex ? boundedTargetIndex - 1 : boundedTargetIndex;
        nextCardPaths.splice(insertionIndex, 0, movedPath);

        if (nextCardPaths.every((path, index) => path === currentPaths[index])) return;

        this.fragmentStore.updateField('cards', nextCardPaths);
        this.#writeCompareChart(this.compareEntriesByPath, nextCardPaths);
    }

    #handleCardDragStart(cardPath, event) {
        this.draggedCardPath = cardPath;
        this.dropIndicatorIndex = this.cardItems.findIndex(({ path }) => path === cardPath);
        event.dataTransfer?.setData('text/plain', cardPath);
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
        }
    }

    #handleCardDragOver(index, event) {
        if (!this.draggedCardPath) return;
        event.preventDefault();
        this.dropIndicatorIndex = index;
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }

    #handleCardDrop(index, event) {
        event.preventDefault();
        const draggedCardPath = this.draggedCardPath || event.dataTransfer?.getData('text/plain');
        if (draggedCardPath) {
            this.#moveCardToIndex(draggedCardPath, index);
        }
        this.#clearDragState();
    }

    #handleCardDragEnd = () => {
        this.#clearDragState();
    };

    #clearDragState() {
        this.draggedCardPath = '';
        this.dropIndicatorIndex = -1;
    }

    #removeSelectedCard = () => {
        if (!this.selectedCardPath) return;

        const nextCardPaths = this.cardItems.map(({ path }) => path).filter((path) => path !== this.selectedCardPath);
        const nextEntries = { ...this.compareEntriesByPath };
        delete nextEntries[this.selectedCardPath];

        this.#removeDraftStore(this.selectedCardPath);
        this.#removeFragmentReference(this.selectedCardPath);
        this.fragmentStore.updateField('cards', nextCardPaths);
        this.#writeCompareChart(nextEntries, nextCardPaths);
        this.selectedCardPath = nextCardPaths[0] || '';
    };

    #createDraftCardFragment(sequence) {
        const parentPath = this.cardsParentPath;
        const slug = createNameSlug();
        const name = `${normalizeFragmentName(`${NEW_CARD_TITLE}-${sequence}`) || `compare-card-${sequence}`}-${slug}`;
        const path = `${parentPath}/${DRAFT_CARD_PREFIX}-${this.fragment?.id || 'collection'}-${sequence}-${slug}`;

        return {
            id: `${DRAFT_CARD_PREFIX}-${this.fragment?.id || 'collection'}-${sequence}`,
            path,
            name,
            title: `${NEW_CARD_TITLE} ${sequence}`,
            description: '',
            tags: [],
            references: [],
            model: {
                id: CARD_MODEL_ID,
                path: CARD_MODEL_PATH,
                name: 'Card',
                title: 'Card',
            },
            fields: [
                createField('variant', [VARIANT_NAMES.MINI_COMPARE_CHART]),
                createField('cardName', [`${NEW_CARD_TITLE} ${sequence}`]),
                createField('cardTitle', [`${NEW_CARD_TITLE} ${sequence}`]),
                createField('subtitle', ['']),
                createField('size', ['']),
                createField('backgroundImage', ['']),
                createField('backgroundImageAltText', ['']),
                createField('osi', ['']),
                createField('prices', [''], 'long-text', false, 'text/html'),
                createField('description', [''], 'long-text', false, 'text/html'),
                createField('ctas', [''], 'long-text', false, 'text/html'),
                createField('shortDescription', [''], 'long-text', false, 'text/html'),
                createField('promoText', ['']),
                createField('promoCode', ['']),
                createField('perUnitLabel', ['']),
                createField('addon', ['']),
                createField('addonConfirmation', ['']),
                createField('callout', [''], 'long-text', false, 'text/html'),
                createField('backgroundColor', ['']),
                createField('borderColor', ['']),
                createField('whatsIncluded', ['']),
                createField('footerRows', ['']),
                createField('quantitySelect', ['']),
                createField('showPlanType', [false], 'boolean'),
                createField('showSecureLabel', [false], 'boolean'),
                createField('locReady', [false], 'boolean'),
            ],
        };
    }

    #getDraftTags(fragment) {
        return fragment.newTags || fragment.tags?.map((tag) => tag.id) || [];
    }

    #buildCardCreatePayload(fragment) {
        const title = fragment.title || getCardTitle(fragment) || NEW_CARD_TITLE;

        return {
            modelId: CARD_MODEL_ID,
            parentPath: this.cardsParentPath,
            title,
            description: fragment.description || '',
            name: normalizeFragmentName(fragment.name) || normalizeFragmentName(title) || 'compare-card',
            data: {
                osi: fragment.getFieldValue('osi') || undefined,
                tags: this.#getDraftTags(fragment),
            },
        };
    }

    async #createFragmentFromDraft(repository, draftStore) {
        const draftFragment = draftStore.get();
        const tags = this.#getDraftTags(draftFragment);
        const hasOfferlessTag = tags.some((tag) => tag?.includes('offerless'));
        const osi = draftFragment.getFieldValue('osi');

        if (!osi && !hasOfferlessTag) {
            throw new Error('Please select offer');
        }

        const fragmentData = this.#buildCardCreatePayload(draftFragment);
        const baseName = fragmentData.name;

        for (let attempt = 0; attempt < 10; attempt += 1) {
            try {
                return await repository.createFragment(fragmentData, false);
            } catch (error) {
                if (!error.message.includes(': 409') || attempt === 9) {
                    throw error;
                }

                fragmentData.name = `${baseName}-${attempt + 1}`;
            }
        }

        throw new Error('Failed to create fragment.');
    }

    async #persistNewCards(repository) {
        const newCardItems = this.cardItems.filter(({ fragmentStore }) => fragmentStore?.new);
        const createdStores = [];

        for (const { path, fragmentStore } of newCardItems) {
            const draftSnapshot = structuredClone(fragmentStore.get());
            const createdFragment = await this.#createFragmentFromDraft(repository, fragmentStore);
            if (!createdFragment?.path) {
                throw new Error('Failed to create fragment.');
            }

            fragmentStore.refreshFrom(createdFragment);
            this.#restoreDraftFragmentState(fragmentStore, draftSnapshot);
            fragmentStore.new = false;
            delete fragmentStore.tempPath;
            this.#replaceDraftPath(path, createdFragment, fragmentStore);
            createdStores.push(fragmentStore);

            const currentList = Store.fragments.list.data.get() ?? [];
            if (!currentList.find((store) => store.get()?.path === createdFragment.path)) {
                Store.fragments.list.data.set([fragmentStore, ...currentList]);
            }
        }

        return createdStores;
    }

    #restoreDraftFragmentState(fragmentStore, draftSnapshot) {
        if (!fragmentStore?.get() || !draftSnapshot) return;

        const restoredFragment = fragmentStore.get();
        const draftFields = structuredClone(draftSnapshot.fields || []);

        for (const draftField of draftFields) {
            if (!this.#shouldRestoreDraftField(draftField)) continue;

            fragmentStore.updateField(draftField.name, draftField.values || []);
            const restoredField = restoredFragment.getField(draftField.name);
            if (!restoredField) continue;
            restoredField.type = draftField.type || restoredField.type || 'text';
            restoredField.multiple = draftField.multiple ?? restoredField.multiple ?? false;
            if (draftField.mimeType) {
                restoredField.mimeType = draftField.mimeType;
            }
        }

        fragmentStore.previewStore.refreshFrom(structuredClone(restoredFragment));
    }

    #shouldRestoreDraftField(field) {
        if (!field?.name) return false;
        if (field.name === 'tags') return false;

        if (field.name === 'variant') return true;
        if (field.type === 'boolean') {
            return Boolean(field.values?.some(Boolean));
        }

        return Boolean(
            field.values?.some((value) => {
                if (value == null) return false;
                if (typeof value === 'string') return value.trim().length > 0;
                return true;
            }),
        );
    }

    #handleLabelInput = (event) => {
        this.#updateEntry(this.selectedCardPath, {
            label: event.target.value,
            values: this.selectedEntry.values,
        });
    };

    #handleFeatureValuesChange = (event) => {
        this.#updateEntry(this.selectedCardPath, {
            label: this.selectedEntry.label,
            values: cloneValues(event.target.value),
        });
    };

    #updateSelectedCardFragment = ({ target, detail, values }) => {
        if (!this.selectedCardStore) return;

        const fieldName = target.dataset.field;
        let value = values;
        if (!value) {
            value = target.value || detail?.value || target.checked;
            value = target.multiline ? value?.split(',') : [value ?? ''];
        }

        this.selectedCardStore.updateField(fieldName, value);
    };

    updateCompareEntry(cardPath, nextEntry) {
        this.#updateEntry(cardPath, nextEntry);
    }

    #updateEntry(cardPath, nextEntry) {
        if (!cardPath) return;

        const nextEntries = {
            ...this.compareEntriesByPath,
            [cardPath]: {
                label: nextEntry.label || '',
                values: cloneValues(nextEntry.values),
            },
        };

        this.#writeCompareChart(nextEntries);
    }

    #normalizeCompareChart() {
        const cardPaths = this.cardItems.map(({ path }) => path);
        const normalizedHtml = serializeCompareChart(this.compareEntriesByPath, cardPaths);
        if (normalizedHtml === this.compareChartHtml) return;

        this.#writeCompareChart(this.compareEntriesByPath, cardPaths);
    }

    #writeCompareChart(entriesByPath, cardPaths = this.cardItems.map(({ path }) => path)) {
        const compareChartHtml = serializeCompareChart(entriesByPath, cardPaths);
        this.#cachedCompareChartHtml = compareChartHtml;
        this.#cachedCompareEntries = entriesByPath;

        this.fragmentStore.updateField(COMPARE_CHART_FIELD, [compareChartHtml]);
        this.#ensureCompareChartFieldMetadata();
        this.#refreshPreviewFragments();
    }

    #ensureCompareChartFieldMetadata() {
        for (const store of [this.fragmentStore, this.fragmentStore?.previewStore]) {
            const field = store?.get()?.getField(COMPARE_CHART_FIELD);
            if (!field) continue;
            field.type = 'long-text';
            field.multiple = false;
            field.mimeType = 'text/plain';
        }
    }

    #createPreviewFragmentId() {
        return `compare-table-preview-${this.fragment?.id || 'collection'}`;
    }

    #buildFallbackHeadingCell(cardItem) {
        const cell = document.createElement('div');
        const title = document.createElement('p');
        title.textContent = getCardLabel(cardItem);
        cell.append(title);
        return cell;
    }

    #buildPlaceholderCell(value = '') {
        const cell = document.createElement('div');
        if (!value) return cell;
        const text = document.createElement('div');
        text.textContent = value;
        cell.append(text);
        return cell;
    }

    #buildFeatureCell(value) {
        const cell = document.createElement('div');
        if (!value) {
            const empty = document.createElement('p');
            empty.textContent = '-';
            cell.append(empty);
            return cell;
        }

        cell.append(createMnemonicList(value));
        return cell;
    }

    #buildTableMarkup() {
        const table = document.createElement('div');
        table.className = 'table';
        const labelValues = this.cardItems.map(({ path }) => this.compareEntriesByPath[path]?.label || '');
        const hasLabelRow = labelValues.some(Boolean);

        const highlightRow = document.createElement('div');
        this.cardItems.forEach(() => {
            highlightRow.append(this.#buildPlaceholderCell());
        });
        table.append(highlightRow);

        const headingRow = document.createElement('div');
        this.cardItems.forEach((cardItem) => {
            headingRow.append(this.#buildFallbackHeadingCell(cardItem));
        });
        table.append(headingRow);

        const dividerRow = document.createElement('div');
        this.cardItems.forEach(() => {
            const cell = document.createElement('div');
            cell.append(document.createElement('hr'));
            dividerRow.append(cell);
        });
        table.append(dividerRow);

        if (hasLabelRow) {
            const labelRow = document.createElement('div');
            labelValues.forEach((label) => {
                labelRow.append(this.#buildPlaceholderCell(label));
            });
            table.append(labelRow);
        }

        const maxFeatureCount = Math.max(
            0,
            ...this.cardItems.map(({ path }) => (this.compareEntriesByPath[path] || createEmptyEntry()).values.length),
        );

        for (let index = 0; index < maxFeatureCount; index += 1) {
            const row = document.createElement('div');
            this.cardItems.forEach(({ path }) => {
                const entry = this.compareEntriesByPath[path] || createEmptyEntry();
                row.append(this.#buildFeatureCell(entry.values[index]));
            });
            table.append(row);
        }

        return table.outerHTML;
    }

    #buildTablePreviewReference(cardItem) {
        const fragment = structuredClone(cardItem.fragmentStore.previewStore.get() || cardItem.fragmentStore.get());
        return {
            type: 'content-fragment',
            value: {
                id: fragment.id,
                title: fragment.title,
                fields: fragment.fields,
            },
        };
    }

    #buildTablePreviewFragment() {
        return {
            id: this.#createPreviewFragmentId(),
            path: `${this.cardsParentPath}/compare-table-preview`,
            title: this.fragment?.title || 'Compare Chart Preview',
            model: { id: 'table' },
            fields: [
                createField('blockName', ['Table']),
                createField('selectedVariantNames', ['merch', 'highlight'], 'text', true),
                createField(
                    'cards',
                    this.cardItems.map(({ fragmentStore, path }) => fragmentStore?.get()?.id || path.split('/').pop()),
                    'content-fragment',
                    true,
                ),
                createField('compareChart', [this.#buildTableMarkup()], 'long-text', false, 'text/html'),
            ],
            references: this.cardItems
                .filter(({ fragmentStore }) => fragmentStore)
                .map((cardItem) => this.#buildTablePreviewReference(cardItem)),
        };
    }

    #refreshPreviewFragments() {
        cancelAnimationFrame(this.#previewRefreshFrame);
        this.#previewRefreshFrame = requestAnimationFrame(async () => {
            if (!this.fragmentStore) return;

            const previewFragment = buildCompareChartPreviewFragment(this.fragmentStore);
            await prepopulateFragmentCache(previewFragment.id, previewFragment);

            document.querySelectorAll(`aem-fragment[fragment="${previewFragment.id}"]`).forEach((fragment) => {
                fragment.refresh(false);
            });
        });
    }

    render() {
        return this.previewOnly ? this.previewTemplate : this.editorTemplate;
    }
}

customElements.define('compare-chart-editor', CompareChartEditor);
