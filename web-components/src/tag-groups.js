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

// Author JSON -> sidenav groups (title, deeplink, single, checkboxes).
export const normalizeCheckboxGroups = (checkboxGroups, settings) => {
    const groups = Array.isArray(checkboxGroups)
        ? checkboxGroups
        : JSON.parse(checkboxGroups);
    return groups.map((group) => {
        const tags = group.tags ?? [];
        const deeplink =
            group.deeplink ?? parseTagFilter(tags[0] ?? '')[0] ?? group.label;
        const checkboxes =
            group.checkboxes ??
            tags.map((tag) => {
                const leaf = parseTagFilter(tag)[1] ?? tag;
                return { name: leaf, label: tagLabel(leaf, settings) };
            });
        return {
            title: group.title,
            label: deeplink,
            deeplink,
            single: !!group.single,
            checkboxes,
        };
    });
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
