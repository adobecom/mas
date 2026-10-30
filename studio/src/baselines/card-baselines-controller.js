import { Fragment } from '../aem/fragment.js';
import { extractLocaleFromPath, extractSurfaceFromPath } from '../utils.js';
import { VARIANTS } from '../editors/variant-picker.js';
import { buildBaselineParent, findCardBaselines, hasContent } from './baseline-model.js';

export const BASELINE_STATUS = {
    NONE: 'none',
    PENDING: 'pending',
    FOUND: 'found',
    MISSING: 'missing',
    ERROR: 'error',
};

const BASELINE_LAYERS = ['offerBaseline', 'fragmentBaseline', 'fragmentSegmentBaseline'];

const templateLabel = (template) => VARIANTS.find(({ value }) => value === template)?.label ?? template;

/** "a", "a and b", "a, b, and c" */
const listOf = (items) => (items.length > 2 ? `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}` : items.join(' and '));

/**
 * Looks up the baselines of the card its host (merch card editor) edits whenever the card offer, template or locale
 * change, and hands their merge to the card fragment store while the card has baselines enabled.
 * The host provides `fragmentStore`, `localeDefaultFragment`, `effectiveIsVariation` and `getEffectiveFieldValue`
 * (variation values fall back to the locale default card).
 */
export class CardBaselinesController {
    status = BASELINE_STATUS.NONE;
    baselines = null;
    /** Template, PA code & market segment of the last lookup, as far as they are known. */
    lookup = null;
    /** @type {Fragment | null} merged baselines the card inherits from, while it has baselines enabled */
    parent = null;
    #lookupKey = null;
    #lookupId = 0;
    #parentKey = null;
    #parentStore = null;

    constructor(host, find = findCardBaselines) {
        this.host = host;
        this.find = find;
        host.addController(this);
    }

    /** Most specific baseline fragment found (segment, then template); `null` without one or with an offer baseline only. */
    get baseline() {
        if (this.status !== BASELINE_STATUS.FOUND) return null;
        const { fragmentSegmentBaseline, fragmentBaseline } = this.baselines;
        return fragmentSegmentBaseline ?? fragmentBaseline;
    }

    /** Product name the offer baseline provides as card title, as delivered by the offers service. */
    get offerProductName() {
        const cardTitle = this.baselines?.offerBaseline?.fields.find(({ name }) => name === 'cardTitle');
        return cardTitle?.values[0] ?? 'product title and icon';
    }

    /** Why no baseline applies, e.g. "Baseline for Plans, PA-1, and COM not found". */
    get missingMessage() {
        const { template, productArrangementCode, marketSegment } = this.lookup;
        if (!productArrangementCode) return 'No PA code found for this offer';
        const keys = [templateLabel(template), productArrangementCode, marketSegment?.toUpperCase()].filter(Boolean);
        return `Baseline for ${listOf(keys)} not found`;
    }

    get message() {
        switch (this.status) {
            case BASELINE_STATUS.PENDING:
                return 'Looking for a baseline…';
            case BASELINE_STATUS.FOUND:
                return this.baseline
                    ? `Baseline found: ${this.baseline.title}`
                    : `Offer baseline found: ${this.offerProductName}`;
            case BASELINE_STATUS.MISSING:
                return this.missingMessage;
            case BASELINE_STATUS.ERROR:
                return 'Baselines could not be looked up';
            default:
                return 'Select an offer and a template to look for a baseline';
        }
    }

    hostUpdate() {
        const { fragmentStore } = this.host;
        const fragment = fragmentStore?.get();
        if (!fragment) return;
        this.#lookUp(fragment);
        this.#applyParent(fragment, fragmentStore);
    }

    hostDisconnected() {
        this.#lookupId++;
        this.#lookupKey = null;
    }

    #lookUp(fragment) {
        const surface = extractSurfaceFromPath(fragment.path);
        const locale = extractLocaleFromPath(fragment.path);
        const osi = this.host.getEffectiveFieldValue('osi');
        const template = this.host.getEffectiveFieldValue('variant');
        const key = [fragment.id, surface, locale, osi, template].join('|');
        if (key === this.#lookupKey) return;
        this.#lookupKey = key;
        const lookupId = ++this.#lookupId;
        this.baselines = null;
        this.lookup = { template };
        if (!osi || !template || Fragment.isBaselinePath(fragment.path)) {
            this.status = BASELINE_STATUS.NONE;
            return;
        }
        this.status = BASELINE_STATUS.PENDING;
        Promise.resolve()
            .then(() => {
                const fragmentsApi = document.querySelector('mas-repository').aem.sites.cf.fragments;
                return this.find(fragmentsApi, { surface, locale, osi, template });
            })
            .then((baselines) => {
                if (lookupId !== this.#lookupId) return;
                const found = BASELINE_LAYERS.some((layer) => baselines?.[layer]);
                this.baselines = found ? baselines : null;
                this.lookup = {
                    template,
                    productArrangementCode: baselines?.productArrangementCode,
                    marketSegment: baselines?.marketSegment,
                };
                this.status = found ? BASELINE_STATUS.FOUND : BASELINE_STATUS.MISSING;
                this.host.requestUpdate();
            })
            .catch((error) => {
                if (lookupId !== this.#lookupId) return;
                console.error('Failed to look up baselines:', error);
                this.status = BASELINE_STATUS.ERROR;
                this.host.requestUpdate();
            });
    }

    #applyParent(fragment, fragmentStore) {
        const enabled = this.host.getEffectiveFieldValue('enableBaselines') === true;
        const { localeDefaultFragment, effectiveIsVariation } = this.host;
        const icons = fragment.getEffectiveFieldValues('mnemonicIcon', localeDefaultFragment, effectiveIsVariation);
        const parentKey = [this.#lookupId, this.status, enabled, hasContent(icons)].join('|');
        if (fragmentStore === this.#parentStore && parentKey === this.#parentKey) return;
        this.#parentStore = fragmentStore;
        this.#parentKey = parentKey;
        const card = { fields: [{ name: 'mnemonicIcon', values: icons }] };
        const parent = enabled && this.baselines ? buildBaselineParent(this.baselines, card) : null;
        this.parent = parent?.fragment ?? null;
        fragmentStore.setBaselineParent(this.parent);
    }
}
