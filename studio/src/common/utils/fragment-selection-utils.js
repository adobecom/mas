export function extractSelectionId(item) {
    if (typeof item === 'string') return item;
    if (item?.get?.()?.id) return item.get().id;
    if (item?.id) return item.id;
    return null;
}

export function findFragmentDataById(id, listStores = []) {
    if (!id) return null;

    for (const store of listStores) {
        const fragment = store?.get?.();
        if (!fragment) continue;
        if (fragment.id === id) return fragment;

        const reference = fragment.references?.find((ref) => ref.id === id);
        if (reference) return reference;
    }

    return null;
}

export function findFragmentStoreById(id, listStores = []) {
    if (!id) return null;

    const direct = listStores.find((store) => store?.get?.()?.id === id);
    if (direct) return direct;

    return listStores.find((store) => store?.get?.()?.references?.some((ref) => ref.id === id)) || null;
}

export function resolveFragmentsFromSelection(selection, listStores = []) {
    return selection
        .map((item) => {
            if (item?.get) return item.get();
            if (item?.id && !item.get) return item;

            const id = extractSelectionId(item);
            return id ? findFragmentDataById(id, listStores) : null;
        })
        .filter(Boolean);
}
