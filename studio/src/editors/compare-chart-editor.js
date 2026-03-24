import { css, html, LitElement, nothing } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { CARD_MODEL_PATH, TAG_MODEL_ID_MAPPING } from '../constants.js';
import '../fields/multifield.js';
import { getFromFragmentCache, prepopulateFragmentCache } from '../mas-repository.js';
import Store from '../store.js';
import ReactiveController from '../reactivity/reactive-controller.js';
import generateFragmentStore from '../reactivity/source-fragment-store.js';
import { getSpectrumVersion } from '../constants/icon-library.js';
import { dragHandleIcon } from '../icons.js';
import { VARIANT_NAMES } from './variant-picker.js';
import { showToast } from '../utils.js';
import './merch-card-editor.js';
import '../rte/rte-field.js';

const COMPARE_CHART_FIELD = 'compareChart';
const CARD_SELECT_EVENT = 'compare-chart-select-card';
const CARD_MODEL_ID = TAG_MODEL_ID_MAPPING['mas:studio/content-type/merch-card'];
const NEW_CARD_TITLE = 'New Compare Card';
const DRAFT_CARD_PREFIX = '__compare-chart-draft__';
const FEATURE_ROW_PREFIX = 'compare-feature-row';
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

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

const normalizeRichText = (value = '') => value.trim();

const createRichTextParagraph = (text = '') => {
    if (!text) return '';
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    return paragraph.outerHTML;
};

const createFeatureRowId = () => `${FEATURE_ROW_PREFIX}-${createNameSlug(8)}`;

const createEmptyFeatureRow = (id = createFeatureRowId()) => ({
    id,
    label: '',
    cellsByPath: {},
});

const cloneFeatureRows = (rows = []) =>
    rows.map((row) => ({
        id: row.id,
        label: row.label || '',
        cellsByPath: { ...(row.cellsByPath || {}) },
    }));

const getElementInnerHtml = (element) => normalizeRichText(element?.innerHTML || '');

const getLegacyFeatureValue = (element) => {
    const description = element.querySelector('[slot="description"]')?.textContent?.trim() || '';
    const merchIcon = element.querySelector('merch-icon');
    if (merchIcon) {
        const wrapper = document.createElement('div');
        const mnemonic = document.createElement('mas-mnemonic');
        mnemonic.setAttribute('src', merchIcon.getAttribute('src') || '');
        if (merchIcon.getAttribute('alt')) {
            mnemonic.setAttribute('alt', merchIcon.getAttribute('alt'));
        }
        wrapper.append(mnemonic);
        if (description) {
            wrapper.append(document.createTextNode(' '));
            wrapper.append(description);
        }
        return normalizeRichText(wrapper.innerHTML);
    }

    const spectrumIcon = element.querySelector('[slot="icon"] .sp-icon');
    if (spectrumIcon) {
        const wrapper = document.createElement('div');
        wrapper.append(spectrumIcon.cloneNode(true));
        if (description) {
            wrapper.append(document.createTextNode(' '));
            wrapper.append(description);
        }
        return normalizeRichText(wrapper.innerHTML);
    }

    return createRichTextParagraph(description);
};

const parseLegacyCompareChart = (compareChartHtml = '') => {
    if (!compareChartHtml) return [];

    const doc = new DOMParser().parseFromString(compareChartHtml, 'text/html');
    const entriesByPath = {};

    doc.querySelectorAll('.compare-chart-card[data-card-path]').forEach((cardElement) => {
        const cardPath = cardElement.getAttribute('data-card-path');
        if (!cardPath) return;

        const whatsIncluded = cardElement.querySelector('merch-whats-included');
        const values = [];
        whatsIncluded?.querySelectorAll('[slot="content"] merch-mnemonic-list').forEach((listElement) => {
            values.push(getLegacyFeatureValue(listElement));
        });
        entriesByPath[cardPath] = values;
    });

    const maxRowCount = Math.max(0, ...Object.values(entriesByPath).map((values) => values.length));
    const rows = [];
    for (let index = 0; index < maxRowCount; index += 1) {
        const row = createEmptyFeatureRow();
        Object.entries(entriesByPath).forEach(([cardPath, values]) => {
            row.cellsByPath[cardPath] = values[index] || '';
        });
        rows.push(row);
    }

    return rows;
};

const parseCompareChart = (compareChartHtml = '') => {
    if (!compareChartHtml) return [];

    const doc = new DOMParser().parseFromString(compareChartHtml, 'text/html');
    const rows = [...doc.querySelectorAll('.compare-chart-row[data-row-id]')].map((rowElement) => {
        const row = createEmptyFeatureRow(rowElement.getAttribute('data-row-id') || createFeatureRowId());
        row.label = getElementInnerHtml(rowElement.querySelector('.compare-chart-label'));
        rowElement.querySelectorAll('.compare-chart-cell[data-card-path]').forEach((cellElement) => {
            const cardPath = cellElement.getAttribute('data-card-path');
            if (!cardPath) return;
            row.cellsByPath[cardPath] = getElementInnerHtml(cellElement);
        });
        return row;
    });

    if (rows.length) return rows;
    return parseLegacyCompareChart(compareChartHtml);
};

const serializeCompareChart = (rows, cardPaths) => {
    if (!rows.length) return '';

    const wrapper = document.createElement('div');
    wrapper.className = 'compare-chart';
    wrapper.setAttribute('data-editor', 'mini-compare-chart');

    rows.forEach((row) => {
        const rowElement = document.createElement('div');
        rowElement.className = 'compare-chart-row';
        rowElement.setAttribute('data-row-id', row.id || createFeatureRowId());

        const label = document.createElement('div');
        label.className = 'compare-chart-label';
        label.innerHTML = row.label || '';
        rowElement.append(label);

        cardPaths.forEach((cardPath) => {
            const cell = document.createElement('div');
            cell.className = 'compare-chart-cell';
            cell.setAttribute('data-card-path', cardPath);
            cell.innerHTML = row.cellsByPath?.[cardPath] || '';
            rowElement.append(cell);
        });

        wrapper.append(rowElement);
    });

    return wrapper.outerHTML;
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

const buildPlaceholderCell = (value = '', attributes = {}) => {
    const cell = document.createElement('div');
    Object.entries(attributes).forEach(([name, attributeValue]) => {
        cell.setAttribute(name, attributeValue);
    });
    if (!value) return cell;
    const text = document.createElement('div');
    text.textContent = value;
    cell.append(text);
    return cell;
};

const buildFeatureCell = (value) => {
    const cell = document.createElement('div');
    if (!value) return cell;

    cell.innerHTML = value;
    return cell;
};

const getCardPreviewFragment = (cardItem) =>
    cardItem.fragmentStore?.previewStore?.get() || cardItem.fragmentStore?.get() || cardItem.reference;

const cardHasBadge = (cardItem) => {
    const fragment = getCardPreviewFragment(cardItem);
    const badgeValue = getFieldValue(fragment, 'badge');
    if (typeof badgeValue === 'string') return badgeValue.trim().length > 0;
    if (badgeValue == null) return false;
    return String(badgeValue).trim().length > 0;
};

const getCompareTableVariantNames = (cardItems) => {
    const variants = ['header-left', 'sticky', 'pricing-bottom'];
    if (cardItems.some((cardItem) => cardHasBadge(cardItem))) {
        variants.splice(1, 0, 'highlight');
    }
    return variants;
};

const buildTableMarkup = (fragmentStore) => {
    const table = document.createElement('div');
    table.className = 'table compare-chart-features has-addon';
    const fragment = fragmentStore?.get();
    const compareRows = parseCompareChart(getFieldValue(fragment, COMPARE_CHART_FIELD));
    const cardItems = getCompareChartCardItems(fragmentStore);
    const hasBadgeRow = cardItems.some((cardItem) => cardHasBadge(cardItem));

    if (hasBadgeRow) {
        const highlightRow = document.createElement('div');
        highlightRow.append(buildPlaceholderCell('', { 'data-valign': 'middle' }));
        cardItems.forEach(() => {
            highlightRow.append(buildPlaceholderCell('', { 'data-valign': 'middle' }));
        });
        table.append(highlightRow);
    }

    const headingRow = document.createElement('div');
    headingRow.append(buildPlaceholderCell());
    cardItems.forEach((cardItem) => {
        headingRow.append(buildFallbackHeadingCell(cardItem));
    });
    table.append(headingRow);

    const dividerRow = document.createElement('div');
    dividerRow.append(buildPlaceholderCell());
    cardItems.forEach(() => {
        const cell = document.createElement('div');
        cell.append(document.createElement('hr'));
        dividerRow.append(cell);
    });
    table.append(dividerRow);

    for (const rowData of compareRows) {
        const row = document.createElement('div');
        row.append(buildFeatureCell(rowData.label));
        cardItems.forEach(({ path }) => {
            row.append(buildFeatureCell(rowData.cellsByPath?.[path] || ''));
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
            createField('selectedVariantNames', getCompareTableVariantNames(cardItems), 'text', true),
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
        activeEditorKey: { type: String, state: true },
        showRemoveCardDialog: { type: Boolean, state: true },
    };

    static styles = css`
        :host {
            display: block;
        }

        .editor-stack {
            display: grid;
            gap: 24px;
        }

        .compare-authoring-container {
            display: grid;
            gap: 20px;
            padding: 20px;
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 20px;
            background: var(--spectrum-gray-75);
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

        .two-column-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
        }

        @media (max-width: 900px) {
            .two-column-grid {
                grid-template-columns: 1fr;
            }
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
            align-items: center;
        }

        .cards-actions sp-action-group {
            flex-wrap: wrap;
        }

        .features-toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 16px;
        }

        .features-toolbar sp-action-group {
            flex-wrap: wrap;
        }

        .features-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            table-layout: fixed;
            border: 1px solid var(--spectrum-gray-300);
            border-radius: 14px;
            overflow: hidden;
            background: var(--spectrum-white);
        }

        .features-table thead th {
            text-align: left;
            padding: 12px 14px;
            font-size: 12px;
            font-weight: 700;
            color: var(--spectrum-gray-700);
            background: var(--spectrum-gray-75);
            border-bottom: 1px solid var(--spectrum-gray-300);
        }

        .features-table thead .feature-label-column,
        .feature-label-cell {
            background: var(--spectrum-background-layer-1-color);
        }

        .features-table thead th + th,
        .features-table tbody td + td {
            border-inline-start: 1px solid var(--spectrum-gray-300);
        }

        .features-table tbody td {
            vertical-align: top;
            border-bottom: 1px solid var(--spectrum-gray-300);
            background: var(--spectrum-white);
        }

        .features-table tbody tr:last-child td {
            border-bottom: none;
        }

        .features-table .feature-label-column {
            width: 220px;
        }

        .features-table .feature-card-column {
            width: calc((100% - 220px) / max(1, var(--compare-card-count, 1)));
        }

        .feature-label-cell,
        .feature-value-cell {
            padding: 12px;
            color: var(--spectrum-gray-900);
        }

        .feature-label-cell {
            position: relative;
            min-height: 92px;
            background: var(--spectrum-background-layer-1-color);
        }

        .feature-value-cell {
            min-height: 48px;
            background: var(--spectrum-white);
        }

        .feature-label-cell.is-editable,
        .feature-value-cell.is-editable {
            cursor: text;
        }

        .feature-value-cell.is-editable:hover {
            background: var(--spectrum-gray-50);
        }

        .feature-label-cell.is-active,
        .feature-value-cell.is-active {
            background: var(--spectrum-blue-75);
            box-shadow: inset 0 0 0 2px var(--spectrum-blue-500);
        }

        .feature-label-cell.is-active {
            background: var(--spectrum-background-layer-1-color);
            box-shadow: none;
        }

        .feature-cell-display {
            min-height: 44px;
            line-height: 1.5;
            overflow-wrap: anywhere;
        }

        .feature-cell-display :first-child {
            margin-top: 0;
        }

        .feature-cell-display :last-child {
            margin-bottom: 0;
        }

        .feature-cell-placeholder {
            color: var(--spectrum-gray-500);
        }

        .feature-row-actions {
            position: absolute;
            top: 8px;
            right: 8px;
            display: inline-flex;
            gap: 4px;
            opacity: 0;
            pointer-events: none;
            transition: opacity 120ms ease;
        }

        .features-table tbody tr:hover .feature-row-actions,
        .features-table tbody tr:focus-within .feature-row-actions {
            opacity: 1;
            pointer-events: auto;
        }

        .feature-cell-editor rte-field {
            width: 100%;
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

        sp-underlay:not([open]) + sp-dialog {
            display: none;
        }

        sp-underlay + sp-dialog {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 2000;
            background: var(--spectrum-white);
            border-radius: 16px;
            width: min(520px, calc(100vw - 32px));
        }
    `;

    reactiveController = new ReactiveController(this, []);
    #fragmentReferencesMap = new Map();
    #cachedCompareChartHtml = null;
    #cachedCompareRows = [];
    #lastCardPathsSignature = '';
    #previewRefreshFrame = 0;
    #lastPreviewSignature = '';
    #activeEditorInitialValue = '';

    constructor() {
        super();
        this.fragmentStore = null;
        this.previewOnly = false;
        this.selectedCardPath = '';
        this.draggedCardPath = '';
        this.dropIndicatorIndex = -1;
        this.activeEditorKey = '';
        this.showRemoveCardDialog = false;
    }

    connectedCallback() {
        super.connectedCallback();
        document.addEventListener(CARD_SELECT_EVENT, this.#handleExternalCardSelect);
        document.addEventListener('pointerdown', this.#handleDocumentPointerDown, true);
        if (this.fragmentStore) {
            void this.initFragmentReferencesMap();
        }
    }

    disconnectedCallback() {
        cancelAnimationFrame(this.#previewRefreshFrame);
        document.removeEventListener(CARD_SELECT_EVENT, this.#handleExternalCardSelect);
        document.removeEventListener('pointerdown', this.#handleDocumentPointerDown, true);
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
        if (this.selectedCardPath && !cardPaths.includes(this.selectedCardPath)) {
            this.selectedCardPath = '';
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

    get compareRows() {
        if (this.compareChartHtml === this.#cachedCompareChartHtml) {
            return this.#cachedCompareRows;
        }

        this.#cachedCompareChartHtml = this.compareChartHtml;
        this.#cachedCompareRows = parseCompareChart(this.compareChartHtml);
        return this.#cachedCompareRows;
    }

    get selectedCard() {
        return this.cardItems.find(({ path }) => path === this.selectedCardPath) || null;
    }

    get selectedCardStore() {
        return this.selectedCard?.fragmentStore || null;
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

    get generalInfoTemplate() {
        return html`
            <div class="panel-card" data-general-info-panel>
                <h2 class="section-title">General info</h2>
                <div class="two-column-grid">
                    <sp-field-group id="fragment-title-group">
                        <sp-field-label for="fragment-title">Fragment title</sp-field-label>
                        <sp-textfield
                            id="fragment-title"
                            placeholder="Enter fragment title"
                            .value=${this.fragment?.title || ''}
                            @input=${this.#handleFragmentTitleUpdate}
                        ></sp-textfield>
                    </sp-field-group>
                    <sp-field-group id="fragment-description-group">
                        <sp-field-label for="fragment-description">Fragment description</sp-field-label>
                        <sp-textfield
                            id="fragment-description"
                            placeholder="Enter fragment description"
                            .value=${this.fragment?.description || ''}
                            @input=${this.#handleFragmentDescriptionUpdate}
                        ></sp-textfield>
                    </sp-field-group>
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
                        <sp-action-group aria-label="Card actions" compact>
                            <sp-action-button id="new-card-action" @click=${this.#createNewCard}>
                                <sp-icon-add slot="icon"></sp-icon-add>
                            </sp-action-button>
                            <sp-action-button id="paste-card-action" @click=${this.#pasteCardFromClipboard}>
                                <sp-icon-paste slot="icon"></sp-icon-paste>
                            </sp-action-button>
                            <sp-action-button
                                id="remove-card-action"
                                ?disabled=${!this.selectedCardPath}
                                @click=${this.#removeSelectedCard}
                            >
                                <sp-icon-delete slot="icon"></sp-icon-delete>
                            </sp-action-button>
                        </sp-action-group>
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
        return html`
            <div class="panel-card">
                <h3 class="section-title">Features</h3>
                <div class="features-toolbar">
                    <div class="cards-count">${this.compareRows.length} row${this.compareRows.length === 1 ? '' : 's'}</div>
                    <sp-action-group aria-label="Feature actions" compact>
                        <sp-action-button id="add-feature-row-action" @click=${this.#addFeatureRow}>
                            <sp-icon-add slot="icon"></sp-icon-add>
                        </sp-action-button>
                    </sp-action-group>
                </div>
                ${this.featuresTableTemplate}
            </div>
        `;
    }

    get removeCardDialogTemplate() {
        if (!this.showRemoveCardDialog || !this.selectedCardPath) return nothing;

        const selectedCardLabel = getCardLabel(this.selectedCard || { path: this.selectedCardPath });
        return html`
            <sp-underlay ?open=${this.showRemoveCardDialog}></sp-underlay>
            <sp-dialog>
                <h2 slot="heading">Remove card</h2>
                <p>Remove ${selectedCardLabel} from this compare chart? Its feature column will be deleted.</p>
                <sp-button slot="button" variant="secondary" treatment="outline" @click=${this.#closeRemoveCardDialog}>
                    Cancel
                </sp-button>
                <sp-button slot="button" variant="negative" @click=${this.#confirmRemoveSelectedCard}>Remove</sp-button>
            </sp-dialog>
        `;
    }

    get featuresTableTemplate() {
        return html`
            <table class="features-table" style=${`--compare-card-count: ${Math.max(this.cardItems.length, 1)};`}>
                <thead>
                    <tr>
                        <th class="feature-label-column">Feature</th>
                        ${this.cardItems.map(
                            (cardItem) => html`<th class="feature-card-column">${getCardLabel(cardItem)}</th>`,
                        )}
                    </tr>
                </thead>
                <tbody>
                    ${this.compareRows.length
                        ? this.compareRows.map((row) => this.#renderFeatureRow(row))
                        : html`
                              <tr>
                                  <td class="feature-label-cell">
                                      <div class="feature-cell-display feature-cell-placeholder">No feature rows yet.</div>
                                  </td>
                                  ${this.cardItems.map(
                                      () => html`
                                          <td class="feature-value-cell">
                                              <div class="feature-cell-display feature-cell-placeholder">
                                                  Add a row to start editing.
                                              </div>
                                          </td>
                                      `,
                                  )}
                              </tr>
                          `}
                </tbody>
            </table>
        `;
    }

    get selectedCardEditorTemplate() {
        if (!this.cardItems.length || !this.selectedCardStore) {
            return html`
                <div class="panel-card">
                    <h3 class="panel-title">Card editor</h3>
                    <p class="panel-copy">Select a card to edit its content.</p>
                </div>
            `;
        }

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
        const compareAuthoringTemplate = html`
            <div class="compare-authoring-container">
                ${this.cardsManagerTemplate} ${this.cardItems.length ? this.compareFeaturesTemplate : this.emptyEditorTemplate}
            </div>
        `;

        if (!this.cardItems.length) {
            return html` <div class="editor-stack">${this.generalInfoTemplate} ${compareAuthoringTemplate}</div> `;
        }

        return html`
            <div class="editor-stack">
                ${this.generalInfoTemplate} ${compareAuthoringTemplate} ${this.selectedCardEditorTemplate}
                ${this.removeCardDialogTemplate}
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

        const { previewFragment, changed } = this.#createPreviewSnapshot();
        if (changed) {
            void prepopulateFragmentCache(previewFragment.id, previewFragment);
        }

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
        this.#closeActiveEditor();
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
        this.#closeActiveEditor();
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
        const nextRows = cloneFeatureRows(this.compareRows).map((row) => {
            if (!Object.hasOwn(row.cellsByPath, previousPath)) return row;
            row.cellsByPath[nextPath] = row.cellsByPath[previousPath] || '';
            delete row.cellsByPath[previousPath];
            return row;
        });

        this.fragmentStore.updateField('cards', nextCardPaths);
        this.#writeCompareChart(nextRows, nextCardPaths);
        if (this.activeEditorKey?.startsWith(`cell:`) && this.activeEditorKey.endsWith(`:${previousPath}`)) {
            const rowId = this.activeEditorKey.split(':')[1];
            this.activeEditorKey = this.#getCellEditorKey(rowId, nextPath);
        }
        if (this.selectedCardPath === previousPath) {
            this.selectedCardPath = nextPath;
        }
    }

    #broadcastCardSelection(cardPath) {
        const nextCardPath = this.selectedCardPath === cardPath ? '' : cardPath;
        if (!nextCardPath) {
            this.selectedCardPath = '';
            return;
        }

        document.dispatchEvent(
            new CustomEvent(CARD_SELECT_EVENT, {
                detail: {
                    collectionId: this.fragment?.id,
                    cardPath: nextCardPath,
                },
            }),
        );
    }

    #handleExternalCardSelect = ({ detail }) => {
        if (detail?.collectionId !== this.fragment?.id || !detail?.cardPath) return;
        this.selectedCardPath = detail.cardPath;
        void this.#scrollGeneralInfoIntoView();
    };

    async #scrollGeneralInfoIntoView() {
        await this.updateComplete;
        this.renderRoot?.querySelector('[data-general-info-panel]')?.scrollIntoView({ block: 'start', inline: 'nearest' });
    }

    #createNewCard = () => {
        const currentPaths = this.cardItems.map(({ path }) => path);
        const nextCardPaths = [...currentPaths];
        const draftFragment = this.#createDraftCardFragment(currentPaths.length + 1);
        const draftStore = this.#ensureDraftStore(draftFragment.path, draftFragment);
        draftStore.new = true;
        draftStore.tempPath = draftFragment.path;

        this.#ensureFragmentReference(draftFragment);
        nextCardPaths.push(draftFragment.path);
        this.fragmentStore.updateField('cards', nextCardPaths);
        this.#writeCompareChart(this.compareRows, nextCardPaths);
        this.selectedCardPath = draftFragment.path;
        this.requestUpdate();
    };

    async #pasteCardFromClipboard() {
        try {
            const clipboardText = await navigator.clipboard?.readText?.();
            const fragmentId = this.#extractFragmentIdFromClipboard(clipboardText);
            if (!fragmentId) {
                showToast('Clipboard does not contain a card link or fragment id.', 'negative');
                return;
            }

            const fragmentData = await this.#resolveCardFragmentById(fragmentId);
            if (!fragmentData?.path) {
                showToast('Unable to resolve card from clipboard.', 'negative');
                return;
            }

            this.#addResolvedCard(fragmentData);
        } catch (error) {
            console.error('Failed to paste card from clipboard:', error);
            showToast('Unable to paste card from clipboard.', 'negative');
        }
    }

    #extractFragmentIdFromClipboard(clipboardText = '') {
        const trimmed = clipboardText.trim();
        if (!trimmed) return '';

        if (UUID_PATTERN.test(trimmed) && trimmed === trimmed.match(UUID_PATTERN)?.[0]) {
            return trimmed;
        }

        try {
            const url = new URL(trimmed);
            const hash = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
            const hashParams = new URLSearchParams(hash);
            const directId = hashParams.get('query') || hashParams.get('fragmentId') || url.searchParams.get('query');
            if (directId) return directId;
        } catch {
            // ignore URL parsing failures and fall back to UUID extraction
        }

        return trimmed.match(UUID_PATTERN)?.[0] || '';
    }

    async #resolveCardFragmentById(fragmentId) {
        if (!fragmentId) return null;

        const knownCard =
            this.cardItems.find(({ fragmentStore }) => fragmentStore?.get()?.id === fragmentId)?.fragmentStore?.get() ||
            this.fragment?.references?.find((reference) => reference.id === fragmentId) ||
            Store.fragments.list.data
                .get()
                .find((store) => store.get()?.id === fragmentId)
                ?.get() ||
            (await getFromFragmentCache(fragmentId));

        if (knownCard) {
            return structuredClone(knownCard);
        }

        const fragmentData = await this.repository?.aem?.sites?.cf?.fragments?.getById?.(fragmentId);
        return fragmentData ? structuredClone(fragmentData) : null;
    }

    #addResolvedCard(fragmentData) {
        const cardPath = fragmentData?.path;
        if (!cardPath) return;

        if (this.cardItems.some(({ path }) => path === cardPath)) {
            this.selectedCardPath = cardPath;
            return;
        }

        this.#ensureDraftStore(cardPath, fragmentData);
        this.#ensureFragmentReference(fragmentData);

        const nextCardPaths = [...this.cardItems.map(({ path }) => path), cardPath];
        this.fragmentStore.updateField('cards', nextCardPaths);
        this.#writeCompareChart(this.compareRows, nextCardPaths);
        this.selectedCardPath = cardPath;
    }

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
        this.#writeCompareChart(this.compareRows, nextCardPaths);
        this.#refreshPreviewFragments(true);
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
        this.showRemoveCardDialog = true;
    };

    #closeRemoveCardDialog = () => {
        this.showRemoveCardDialog = false;
    };

    #confirmRemoveSelectedCard = () => {
        if (!this.selectedCardPath) return;
        this.showRemoveCardDialog = false;

        const nextCardPaths = this.cardItems.map(({ path }) => path).filter((path) => path !== this.selectedCardPath);
        const nextRows = cloneFeatureRows(this.compareRows).map((row) => {
            delete row.cellsByPath[this.selectedCardPath];
            return row;
        });
        if (this.activeEditorKey?.startsWith(`cell:`) && this.activeEditorKey.endsWith(`:${this.selectedCardPath}`)) {
            this.activeEditorKey = '';
        }

        this.#removeDraftStore(this.selectedCardPath);
        this.#removeFragmentReference(this.selectedCardPath);
        this.fragmentStore.updateField('cards', nextCardPaths);
        this.#writeCompareChart(nextRows, nextCardPaths);
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

    #handleFragmentTitleUpdate = (event) => {
        this.fragmentStore?.updateFieldInternal('title', event.target.value);
    };

    #handleFragmentDescriptionUpdate = (event) => {
        this.fragmentStore?.updateFieldInternal('description', event.target.value);
    };

    #getLabelEditorKey(rowId) {
        return `label:${rowId}`;
    }

    #getCellEditorKey(rowId, cardPath) {
        return `cell:${rowId}:${cardPath}`;
    }

    #findRowById(rowId) {
        return this.compareRows.find((row) => row.id === rowId) || null;
    }

    #getCardOsi(cardPath) {
        const cardStore = this.cardItems.find(({ path }) => path === cardPath)?.fragmentStore;
        return cardStore?.get()?.getFieldValue?.('osi') || '';
    }

    #buildFieldSelector(key) {
        return `[data-editor-key="${window.CSS?.escape?.(key) || key}"]`;
    }

    #getEditorKeys() {
        return this.compareRows.flatMap((row) => [
            this.#getLabelEditorKey(row.id),
            ...this.cardItems.map(({ path }) => this.#getCellEditorKey(row.id, path)),
        ]);
    }

    async #focusActiveEditor() {
        await this.updateComplete;
        const editor = this.renderRoot?.querySelector(`rte-field${this.#buildFieldSelector(this.activeEditorKey)}`);
        editor?.editorView?.focus?.();
        editor?.shadowRoot?.getElementById('editor')?.focus?.();
    }

    #handleDocumentPointerDown = (event) => {
        if (!this.activeEditorKey || !this.renderRoot) return;
        const activeContainer = this.renderRoot.querySelector(this.#buildFieldSelector(this.activeEditorKey));
        if (activeContainer && event.composedPath().includes(activeContainer)) {
            return;
        }
        this.#closeActiveEditor();
    };

    #activateEditor(key) {
        if (this.activeEditorKey === key) return;
        this.#closeActiveEditor();
        this.#activeEditorInitialValue = this.#getEditorValue(key);
        this.activeEditorKey = key;
        void this.#focusActiveEditor();
    }

    #closeActiveEditor() {
        if (!this.activeEditorKey) return;
        this.#commitActiveEditor();
        this.activeEditorKey = '';
        this.#activeEditorInitialValue = '';
    }

    #discardActiveEditor() {
        if (!this.activeEditorKey) return;
        this.#applyEditorValue(this.activeEditorKey, this.#activeEditorInitialValue);
        this.activeEditorKey = '';
        this.#activeEditorInitialValue = '';
    }

    #commitActiveEditor() {
        if (!this.activeEditorKey || !this.renderRoot) return;
        const editor = this.renderRoot.querySelector(`rte-field${this.#buildFieldSelector(this.activeEditorKey)}`);
        if (!editor) return;
        this.#applyEditorValue(this.activeEditorKey, editor.value || '');
    }

    #applyEditorValue(editorKey, value) {
        if (!editorKey) return;
        const normalizedValue = normalizeRichText(value || '');
        if (editorKey.startsWith('label:')) {
            const rowId = editorKey.slice('label:'.length);
            this.#updateRow(rowId, (row) => {
                row.label = normalizedValue;
            });
            return;
        }

        if (!editorKey.startsWith('cell:')) return;
        const [, rowId, ...cardPathParts] = editorKey.split(':');
        const cardPath = cardPathParts.join(':');
        this.#updateRow(rowId, (row) => {
            row.cellsByPath[cardPath] = normalizedValue;
        });
    }

    #getEditorValue(editorKey) {
        if (!editorKey) return '';
        if (editorKey.startsWith('label:')) {
            const rowId = editorKey.slice('label:'.length);
            return this.#findRowById(rowId)?.label || '';
        }

        if (!editorKey.startsWith('cell:')) return '';
        const [, rowId, ...cardPathParts] = editorKey.split(':');
        const cardPath = cardPathParts.join(':');
        return this.#findRowById(rowId)?.cellsByPath?.[cardPath] || '';
    }

    #updateRow(rowId, updateFn) {
        const nextRows = cloneFeatureRows(this.compareRows).map((row) => {
            if (row.id !== rowId) return row;
            updateFn(row);
            return row;
        });
        this.#writeCompareChart(nextRows);
    }

    #addFeatureRow = () => {
        this.#closeActiveEditor();
        const nextRows = [...cloneFeatureRows(this.compareRows), createEmptyFeatureRow()];
        this.#writeCompareChart(nextRows);
    };

    #removeFeatureRow = (rowId) => {
        this.#closeActiveEditor();
        const nextRows = cloneFeatureRows(this.compareRows).filter((row) => row.id !== rowId);
        this.#writeCompareChart(nextRows);
    };

    #moveFeatureRow = (rowId, direction) => {
        this.#closeActiveEditor();
        const nextRows = cloneFeatureRows(this.compareRows);
        const currentIndex = nextRows.findIndex((row) => row.id === rowId);
        if (currentIndex === -1) return;

        const targetIndex = currentIndex + direction;
        if (targetIndex < 0 || targetIndex >= nextRows.length) return;

        const [row] = nextRows.splice(currentIndex, 1);
        nextRows.splice(targetIndex, 0, row);
        this.#writeCompareChart(nextRows);
    };

    #normalizeCompareChart() {
        const cardPaths = this.cardItems.map(({ path }) => path);
        const normalizedHtml = serializeCompareChart(this.compareRows, cardPaths);
        if (normalizedHtml === this.compareChartHtml) return;

        this.#writeCompareChart(this.compareRows, cardPaths);
    }

    #writeCompareChart(rows, cardPaths = this.cardItems.map(({ path }) => path)) {
        const compareChartHtml = serializeCompareChart(rows, cardPaths);
        this.#cachedCompareChartHtml = compareChartHtml;
        this.#cachedCompareRows = cloneFeatureRows(rows);

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

    #renderFeatureRow(row) {
        const labelEditorKey = this.#getLabelEditorKey(row.id);
        const rowIndex = this.compareRows.findIndex(({ id }) => id === row.id);
        const canMoveUp = rowIndex > 0;
        const canMoveDown = rowIndex > -1 && rowIndex < this.compareRows.length - 1;
        return html`
            <tr>
                <td
                    class=${`feature-label-cell ${this.activeEditorKey === labelEditorKey ? 'is-active' : 'is-editable'}`}
                    data-editor-key=${labelEditorKey}
                    tabindex=${this.activeEditorKey === labelEditorKey ? '-1' : '0'}
                    @click=${() => this.#activateEditor(labelEditorKey)}
                    @keydown=${(event) => this.#handleFeatureCellActivationKeydown(event, labelEditorKey)}
                >
                    <sp-action-group class="feature-row-actions" compact quiet>
                        <sp-action-button
                            class="feature-row-move-up"
                            ?disabled=${!canMoveUp}
                            quiet
                            label="Move row up"
                            @click=${(event) => {
                                event.stopPropagation();
                                this.#moveFeatureRow(row.id, -1);
                            }}
                        >
                            <sp-icon-chevron-up slot="icon"></sp-icon-chevron-up>
                        </sp-action-button>
                        <sp-action-button
                            class="feature-row-move-down"
                            ?disabled=${!canMoveDown}
                            quiet
                            label="Move row down"
                            @click=${(event) => {
                                event.stopPropagation();
                                this.#moveFeatureRow(row.id, 1);
                            }}
                        >
                            <sp-icon-chevron-down slot="icon"></sp-icon-chevron-down>
                        </sp-action-button>
                        <sp-action-button
                            class="feature-row-remove"
                            quiet
                            label="Remove row"
                            @click=${(event) => {
                                event.stopPropagation();
                                this.#removeFeatureRow(row.id);
                            }}
                        >
                            <sp-icon-delete slot="icon"></sp-icon-delete>
                        </sp-action-button>
                    </sp-action-group>
                    ${this.#renderEditableField({
                        editorKey: labelEditorKey,
                        value: row.label,
                        placeholder: 'Click to add feature name',
                    })}
                </td>
                ${this.cardItems.map(({ path }) => {
                    const editorKey = this.#getCellEditorKey(row.id, path);
                    return html`
                        <td
                            class=${`feature-value-cell ${this.activeEditorKey === editorKey ? 'is-active' : 'is-editable'}`}
                            data-editor-key=${editorKey}
                            tabindex=${this.activeEditorKey === editorKey ? '-1' : '0'}
                            @click=${() => this.#activateEditor(editorKey)}
                            @keydown=${(event) => this.#handleFeatureCellActivationKeydown(event, editorKey)}
                        >
                            ${this.#renderEditableField({
                                editorKey,
                                value: row.cellsByPath?.[path] || '',
                                placeholder: 'Click to edit',
                                osi: this.#getCardOsi(path),
                            })}
                        </td>
                    `;
                })}
            </tr>
        `;
    }

    #renderEditableField({ editorKey, value, placeholder, osi = '' }) {
        const isActive = this.activeEditorKey === editorKey;
        if (isActive) {
            return html`
                <div class="feature-cell-editor" data-editor-key=${editorKey}>
                    <rte-field
                        float
                        inline
                        icon
                        icon-picker
                        mnemonic
                        .osi=${osi}
                        .value=${value || ''}
                        data-editor-key=${editorKey}
                        @change=${this.#handleFeatureEditorChange}
                        @keydown=${this.#handleFeatureEditorKeydown}
                    ></rte-field>
                </div>
            `;
        }

        return html`
            <div class="feature-cell-display">
                ${value ? unsafeHTML(value) : html`<span class="feature-cell-placeholder">${placeholder}</span>`}
            </div>
        `;
    }

    #handleFeatureCellActivationKeydown(event, editorKey) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        event.stopPropagation();
        this.#activateEditor(editorKey);
    }

    #handleFeatureEditorChange = (event) => {
        const editorKey = event.currentTarget.dataset.editorKey;
        this.#applyEditorValue(editorKey, event.currentTarget.value || '');
    };

    #handleFeatureEditorKeydown = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            this.#discardActiveEditor();
            return;
        }

        if (event.key !== 'Tab') return;
        event.preventDefault();
        event.stopPropagation();

        const currentKey = event.currentTarget.dataset.editorKey;
        const editorKeys = this.#getEditorKeys();
        const currentIndex = editorKeys.indexOf(currentKey);
        if (currentIndex === -1) {
            this.#closeActiveEditor();
            return;
        }

        this.#applyEditorValue(currentKey, event.currentTarget.value || '');
        const nextIndex = currentIndex + (event.shiftKey ? -1 : 1);
        const nextKey = editorKeys[nextIndex];

        if (!nextKey) {
            this.activeEditorKey = '';
            return;
        }

        this.activeEditorKey = nextKey;
        void this.#focusActiveEditor();
    };

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
                createField('selectedVariantNames', getCompareTableVariantNames(this.cardItems), 'text', true),
                createField(
                    'cards',
                    this.cardItems.map(({ fragmentStore, path }) => fragmentStore?.get()?.id || path.split('/').pop()),
                    'content-fragment',
                    true,
                ),
                createField('compareChart', [buildTableMarkup(this.fragmentStore)], 'long-text', false, 'text/html'),
            ],
            references: this.cardItems
                .filter(({ fragmentStore }) => fragmentStore)
                .map((cardItem) => this.#buildTablePreviewReference(cardItem)),
        };
    }

    #createPreviewSnapshot() {
        const previewFragment = buildCompareChartPreviewFragment(this.fragmentStore);
        const signature = JSON.stringify(previewFragment);
        const changed = signature !== this.#lastPreviewSignature;
        if (changed) {
            this.#lastPreviewSignature = signature;
        }

        return { previewFragment, changed };
    }

    #refreshPreviewFragments(force = false) {
        cancelAnimationFrame(this.#previewRefreshFrame);
        this.#previewRefreshFrame = requestAnimationFrame(async () => {
            if (!this.fragmentStore) return;

            const { previewFragment, changed } = this.#createPreviewSnapshot();
            if (!changed && !force) return;

            if (changed) {
                await prepopulateFragmentCache(previewFragment.id, previewFragment);
            }

            document.querySelectorAll(`aem-fragment[fragment="${previewFragment.id}"]`).forEach((fragment) => {
                fragment.refresh(false);
            });
            document
                .querySelectorAll(`acom-content-preview[fragment="${previewFragment.id}"]`)
                .forEach((preview) => preview.refresh?.());
        });
    }

    render() {
        return this.previewOnly ? this.previewTemplate : this.editorTemplate;
    }
}

customElements.define('compare-chart-editor', CompareChartEditor);
