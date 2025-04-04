import Store from '../store.js';
import {
    PAGE_NAMES,
    STATUS_MODIFIED,
    STATUS_PUBLISHED,
    STATUS_DRAFT,
    ROOT_PATH,
} from '../constants.js';
import {
    getFragmentFieldValue,
    getDictionaryPath,
    withLoadingState,
    MasPlaceholders,
} from './mas-placeholders.js';

export class MasPlaceholdersLoader extends MasPlaceholders {
    constructor() {
        // Don't actually call the parent constructor since we're just using this class for its methods
        // We'll instantiate it from the parent and then bind its methods
        if (new.target === MasPlaceholdersLoader) {
            throw new Error('This class should not be instantiated directly');
        }
        // Don't call super() here since we don't want a full LitElement instance
    }

    async connectedCallback() {
        const currentPage = Store.page.get();
        if (currentPage !== PAGE_NAMES.PLACEHOLDERS) {
            Store.page.set(PAGE_NAMES.PLACEHOLDERS);
        }

        const masRepository = this.repository;
        if (!masRepository) {
            this.error = 'Repository component not found';
            return;
        }

        this.selectedFolder = Store.search.get();
        this.selectedLocale = Store.filters.get().locale || 'en_US';
        this.placeholdersData = Store.placeholders?.list?.data?.get() || [];

        Store.placeholders.list.loading.set(true);
        this.loadPlaceholders(true);
    }

    handleFolderChange() {
        Store.placeholders.list.loading.set(true);
        if (this.repository) {
            this.loadPlaceholders();
        } else {
            this.error = 'Repository component not found';
        }
    }

    handleLocaleChange(event) {
        const newLocale = event.detail.locale;

        Store.filters.set((currentValue) => ({
            ...currentValue,
            locale: newLocale,
        }));

        this.selectedLocale = newLocale;
        Store.placeholders.list.loading.set(true);
        this.placeholdersLoading = true;

        if (this.repository) {
            this.loadPlaceholders();
        }
    }

    updated(changedProperties) {
        const currentFolder = Store.search.get();
        const currentLocale = Store.filters.get().locale || 'en_US';
        const currentFolderData = Store.folders?.data?.get() || [];
        const currentFoldersLoaded = Store.folders?.loaded?.get() || false;
        const currentPlaceholdersData =
            Store.placeholders?.list?.data?.get() || [];
        const currentPlaceholdersLoading =
            Store.placeholders?.list?.loading?.get() || false;

        if (
            currentLocale !== this.selectedLocale &&
            currentFolder?.path &&
            !currentPlaceholdersLoading
        ) {
            this.selectedLocale = currentLocale;
            Store.placeholders.list.loading.set(true);
            if (this.repository) {
                this.loadPlaceholders(true);
            }
        }

        if (
            currentFolder?.path !== this.selectedFolder?.path &&
            !currentPlaceholdersLoading
        ) {
            this.selectedFolder = currentFolder;
            this.handleFolderChange();
        }

        this.selectedFolder = currentFolder;
        this.selectedLocale = currentLocale;
        this.folderData = currentFolderData;
        this.foldersLoaded = currentFoldersLoaded;
        this.placeholdersData = currentPlaceholdersData;
        this.placeholdersLoading = currentPlaceholdersLoading;
    }

    /**
     * Load placeholders with selective update
     * Fetches data and updates Store without triggering a full reload
     * @param {boolean} forceCacheBust - Whether to bypass cache
     */
    async loadPlaceholders(forceCacheBust = false) {
        const innerLoadPlaceholders = async (forceCacheBust = false) => {
            try {
                const repository = this.repository;
                if (!repository) {
                    throw new Error('Repository component not found');
                }

                const folderPath = this.selectedFolder.path;
                const locale = this.selectedLocale || 'en_US';
                const dictionaryPath = getDictionaryPath(folderPath, locale);

                const searchOptions = {
                    path: dictionaryPath,
                    sort: [{ on: 'created', order: 'ASC' }],
                };

                const abortController = new AbortController();

                const cursor = await repository.aem.sites.cf.fragments.search(
                    searchOptions,
                    50,
                    abortController,
                );

                const result = await cursor.next();
                if (!result.value || result.value.length === 0) {
                    this.placeholdersData = [];
                    Store.placeholders.list.data.set([]);
                    return;
                }

                let indexFragment = null;
                try {
                    const indexPath = `${dictionaryPath}/index`;
                    indexFragment =
                        await repository.aem.sites.cf.fragments.getByPath(
                            indexPath,
                            {
                                references: 'direct-hydrated',
                            },
                        );
                } catch (error) {
                    console.error('No index fragment found:', error);
                }

                const publishedInIndex = {};

                if (indexFragment && indexFragment.publishedRef) {
                    const entriesField = indexFragment.fields.find(
                        (f) => f.name === 'entries',
                    );

                    if (entriesField && entriesField.values) {
                        entriesField.values.forEach((path) => {
                            publishedInIndex[path] = true;
                        });
                    }
                }

                const placeholders = result.value
                    .filter((item) => !item.path.endsWith('/index'))
                    .map((fragment) => {
                        if (!fragment || !fragment.fields) return null;

                        const key = getFragmentFieldValue(fragment, 'key');
                        const value = getFragmentFieldValue(fragment, 'value');
                        const locReady = getFragmentFieldValue(
                            fragment,
                            'locReady',
                            false,
                        );

                        const isInPublishedIndex =
                            indexFragment?.publishedRef &&
                            publishedInIndex[fragment.path];

                        let statusInfo;
                        if (isInPublishedIndex) {
                            const modifiedTime = fragment.modified?.at
                                ? new Date(fragment.modified.at).getTime()
                                : 0;

                            const indexPublishedTime = indexFragment.published
                                ?.at
                                ? new Date(indexFragment.published.at).getTime()
                                : 0;

                            const modifiedAfterPublished =
                                modifiedTime > indexPublishedTime &&
                                indexPublishedTime > 0;

                            statusInfo = {
                                status: modifiedAfterPublished
                                    ? STATUS_MODIFIED
                                    : STATUS_PUBLISHED,
                                isPublished: true,
                                hasPublishedRef: true,
                                modifiedAfterPublished,
                            };
                        } else {
                            statusInfo = this.detectFragmentStatus(fragment);
                        }

                        const containsHtml = /<\/?[a-z][\s\S]*>/i.test(value);
                        const displayValue = containsHtml
                            ? value.replace(/<[^>]*>/g, '')
                            : value;

                        return {
                            id: fragment.id,
                            key,
                            value,
                            displayValue,
                            isRichText: containsHtml,
                            locale,
                            state: locReady ? 'Ready' : 'Not Ready',
                            status: statusInfo.status,
                            published: statusInfo.isPublished,
                            hasPublishedRef: statusInfo.hasPublishedRef,
                            modifiedAfterPublished:
                                statusInfo.modifiedAfterPublished,
                            publishedTime: fragment.published
                                ? new Date(fragment.published.at).getTime()
                                : isInPublishedIndex && indexFragment.published
                                  ? new Date(
                                        indexFragment.published.at,
                                    ).getTime()
                                  : 0,
                            modifiedTime: fragment.modified
                                ? new Date(fragment.modified.at).getTime()
                                : 0,
                            updatedBy: fragment.modified?.by || 'Unknown',
                            updatedAt: fragment.modified?.at
                                ? new Date(
                                      fragment.modified.at,
                                  ).toLocaleString()
                                : 'Unknown',
                            path: fragment.path,
                            fragment,
                            isInPublishedIndex,
                        };
                    })
                    .filter(Boolean);

                this.placeholdersData = placeholders;
                Store.placeholders.list.data.set(placeholders);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    if (error.message?.includes('404')) {
                        this.placeholdersData = [];
                        Store.placeholders.list.data.set([]);
                        return;
                    }
                    throw error;
                }
            }
        };

        return withLoadingState(innerLoadPlaceholders).call(
            this,
            forceCacheBust,
        );
    }

    detectFragmentStatus(fragment) {
        let status = STATUS_DRAFT;
        let modifiedAfterPublished = false;
        const hasPublishedRef = !!fragment.publishedRef;
        const isPublished = !!fragment.published || hasPublishedRef;

        if (isPublished) {
            status = STATUS_PUBLISHED;

            if (
                fragment.modified &&
                fragment.modified.at &&
                fragment.published &&
                fragment.published.at
            ) {
                const publishedTime = new Date(fragment.published.at).getTime();
                const modifiedTime = new Date(fragment.modified.at).getTime();

                if (modifiedTime > publishedTime) {
                    status = STATUS_MODIFIED;
                    modifiedAfterPublished = true;
                }
            }
        }

        return {
            status,
            modifiedAfterPublished,
            isPublished,
            hasPublishedRef,
        };
    }
}
