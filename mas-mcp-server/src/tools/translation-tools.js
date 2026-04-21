import {
    TRANSLATION_PROJECT_MODEL_ID,
    TRANSLATIONS_ALLOWED_SURFACES,
    LOCALE_DEFAULTS,
    SURFACE_PATHS,
    ROOT_PATH,
} from '../config/constants.js';

const CARD_MODEL_ID = 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ';

export class TranslationTools {
    constructor(aemClient, urlBuilder) {
        this.aemClient = aemClient;
        this.urlBuilder = urlBuilder;
    }

    async listTranslationProjects(params) {
        const { surface, query, limit = 20 } = params;

        if (!TRANSLATIONS_ALLOWED_SURFACES.includes(surface)) {
            throw new Error(
                `Surface "${surface}" does not support translations. Allowed: ${TRANSLATIONS_ALLOWED_SURFACES.join(', ')}`,
            );
        }

        const path = `${SURFACE_PATHS[surface] || `${ROOT_PATH}/${surface}`}/translations`;

        const fragments = await this.aemClient.searchFragments({
            path,
            query,
            modelIds: [TRANSLATION_PROJECT_MODEL_ID],
            limit,
        });

        const projects = fragments.map((fragment) => this.formatTranslationProject(fragment));

        return {
            projects,
            count: projects.length,
            surface,
            studioLinks: {
                list: this.urlBuilder.buildTranslationsLink({
                    path: SURFACE_PATHS[surface] || `${ROOT_PATH}/${surface}`,
                }),
                createNew: this.urlBuilder.buildCreateTranslationLink({
                    path: SURFACE_PATHS[surface] || `${ROOT_PATH}/${surface}`,
                }),
            },
        };
    }

    async getTranslationProject(params) {
        const { id } = params;

        const fragment = await this.aemClient.getFragment(id);
        const project = this.formatTranslationProject(fragment);

        const studioLinks = this.urlBuilder.createTranslationProjectLinks({
            id: fragment.id,
            path: fragment.path,
        });

        return {
            project,
            studioLinks,
        };
    }

    async checkTranslationStatus(params) {
        const { id, locales } = params;

        const translationData = await this.aemClient.getFragmentTranslations(id);

        const fragment = await this.aemClient.getFragment(id);
        const surfacePath = this.urlBuilder.extractSurfacePath(fragment.path);

        const translatedLocales = [];
        if (translationData?.items) {
            translationData.items.forEach((item) => {
                const locale = this.extractLocaleFromPath(item.path);
                if (locale) translatedLocales.push(locale);
            });
        }

        const checkLocales = locales || LOCALE_DEFAULTS.filter((l) => l !== 'en_US');
        const missing = checkLocales.filter((l) => !translatedLocales.includes(l));

        return {
            fragmentId: id,
            fragmentTitle: fragment.title,
            translated: translatedLocales,
            missing,
            coverage: `${translatedLocales.length}/${checkLocales.length}`,
            studioLinks: {
                edit: this.urlBuilder.buildFragmentEditorLink(id, { path: surfacePath }),
                createTranslationProject: this.urlBuilder.buildCreateTranslationLink({
                    path: surfacePath,
                }),
            },
        };
    }

    listLocales() {
        return {
            locales: LOCALE_DEFAULTS,
            count: LOCALE_DEFAULTS.length,
            allowedSurfaces: TRANSLATIONS_ALLOWED_SURFACES,
        };
    }

    async translationCoverageReport(params) {
        const { surface, locales, limit = 50 } = params;

        if (!TRANSLATIONS_ALLOWED_SURFACES.includes(surface)) {
            throw new Error(
                `Surface "${surface}" does not support translations. Allowed: ${TRANSLATIONS_ALLOWED_SURFACES.join(', ')}`,
            );
        }

        const surfacePath = SURFACE_PATHS[surface] || `${ROOT_PATH}/${surface}`;
        const path = `${surfacePath}/en_US`;

        const fragments = await this.aemClient.searchFragments({
            path,
            modelIds: [CARD_MODEL_ID],
            limit,
        });

        const checkLocales = locales || LOCALE_DEFAULTS.filter((l) => l !== 'en_US');
        const coverage = {};
        checkLocales.forEach((locale) => {
            coverage[locale] = { translated: 0, total: fragments.length };
        });

        for (const fragment of fragments) {
            const variationsField = Array.isArray(fragment.fields)
                ? fragment.fields.find((f) => f.name === 'variations')
                : null;
            const variationPaths = variationsField?.values || [];

            for (const varPath of variationPaths) {
                const locale = this.extractLocaleFromPath(varPath);
                if (locale && coverage[locale]) {
                    coverage[locale].translated++;
                }
            }
        }

        const report = {};
        for (const [locale, data] of Object.entries(coverage)) {
            const percentage = data.total > 0 ? Math.round((data.translated / data.total) * 100) : 0;
            report[locale] = {
                translated: data.translated,
                total: data.total,
                percentage: `${percentage}%`,
            };
        }

        return {
            surface,
            report,
            totalCards: fragments.length,
            studioLinks: {
                translations: this.urlBuilder.buildTranslationsLink({ path: surfacePath }),
            },
        };
    }

    async findUntranslatedCards(params) {
        const { surface, locale, limit = 20 } = params;

        if (!TRANSLATIONS_ALLOWED_SURFACES.includes(surface)) {
            throw new Error(
                `Surface "${surface}" does not support translations. Allowed: ${TRANSLATIONS_ALLOWED_SURFACES.join(', ')}`,
            );
        }

        if (!LOCALE_DEFAULTS.includes(locale)) {
            throw new Error(`Invalid locale "${locale}". Must be one of: ${LOCALE_DEFAULTS.join(', ')}`);
        }

        const surfacePath = SURFACE_PATHS[surface] || `${ROOT_PATH}/${surface}`;
        const path = `${surfacePath}/en_US`;

        const fragments = await this.aemClient.searchFragments({
            path,
            modelIds: [CARD_MODEL_ID],
            limit: limit * 3,
        });

        const untranslated = [];

        for (const fragment of fragments) {
            const variationsField = Array.isArray(fragment.fields)
                ? fragment.fields.find((f) => f.name === 'variations')
                : null;
            const variationPaths = variationsField?.values || [];

            const hasLocale = variationPaths.some((p) => this.extractLocaleFromPath(p) === locale);

            if (!hasLocale) {
                untranslated.push({
                    id: fragment.id,
                    title: fragment.title,
                    path: fragment.path,
                    studioLinks: {
                        edit: this.urlBuilder.buildFragmentEditorLink(fragment.id, { path: surfacePath }),
                    },
                });
            }

            if (untranslated.length >= limit) break;
        }

        return {
            surface,
            locale,
            untranslated,
            count: untranslated.length,
            studioLinks: {
                createTranslationProject: this.urlBuilder.buildCreateTranslationLink({
                    path: surfacePath,
                }),
                translations: this.urlBuilder.buildTranslationsLink({ path: surfacePath }),
            },
        };
    }

    formatTranslationProject(fragment) {
        const fields = {};

        if (Array.isArray(fragment.fields)) {
            fragment.fields.forEach((field) => {
                if (field.name) {
                    fields[field.name] = field.multiple ? field.values : field.values?.[0];
                }
            });
        }

        const studioLinks = this.urlBuilder.createTranslationProjectLinks({
            id: fragment.id,
            path: fragment.path,
        });

        return {
            id: fragment.id,
            path: fragment.path,
            title: fragment.title,
            targetLocales: fields.targetLocales || [],
            submissionDate: fields.submissionDate || null,
            readonly: !!fields.submissionDate,
            items: fields.items || [],
            itemCount: Array.isArray(fields.items) ? fields.items.length : 0,
            modified: fragment.modified,
            studioLinks,
        };
    }

    async createTranslationProject(params) {
        const { title, surface, fragmentPaths, targetLocales, projectType = 'translation' } = params;
        if (!title) throw new Error('Project title is required');
        if (!surface) throw new Error('Surface is required');
        if (!fragmentPaths?.length) throw new Error('At least one fragment path is required');
        if (!targetLocales?.length) throw new Error('At least one target locale is required');

        const basePath = SURFACE_PATHS[surface];
        if (!basePath) throw new Error(`Unknown surface: ${surface}`);

        const translationsPath = `${basePath}/translations`;

        const fragmentData = {
            title,
            description: `Translation project: ${title}`,
            modelId: TRANSLATION_PROJECT_MODEL_ID,
            parentPath: translationsPath,
            fields: [
                { name: 'title', values: [title] },
                { name: 'fragments', values: fragmentPaths },
                { name: 'targetLocales', values: targetLocales },
                { name: 'projectType', values: [projectType] },
                { name: 'submissionDate', values: [] },
            ],
        };

        const fragment = await this.aemClient.createFragment(fragmentData);
        const project = this.formatTranslationProject(fragment);

        return {
            success: true,
            operation: 'create_translation_project',
            project,
            message: `Created translation project "${title}" with ${fragmentPaths.length} cards → ${targetLocales.join(', ')}`,
        };
    }

    async submitTranslationProject(params) {
        const { id, surface } = params;
        if (!id) throw new Error('Project ID is required');
        if (!surface) throw new Error('Surface is required');

        const authHeader = await this.aemClient.authManager.getAuthHeader();

        const ioBaseUrl = 'https://14257-masstudio.adobeioruntime.net/api/v1/web/MerchAtScaleStudio';
        const url = `${ioBaseUrl}/translation-project-start?projectId=${encodeURIComponent(id)}&surface=${encodeURIComponent(surface)}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { Authorization: authHeader },
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to submit translation project (${response.status}): ${text.substring(0, 200)}`);
        }

        const result = await response.json();
        return {
            success: true,
            operation: 'submit_translation_project',
            projectId: id,
            submissionDate: result.submissionDate,
            message: 'Translation project submitted successfully',
        };
    }

    extractLocaleFromPath(path) {
        const match = path?.match(/\/content\/dam\/mas\/[^/]+\/([^/]+)\//);
        return match?.[1] || null;
    }
}
