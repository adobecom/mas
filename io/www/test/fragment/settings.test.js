import { expect } from 'chai';
import sinon from 'sinon';
import {
    transformer as settings,
    getSettings,
    collectSettingEntries,
    clearSettingsCache,
} from '../../src/fragment/transformers/settings.js';
import SETTINGS_RESPONSE from './mocks/settings-sandbox.json' with { type: 'json' };
import { createResponse } from './mocks/MockFetch.js';

const DEFAULT_SURFACE = 'sandbox';
const DEFAULT_LOCALE = 'fr_FR';

const settingsIndexUrl = (surface = DEFAULT_SURFACE) =>
    `https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/${surface}/settings/index`;

const settingsContentUrl = (id) => `https://odin.adobe.com/adobe/sites/fragments/${id}?references=all-hydrated`;

let fetchStub;

function mockSettingsFetch(
    surface = DEFAULT_SURFACE,
    settingsId = 'settings-id',
    referencesBody = { body: { references: {} } },
    stub = fetchStub,
) {
    stub.withArgs(settingsIndexUrl(surface)).returns(createResponse(200, { items: [{ id: settingsId }] }));
    stub.withArgs(settingsContentUrl(settingsId)).returns(createResponse(200, referencesBody));
}

function createContext(overrides = {}) {
    return {
        surface: DEFAULT_SURFACE,
        locale: DEFAULT_LOCALE,
        networkConfig: { retries: 1, retryDelay: 1 },
        ...overrides,
    };
}
describe('settings', () => {
    describe('collectSettingEntries', () => {
        it('groups default & overrides', () => {
            const result = collectSettingEntries(SETTINGS_RESPONSE);
            expect(result.showSecureLabel.default).to.exist;
            expect(result.showSecureLabel.default.name).to.equal('showSecureLabel');
            expect(result.showSecureLabel.override).to.have.length(1);
            expect(result.showSecureLabel.override[0].locales).to.include('fr_FR');
        });

        it('returns empty object when references is null', () => {
            expect(collectSettingEntries({})).to.deep.equal({});
            expect(collectSettingEntries({ references: null })).to.deep.equal({});
        });

        it('skips refs without value or name', () => {
            const fragment = {
                references: {
                    ref1: { value: {} },
                    ref2: { value: { fields: null } },
                    ref3: { value: { fields: { type: 'text' } } },
                },
            };
            expect(collectSettingEntries(fragment)).to.deep.equal({});
        });
    });

    describe('getSettings', () => {
        beforeEach(() => {
            fetchStub = sinon.stub(globalThis, 'fetch');
        });

        afterEach(() => {
            fetchStub.restore();
            clearSettingsCache();
        });

        it('returns context.settings when hasExternalSettings', async () => {
            const external = {
                showSecureLabel: { default: { name: 'showSecureLabel', type: 'boolean', booleanValue: true }, override: [] },
            };
            const result = await getSettings(createContext({ hasExternalSettings: true, settings: external }));
            expect(result).to.equal(external);
            expect(fetchStub.called).to.be.false;
        });

        it('returns null when settings index has no items', async () => {
            fetchStub.withArgs(settingsIndexUrl()).returns(createResponse(200, { items: [] }));
            const result = await getSettings(createContext());
            expect(result).to.be.null;
        });

        it('returns null when fetch references fails', async () => {
            fetchStub.withArgs(settingsIndexUrl()).returns(createResponse(200, { items: [{ id: 'sid' }] }));
            fetchStub.withArgs(settingsContentUrl('sid')).returns(createResponse(500, null, 'Internal Server Error'));
            const result = await getSettings(createContext());
            expect(result).to.be.null;
        });

        it('returns grouped settings on success', async () => {
            const referencesBody = {
                references: {
                    ref1: {
                        value: {
                            fields: {
                                name: 'showSecureLabel',
                                type: 'boolean',
                                booleanValue: true,
                            },
                        },
                    },
                },
            };
            mockSettingsFetch(DEFAULT_SURFACE, 'settings-id', referencesBody);
            const result = await getSettings(createContext());
            expect(result).to.deep.equal({
                showSecureLabel: {
                    default: { name: 'showSecureLabel', type: 'boolean', booleanValue: true },
                    override: [],
                },
            });
        });
    });

    describe('settings transformer init', () => {
        beforeEach(() => {
            fetchStub = sinon.stub(globalThis, 'fetch');
        });

        afterEach(() => {
            fetchStub.restore();
            clearSettingsCache();
        });

        it('returns null when surface is missing', async () => {
            fetchStub.withArgs(settingsIndexUrl(undefined)).returns(createResponse(200, { items: [] }));
            const context = createContext();
            delete context.surface;
            const result = await settings.init(context);
            expect(result).to.be.null;
        });

        it('returns null when fragment not found', async () => {
            fetchStub.withArgs(settingsIndexUrl()).returns(createResponse(200, { items: [] }));
            const result = await settings.init(createContext());
            expect(result).to.be.null;
        });

        it('returns null when fetch references fails', async () => {
            fetchStub.withArgs(settingsIndexUrl()).returns(createResponse(200, { items: [{ id: 'sid' }] }));
            fetchStub.withArgs(settingsContentUrl('sid')).returns(createResponse(500, null, 'Internal Server Error'));
            const result = await settings.init(createContext());
            expect(result).to.be.null;
        });

        it('returns grouped settings on success', async () => {
            mockSettingsFetch(DEFAULT_SURFACE, 'settings-id', SETTINGS_RESPONSE);
            const result = await settings.init(createContext());
            expect(result.showSecureLabel).to.exist;
            expect(result.showSecureLabel.default.name).to.equal('showSecureLabel');
            expect(result.showSecureLabel.default.booleanValue).to.be.true;
            expect(result.showSecureLabel.override).to.have.length(1);
            expect(result.showSecureLabel.override[0].locales).to.include('fr_FR');
            expect(result.displayPlanType).to.exist;
            expect(result.displayAnnual).to.exist;
        });
    });

    describe('settings caching', () => {
        const referencesBody = {
            references: {
                ref1: {
                    value: {
                        fields: {
                            name: 'showSecureLabel',
                            type: 'boolean',
                            booleanValue: true,
                        },
                    },
                },
            },
        };

        beforeEach(() => {
            fetchStub = sinon.stub(globalThis, 'fetch');
        });

        afterEach(() => {
            fetchStub.restore();
            clearSettingsCache();
        });

        const contentFetchCalls = () => fetchStub.getCalls().filter((c) => c.args[0]?.includes('references=all-hydrated'));

        it('uses cached settings on second request (no extra content fetch)', async () => {
            clearSettingsCache();
            mockSettingsFetch(DEFAULT_SURFACE, 'settings-id', referencesBody);

            const ctx1 = createContext();
            ctx1.promises = {};
            ctx1.promises.settings = settings.init(ctx1);
            await ctx1.promises.settings;

            const ctx2 = createContext();
            ctx2.promises = {};
            ctx2.promises.settings = settings.init(ctx2);
            await ctx2.promises.settings;

            expect(contentFetchCalls()).to.have.length(1);
        });

        it('caches settings with 200 and reuses within TTL', async () => {
            clearSettingsCache();
            mockSettingsFetch(DEFAULT_SURFACE, 'settings-id', referencesBody);

            const result1 = await getSettings(createContext());
            expect(result1.showSecureLabel.default.booleanValue).to.be.true;
            expect(contentFetchCalls()).to.have.length(1);

            const result2 = await getSettings(createContext());
            expect(result2.showSecureLabel.default.booleanValue).to.be.true;
            expect(contentFetchCalls()).to.have.length(1);
        });

        it('clearSettingsCache() clears in-memory cache', async () => {
            clearSettingsCache();
            mockSettingsFetch(DEFAULT_SURFACE, 'settings-id', referencesBody);
            await getSettings(createContext());
            expect(contentFetchCalls()).to.have.length(1);

            clearSettingsCache();
            await getSettings(createContext());
            expect(contentFetchCalls()).to.have.length(2);
        });

        it('different surface/locale use different cache entries', async () => {
            clearSettingsCache();
            const bodyA = {
                references: {
                    ref1: { value: { fields: { name: 'x', type: 'text', textValue: 'A' } } },
                },
            };
            const bodyB = {
                references: {
                    ref1: { value: { fields: { name: 'x', type: 'text', textValue: 'B' } } },
                },
            };
            mockSettingsFetch('surfaceA', 'id-a', bodyA);
            mockSettingsFetch('surfaceB', 'id-b', bodyB);

            const resultA = await getSettings(createContext({ surface: 'surfaceA', locale: 'en_US' }));
            const resultB = await getSettings(createContext({ surface: 'surfaceB', locale: 'fr_FR' }));
            expect(resultA.x.default.textValue).to.equal('A');
            expect(resultB.x.default.textValue).to.equal('B');
        });

        it('shares cache across locales for same surface (settings URL has no locale)', async () => {
            clearSettingsCache();
            const referencesBody = {
                references: {
                    ref1: {
                        value: { fields: { name: 'x', type: 'text', textValue: 'shared' } },
                    },
                },
            };
            mockSettingsFetch(DEFAULT_SURFACE, 'settings-id', referencesBody);
            const contentCalls = () => fetchStub.getCalls().filter((c) => c.args[0]?.includes('references=all-hydrated'));

            await getSettings(createContext({ surface: DEFAULT_SURFACE, locale: 'en_US' }));
            await getSettings(createContext({ surface: DEFAULT_SURFACE, locale: 'fr_FR' }));
            expect(contentCalls()).to.have.length(1);
        });
    });

    describe('settings transformer process', () => {
        it('applies settings from context.promises.settings (grouped format)', async () => {
            const context = {
                locale: 'fr_FR',
                body: {
                    fields: { variant: 'plans' },
                },
                promises: {
                    settings: Promise.resolve({
                        showSecureLabel: {
                            default: {
                                name: 'showSecureLabel',
                                type: 'boolean',
                                booleanValue: true,
                            },
                            override: [],
                        },
                        checkoutWorkflow: {
                            default: {
                                name: 'checkoutWorkflow',
                                type: 'text',
                                textValue: 'UCv3',
                            },
                            override: [],
                        },
                    }),
                },
            };
            const result = await settings.process(context);
            expect(result.body.settings.showSecureLabel).to.be.true;
            expect(result.body.settings.checkoutWorkflow).to.equal('UCv3');
        });

        it('applies placeholder for secureLabel when showSecureLabel is true', async () => {
            const context = {
                locale: 'fr_FR',
                body: { fields: { variant: 'plans' } },
                promises: {
                    settings: Promise.resolve({
                        showSecureLabel: {
                            default: {
                                name: 'showSecureLabel',
                                type: 'placeholder',
                                textValue: '{{secure-label}}',
                            },
                            override: [],
                        },
                    }),
                },
            };
            const result = await settings.process(context);
            expect(result.body.settings.showSecureLabel).to.equal('{{secure-label}}');
        });

        it('always applies priceLiterals', async () => {
            const context = {
                locale: 'en_US',
                body: { fields: {} },
                promises: { settings: Promise.resolve({}) },
            };
            const result = await settings.process(context);
            expect(result.body.priceLiterals).to.be.an('object');
            expect(result.body.priceLiterals.recurrenceLabel).to.equal('{{price-literal-recurrence-label}}');
        });

        it('applies settings to collection model references', async () => {
            const context = {
                locale: 'fr_FR',
                body: {
                    model: { id: 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24' },
                    references: {
                        ref1: {
                            type: 'content-fragment',
                            value: { fields: { variant: 'plans' } },
                        },
                    },
                },
                promises: {
                    settings: Promise.resolve({
                        showSecureLabel: {
                            default: {
                                name: 'showSecureLabel',
                                type: 'boolean',
                                booleanValue: true,
                            },
                            override: [],
                        },
                    }),
                },
            };
            const result = await settings.process(context);
            expect(result.body.references.ref1.value.settings.showSecureLabel).to.be.true;
            expect(result.body.placeholders).to.exist;
            expect(result.body.settings?.tagLabels).to.exist;
        });

        it('skips null entry (no default and no override)', async () => {
            const context = {
                locale: 'fr_FR',
                body: { fields: {} },
                promises: {
                    settings: Promise.resolve({
                        optional: { default: null, override: [] },
                    }),
                },
            };
            const result = await settings.process(context);
            expect(result.body.settings).to.be.undefined;
        });

        it('handles missing body', async () => {
            const context = { locale: 'en_US', promises: { settings: Promise.resolve({}) } };
            const result = await settings.process(context);
            expect(result.settings).to.be.undefined;
        });

        it('handles missing context.promises.settings', async () => {
            const context = {
                locale: 'en_US',
                body: { fields: {} },
            };
            const result = await settings.process(context);
            expect(result).to.deep.equal(context);
        });

        it('picks override with most tag matches when multiple overrides match locale', async () => {
            const context = {
                locale: 'fr_FR',
                body: { fields: { variant: 'plans' }, tags: ['premium', 'b2b'] },
                promises: {
                    settings: Promise.resolve({
                        badgeLabel: {
                            default: {
                                name: 'badgeLabel',
                                type: 'text',
                                textValue: 'Default badge',
                            },
                            override: [
                                {
                                    name: 'badgeLabel',
                                    type: 'text',
                                    textValue: 'Premium badge',
                                    locales: ['fr_FR'],
                                    tags: ['premium'],
                                },
                                {
                                    name: 'badgeLabel',
                                    type: 'text',
                                    textValue: 'Premium B2B badge',
                                    locales: ['fr_FR'],
                                    tags: ['premium', 'b2b'],
                                },
                            ],
                        },
                    }),
                },
            };
            const result = await settings.process(context);
            expect(result.body.settings.badgeLabel).to.equal('Premium B2B badge');
        });

        it('uses single matching override when exactly one override matches locale', async () => {
            const context = {
                locale: 'fr_FR',
                body: { fields: { variant: 'plans' } },
                promises: {
                    settings: Promise.resolve({
                        checkoutWorkflow: {
                            default: {
                                name: 'checkoutWorkflow',
                                type: 'text',
                                templates: ['plans', 'other-variant'],
                                textValue: 'UCv3',
                            },
                            override: [
                                {
                                    name: 'checkoutWorkflow',
                                    type: 'text',
                                    textValue: 'UCv3-FR',
                                    locales: ['fr_FR'],
                                },
                            ],
                        },
                    }),
                },
            };
            const result = await settings.process(context);
            expect(result.body.settings).to.exist;
            expect(result.body.settings.checkoutWorkflow).to.exist;
            expect(result.body.settings.checkoutWorkflow).to.equal('UCv3-FR');
        });

        it('does not apply settings when template is not in settings', async () => {
            const context = {
                locale: 'fr_FR',
                body: { fields: { variant: 'weird-plans' } },
                promises: {
                    settings: Promise.resolve({
                        checkoutWorkflow: {
                            default: {
                                name: 'checkoutWorkflow',
                                type: 'text',
                                templates: ['plans', 'other-variant'],
                                textValue: 'UCv3',
                            },
                            override: [
                                {
                                    name: 'checkoutWorkflow',
                                    type: 'text',
                                    textValue: 'UCv3-FR',
                                    locales: ['fr_FR'],
                                },
                            ],
                        },
                    }),
                },
            };
            const result = await settings.process(context);
            expect(result).to.deep.equal(context);
        });

        it('applies richText setting from richTextValue', async () => {
            const richText = { mimeType: 'text/html', html: '<p>Trust badge copy</p>' };
            const context = {
                locale: 'en_US',
                body: { fields: {} },
                promises: {
                    settings: Promise.resolve({
                        trustCopy: {
                            default: {
                                name: 'trustCopy',
                                type: 'richText',
                                richTextValue: richText,
                            },
                            override: [],
                        },
                    }),
                },
            };
            const result = await settings.process(context);
            expect(result.body.settings.trustCopy).to.deep.equal(richText);
        });

        it('applies entry with no type using booleanValue (default branch)', async () => {
            const context = {
                locale: 'en_US',
                body: { fields: {} },
                promises: {
                    settings: Promise.resolve({
                        legacyFlag: {
                            default: {
                                name: 'legacyFlag',
                                booleanValue: true,
                            },
                            override: [],
                        },
                    }),
                },
            };
            const result = await settings.process(context);
            expect(result.body.settings.legacyFlag).to.be.true;
        });
    });
});
