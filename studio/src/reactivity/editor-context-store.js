import { ReactiveStore } from './reactive-store.js';
import { previewFragmentForEditor } from 'fragment-client';
import Store from '../store.js';

export class EditorContextStore extends ReactiveStore {
    loading = false;
    parentFragment = null;

    constructor(initialValue, validator) {
        super(initialValue, validator);
    }

    async loadFragmentContext(fragmentId) {
        this.loading = true;
        this.parentFragment = null;

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

                const parentId = result.fragmentsIds?.['default-locale-id'];
                if (parentId && parentId !== fragmentId) {
                    const aem = document.querySelector('mas-repository')?.aem;
                    if (aem) {
                        try {
                            this.parentFragment = await aem.sites.cf.fragments.getById(parentId);
                        } catch (err) {
                            console.debug('Parent fragment not found:', parentId);
                        }
                    }
                }
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
