import { ReactiveStore } from './reactive-store.js';
import { previewFragmentWithContext, LOCALE_DEFAULTS } from 'fragment-client';
import Store from '../store.js';

function getCorrespondingLocale(locale) {
    const [language] = locale.split('_');
    for (const defaultLocale of LOCALE_DEFAULTS) {
        if (defaultLocale.startsWith(language)) {
            return defaultLocale;
        }
    }
    return locale;
}

export class EditorContextStore extends ReactiveStore {
    fragmentsIds = {};
    loading = false;

    constructor(initialValue, validator) {
        super(initialValue, validator);
    }

    extractLocaleFromPath(path) {
        if (!path) return null;
        const parts = path.split('/');
        for (const part of parts) {
            if (/^[a-z]{2}_[A-Z]{2}$/.test(part)) {
                return part;
            }
        }
        return null;
    }

    deduceParentPath(fragmentPath, fragmentLocale) {
        if (!fragmentPath || !fragmentLocale) return null;
        const defaultLocale = getCorrespondingLocale(fragmentLocale);
        if (defaultLocale === fragmentLocale) return null;
        const parts = fragmentPath.split('/');
        const localeIndex = parts.findIndex((part) => part === fragmentLocale);
        if (localeIndex === -1) return null;
        parts[localeIndex] = defaultLocale;
        return parts.join('/');
    }

    async loadFragmentContext(fragmentId) {
        this.loading = true;
        try {
            const fragment = Store.fragments.inEdit.get()?.get();
            const fragmentLocale = this.extractLocaleFromPath(fragment?.path) || Store.filters.value.locale;

            const options = {
                locale: fragmentLocale,
                surface: Store.search.value.path,
            };
            const result = await previewFragmentWithContext(fragmentId, options);
            if (result.status === 200) {
                this.fragmentsIds = result.fragmentsIds || {};
                this.set(result.body);
            }

            if (!this.fragmentsIds['default-locale-id'] && fragment) {
                const originalIdField = fragment.fields?.find((f) => f.name === 'originalId');
                const originalId = originalIdField?.values?.[0];
                if (originalId && originalId !== fragmentId) {
                    this.fragmentsIds['default-locale-id'] = originalId;
                }
            }

            if (!this.fragmentsIds['default-locale-id'] && fragment?.path) {
                const parentPath = this.deduceParentPath(fragment.path, fragmentLocale);
                if (parentPath) {
                    try {
                        const aem = document.querySelector('mas-repository')?.aem;
                        if (aem) {
                            const parentFragment = await aem.sites.cf.fragments.getByPath(parentPath);
                            if (parentFragment?.id && parentFragment.id !== fragmentId) {
                                this.fragmentsIds['default-locale-id'] = parentFragment.id;
                            }
                        }
                    } catch (err) {
                        console.debug('Parent fragment not found at deduced path:', parentPath);
                    }
                }
            }

            return result;
        } finally {
            this.loading = false;
        }
    }

    getParentId() {
        return this.fragmentsIds['default-locale-id'] || null;
    }

    hasParent() {
        return !!this.getParentId();
    }

    reset() {
        this.fragmentsIds = {};
        this.set(null);
    }
}
