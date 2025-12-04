import Events from './events.js';

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
            const currentVersion = {
                id: 'current',
                version: 'Current',
                created: fragment.modified || new Date().toISOString(),
                createdBy: fragment.modifiedBy || 'System',
                isCurrent: true,
            };

            // Load version history
            const versionsResponse = await this.repository.aem.sites.cf.fragments.getVersions(fragmentId);
            const historicalVersions = versionsResponse?.items || [];

            // Combine current version with historical versions
            const versions = [currentVersion, ...historicalVersions];

            return {
                fragment,
                versions,
                currentVersion,
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
            const fieldsArray = denormalizeFields(normalizedFields, currentFragment);

            // Update the current fragment with the version data
            const updatedFragment = {
                ...currentFragment,
                fields: fieldsArray,
            };

            // Save the fragment
            await this.repository.aem.sites.cf.fragments.save(updatedFragment);

            Events.toast.emit({
                variant: 'positive',
                content: `Version ${version.version} restored successfully`,
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
