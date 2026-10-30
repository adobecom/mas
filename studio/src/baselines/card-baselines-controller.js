import { Fragment } from '../aem/fragment.js';
import { extractLocaleFromPath, extractSurfaceFromPath } from '../utils.js';
import { getDefaultLocaleCode } from '../../../io/www/src/fragment/locales.js';
import { buildBaselineParent, findCardBaselines, hasContent } from './baseline-model.js';

export const BASELINE_STATUS = {
    NONE: 'none',
    PENDING: 'pending',
    FOUND: 'found',
    MISSING: 'missing',
    ERROR: 'error',
};

/**
 * Looks up the baselines of the card its host (merch card editor) edits whenever the card offer, template or locale
 * change, and hands their merge to the card fragment store while the card has baselines enabled.
 * The host provides `fragment`, `fragmentStore` and `getEffectiveFieldValue(s)` (variation values fall back to the
 * locale default card).
 */
export class CardBaselinesController {
    status = BASELINE_STATUS.NONE;
    baselines = null;
    defaultLocale = null;
    #lookupKey = null;
    #lookupId = 0;
    #parentKey = null;
    #parentStore = null;

    constructor(host, find = findCardBaselines) {
        this.host = host;
        this.find = find;
        host.addController(this);
    }

    get message() {
        switch (this.status) {
            case BASELINE_STATUS.PENDING:
                return 'Looking for a baseline…';
            case BASELINE_STATUS.FOUND: {
                const { fragmentSegmentBaseline, fragmentBaseline } = this.baselines;
                const baseline = fragmentSegmentBaseline ?? fragmentBaseline;
                return baseline ? `Baseline found: ${baseline.title}` : 'Offer baseline found: product title and icon';
            }
            case BASELINE_STATUS.MISSING:
                return `No baseline for this offer and template in ${this.defaultLocale}`;
            case BASELINE_STATUS.ERROR:
                return 'Baselines could not be looked up';
            default:
                return '';
        }
    }

    hostUpdate() {
        const { fragmentStore } = this.host;
        const fragment = fragmentStore?.get();
        if (!fragment) return;
        this.#lookUp(fragment);
        this.#applyParent(fragmentStore);
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
        this.defaultLocale = getDefaultLocaleCode(surface, locale);
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
                const found = Object.values(baselines ?? {}).some(Boolean);
                this.baselines = found ? baselines : null;
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

    #applyParent(fragmentStore) {
        const enabled = this.host.getEffectiveFieldValue('enableBaselines') === true;
        const icons = this.host.getEffectiveFieldValues('mnemonicIcon');
        const parentKey = [this.#lookupId, this.status, enabled, hasContent(icons)].join('|');
        if (fragmentStore === this.#parentStore && parentKey === this.#parentKey) return;
        this.#parentStore = fragmentStore;
        this.#parentKey = parentKey;
        const card = { fields: [{ name: 'mnemonicIcon', values: icons }] };
        const parent = enabled && this.baselines ? buildBaselineParent(this.baselines, card) : null;
        fragmentStore.setBaselineParent(parent?.fragment ?? null);
    }
}
