import { ReactiveStore } from './reactive-store.js';
import { previewFragmentForEditor, LOCALE_DEFAULTS } from 'fragment-client';
import Store from '../store.js';

export class EditorContextStore extends ReactiveStore {
    loading = false;
    localeDefaultFragment = null;
    defaultLocaleId = null;
    parentFetchPromise = null;
    isVariationByPath = false;
    expectedDefaultLocale = null;

    constructor(initialValue, validator) {
        super(initialValue, validator);
    }

    detectVariationFromPath(fragmentPath) {
        if (!fragmentPath) return { isVariation: false, defaultLocale: null };
        const pathMatch = fragmentPath.match(/\/content\/dam\/mas\/[^/]+\/([^/]+)\//);
        if (!pathMatch) return { isVariation: false, defaultLocale: null };
        const pathLocale = pathMatch[1];
        if (LOCALE_DEFAULTS.includes(pathLocale)) {
            return { isVariation: false, defaultLocale: null };
        }
        const language = pathLocale.split('_')[0];
        const expectedDefault = LOCALE_DEFAULTS.find((l) => l.startsWith(`${language}_`));
        if (expectedDefault && expectedDefault !== pathLocale) {
            return { isVariation: true, defaultLocale: expectedDefault, pathLocale };
        }
        return { isVariation: false, defaultLocale: null };
    }

    async loadFragmentContext(fragmentId, fragmentPath) {
        this.loading = true;
        this.localeDefaultFragment = null;
        this.defaultLocaleId = null;
        this.parentFetchPromise = null;
        this.isVariationByPath = false;
        this.expectedDefaultLocale = null;

        try {
            let surface = Store.search.value.path;
            if (!surface && fragmentPath) {
                const pathMatch = fragmentPath.match(/\/content\/dam\/mas\/([^/]+)\//);
                if (pathMatch) {
                    surface = pathMatch[1];
                }
            }

            if (!surface) {
                return { status: 0, body: null };
            }

            const options = {
                locale: Store.filters.value.locale,
                surface,
            };
            const result = await previewFragmentForEditor(fragmentId, options);

            if (result.status === 200) {
                this.set(result.body);

                this.defaultLocaleId = result.fragmentsIds?.['default-locale-id'];
                if (this.defaultLocaleId && this.defaultLocaleId !== fragmentId) {
                    const aem = document.querySelector('mas-repository')?.aem;
                    if (aem) {
                        this.parentFetchPromise = aem.sites.cf.fragments
                            .getById(this.defaultLocaleId)
                            .then((data) => {
                                this.localeDefaultFragment = data;
                                return data;
                            })
                            .catch((err) => {
                                console.debug('Locale default fragment not found:', this.defaultLocaleId);
                                return null;
                            });
                    }
                }
                this.notify();
            }

            if (!this.defaultLocaleId && fragmentPath) {
                const pathDetection = this.detectVariationFromPath(fragmentPath);
                if (pathDetection.isVariation) {
                    this.isVariationByPath = true;
                    this.expectedDefaultLocale = pathDetection.defaultLocale;
                    this.fetchParentByPath(fragmentPath, pathDetection.defaultLocale, pathDetection.pathLocale);
                }
            }

            return result;
        } finally {
            this.loading = false;
        }
    }

    fetchParentByPath(fragmentPath, defaultLocale, pathLocale) {
        const aem = document.querySelector('mas-repository')?.aem;
        if (!aem) return;
        const parentPath = fragmentPath.replace(`/${pathLocale}/`, `/${defaultLocale}/`);
        this.parentFetchPromise = aem.sites.cf.fragments
            .getByPath(parentPath)
            .then((data) => {
                this.localeDefaultFragment = data;
                this.defaultLocaleId = data?.id;
                return data;
            })
            .catch((err) => {
                console.debug('Locale default fragment not found by path:', parentPath);
                return null;
            });
    }

    getLocaleDefaultFragment() {
        return this.localeDefaultFragment;
    }

    async getLocaleDefaultFragmentAsync() {
        if (this.parentFetchPromise) {
            await this.parentFetchPromise;
        }
        return this.localeDefaultFragment;
    }

    getDefaultLocaleId() {
        return this.defaultLocaleId;
    }

    isVariation(fragmentId) {
        if (this.isVariationByPath) return true;
        if (!this.defaultLocaleId) return false;
        return this.defaultLocaleId !== fragmentId;
    }

    reset() {
        this.localeDefaultFragment = null;
        this.defaultLocaleId = null;
        this.parentFetchPromise = null;
        this.isVariationByPath = false;
        this.expectedDefaultLocale = null;
        this.set(null);
    }
}
