import { ReactiveStore } from './reactive-store.js';
import { previewFragmentForEditor } from 'fragment-client';
import Store from '../store.js';
import { extractLocaleFromPath, getCorrespondingLocale } from '../aem/fragment.js';

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

    async fetchLocaleDefaultFragment() {
        if (this.localeDefaultFragment) {
            return this.localeDefaultFragment;
        }

        if (!this.value?.path) return null;

        const locale = extractLocaleFromPath(this.value.path);
        if (!locale) return null;

        const defaultLocale = getCorrespondingLocale(locale);
        if (!defaultLocale || locale === defaultLocale) return null;

        const parentPath = this.value.path.replace(`/${locale}/`, `/${defaultLocale}/`);
        const aem = document.querySelector('mas-repository')?.aem;

        if (!aem) return null;

        try {
            this.localeDefaultFragment = await aem.sites.cf.fragments.getByPath(parentPath);
            return this.localeDefaultFragment;
        } catch (error) {
            console.warn('Could not fetch locale default fragment:', parentPath);
            return null;
        }
    }

    getDefaultLocaleId() {
        return this.defaultLocaleId;
    }

    isVariation(fragmentId) {
        if (this.defaultLocaleId) {
            return this.defaultLocaleId !== fragmentId;
        }
        if (!this.value?.path) return false;
        const locale = extractLocaleFromPath(this.value.path);
        if (!locale) return false;
        const defaultLocale = getCorrespondingLocale(locale);
        return locale !== defaultLocale;
    }

    reset() {
        this.localeDefaultFragment = null;
        this.defaultLocaleId = null;
        this.set(null);
    }
}
