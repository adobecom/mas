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
    loading = false;
    parentFragment = null;

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
        this.parentFragment = null;

        try {
            const fragment = Store.fragments.inEdit.get()?.get();
            const fragmentLocale = this.extractLocaleFromPath(fragment?.path) || Store.filters.value.locale;

            if (fragment?.path) {
                const parentPath = this.deduceParentPath(fragment.path, fragmentLocale);
                if (parentPath) {
                    try {
                        const aem = document.querySelector('mas-repository')?.aem;
                        if (aem) {
                            const parent = await aem.sites.cf.fragments.getByPath(parentPath);
                            if (parent?.id && parent.id !== fragmentId) {
                                this.parentFragment = parent;
                            }
                        }
                    } catch (err) {
                        console.debug('Parent fragment not found at deduced path:', parentPath);
                    }
                }
            }

            if (!Store.search.value.path) {
                return { status: 0, body: null };
            }

            const options = {
                locale: fragmentLocale,
                surface: Store.search.value.path,
            };
            const result = await previewFragmentWithContext(fragmentId, options);
            if (result.status === 200) {
                this.set(result.body);
            }

            return result;
        } finally {
            this.loading = false;
        }
    }

    getParentFragment() {
        return this.parentFragment;
    }

    getParentId() {
        return this.parentFragment?.id || null;
    }

    hasParent() {
        return !!this.parentFragment;
    }

    reset() {
        this.parentFragment = null;
        this.set(null);
    }
}
