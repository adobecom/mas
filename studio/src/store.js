import MasFilters from './entities/filters.js';
import MasSearch from './entities/search.js';
import { reactiveStore } from './reactiveStore/reactiveStore.js';

const Store = {
    fragments: {
        loading: reactiveStore(true),
        data: reactiveStore([]),
        inEdit: reactiveStore(null),
    },
    folders: {
        loaded: reactiveStore(false),
        data: reactiveStore([]),
    },
    filters: reactiveStore(MasFilters.fromHash()),
    search: reactiveStore(MasSearch.fromHash()),
    renderMode: reactiveStore(
        localStorage.getItem('mas-render-mode') || 'render',
    ), // 'render' | 'table'
    selecting: reactiveStore(false),
    selection: reactiveStore([]),
};

export default Store;
