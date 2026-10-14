import Store from '../store.js';
import { FragmentStore } from './fragment-store.js';
import { previewFragment, previewStudioFragment } from '../../libs/fragment-client.js';
import { Fragment } from '../aem/fragment.js';
import { ODIN_PREVIEW_FRAGMENTS_URL } from '../constants.js';
import { normalizeExplicitEmptyInFields } from '../../../io/www/src/fragment/utils/explicit-empty.js';
import { canProbePromoVariationsForFragment, getPromotionTagFromFragment } from '../promotions/promotion-model.js';
import {
    countdownDatesOfProvenance,
    countdownDatesOfTag,
    hasCountdownSentinel,
    toCountdownProject,
} from '../promotions/countdown-preview.js';
import { getService } from '../utils.js';

const COUNTDOWN_PROJECTS_TTL = 30000;
const countdownProjectsByRepository = new WeakMap();

/**
 * Reads the promotion projects without side effects: the loaded list when available, otherwise
 * a (briefly cached) search. Never repository.loadPromotions(): it unpublishes expired projects.
 */
async function readCountdownProjects() {
    const list = Store.promotions.list.data;
    if (list.get()?.length || list.hasMeta('listFetched'))
        return (list.get() ?? []).map((store) => toCountdownProject(store.get()));
    const repository = document.querySelector('mas-repository');
    const cached = countdownProjectsByRepository.get(repository);
    if (cached && Date.now() - cached.at < COUNTDOWN_PROJECTS_TTL) return cached.projects;
    const projects = repository
        .searchFragmentList({ path: repository.getPromotionsPath(), sort: [{ on: 'created', order: 'DESC' }] }, 50)
        .then((fragments) => fragments.map(toCountdownProject))
        .catch((error) => {
            countdownProjectsByRepository.delete(repository);
            throw error;
        });
    countdownProjectsByRepository.set(repository, { at: Date.now(), projects });
    return projects;
}

export const INHERITED_SETTINGS_FIELDS = new Set(['addon', 'showPlanType', 'showSecureLabel', 'quantitySelect']);

export function serializePreviewFields(fields = []) {
    return fields.reduce((result, field) => {
        const values = field.values || [];
        const isSingleEmptyString = field.multiple !== true && values.length === 1 && values[0] === '';

        // Studio uses [''] as the single-value "inherit/default" sentinel for settings.
        // Omit those fields from preview payloads so fragment-client resolves surface defaults.
        if (isSingleEmptyString && INHERITED_SETTINGS_FIELDS.has(field.name)) {
            return result;
        }

        result[field.name] = field.multiple ? values : values[0];
        return result;
    }, {});
}

export function mergeResolvedPreviewFields(originalFields = [], resolvedFields = {}, resolvedSettings = {}) {
    return originalFields.map((field) => {
        const resolvedValue = resolvedFields?.[field.name];

        if (field.multiple) {
            if (Array.isArray(resolvedValue)) {
                return {
                    ...field,
                    values: resolvedValue,
                };
            }
            return field;
        }

        if (resolvedValue !== undefined) {
            return {
                ...field,
                values: [resolvedValue],
            };
        }

        // For inherited settings fields omitted from the preview payload,
        // the resolved value comes back in result.settings instead of result.fields.
        if (INHERITED_SETTINGS_FIELDS.has(field.name)) {
            const settingValue = resolvedSettings?.[field.name];
            if (settingValue !== undefined) {
                return {
                    ...field,
                    values: [settingValue],
                };
            }
        }

        return field;
    });
}

export class PreviewFragmentStore extends FragmentStore {
    resolved = false;
    placeholderUnsubscribe = null;
    previewLocaleOverride = null;
    #resolving = false;
    #resolvePending = false;
    #resolveDebounceTimer = null;
    #refreshDebounceTimer = null;
    #resolvedDictionarySig = null;

    /**
     * @param {Fragment} initialValue
     * @param {(value: any) => any} validator
     */
    constructor(initialValue, validator, { lazy = false } = {}) {
        const fragmentInstance = initialValue instanceof Fragment ? initialValue : new Fragment(initialValue);
        super(fragmentInstance, validator);
        this.lazy = lazy;

        this.placeholderUnsubscribe = Store.placeholders.previewByLocale.subscribe(() => {
            if (this.lazy || !Store.previewDictionaryReady(this.previewLocale)) return;
            const sig = this.previewLocale;
            if (this.resolved && sig === this.#resolvedDictionarySig) return;
            this.resolved = false;
            this.resolveFragment(true);
        });

        if (!this.lazy) {
            this.resolveFragment();
        }
    }

    set(value) {
        /* IMPORTANT! This store's value should NOT be re-assigned!
           We generally get here from the source store's "set" function, but there, the value
           that is passed is actually (or should be!) the underlying value of the source store, 
           which is DIFFERENT from the underlying value of this store - which again should not change, 
           only use replaceFrom/refreshFrom to keep the object reference, 
           rather than (in this case) "super.set(value)"
        */
        this.value.replaceFrom(value, false);
        this.resolveFragment();
    }

    updateField(name, value) {
        this.value.updateField(name, value);
        this.resolveFragment();
    }

    updateFieldInternal(name, value) {
        this.value.updateFieldInternal(name, value);
        this.resolveFragment();
    }

    refreshFrom(value) {
        this.value.refreshFrom(value);
        this.resolveFragment();
    }

    discardChanges() {
        this.value.discardChanges();
        this.resolveFragment();
    }

    get previewLocale() {
        return this.previewLocaleOverride || Store.localeOrRegion();
    }

    setPreviewLocaleOverride(value) {
        const nextValue = value || null;
        if (this.previewLocaleOverride === nextValue) {
            return false;
        }
        this.previewLocaleOverride = nextValue;
        this.resolved = false;
        return true;
    }

    resolveFragment(immediate = false) {
        this.lazy = false;
        clearTimeout(this.#resolveDebounceTimer);
        if (immediate) {
            this.#doResolveFragment();
            return;
        }
        this.#resolveDebounceTimer = setTimeout(() => {
            this.#doResolveFragment();
        }, 150);
    }

    #doResolveFragment() {
        if (this.#resolving) {
            // A change arrived mid-resolve; re-run once the in-flight resolve settles so it isn't lost.
            this.#resolvePending = true;
            return;
        }

        if (!this.value) {
            console.warn('[PreviewFragmentStore] Cannot resolve: no fragment value');
            this.resolved = true;
            this.refreshAemFragment(true);
            this.notify();
            return;
        }

        if (!this.value?.model?.path) {
            console.warn('[PreviewFragmentStore] Cannot resolve: invalid fragment model', {
                fragmentId: this.value?.id,
                hasModel: !!this.value?.model,
            });
            this.resolved = true;
            this.refreshAemFragment(true);
            this.notify();
            return;
        }

        if (this.isCollection) {
            this.resolved = true;
            this.refreshAemFragment(true);
            this.notify();
            return;
        }

        if (!Store.previewDictionaryReady(this.previewLocale)) {
            // Leave resolved=false so the placeholderUnsubscribe callback
            // re-runs resolution once the dictionary for this locale arrives.
            this.refreshAemFragment(true);
            this.notify();
            return;
        }

        if (!Store.surface()) {
            this.resolved = true;
            this.refreshAemFragment(true);
            this.notify();
            return;
        }

        this.#resolving = true;
        const dictionarySig = this.previewLocale;
        this.getResolvedFragment()
            .then((result) => {
                if (result) {
                    this.#resolvedDictionarySig = dictionarySig;
                    this.replaceFrom(result);
                    this.refreshAemFragment(true);
                }
            })
            .catch((error) => {
                console.error('[PreviewFragmentStore] Failed to resolve fragment:', error);
            })
            .finally(() => {
                this.#resolving = false;
                if (!this.resolved) {
                    this.resolved = true;
                    this.refreshAemFragment(true);
                    this.notify();
                }
                if (this.#resolvePending) {
                    this.#resolvePending = false;
                    this.#doResolveFragment();
                }
            });
    }

    async getResolvedFragment() {
        /* Transform fields to publish */
        const body = structuredClone(this.value);
        const originalFields = body.fields;
        body.fields = serializePreviewFields(originalFields);

        const context = {
            locale: this.previewLocale,
            surface: Store.surface(),
            dictionary: Store.previewDictionary(this.previewLocale),
            preview: { url: ODIN_PREVIEW_FRAGMENTS_URL },
        };
        const result = await previewStudioFragment(body, context);

        /* Transform fields back to author */
        result.fields = normalizeExplicitEmptyInFields(
            mergeResolvedPreviewFields(originalFields, result.fields, result.settings),
        );

        const essentialProps = [
            'path',
            'id',
            'etag',
            'model',
            'title',
            'description',
            'status',
            'created',
            'modified',
            'published',
            'tags',
            'references',
        ];
        for (const prop of essentialProps) {
            if (this.value[prop] !== undefined && result[prop] === undefined) {
                result[prop] = this.value[prop];
            }
        }

        // Preview payload only: the source fragment never carries these.
        result.previewLocale = this.previewLocale;
        Object.assign(result, await this.getCountdownDates(result.fields));

        return result;
    }

    /**
     * Countdown dates for the preview payload; keys are always present so stale dates get cleared.
     * A promo variation takes its tagged project (drafts included). A default card takes the project
     * the production pipeline selects for its saved version, even if the saved description has no
     * sentinel. Unsaved authored content is never sent anywhere.
     */
    async getCountdownDates(fields) {
        const none = { cdtStart: undefined, cdtEnd: undefined };
        if (!hasCountdownSentinel(fields)) return none;
        try {
            const tag = getPromotionTagFromFragment(this.value);
            if (tag) return { ...none, ...countdownDatesOfTag(await readCountdownProjects(), tag) };
            if (!canProbePromoVariationsForFragment(this.value)) return none;
            const instant = getService()?.settings?.instant;
            const provenance = await this.previewPublishedFragment(this.value.id, {
                locale: this.previewLocale,
                country: this.previewLocale.split('_')[1],
                ...(instant && { instant }),
                fullContext: true,
            });
            return { ...none, ...countdownDatesOfProvenance(provenance) };
        } catch (error) {
            console.warn('[PreviewFragmentStore] Could not resolve countdown dates:', error);
            return none;
        }
    }

    /** Edge: the production pipeline over the saved fragment (reads only, shares its caches). */
    previewPublishedFragment(id, options) {
        return previewFragment(id, options);
    }

    replaceFrom(value) {
        this.value.replaceFrom(value);
        this.resolved = true;
        this.populateGlobalCache();
        this.notify();
    }

    populateGlobalCache() {
        const AemFragment = customElements.get('aem-fragment');
        if (AemFragment?.cache) {
            AemFragment.cache.remove(this.value.id);
            AemFragment.cache.add(this.value);
        }
    }

    refreshAemFragment(immediate = false) {
        clearTimeout(this.#refreshDebounceTimer);

        const doRefresh = () => {
            this.populateGlobalCache();
            const aemFragments = document.querySelectorAll(`aem-fragment[fragment="${this.value.id}"]`);
            aemFragments.forEach((aemFragment) => {
                aemFragment.refresh(false);
            });

            const editor = document.querySelector('mas-fragment-editor');
            if (editor) {
                editor.dispatchEvent(
                    new CustomEvent('preview-updated', {
                        bubbles: true,
                        composed: true,
                        detail: { fragmentId: this.value.id },
                    }),
                );
            }
        };

        if (immediate) {
            doRefresh();
            return;
        }
        this.#refreshDebounceTimer = setTimeout(doRefresh, 100);
    }

    /**
     * Cleanup subscription to prevent memory leaks
     * Call this when the store is no longer needed
     */
    dispose() {
        if (this.placeholderUnsubscribe) {
            Store.placeholders.previewByLocale.unsubscribe(this.placeholderUnsubscribe);
            this.placeholderUnsubscribe = null;
        }
    }
}
