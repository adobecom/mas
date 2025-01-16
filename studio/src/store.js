import { Fragment } from './aem/fragment.js';
import { getEditorPanel } from './editor-panel.js';
import { pageModifier } from './modifiers.js';
import { HashLinkedStore } from './reactivity/hash-linked-store.js';
import { ReactiveStore } from './reactivity/reactive-store.js';
import { getHashParam } from './utils.js';

const hasQuery = Boolean(getHashParam('query'));

const Store = {
    fragments: {
        list: {
            loading: new ReactiveStore(true),
            data: new ReactiveStore([]),
        },
        recentlyUpdated: {
            loading: new ReactiveStore(true),
            data: new ReactiveStore([]),
            limit: new ReactiveStore(6),
        },
        inEdit: new ReactiveStore(null),
    },
    folders: {
        loaded: new ReactiveStore(false),
        data: new ReactiveStore([]),
    },
    search: new HashLinkedStore(['path', 'query']),
    filters: new HashLinkedStore([]),
    renderMode: new ReactiveStore(
        localStorage.getItem('mas-render-mode') || 'render',
    ), // 'render' | 'table'
    selecting: new ReactiveStore(false),
    selection: new ReactiveStore([]),
    page: new HashLinkedStore(
        'page',
        hasQuery ? 'content' : 'welcome',
        pageModifier,
    ), // 'welcome' | 'content'
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
        Store.page.set(value);
    };
}
