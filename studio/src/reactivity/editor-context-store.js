import { ReactiveStore } from './reactive-store.js';
import { previewFragmentForEditor } from 'fragment-client';
import Store from '../store.js';

export class EditorContextStore extends ReactiveStore {
    loading = false;
    localeDefaultFragment = null;
    defaultLocaleId = null;

    constructor(initialValue, validator) {
        super(initialValue, validator);
    }

    async loadFragmentContext(fragmentId) {
        this.loading = true;
        this.localeDefaultFragment = null;
        this.defaultLocaleId = null;

        try {
            if (!Store.search.value.path) {
                return { status: 0, body: null };
            }

            const options = {
                locale: Store.filters.value.locale,
                surface: Store.search.value.path,
            };
            const result = await previewFragmentForEditor(fragmentId, options);

            if (result.status === 200) {
                this.set(result.body);

                this.defaultLocaleId = result.fragmentsIds?.['default-locale-id'];
                if (this.defaultLocaleId && this.defaultLocaleId !== fragmentId) {
                    const aem = document.querySelector('mas-repository')?.aem;
                    if (aem) {
                        try {
                            this.localeDefaultFragment = await aem.sites.cf.fragments.getById(this.defaultLocaleId);
                        } catch (err) {
                            console.debug('Locale default fragment not found:', this.defaultLocaleId);
                        }
                    }
                }
                this.notify();
            }

            return result;
        } finally {
            this.loading = false;
        }
    }

    getLocaleDefaultFragment() {
        return this.localeDefaultFragment;
    }

    getDefaultLocaleId() {
        return this.defaultLocaleId;
    }

    isVariation(fragmentId) {
        if (!this.defaultLocaleId) return false;
        return this.defaultLocaleId !== fragmentId;
    }

    reset() {
        this.localeDefaultFragment = null;
        this.defaultLocaleId = null;
        this.set(null);
    }
}
