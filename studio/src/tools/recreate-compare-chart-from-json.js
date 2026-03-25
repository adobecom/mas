const CARD_MODEL_PATH = '/conf/mas/settings/dam/cfm/models/card';
const COLLECTION_MODEL_PATH = '/conf/mas/settings/dam/cfm/models/collection';

const clone = (value) => JSON.parse(JSON.stringify(value));

const getFragmentNameFromPath = (path = '') =>
    path.split('/').filter(Boolean).pop() || '';

const getParentPathFromPath = (path = '') => {
    if (!path) return '';
    const parts = path.split('/').filter(Boolean);
    if (parts.length <= 1) return '';
    return `/${parts.slice(0, -1).join('/')}`;
};

const getField = (fields = [], name) => fields.find((field) => field?.name === name) || null;

const getFieldValues = (fields = [], name) => getField(fields, name)?.values || [];

const sanitizeField = (field) => {
    const sanitized = {
        name: field.name,
        type: field.type || 'text',
        multiple: Boolean(field.multiple),
        values: clone(field.values || []),
    };
    if (field.mimeType) sanitized.mimeType = field.mimeType;
    return sanitized;
};

export const dedupeReferencesByPath = (references = []) => {
    const seen = new Set();
    return references.filter((reference) => {
        const path = reference?.path;
        if (!path || seen.has(path)) return false;
        seen.add(path);
        return true;
    });
};

export const getOrderedCardFragments = (fragmentData) => {
    const cardPaths = getFieldValues(fragmentData?.fields, 'cards').map(String);
    const referencesByPath = new Map(
        dedupeReferencesByPath(fragmentData?.references).map((reference) => [
            reference.path,
            reference,
        ]),
    );

    return cardPaths.map((path) => {
        const reference = referencesByPath.get(path);
        if (!reference) {
            throw new Error(`Missing referenced card for path: ${path}`);
        }
        if (reference.model?.path !== CARD_MODEL_PATH) {
            throw new Error(
                `Expected card model for ${path}, got ${reference.model?.path || 'unknown'}`,
            );
        }
        return reference;
    });
};

export const rewriteCompareChartCardPaths = (compareChartHtml = '', pathMap = new Map()) => {
    if (!compareChartHtml) return compareChartHtml;
    const doc = new DOMParser().parseFromString(compareChartHtml, 'text/html');
    doc.querySelectorAll('.compare-chart-cell[data-card-path]').forEach((cell) => {
        const oldPath = cell.getAttribute('data-card-path');
        const newPath = pathMap.get(oldPath);
        if (newPath) cell.setAttribute('data-card-path', newPath);
    });
    return doc.body.innerHTML;
};

export const buildCreatePayload = (fragmentData, { fields } = {}) => ({
    title: fragmentData.title,
    name: fragmentData.name || getFragmentNameFromPath(fragmentData.path),
    description: fragmentData.description || '',
    modelId: fragmentData.model?.id,
    parentPath: getParentPathFromPath(fragmentData.path),
    fields: (fields ?? fragmentData.fields ?? []).map(sanitizeField),
});

export const buildCollectionShellPayload = (fragmentData) => {
    const fields = (fragmentData.fields || [])
        .filter((field) => !['cards', 'compareChart'].includes(field.name))
        .map(sanitizeField);

    return buildCreatePayload(fragmentData, { fields });
};

export const buildCollectionSavePayload = (
    createdCollection,
    sourceCollection,
    pathMap,
) => {
    const fields = (sourceCollection.fields || []).map((field) => {
        const sanitized = sanitizeField(field);
        if (field.name === 'cards') {
            sanitized.values = sanitized.values.map((value) => pathMap.get(value) || value);
        }
        if (field.name === 'compareChart') {
            sanitized.values = sanitized.values.map((value) =>
                rewriteCompareChartCardPaths(value, pathMap),
            );
        }
        return sanitized;
    });

    return {
        id: createdCollection.id,
        title: sourceCollection.title,
        description: sourceCollection.description || '',
        fields,
    };
};

export const buildRecreationPlan = (fragmentData) => {
    if (fragmentData?.model?.path !== COLLECTION_MODEL_PATH) {
        throw new Error(
            `Expected collection model, got ${fragmentData?.model?.path || 'unknown'}`,
        );
    }

    const cards = getOrderedCardFragments(fragmentData);
    return {
        cards,
        cardTargetPaths: cards.map((card) => card.path),
        collectionTargetPath: fragmentData.path,
        collectionShellPayload: buildCollectionShellPayload(fragmentData),
    };
};

const getRepository = (repositoryOrSelector = 'mas-repository') => {
    if (typeof repositoryOrSelector !== 'string') return repositoryOrSelector;
    return document.querySelector(repositoryOrSelector);
};

const getAem = (repositoryOrSelector) => {
    const repository = getRepository(repositoryOrSelector);
    if (!repository?.aem) {
        throw new Error(
            'mas-repository.aem is not ready. Run this from a loaded Studio page.',
        );
    }
    return repository.aem;
};

const saveTagsIfNeeded = async (aem, fragment, tags = []) => {
    if (!tags.length) return fragment;
    fragment.newTags = tags;
    await aem.saveTags(fragment);
    return aem.sites.cf.fragments.getById(fragment.id);
};

const checkExistingPath = async (aem, path) =>
    aem.sites.cf.fragments.getByPath(path).catch(() => null);

const createCardFragment = async (aem, cardFragment) => {
    const payload = buildCreatePayload(cardFragment);
    const created = await aem.sites.cf.fragments.create(payload);
    return saveTagsIfNeeded(aem, created, cardFragment.tags || []);
};

export async function recreateCompareChartFromJson({
    fragmentData,
    fragmentUrl = '/fragment.json',
    repository = 'mas-repository',
    dryRun = true,
    log = console,
} = {}) {
    const aem = getAem(repository);
    const sourceFragment =
        fragmentData ||
        (await fetch(fragmentUrl).then(async (response) => {
            if (!response.ok) {
                throw new Error(
                    `Failed to load ${fragmentUrl}: ${response.status} ${response.statusText}`,
                );
            }
            return response.json();
        }));

    const plan = buildRecreationPlan(sourceFragment);
    const targetPaths = [...plan.cardTargetPaths, plan.collectionTargetPath];
    const existing = (
        await Promise.all(
            targetPaths.map(async (path) => ({
                path,
                fragment: await checkExistingPath(aem, path),
            })),
        )
    ).filter(({ fragment }) => fragment);

    if (existing.length) {
        throw new Error(
            `Target fragment path(s) already exist: ${existing.map(({ path }) => path).join(', ')}`,
        );
    }

    const summary = {
        dryRun,
        cardCount: plan.cards.length,
        collectionPath: plan.collectionTargetPath,
        cardPaths: plan.cardTargetPaths,
    };

    if (dryRun) {
        log.info('[compare-chart-import] dry run', summary);
        return summary;
    }

    const pathMap = new Map();
    const createdCards = [];

    for (const cardFragment of plan.cards) {
        const createdCard = await createCardFragment(aem, cardFragment);
        pathMap.set(cardFragment.path, createdCard.path);
        createdCards.push({
            sourcePath: cardFragment.path,
            id: createdCard.id,
            path: createdCard.path,
            title: createdCard.title,
        });
    }

    const createdCollection = await aem.sites.cf.fragments.create(
        plan.collectionShellPayload,
    );
    const savedCollection = await aem.sites.cf.fragments.save(
        buildCollectionSavePayload(createdCollection, sourceFragment, pathMap),
    );
    const finalCollection = await saveTagsIfNeeded(
        aem,
        savedCollection,
        sourceFragment.tags || [],
    );

    const result = {
        dryRun: false,
        cards: createdCards,
        collection: {
            id: finalCollection.id,
            path: finalCollection.path,
            title: finalCollection.title,
        },
        pathMap: Object.fromEntries(pathMap),
    };

    log.info('[compare-chart-import] completed', result);
    return result;
}

export async function dryRunCompareChartRecreation(options = {}) {
    return recreateCompareChartFromJson({ ...options, dryRun: true });
}

export async function executeCompareChartRecreation(options = {}) {
    return recreateCompareChartFromJson({ ...options, dryRun: false });
}
