// mas:pricing/individual -> ['pricing', 'individual']
export const parseTagFilter = (tag) => {
    const parts = tag.replace(/^mas:/, '').split('/');
    if (parts.length < 2) return [null, null];
    return [parts[0], parts[parts.length - 1]];
};

// coll-tag-filter/foo placeholder -> "Foo"; else the authored label.
export const tagLabel = (leaf, settings) => {
    const label = settings?.tagLabels?.[leaf] || leaf;
    return label.startsWith('coll-tag-filter')
        ? leaf.charAt(0).toUpperCase() + leaf.slice(1)
        : label;
};

// One sidenav group per tag namespace. Titles/labels come from the tag labels,
// falling back to the tag; a lone namespace keeps the authored title.
export const groupTagFilters = (tagFilters, title, settings) => {
    const byNamespace = new Map();
    for (const tag of tagFilters) {
        const [namespace, leaf] = parseTagFilter(tag);
        if (!namespace || !leaf) continue;
        if (!byNamespace.has(namespace)) byNamespace.set(namespace, []);
        byNamespace
            .get(namespace)
            .push({ name: leaf, label: tagLabel(leaf, settings) });
    }
    const single = byNamespace.size === 1;
    return [...byNamespace.entries()].map(([namespace, checkboxes]) => ({
        title: single && title ? title : tagLabel(namespace, settings),
        label: namespace,
        deeplink: namespace,
        checkboxes,
    }));
};

// A card's tags scoped to the group namespaces, as `ns:leaf` for filtering.
export const cardFilterTags = (tags, namespaces) =>
    (tags ?? [])
        .map(parseTagFilter)
        .filter(([ns, leaf]) => ns && leaf && namespaces.has(ns))
        .map(([ns, leaf]) => `${ns}:${leaf}`);

// A card is kept when, for every group, it carries one of the selected tags
// (or the group has no selection). Groups AND together; options within OR.
export const matchesTagGroups = (cardTags, groups, state) =>
    groups.every((group) => {
        const selected = (state[group.deeplink] || '')
            .split(',')
            .filter(Boolean);
        if (!selected.length) return true;
        return selected.some((value) =>
            cardTags.includes(`${group.deeplink}:${value}`),
        );
    });
