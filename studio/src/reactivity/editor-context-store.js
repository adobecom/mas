import { ReactiveStore } from './reactive-store.js';
import { previewFragmentForEditor } from 'fragment-client';
import { getDefaultLocaleCode } from '../../../io/www/src/fragment/locales.js';
import Store from '../store.js';
import { Fragment } from '../aem/fragment.js';

export class EditorContextStore extends ReactiveStore {
    loading = false;
    localeDefaultFragment = null;
    defaultLocaleId = null;
    parentFetchPromise = null;
    isVariationByPath = false;
    isGroupedVariationByPath = false;
    expectedDefaultLocale = null;

    constructor(initialValue, validator) {
        super(initialValue, validator);
    }

    detectVariationFromPath(fragmentPath) {
        if (!fragmentPath) return { isVariation: false, defaultLocale: null };
        const pathMatch = fragmentPath.match(/\/content\/dam\/mas\/[^/]+\/([^/]+)\//);
        if (!pathMatch) return { isVariation: false, defaultLocale: null };
        const localeCode = pathMatch[1];
        const expectedDefault = getDefaultLocaleCode(Store.surface(), localeCode);
        if (expectedDefault && expectedDefault !== localeCode) {
            return { isVariation: true, defaultLocale: expectedDefault, pathLocale: localeCode };
        }
        return { isVariation: false, defaultLocale: null };
    }

    async loadFragmentContext(fragmentId, fragmentPath) {
        this.loading = false;
        this.localeDefaultFragment = null;
        this.defaultLocaleId = null;
        this.parentFetchPromise = null;
        this.isVariationByPath = false;
        this.isGroupedVariationByPath = false;
        this.expectedDefaultLocale = null;
        if (Fragment.isGroupedVariationPath(fragmentPath)) {
            this.isGroupedVariationByPath = true;
        }

        let notified = false;

        try {
            let surface = Store.surface();
            if (!surface && fragmentPath) {
                const pathMatch = fragmentPath.match(/\/content\/dam\/mas\/([^/]+)\//);
                if (pathMatch) {
                    surface = pathMatch[1];
                }
            }

            if (!surface) {
                this.notify();
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
                                this.notify();
                                return data;
                            })
                            .catch(() => {
                                console.debug('Locale default fragment not found:', this.defaultLocaleId);
                                return null;
                            });
                    }
                }
                this.notify();
                notified = true;
            } else {
                console.debug(`Fragment context fetch returned status ${result.status}`, {
                    fragmentId,
                    message: result.message,
                });
                this.set(null);
                this.notify();
                notified = true;
            }

            if (fragmentPath) {
                if (!this.defaultLocaleId) {
                    const pathDetection = this.detectVariationFromPath(fragmentPath);
                    if (pathDetection.isVariation) {
                        this.isVariationByPath = true;
                        this.expectedDefaultLocale = pathDetection.defaultLocale;
                        this.fetchParentByPath(fragmentPath, pathDetection.defaultLocale, pathDetection.pathLocale);
                        if (!notified) {
                            this.notify();
                            notified = true;
                        }
                    }
                }
            }

            return result;
        } catch (error) {
            console.debug('Fragment context fetch failed:', error.message, { fragmentId });
            this.set(null);
            if (!notified) {
                this.notify();
                notified = true;
            }
            return { status: 0, body: null, error: error.message };
        } finally {
            this.loading = false;
            if (!notified) {
                console.warn('EditorContextStore.loadFragmentContext completed without notifying subscribers');
                this.notify();
            }
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
                this.notify();
                return data;
            })
            .catch(() => {
                console.debug('Locale default fragment not found by path:', parentPath);
                return null;
            });
    }

    setParent(parentData) {
        if (!parentData) return;
        this.localeDefaultFragment = parentData;
        this.defaultLocaleId = parentData.id;
        this.parentFetchPromise = Promise.resolve(parentData);
        this.notify();
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
        if (this.isGroupedVariationByPath) return true;
        if (!this.defaultLocaleId) return false;
        return this.defaultLocaleId !== fragmentId;
    }

    reset() {
        this.localeDefaultFragment = null;
        this.defaultLocaleId = null;
        this.parentFetchPromise = null;
        this.isVariationByPath = false;
        this.isGroupedVariationByPath = false;
        this.expectedDefaultLocale = null;
        this.set(null);
    }
}
