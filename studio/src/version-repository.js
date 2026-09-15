import Events from './events.js';

// AEM's asynchronous publish/unpublish workflow records this technical account as the
// actor for the version it creates, masking whoever actually triggered the action.
export const SYSTEM_ACTORS = new Set(['workflow-process-service']);

function actorOf(entry) {
    return entry?.createdBy || entry?.created?.by || null;
}

function isHumanActor(actor) {
    return Boolean(actor) && !SYSTEM_ACTORS.has(actor);
}

/**
 * Resolve the actor to display for the version at `index`, preferring a human actor.
 * Falls back to the nearest more-recent-to-oldest entry with a human actor (e.g. a
 * version recorded under the initiating user's own session, see AEM.publishFragment)
 * so a system account never masks the real person who triggered the action.
 * @param {Array} entries - Versions ordered from most recent to oldest
 * @param {number} index - Index of the entry to resolve within `entries`
 * @returns {string} The resolved actor, or 'System' when only a system actor is known
 */
export function resolveVersionActor(entries, index) {
    for (let i = index; i < entries.length; i++) {
        const actor = actorOf(entries[i]);
        if (isHumanActor(actor)) return actor;
    }
    return 'System';
}

/**
 * Repository for version-related data operations.
 * Handles loading, saving, and restoring fragment versions.
 */
export class VersionRepository {
    constructor(repository) {
        this.repository = repository;
    }

    /**
     * Load version history for a fragment
     * @param {string} fragmentId - The fragment ID
     * @returns {Promise<{fragment: Object, versions: Array, currentVersion: Object}>}
     */
    async loadVersionHistory(fragmentId) {
        try {
            // Load the current fragment
            const fragment = await this.repository.aem.sites.cf.fragments.getById(fragmentId);

            // Create a "current version" from the live fragment
            // Handle different formats of modified date (could be string, object with 'at' property, or undefined)
            let modifiedDate;
            if (fragment.modified) {
                if (typeof fragment.modified === 'object' && fragment.modified.at) {
                    modifiedDate = fragment.modified.at;
                } else if (typeof fragment.modified === 'string') {
                    modifiedDate = fragment.modified;
                } else {
                    modifiedDate = new Date().toISOString();
                }
            } else {
                modifiedDate = new Date().toISOString();
            }

            const currentVersion = {
                id: 'current',
                version: 'Current',
                created: modifiedDate,
                createdBy: fragment.modifiedBy || fragment.modified?.by || null,
                isCurrent: true,
            };

            // Load version history
            const versionsResponse = await this.repository.aem.sites.cf.fragments.getVersions(fragmentId);
            const historicalVersions = versionsResponse?.items || [];

            // Combine current version with historical versions, then resolve each entry's
            // actor so a system account (e.g. the async publish workflow) never masks the
            // real person who triggered the action.
            const rawVersions = [currentVersion, ...historicalVersions];
            const versions = rawVersions.map((version, index) => ({
                ...version,
                createdBy: resolveVersionActor(rawVersions, index),
            }));

            return {
                fragment,
                versions,
                currentVersion: versions[0],
            };
        } catch (error) {
            console.error('Failed to load version history:', error);
            throw error;
        }
    }

    /**
     * Load data for a specific version
     * @param {string} fragmentId - The fragment ID
     * @param {string} versionId - The version ID
     * @returns {Promise<Object>} Version data
     */
    async loadVersionData(fragmentId, versionId) {
        try {
            const versionData = await this.repository.aem.sites.cf.fragments.getVersion(fragmentId, versionId);
            return versionData;
        } catch (error) {
            console.error('Failed to load version data:', error);
            throw error;
        }
    }

    /**
     * Restore a fragment to a specific version
     * @param {Object} version - The version to restore
     * @param {Object} currentFragment - The current fragment
     * @param {Function} normalizeFields - Function to normalize fields
     * @param {Function} denormalizeFields - Function to denormalize fields
     * @returns {Promise<void>}
     */
    async restoreVersion(version, currentFragment, normalizeFields, denormalizeFields) {
        try {
            // Load the version data if not already loaded
            const versionData = await this.loadVersionData(currentFragment.id, version.id);

            // Normalize the version fields
            const normalizedFields = normalizeFields(versionData);

            // Convert back to AEM array format for saving
            let fieldsArray = denormalizeFields(normalizedFields, currentFragment);

            // Preserve the current fragment's variations field so restored versions don't wipe locale variation.
            const currentVariationsField = currentFragment.fields?.find((f) => f.name === 'variations');
            if (currentVariationsField) {
                const withoutVariations = fieldsArray.filter((f) => f.name !== 'variations');
                fieldsArray = [
                    ...withoutVariations,
                    { ...currentVariationsField, values: currentVariationsField.values || [] },
                ];
            }

            // Extract fragment title and description from normalized fields
            const { fragmentTitle, fragmentDescription } = normalizedFields;

            // Update the current fragment with the version data
            const updatedFragment = {
                ...currentFragment,
                fields: fieldsArray,
                // Restore title and description if they exist in the version
                ...(fragmentTitle !== undefined && { title: fragmentTitle }),
                ...(fragmentDescription !== undefined && { description: fragmentDescription }),
            };

            // Save the fragment
            await this.repository.aem.sites.cf.fragments.save(updatedFragment);

            Events.toast.emit({
                variant: 'positive',
                content: `Version ${version.title} restored successfully`,
            });
        } catch (error) {
            console.error('Failed to restore version:', error);
            Events.toast.emit({
                variant: 'negative',
                content: `Failed to restore version: ${error.message}`,
            });
            throw error;
        }
    }

    /**
     * Search versions by query
     * @param {Array} versions - Array of versions to search
     * @param {string} query - Search query
     * @returns {Array} Filtered versions
     */
    searchVersions(versions, query) {
        if (!query) return versions;

        const lowerQuery = query.toLowerCase();
        return versions.filter((version) => {
            return (
                version.version?.toLowerCase().includes(lowerQuery) ||
                version.createdBy?.toLowerCase().includes(lowerQuery) ||
                version.created?.toLowerCase().includes(lowerQuery) ||
                version.comment?.toLowerCase().includes(lowerQuery)
            );
        });
    }
}
