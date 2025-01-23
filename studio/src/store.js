import { Fragment } from './aem/fragment.js';
import { getEditorPanel } from './editor-panel.js';
import MasFilters from './entities/filters.js';
import MasSearch from './entities/search.js';
import { reactiveStore } from './reactivity/reactive-store.js';
import { WCS_ENV_PROD } from './constants.js';

const params = Object.fromEntries(
    new URLSearchParams(window.location.hash.slice(1)),
);
const initialSearch = MasSearch.fromHash();
const initialFilters = MasFilters.fromHash();

const Store = {
    fragments: {
        list: {
            loading: reactiveStore(true),
            data: reactiveStore([]),
        },
        recentlyUpdated: {
            loading: reactiveStore(true),
            data: reactiveStore([]),
            limit: reactiveStore(6),
        },
        inEdit: reactiveStore(null),
    },
    folders: {
        loaded: reactiveStore(false),
        data: reactiveStore([]),
    },
    locale: {
        current: reactiveStore('en_US'),
        get path() {
            return '/' + Store.locale.current.get();
        },
        data: [
            { code: 'pt_BR', flag: '🇧🇷', name: 'Brazil' },
            { code: 'fr_CA', flag: '🇨🇦', name: 'Canada' },
            { code: 'zh_CN', flag: '🇨🇳', name: 'China' },
            { code: 'cs_CZ', flag: '🇨🇿', name: 'Czech Republic' },
            { code: 'da_DK', flag: '🇩🇰', name: 'Denmark' },
            { code: 'fi_FI', flag: '🇫🇮', name: 'Finland' },
            { code: 'fr_FR', flag: '🇫🇷', name: 'France' },
            { code: 'de_DE', flag: '🇩🇪', name: 'Germany' },
            { code: 'hu_HU', flag: '🇭🇺', name: 'Hungary' },
            { code: 'id_ID', flag: '🇮🇩', name: 'Indonesia' },
            { code: 'it_IT', flag: '🇮🇹', name: 'Italy' },
            { code: 'ja_JP', flag: '🇯🇵', name: 'Japan' },
            { code: 'es_MX', flag: '🇲🇽', name: 'Mexico' },
            { code: 'nl_NL', flag: '🇳🇱', name: 'Netherlands' },
            { code: 'nb_NO', flag: '🇳🇴', name: 'Norway' },
            { code: 'pl_PL', flag: '🇵🇱', name: 'Poland' },
            { code: 'ru_RU', flag: '🇷🇺', name: 'Russia' },
            { code: 'ko_KR', flag: '🇰🇷', name: 'South Korea' },
            { code: 'es_ES', flag: '🇪🇸', name: 'Spain' },
            { code: 'sv_SE', flag: '🇸🇪', name: 'Sweden' },
            { code: 'th_TH', flag: '🇹🇭', name: 'Thailand' },
            { code: 'tr_TR', flag: '🇹🇷', name: 'Türkiye' },
            { code: 'uk_UA', flag: '🇺🇦', name: 'Ukraine' },
            { code: 'en_US', flag: '🇺🇸', name: 'United States' },
            { code: 'vi_VN', flag: '🇻🇳', name: 'Vietnam' },
            { code: 'zh_TW', flag: '🇹🇼', name: 'Taiwan' },
        ],
    },
    search: reactiveStore(initialSearch),
    filters: reactiveStore(initialFilters),
    renderMode: reactiveStore(
        localStorage.getItem('mas-render-mode') || 'render',
    ), // 'render' | 'table'
    selecting: reactiveStore(false),
    selection: reactiveStore([]),
    currentPage: reactiveStore(initialSearch.query ? 'content' : 'splash'), // 'splash' | 'content'
    commerceEnv: reactiveStore(params['commerce.env'] ?? WCS_ENV_PROD),
};

export default Store;

/** Utils */

/**
 * Shortcut for retrieveing the underlying in edit fragment
 * @returns {Fragment}
 */
export function getInEditFragment() {
    return Store.fragments.inEdit.get().get();
}

export function toggleSelection(id) {
    const selection = Store.selection.get();
    if (selection.includes(id))
        Store.selection.set(
            selection.filter((selectedId) => selectedId !== id),
        );
    else Store.selection.set([...selection, id]);
}

export function navigateToPage(value) {
    return function () {
        const editor = getEditorPanel();
        if (editor && !editor.close()) return;
        Store.currentPage.set(value);
    };
}
