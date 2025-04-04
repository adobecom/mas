import { DICTIONARY_MODEL_ID } from '../constants.js';
import { MasPlaceholders } from './mas-placeholders.js';

export class MasPlaceholdersIndexManager extends MasPlaceholders {
    constructor() {
        // Don't actually call the parent constructor since we're just using this class for its methods
        // We'll instantiate it from the parent and then bind its methods
        if (new.target === MasPlaceholdersIndexManager) {
            throw new Error('This class should not be instantiated directly');
        }
        // Don't call super() here since we don't want a full LitElement instance
    }

    /**
     * Updates index fragment with a new placeholder entry
     * @param {string} parentPath - Path to the directory containing the index
     * @param {string} fragmentPath - Path to the fragment to add to the index
     * @param {boolean} shouldPublish - Whether to publish the index after updating (defaults to false)
     * @returns {Promise<Object>} - Success status and index info
     */
    async updateIndexFragment(parentPath, fragmentPath, shouldPublish = false) {
        if (!parentPath || !fragmentPath) {
            console.error(
                'Missing parentPath or fragmentPath for updateIndexFragment',
            );
            return false;
        }

        try {
            const repository = this.repository;
            if (!repository) {
                throw new Error('Repository component not found');
            }
            
            const indexPath = `${parentPath}/index`;

            let fragmentToAdd;
            try {
                fragmentToAdd =
                    await repository.aem.sites.cf.fragments.getByPath(
                        fragmentPath,
                    );
                if (!fragmentToAdd || !fragmentToAdd.id) {
                    console.error('Failed to get fragment to add - missing ID');
                    return false;
                }
            } catch (error) {
                console.error('Failed to get fragment by path:', error);
                return false;
            }

            let indexFragment;
            try {
                indexFragment =
                    await repository.aem.sites.cf.fragments.getByPath(
                        indexPath,
                    );
            } catch (error) {
                return await this.createIndexFragment(
                    parentPath,
                    fragmentPath,
                    shouldPublish,
                );
            }

            if (!indexFragment || !indexFragment.id) {
                console.error('Index fragment is invalid');
                return false;
            }

            const freshIndex = await repository.aem.sites.cf.fragments.getById(
                indexFragment.id,
            );
            if (!freshIndex) {
                console.error('Failed to get fresh index by ID');
                return false;
            }

            const entriesField = freshIndex.fields.find(
                (f) => f.name === 'entries',
            );
            const currentEntries = entriesField?.values || [];

            let publishedIndex = null;
            const wasUpdated = !currentEntries.includes(fragmentToAdd.path);

            if (wasUpdated) {
                const updatedEntries = [...currentEntries, fragmentToAdd.path];

                const updatedFields = repository.updateFieldInFragment(
                    freshIndex.fields,
                    'entries',
                    updatedEntries,
                    'content-fragment',
                    true,
                );

                const updatedFragment = {
                    ...freshIndex,
                    fields: updatedFields,
                };

                const savedIndex =
                    await repository.aem.sites.cf.fragments.save(
                        updatedFragment,
                    );

                if (!savedIndex) {
                    console.error('Failed to save index fragment');
                    return false;
                }

                await new Promise((resolve) => setTimeout(resolve, 1000));

                if (shouldPublish) {
                    try {
                        const latestIndex =
                            await repository.aem.sites.cf.fragments.getById(
                                savedIndex.id,
                            );

                        if (latestIndex) {
                            await repository.aem.sites.cf.fragments.publish(
                                latestIndex,
                            );
                            publishedIndex = latestIndex;
                        }
                    } catch (publishError) {
                        console.error(
                            'Failed to publish index with references:',
                            publishError,
                        );
                    }
                }
            } else if (shouldPublish) {
                try {
                    await repository.aem.sites.cf.fragments.publish(freshIndex);
                    publishedIndex = freshIndex;
                } catch (publishError) {
                    console.error(
                        'Failed to publish existing index with references:',
                        publishError,
                    );
                }
            } else {
                console.error(
                    `Fragment ${fragmentToAdd.path} already in entries, no publish needed`,
                );
            }

            return {
                success: true,
                wasUpdated,
                publishedIndex,
                indexPath,
            };
        } catch (error) {
            console.error('Failed to update index fragment:', error);
            return { success: false };
        }
    }

    /**
     * Creates a new index fragment with initial entries
     * @param {string} parentPath - Parent path for the index
     * @param {string} fragmentPath - Initial fragment path to include
     * @param {boolean} shouldPublish - Whether to publish the index after creation
     * @returns {Promise<boolean>} - Success status
     */
    async createIndexFragment(parentPath, fragmentPath, shouldPublish = false) {
        if (!parentPath || !fragmentPath) {
            console.error(
                'Missing parentPath or fragmentPath for createIndexFragment',
            );
            return false;
        }

        try {
            const repository = this.repository;
            if (!repository) {
                throw new Error('Repository component not found');
            }

            let fragmentToAdd;
            try {
                fragmentToAdd =
                    await repository.aem.sites.cf.fragments.getByPath(
                        fragmentPath,
                    );
                if (!fragmentToAdd || !fragmentToAdd.id) {
                    console.error(
                        'Failed to get fragment to add to new index - missing ID',
                    );
                    return false;
                }
            } catch (error) {
                console.error('Failed to get fragment by path:', error);
                return false;
            }

            const indexFragment =
                await repository.aem.sites.cf.fragments.create({
                    parentPath,
                    modelId: DICTIONARY_MODEL_ID,
                    name: 'index',
                    title: 'Dictionary Index',
                    description: 'Index of dictionary placeholders',
                    fields: [
                        {
                            name: 'entries',
                            type: 'content-fragment',
                            multiple: true,
                            values: [fragmentToAdd.path],
                        },
                        {
                            name: 'key',
                            type: 'text',
                            multiple: false,
                            values: ['index'],
                        },
                        {
                            name: 'value',
                            type: 'text',
                            multiple: false,
                            values: ['Dictionary index'],
                        },
                        {
                            name: 'locReady',
                            type: 'boolean',
                            multiple: false,
                            values: [true],
                        },
                    ],
                });

            if (!indexFragment || !indexFragment.id) {
                console.error('Failed to create index fragment');
                return false;
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));

            if (shouldPublish) {
                try {
                    await repository.aem.sites.cf.fragments.publish(
                        indexFragment,
                    );
                } catch (publishError) {
                    console.error(
                        'Failed to publish index with references:',
                        publishError,
                    );
                }
            }

            return true;
        } catch (error) {
            console.error('Failed to create index fragment:', error);
            return false;
        }
    }

    /**
     * Remove placeholder from index fragment
     * @param {string} dictionaryPath - Path to the dictionary
     * @param {Object} placeholderFragment - Fragment to remove 
     * @returns {Promise<boolean>} Success status
     */
    async removeFromIndexFragment(dictionaryPath, placeholderFragment) {
        if (!dictionaryPath || !placeholderFragment?.path) {
            return false;
        }

        try {
            const repository = this.repository;
            if (!repository) {
                return false;
            }

            const indexPath = `${dictionaryPath}/index`;

            let indexFragment;
            try {
                indexFragment =
                    await repository.aem.sites.cf.fragments.getByPath(
                        indexPath,
                    );
            } catch (error) {
                return true;
            }

            if (!indexFragment?.id) {
                return false;
            }

            const freshIndex =
                await repository.aem.sites.cf.fragments.getById(
                    indexFragment.id,
                );
            if (!freshIndex) {
                return false;
            }

            const entriesField = freshIndex.fields.find(
                (f) => f.name === 'entries',
            );
            const currentEntries = entriesField?.values || [];
            const updatedEntries = currentEntries.filter(
                (path) => path !== placeholderFragment.path,
            );

            if (currentEntries.length === updatedEntries.length) {
                return true;
            }

            const updatedFields = repository.updateFieldInFragment(
                freshIndex.fields,
                'entries',
                updatedEntries,
                'content-fragment',
                true,
            );

            const updatedFragment = {
                ...freshIndex,
                fields: updatedFields,
            };

            try {
                const savedIndex =
                    await repository.aem.sites.cf.fragments.save(
                        updatedFragment,
                    );
                if (savedIndex) {
                    try {
                        await repository.aem.sites.cf.fragments.publish(
                            savedIndex,
                        );
                    } catch (publishError) {
                        console.debug(
                            'Failed to publish index, but removal was successful',
                        );
                    }
                    return true;
                }
                return false;
            } catch (error) {
                if (error.message?.includes('412')) {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    const maxRetries = 3;
                    if (!this.indexUpdateRetries) {
                        this.indexUpdateRetries = 1;
                    } else if (this.indexUpdateRetries < maxRetries) {
                        this.indexUpdateRetries++;
                    } else {
                        this.indexUpdateRetries = 0;
                        throw new Error(
                            'Maximum retries reached for index update',
                        );
                    }
                    return await this.removeFromIndexFragment(
                        dictionaryPath,
                        placeholderFragment,
                    );
                }
                throw error;
            }
        } catch (error) {
            console.error('Failed to remove from index fragment:', error);
            return false;
        }
    }
}
