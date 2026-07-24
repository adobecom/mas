import Store from '../store.js';
import { FragmentStore } from '../reactivity/fragment-store.js';
import { Placeholder } from '../aem/placeholder.js';
import { Fragment } from '../aem/fragment.js';
import { getDefaultLocaleCode } from '../../../io/www/src/fragment/locales.js';
import { DEFAULT_CONTEXT, getDictionary } from '../../libs/fragment-client.js';
import {
    DICTIONARY_ENTRY_MODEL_ID,
    DICTIONARY_INDEX_MODEL_ID,
    PAGE_NAMES,
    ROOT_PATH,
    SURFACES,
    TAG_STATUS_DRAFT,
} from '../constants.js';

function getRepository() {
    return document.querySelector('mas-repository');
}

// Singleton placeholder state (one <mas-repository> per app).
const dictionaryCache = new Map();
const inflightDictionaryByKey = new Map();
const previewDictionaryAbortByKey = new Map();
let previewDictionaryLoadingDepth = 0;
let placeholdersAbortController = null;

// --- Pure helpers ---

export function parseDictionaryPath(dictionaryPath) {
    if (!dictionaryPath?.startsWith(ROOT_PATH)) return {};
    const relativePath = dictionaryPath.slice(ROOT_PATH.length).replace(/^\/+/, '');
    const match = relativePath.match(/^(?<surfacePath>.*?)\/(?<locale>[^/]+)\/dictionary$/);
    if (!match) return {};
    const { surfacePath = '', locale } = match.groups;
    const surfaceRoot = surfacePath.split('/').filter(Boolean)[0] ?? '';
    return { locale, surfacePath, surfaceRoot };
}

export function ensureReferenceField(fields, fieldName, value) {
    const field = fields.find((item) => item.name === fieldName);
    const desiredValues = value ? [value] : [];

    if (field) {
        const currentValues = Array.isArray(field.values) ? field.values : [];
        const sameValues =
            currentValues.length === desiredValues.length &&
            currentValues.every((item, index) => item === desiredValues[index]);
        if (sameValues && field.type === 'content-fragment' && field.multiple === false) {
            return { fields, changed: false };
        }
        Object.assign(field, { type: 'content-fragment', multiple: false, locked: false, values: desiredValues });
        return { fields, changed: true };
    }

    fields.push({ name: fieldName, type: 'content-fragment', multiple: false, locked: false, values: desiredValues });
    return { fields, changed: true };
}

export function getParentPath(fragment) {
    const parentPath = fragment.path.substring(0, fragment.path.lastIndexOf('/'));
    if (!parentPath) throw new Error(`Failed to determine dictionary path from fragment path: ${fragment.path}`);
    return parentPath;
}

export function getDictionaryFolderPath(surfacePath, locale) {
    if (!locale) return null;
    const trimmedSurface = surfacePath?.replace(/^\/+|\/+$/g, '') ?? '';
    const prefix = trimmedSurface ? `${ROOT_PATH}/${trimmedSurface}` : ROOT_PATH;
    return `${prefix}/${locale}/dictionary`;
}

// --- AEM helpers ---

export async function fetchIndexFragment(indexPath) {
    try {
        return await getRepository().aem.sites.cf.fragments.getByPath(indexPath);
    } catch (error) {
        const message = error.message?.toLowerCase() ?? '';
        if (message.includes('404') || message.includes('not found')) return null;
        throw error;
    }
}

export async function getIndexFragment(path) {
    try {
        const indexFragment = await getRepository().aem.sites.cf.fragments.getByPath(path);
        return new Fragment(indexFragment);
    } catch {
        return null;
    }
}

export async function ensureDictionaryFolder(dictionaryPath) {
    if (!dictionaryPath) return false;
    const normalized = dictionaryPath.replace(/\/+$/, '');
    if (!normalized) return false;

    const parentPath = normalized.slice(0, normalized.lastIndexOf('/'));
    const folderName = normalized.slice(parentPath.length + 1);
    if (!parentPath || !folderName) return false;

    const repo = getRepository();
    let parentListResult;
    try {
        parentListResult = await repo.aem.folders.list(parentPath);
    } catch (error) {
        console.warn('An error occurred while checking dictionary folder. Placeholder feature may be degraded:', error);
        return false;
    }

    const { children = [] } = parentListResult ?? {};
    const exists = children.some((child) => child.path === normalized || child.name === folderName);
    if (exists) return true;

    try {
        await repo.aem.folders.create(parentPath, folderName, folderName);
        return true;
    } catch (error) {
        if (error.message?.includes('409')) return true;
        console.warn('An error occurred while creating dictionary folder. Placeholder feature may be degraded:', error);
        return false;
    }
}

export async function createDictionaryIndexFragment({ parentPath, parentReference, publish = true }) {
    const repo = getRepository();
    try {
        const fields = [
            {
                name: 'parent',
                type: 'content-fragment',
                multiple: false,
                locked: false,
                values: parentReference ? [parentReference] : [],
            },
            { name: 'entries', type: 'content-fragment', multiple: true, values: [] },
        ];

        const indexFragment = await repo.aem.sites.cf.fragments.create({
            parentPath,
            modelId: DICTIONARY_INDEX_MODEL_ID,
            name: 'index',
            title: 'Dictionary Index',
            description: 'Index of dictionary placeholders',
            fields,
        });

        if (!indexFragment?.id) {
            console.error('Failed to create dictionary index fragment');
            return null;
        }

        if (publish) {
            await repo.publishFragment(indexFragment, [], false);
        }
        return indexFragment;
    } catch (error) {
        console.error('Failed to create dictionary index fragment:', error);
        return null;
    }
}

export async function ensureIndexFallbackFields(indexFragment, parentReference) {
    if (!indexFragment || !parentReference) return indexFragment;

    const fields = [...(indexFragment.fields ?? [])];
    const result = ensureReferenceField(fields, 'parent', parentReference);

    if (!result.changed) return indexFragment;

    try {
        const saved = await getRepository().aem.sites.cf.fragments.save({ ...indexFragment, fields });
        return saved ?? indexFragment;
    } catch (error) {
        console.error('Failed to save dictionary index fallback fields:', error);
        return indexFragment;
    }
}

export async function ensureDictionaryIndex(dictionaryPath, visited = new Set()) {
    if (!dictionaryPath) return null;
    if (visited.has(dictionaryPath)) {
        try {
            return await fetchIndexFragment(`${dictionaryPath}/index`);
        } catch (error) {
            console.error(`Failed to fetch already visited dictionary index for ${dictionaryPath}:`, error);
            return null;
        }
    }
    visited.add(dictionaryPath);

    const { locale, surfacePath, surfaceRoot } = parseDictionaryPath(dictionaryPath);
    if (!locale || !surfacePath) return null;

    const indexPath = `${dictionaryPath}/index`;
    let indexFragment = await fetchIndexFragment(indexPath);
    const currentParent = indexFragment?.fields?.find((f) => f.name === 'parent')?.values?.[0] ?? null;

    let parentReference = null;
    const fallbackLocale = getDefaultLocaleCode(surfaceRoot, locale);
    const surfaceFallbackLocale = fallbackLocale && fallbackLocale !== locale ? fallbackLocale : null;
    const acomFallbackLocale = fallbackLocale ?? locale;

    const sameSurfaceDictionaryPath = surfaceFallbackLocale
        ? getDictionaryFolderPath(surfacePath, surfaceFallbackLocale)
        : null;

    if (sameSurfaceDictionaryPath) {
        try {
            const sameSurfaceIndex = await ensureDictionaryIndex(sameSurfaceDictionaryPath, visited);
            if (sameSurfaceIndex?.path) parentReference = sameSurfaceIndex.path;
        } catch (error) {
            console.error(`Failed to ensure same-surface fallback index for ${sameSurfaceDictionaryPath}:`, error);
        }
    }

    if (!parentReference && surfaceRoot !== SURFACES.ACOM.name && acomFallbackLocale) {
        const acomFallbackPath = getDictionaryFolderPath(SURFACES.ACOM.name, acomFallbackLocale);
        if (acomFallbackPath) {
            try {
                const acomIndex = await ensureDictionaryIndex(acomFallbackPath, visited);
                if (acomIndex?.path) parentReference = acomIndex.path;
            } catch (error) {
                console.error(`Failed to ensure ACOM fallback index for ${acomFallbackPath}:`, error);
            }
        }
    }

    if (!indexFragment) {
        const hasDictionaryFolder = await ensureDictionaryFolder(dictionaryPath);
        if (!hasDictionaryFolder) {
            console.error(`Failed to ensure dictionary folder exists: ${dictionaryPath}`);
            return null;
        }
        indexFragment = await createDictionaryIndexFragment({ parentPath: dictionaryPath, parentReference });
        if (!indexFragment) return null;
    } else if (parentReference && currentParent !== parentReference) {
        indexFragment = await ensureIndexFallbackFields(indexFragment, parentReference);
    }

    return indexFragment;
}

// --- Public API ---

export async function addToIndexFragment(fragment) {
    const repo = getRepository();
    const parentPath = getParentPath(fragment);
    const indexPath = `${parentPath}/index`;
    const indexFragment = await getIndexFragment(indexPath);
    if (!indexFragment) {
        console.error(`Index fragment does not exist at ${indexPath}.`);
        return false;
    }

    try {
        const entriesField = indexFragment.getField('entries');
        if (!entriesField) {
            console.error(`Index fragment at ${indexPath} is missing entries field`);
            return false;
        }

        const shouldUpdate = !entriesField.values.includes(fragment.path);
        let updatedIndexFragment = indexFragment;
        if (shouldUpdate) {
            indexFragment.updateField('entries', [...entriesField.values, fragment.path]);
            updatedIndexFragment = await repo.aem.sites.cf.fragments.save(indexFragment);
        } else {
            console.info(`Fragment already added to index: ${fragment.path}`);
        }

        await repo.publishFragment(updatedIndexFragment, [], false);
        return true;
    } catch (error) {
        repo.processError(error, 'Failed to add fragment to index.');
        return false;
    }
}

export async function removeFromIndexFragment(fragments) {
    const repo = getRepository();
    const fragmentsToRemove = !Array.isArray(fragments) ? [fragments] : fragments;
    const parentPath = getParentPath(fragmentsToRemove[0]);
    const indexPath = `${parentPath}/index`;
    const indexFragment = await getIndexFragment(indexPath);
    if (!indexFragment) return false;

    try {
        const entries = indexFragment.getField('entries');
        let shouldUpdate = false;
        for (const fragment of fragmentsToRemove) {
            if (entries.values.includes(fragment.path)) {
                shouldUpdate = true;
                break;
            }
        }

        let updatedIndexFragment = indexFragment;
        if (shouldUpdate) {
            const fragmentPaths = fragmentsToRemove.map((fragment) => fragment.path);
            indexFragment.updateField(
                'entries',
                entries.values.filter((entry) => !fragmentPaths.includes(entry)),
            );
            updatedIndexFragment = await repo.aem.sites.cf.fragments.save(indexFragment);
        } else {
            console.info('Fragment(s) already added to index.');
        }

        await repo.publishFragment(updatedIndexFragment, [], false);
        return true;
    } catch (error) {
        repo.processError(error, 'Failed to add fragment(s) to index.');
        return false;
    }
}

export async function createPlaceholder(placeholder) {
    const repo = getRepository();
    try {
        const folderPath = repo.search.value.path;
        const locale = repo.filters.value.locale;
        if (!folderPath || !locale) return false;

        const dictionaryPath = repo.getDictionaryPath();

        const typeMap = { richTextValue: 'long-text', locReady: 'boolean' };
        const fields = {
            key: placeholder.key,
            value: placeholder.isRichText ? '' : placeholder.value,
            richTextValue: placeholder.isRichText ? placeholder.value : '',
            locReady: true,
        };

        const payload = {
            name: placeholder.key,
            parentPath: dictionaryPath,
            modelId: DICTIONARY_ENTRY_MODEL_ID,
            title: placeholder.key,
            description: `Placeholder for ${placeholder.key}`,
            fields: Object.keys(fields).map((key) => ({
                name: key,
                type: typeMap[key] || 'text',
                values: [fields[key]],
            })),
        };

        const fragment = await repo.createFragment(payload, false);
        const newPlaceholder = new Placeholder(fragment);
        newPlaceholder.updateField('tags', [TAG_STATUS_DRAFT]);
        await repo.aem.saveTags(newPlaceholder);

        const addedToIndex = await addToIndexFragment(newPlaceholder);
        if (!addedToIndex) throw new Error('Failed to update index fragment with new placeholder reference');

        Store.placeholders.list.data.set((prev) => [...prev, new FragmentStore(newPlaceholder)]);
        return true;
    } catch (error) {
        repo.processError(error, 'Failed to create placeholder.');
        return false;
    }
}

export async function publishPlaceholder(placeholder) {
    const repo = getRepository();
    if (!(await repo.publishFragment(placeholder))) return false;

    const parentPath = getParentPath(placeholder);
    const indexPath = `${parentPath}/index`;
    const indexFragment = await getIndexFragment(indexPath);
    if (!indexFragment) {
        const errorMessage = `Could not load placeholders index at ${indexPath}`;
        repo.processError(new Error(errorMessage), `${errorMessage}, please report to administrator.`);
        return false;
    }

    return repo.publishFragment(indexFragment, [], false);
}

export function clearDictionaryCache() {
    dictionaryCache.clear();
    Store.placeholders.previewByLocale.set({});
}

export async function loadPlaceholders() {
    const repo = getRepository();
    try {
        const dictionaryPath = repo.getDictionaryPath();
        if (!dictionaryPath) return;
        try {
            await ensureDictionaryIndex(dictionaryPath);
        } catch (error) {
            console.error('Failed to ensure dictionary index:', error);
        }

        const searchOptions = {
            path: dictionaryPath,
            sort: [{ on: 'created', order: 'ASC' }],
        };

        if (placeholdersAbortController) placeholdersAbortController.abort();
        placeholdersAbortController = new AbortController();

        Store.placeholders.list.loading.set(true);

        const fragments = await repo.searchFragmentList(searchOptions, 50, placeholdersAbortController);

        const indexFragment = fragments.find((fragment) => fragment.path.endsWith('/index'));
        if (indexFragment) Store.placeholders.index.set(indexFragment);
        else console.warn('No index fragment found for dictionary path:', dictionaryPath);

        const placeholders = fragments
            .filter((fragment) => !fragment.path.endsWith('/index'))
            .map((fragment) => new FragmentStore(new Placeholder(fragment)));

        Store.placeholders.list.data.set(placeholders);
    } catch (error) {
        repo.processError(error, 'Could not load placeholders.');
    } finally {
        Store.placeholders.list.loading.set(false);
    }
}

export function getDictionaryPath() {
    const repo = getRepository();
    const surfaceKey =
        repo.page.value === PAGE_NAMES.PROMOTIONS_EDITOR ? Store.promotions.itemPickerSurface.get() || null : Store.surface();
    if (!surfaceKey) return null;
    return `${ROOT_PATH}/${surfaceKey}/${Store.localeOrRegion()}/dictionary`;
}

export async function fetchDictionary(abortController, locale = Store.localeOrRegion()) {
    const repo = getRepository();
    const context = {
        ...DEFAULT_CONTEXT,
        locale,
        surface: repo.search.value.path,
    };
    if (abortController) context.signal = abortController.signal;
    return getDictionary(context);
}

/**
 * Loads preview dictionary for `locale` (defaults to surface locale) into `Store.placeholders.previewByLocale`.
 * Safe to call in parallel for different locales; duplicate cache keys share one in-flight request.
 * @param {string} [locale]
 */
export async function loadPreviewPlaceholders(locale = Store.localeOrRegion()) {
    const repo = getRepository();
    if (!repo.search.value.path) return;

    const path = repo.search.value.path;
    const cacheKey = `${locale}_${path}`;

    if (dictionaryCache.has(cacheKey)) {
        const cached = dictionaryCache.get(cacheKey);
        Store.placeholders.previewByLocale.set((prev) => ({ ...prev, [locale]: cached }));
        return;
    }

    if (inflightDictionaryByKey.has(cacheKey)) {
        return inflightDictionaryByKey.get(cacheKey);
    }

    const previousAbort = previewDictionaryAbortByKey.get(cacheKey);
    previousAbort?.abort();
    const abortController = new AbortController();
    previewDictionaryAbortByKey.set(cacheKey, abortController);

    const promise = (async () => {
        previewDictionaryLoadingDepth += 1;
        if (previewDictionaryLoadingDepth === 1) {
            Store.placeholders.list.loading.set(true);
        }
        try {
            const result = await repo.fetchDictionary(abortController, locale);

            if (repo.search.value.path !== path) return;

            const mergeDict = (dict) => {
                dictionaryCache.set(cacheKey, dict);
                Store.placeholders.previewByLocale.set((prev) => ({ ...prev, [locale]: dict }));
            };

            if ((!result || Object.keys(result).length === 0) && locale !== 'en_US') {
                const fallbackResult = await repo.fetchDictionary(abortController, 'en_US');
                if (repo.search.value.path !== path) return;
                mergeDict(fallbackResult);
            } else {
                mergeDict(result);
            }
        } catch (error) {
            if (error.name === 'AbortError') return;
            repo.processError(error, 'Could not load preview placeholders.');
        } finally {
            inflightDictionaryByKey.delete(cacheKey);
            previewDictionaryAbortByKey.delete(cacheKey);
            previewDictionaryLoadingDepth -= 1;
            if (previewDictionaryLoadingDepth === 0) {
                Store.placeholders.list.loading.set(false);
            }
        }
    })();

    inflightDictionaryByKey.set(cacheKey, promise);
    return promise;
}
