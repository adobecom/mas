import Store from '../store.js';
import { createFragmentDataForAEM } from '../utils/ai-card-mapper.js';
import { extractTitleText } from '../utils.js';
import { getDamPath } from '../mas-repository.js';

function getRepository() {
    const repository = document.querySelector('mas-repository');
    if (!repository) throw new Error('Repository not found');
    return repository;
}

function getParentPath() {
    return `${getDamPath(Store.search.value.path)}/${Store.filters.value.locale || 'en_US'}`;
}

function generateUniqueFragmentName(title) {
    const baseName = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return `${baseName}-${Date.now()}`;
}

export async function saveDraftToAEM(cardConfig) {
    const repository = getRepository();
    const title = extractTitleText(cardConfig.title, 'AI Generated Card');
    const uniqueName = generateUniqueFragmentName(title);
    const fragmentData = createFragmentDataForAEM(cardConfig, cardConfig.variant, {
        title,
        name: uniqueName,
        parentPath: getParentPath(),
    });

    const newFragment = await repository.aem.sites.cf.fragments.create(fragmentData);

    const AemFragmentElement = customElements.get('aem-fragment');
    if (AemFragmentElement && newFragment) {
        AemFragmentElement.cache.add(newFragment);
    }

    return newFragment;
}

export async function saveToAEM(cardConfig) {
    const repository = getRepository();
    const title = extractTitleText(cardConfig.title, 'AI Generated Card');
    const fragmentData = createFragmentDataForAEM(cardConfig, cardConfig.variant, {
        title,
        parentPath: getParentPath(),
    });

    return repository.aem.sites.cf.fragments.create(fragmentData);
}

export async function publishDraft(fragmentId) {
    const repository = getRepository();
    const fragment = await repository.aem.sites.cf.fragments.getById(fragmentId);
    await repository.aem.sites.cf.fragments.publishFragment(fragment);
    return fragment;
}

export async function deleteDraft(fragmentId) {
    const repository = getRepository();
    const fragment = await repository.aem.sites.cf.fragments.getById(fragmentId);
    await repository.aem.sites.cf.fragments.delete(fragment);
    return fragment;
}

export async function saveCollectionToAEM(collectionConfig) {
    const repository = getRepository();
    const parentPath = getParentPath();
    const collectionTitle = collectionConfig.title || 'AI Generated Collection';

    const savedCards = [];
    for (const [index, cardConfig] of collectionConfig.cards.entries()) {
        const cardTitle = `${collectionTitle} - Card ${index + 1}`;
        const fragmentData = createFragmentDataForAEM(cardConfig, cardConfig.variant, {
            title: cardTitle,
            parentPath,
        });

        const newFragment = await repository.aem.sites.cf.fragments.create(fragmentData);
        savedCards.push(newFragment);
    }

    return savedCards;
}
