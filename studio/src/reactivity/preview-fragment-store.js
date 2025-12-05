import Store from '../store.js';
import { FragmentStore } from './fragment-store.js';
import { previewStudioFragment } from 'fragment-client';
import { Fragment } from '../aem/fragment.js';

export class PreviewFragmentStore extends FragmentStore {
    resolved = false;
    placeholderUnsubscribe = null;
    holdResolution = false;
    #resolving = false;
    #resolveDebounceTimer = null;
    #refreshDebounceTimer = null;

    /**
     * @param {Fragment} initialValue
     * @param {(value: any) => any} validator
     * @param {{ skipAutoResolve?: boolean }} options
     */
    constructor(initialValue, validator, options = {}) {
        const fragmentInstance = initialValue instanceof Fragment ? initialValue : new Fragment(initialValue);
        super(fragmentInstance, validator);
        this.holdResolution = options.skipAutoResolve || false;

        this.placeholderUnsubscribe = Store.placeholders.preview.subscribe(() => {
            if (!this.resolved && Store.placeholders.preview.value) {
                this.resolveFragment();
            }
        });

        if (!options.skipAutoResolve) {
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

    updateFieldWithParentValue(fieldName, parentValues) {
        const field = this.value.getField(fieldName);
        if (field) {
            field.values = parentValues;
        } else if (parentValues.length > 0) {
            const existingField = this.value.fields.find((f) => f.name === fieldName);
            if (existingField) {
                existingField.values = parentValues;
            } else {
                this.value.fields.push({
                    name: fieldName,
                    values: parentValues,
                    multiple: parentValues.length > 1,
                });
            }
        }
        this.resolveFragment();
    }

    isResolving() {
        return this.#resolving;
    }

    releaseHold() {
        this.holdResolution = false;
        this.resolveFragment();
    }

    resolveFragment() {
        clearTimeout(this.#resolveDebounceTimer);
        this.#resolveDebounceTimer = setTimeout(() => {
            this.#doResolveFragment();
        }, 150);
    }

    #doResolveFragment() {
        if (this.#resolving || this.holdResolution) {
            return;
        }

        if (!this.value) {
            console.warn('[PreviewFragmentStore] Cannot resolve: no fragment value');
            return;
        }

        if (!this.value?.model?.path) {
            console.warn('[PreviewFragmentStore] Cannot resolve: invalid fragment model', {
                fragmentId: this.value?.id,
                hasModel: !!this.value?.model,
            });
            return;
        }

        if (this.isCollection || !Store.placeholders.preview.value) {
            this.resolved = true;
            this.refreshAemFragment();
            return;
        }

        if (!Store.search.value.path) {
            this.resolved = true;
            this.refreshAemFragment();
            return;
        }

        this.#resolving = true;
        this.getResolvedFragment()
            .then((result) => {
                if (result) {
                    this.replaceFrom(result);
                    this.refreshAemFragment();
                    this.resolved = true;
                }
            })
            .catch((error) => {
                console.error('[PreviewFragmentStore] Failed to resolve fragment:', error);
            })
            .finally(() => {
                this.#resolving = false;
            });
    }

    async getResolvedFragment() {
        /* Transform fields to publish */
        const body = structuredClone(this.value);
        const originalFields = body.fields;
        body.fields = {};
        for (const field of originalFields) {
            body.fields[field.name] = field.multiple ? field.values : field.values[0];
        }

        const context = {
            locale: Store.filters.value.locale,
            surface: Store.search.value.path,
            dictionary: Store.placeholders.preview.value,
        };
        const result = await previewStudioFragment(body, context);

        /* Transform fields back to author */
        for (const field of originalFields) {
            const resolvedField = result.fields[field.name];
            field.values = field.multiple ? resolvedField : [resolvedField];
        }
        result.fields = originalFields;
        return result;
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

    refreshAemFragment() {
        clearTimeout(this.#refreshDebounceTimer);
        this.#refreshDebounceTimer = setTimeout(() => {
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
        }, 100);
    }

    /**
     * Cleanup subscription to prevent memory leaks
     * Call this when the store is no longer needed
     */
    dispose() {
        if (this.placeholderUnsubscribe) {
            Store.placeholders.preview.unsubscribe(this.placeholderUnsubscribe);
            this.placeholderUnsubscribe = null;
        }
    }
}
