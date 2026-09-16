// mas:pricing/individual -> ['pricing', 'individual']
export const parseTagFilter = (tag) => {
    const parts = tag.replace(/^mas:/, '').split('/');
    if (parts.length < 2) return [null, null];
    return [parts[0], parts[parts.length - 1]];
};

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
