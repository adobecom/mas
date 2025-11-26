import { ReactiveStore } from './reactive-store.js';
import { previewFragmentWithContext } from 'fragment-client';
import Store from '../store.js';

export class EditorContextStore extends ReactiveStore {
    fragmentsIds = {};
    loading = false;

    constructor(initialValue, validator) {
        super(initialValue, validator);
    }

    async loadFragmentContext(fragmentId) {
        this.loading = true;
        try {
            const options = {
                locale: Store.filters.value.locale,
                surface: Store.search.value.path,
            };
            const result = await previewFragmentWithContext(fragmentId, options);
            if (result.status === 200) {
                this.fragmentsIds = result.fragmentsIds || {};
                this.set(result.body);
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
