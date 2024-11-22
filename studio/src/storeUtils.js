import Store from './store.js';
import { ReactiveStore } from './reactiveStore/reactiveStore.js';

export function getFragmentStore(id) {
    const fragments = Store.fragments.data.get();
    const fragmentStore = fragments.find((f) => f.get().id === id);
    return fragmentStore || null;
}

export function toggleSelection(id) {
    const selection = Store.selection.get();
    if (selection.includes(id))
        Store.selection.set(
            selection.filter((selectedId) => selectedId !== id),
        );
    else Store.selection.set([...selection, id]);
}

export function updateStore(path) {
    return function (value) {
        let target = Store;
        let lastStore = null;
        const segments = path.split('.');
        for (const segment of segments) {
            if (target instanceof ReactiveStore) {
                lastStore = target;
                target = target.get();
            }
            target = target[segment];
        }
        if (target instanceof ReactiveStore) {
            target.set(value);
        } else {
            lastStore.update((prev) => ({ ...prev, [segments.at(-1)]: value }));
        }
    };
}
