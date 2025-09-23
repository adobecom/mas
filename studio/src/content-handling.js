import { EMPTY_TAGS, TAG_MODEL_ID_MAPPING, TAG_STUDIO_CONTENT_TYPE } from './constants.js';
import Events from './events.js';
import Store from './store.js';
import { isUUID } from './utils.js';

function updateShowingContent() {
    const {
        search,
        filters: { tags },
        pagination,
    } = Store.content;
    const filteredItems = [];
    const newItems = [];
    const searchInAll = !search.value.field || search.value.field === 'all';
    for (const [, itemStore] of Store.content.data.value) {
        if (itemStore.new) {
            newItems.push(itemStore);
            continue;
        }
        const item = itemStore.get();
        /* Search */
        if (search.value.query) {
            if (searchInAll && isUUID(search.value.query)) {
                if (item.id !== search.value.query) continue;
            } else {
                let searchTarget = '';
                if (!searchInAll) {
                    const field = item.fields.find((f) => f.name === search.value.field);
                    if (field) {
                        if (field.multiple) searchTarget = field.values.join(' ');
                        else searchTarget = field.values[0]?.toString() || '';
                    }
                } else {
                    searchTarget = item.fields
                        .map((f) => f.values)
                        .flat()
                        .join(' ');
                }
                if (!searchTarget.toLowerCase().includes(search.value.query.toLowerCase())) continue;
            }
        }
        /* Filters */

        const createdBy = Store.createdByUsers.value.map((user) => user.userPrincipalName);
        if (createdBy.length > 0 && !createdBy.includes(item.created.by)) continue;

        const tagsByType = {};
        const variants = [];
        const statuses = [];
        const contentTypes = [];
        for (const tag of tags.value) {
            if (tag.startsWith('mas:variant/')) {
                variants.push(tag.replace('mas:variant/', ''));
                continue;
            }
            if (tag.startsWith('mas:status/')) {
                statuses.push(tag.replace('mas:status/', ''));
                continue;
            }
            if (tag.startsWith(TAG_STUDIO_CONTENT_TYPE)) {
                contentTypes.push(tag);
                continue;
            }
            for (const key of Object.keys(Store.tags.value)) {
                if (Store.tags.value[key].includes(tag)) {
                    tagsByType[key] ??= [];
                    tagsByType[key].push(tag);
                    break;
                }
            }
        }

        if (variants.length > 0 && !variants.includes(item.getFieldValue('variant'))) continue;
        if (statuses.length > 0 && !statuses.includes(item.status.toLowerCase())) continue;
        if (
            contentTypes.length > 0 &&
            !contentTypes.some((ct) => {
                const contentTypeId = TAG_MODEL_ID_MAPPING[ct];
                return item.model.id === contentTypeId;
            })
        )
            continue;

        let shouldInclude = true;
        for (const tags of Object.values(tagsByType)) {
            if (tags.length === 0) continue;
            let hasATag = false;
            for (const tag of tags) {
                if (item.tags.some((t) => t.id === tag)) {
                    hasATag = true;
                    continue;
                }
            }
            if (!hasATag) {
                shouldInclude = false;
                continue;
            }
        }
        if (!shouldInclude) continue;
        filteredItems.push(itemStore);
    }
    /* Sort - right now only putting the new items at the front */
    const sortedItems = [...newItems, ...filteredItems];

    Store.content.total.set(sortedItems.length);

    const paginatedItems = sortedItems.slice(0, pagination.value.page * pagination.value.size);
    Store.content.displaying.set(paginatedItems);
}

/* Pagination handling */

function resetPage() {
    Store.content.pagination.selectPage(1);
}

Store.content.search.subscribe(resetPage);
Store.content.filters.tags.subscribe(resetPage);
Store.createdByUsers.subscribe(resetPage);

Events.scrolledToBottom.subscribe(() => {
    if (Store.content.total.value === Store.content.displaying.value.length) return;
    Store.content.pagination.nextPage(Store.content.total.value);
});

Store.content.data.subscribe(updateShowingContent);
Store.content.search.subscribe(updateShowingContent);
Store.content.filters.tags.subscribe(updateShowingContent);
Store.content.sort.subscribe(updateShowingContent);
Store.content.pagination.subscribe(updateShowingContent);
Store.createdByUsers.subscribe(updateShowingContent);
Store.tags.subscribe(updateShowingContent);

function clearContent() {
    Store.content.data.clear();
}

Store.surface.subscribe(clearContent);
Store.locale.subscribe(clearContent);
