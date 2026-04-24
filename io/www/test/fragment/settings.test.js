import { expect } from 'chai';
import sinon from 'sinon';
import {
    transformer as settings,
    getSettings,
    collectSettingEntries,
    clearSettingsCache,
    applyCollectionSettings,
} from '../../src/fragment/transformers/settings.js';
import SETTINGS_RESPONSE from './mocks/settings-sandbox.json' with { type: 'json' };
import { createResponse } from './mocks/MockFetch.js';

const DEFAULT_SURFACE = 'sandbox';
const DEFAULT_LOCALE = 'fr_FR';

const settingsIndexUrl = (surface = DEFAULT_SURFACE) =>
    `https://odin.adobe.com/adobe/contentFragments/byPath?path=/content/dam/mas/${surface}/settings/index`;

const settingsContentUrl = (id) => `https://odin.adobe.com/adobe/contentFragments/${id}?references=all-hydrated`;

let fetchStub;

function mockSettingsFetch(
    surface = DEFAULT_SURFACE,
    settingsId = 'settings-id',
    referencesBody = { body: { references: {} } },
    stub = fetchStub,
) {
    stub.withArgs(settingsIndexUrl(surface)).returns(createResponse(200, { id: settingsId }));
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
            expect(result.secureLabel.default).to.exist;
            expect(result.secureLabel.default.name).to.equal('secureLabel');
            expect(result.secureLabel.override).to.have.length(1);
            expect(result.secureLabel.override[0].locales).to.include('fr_FR');
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
                secureLabel: {
                    default: { name: 'secureLabel', type: 'optional-text', booleanValue: true, textValue: '{{secure-label}}' },
                    override: [],
                },
            };
            const result = await getSettings(createContext({ hasExternalSettings: true, settings: external }));
            expect(result).to.equal(external);
            expect(fetchStub.called).to.be.false;
        });

        it('returns null without fetching when surface is undefined', async () => {
            const context = createContext();
            delete context.surface;
            const result = await getSettings(context);
            expect(result).to.be.null;
            expect(fetchStub.called).to.be.false;
        });

        it('returns null when settings index has no items', async () => {
            fetchStub.withArgs(settingsIndexUrl()).returns(createResponse(200, {}));
            const result = await getSettings(createContext());
            expect(result).to.be.null;
        });

        it('returns null when fetch references fails', async () => {
            fetchStub.withArgs(settingsIndexUrl()).returns(createResponse(200, { id: 'sid' }));
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
                                name: 'secureLabel',
                                type: 'optional-text',
                                booleanValue: true,
                                textValue: '{{secure-label}}',
                            },
                        },
                    },
                },
            };
            mockSettingsFetch(DEFAULT_SURFACE, 'settings-id', referencesBody);
            const result = await getSettings(createContext());
            expect(result).to.deep.equal({
                secureLabel: {
                    default: { name: 'secureLabel', type: 'optional-text', booleanValue: true, textValue: '{{secure-label}}' },
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
            fetchStub.withArgs(settingsIndexUrl()).returns(createResponse(200, { id: 'sid' }));
            fetchStub.withArgs(settingsContentUrl('sid')).returns(createResponse(500, null, 'Internal Server Error'));
            const result = await settings.init(createContext());
            expect(result).to.be.null;
        });

        it('returns grouped settings on success', async () => {
            mockSettingsFetch(DEFAULT_SURFACE, 'settings-id', SETTINGS_RESPONSE);
            const result = await settings.init(createContext());
            expect(result.secureLabel).to.exist;
            expect(result.secureLabel.default.name).to.equal('secureLabel');
            expect(result.secureLabel.default.booleanValue).to.be.false;
            expect(result.secureLabel.default.textValue).to.equal('{{secure-label}}');
            expect(result.secureLabel.override).to.have.length(1);
            expect(result.secureLabel.override[0].locales).to.include('fr_FR');
            expect(result.secureLabel.override[0].booleanValue).to.be.true;
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
                            name: 'secureLabel',
                            valuetype: 'boolean',
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
            expect(result1.secureLabel.default.booleanValue).to.be.true;
            expect(contentFetchCalls()).to.have.length(1);

            const result2 = await getSettings(createContext());
            expect(result2.secureLabel.default.booleanValue).to.be.true;
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
                    ref1: { value: { fields: { name: 'x', valuetype: 'text', textValue: 'A' } } },
                },
            };
            const bodyB = {
                references: {
                    ref1: { value: { fields: { name: 'x', valuetype: 'text', textValue: 'B' } } },
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
                        value: { fields: { name: 'x', valuetype: 'text', textValue: 'shared' } },
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
                        secureLabel: {
                            default: {
                                name: 'secureLabel',
                                templates: ['plans', 'plans-students'],
                                locales: [],
                                tags: [],
                                valuetype: 'optional-text',
                                textValue: '{{secure-label}}',
                                richTextValue: { mimeType: 'text/html' },
                                booleanValue: true,
                            },
                            override: [],
                        },
                        checkoutWorkflow: {
                            default: {
                                name: 'checkoutWorkflow',
                                valuetype: 'text',
                                textValue: 'UCv3',
                            },
                            override: [],
                        },
                    }),
                },
            };
            const result = await settings.process(context);
            expect(result.body.settings.secureLabel).to.equal('{{secure-label}}');
            expect(result.body.settings.checkoutWorkflow).to.equal('UCv3');
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
                        secureLabel: {
                            default: {
                                name: 'secureLabel',
                                valuetype: 'optional-text',
                                booleanValue: true,
                                textValue: '{{secure-label}}',
                            },
                            override: [],
                        },
                    }),
                },
            };
            const result = await settings.process(context);
            expect(result.body.references.ref1.value.settings.secureLabel).to.equal('{{secure-label}}');
            expect(result.body.placeholders).to.exist;
            expect(result.body.settings?.tagLabels).to.exist;
        });

        it('applyCollectionSettings uses empty tagLabels when Object.fromEntries is falsy', function () {
            const fromEntriesStub = sinon.stub(Object, 'fromEntries').returns(null);
            const context = {
                body: {
                    references: null,
                },
                dictionary: {},
            };
            try {
                applyCollectionSettings(context, 'fr_FR', {});
                expect(context.body.settings.tagLabels).to.deep.equal({});
            } finally {
                fromEntriesStub.restore();
            }
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
                body: { fields: { variant: 'plans', tags: ['premium', 'b2b'] } },
                promises: {
                    settings: Promise.resolve({
                        badgeLabel: {
                            default: {
                                name: 'badgeLabel',
                                valuetype: 'text',
                                textValue: 'Default badge',
                            },
                            override: [
                                {
                                    name: 'badgeLabel',
                                    valuetype: 'text',
                                    textValue: 'Premium badge',
                                    locales: ['fr_FR'],
                                    tags: ['premium'],
                                },
                                {
                                    name: 'badgeLabel',
                                    valuetype: 'text',
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
                                valuetype: 'text',
                                templates: ['plans', 'other-variant'],
                                textValue: 'UCv3',
                            },
                            override: [
                                {
                                    name: 'checkoutWorkflow',
                                    valuetype: 'text',
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

        it('applies secureLabel locale override when fragment locale matches', async () => {
            const context = {
                locale: 'fr_FR',
                body: { fields: { variant: 'plans' } },
                promises: {
                    settings: Promise.resolve({
                        secureLabel: {
                            default: {
                                name: 'secureLabel',
                                valuetype: 'optional-text',
                                templates: ['plans', 'plans-students'],
                                booleanValue: false,
                                textValue: '{{secure-label}}',
                            },
                            override: [
                                {
                                    name: 'secureLabel',
                                    valuetype: 'optional-text',
                                    booleanValue: true,
                                    textValue: '{{secure-label-fr}}',
                                    locales: ['fr_FR'],
                                },
                            ],
                        },
                    }),
                },
            };
            const result = await settings.process(context);
            expect(result.body.settings.secureLabel).to.equal('{{secure-label-fr}}');
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
                                valuetype: 'text',
                                templates: ['plans', 'other-variant'],
                                textValue: 'UCv3',
                            },
                            override: [
                                {
                                    name: 'checkoutWorkflow',
                                    valuetype: 'text',
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

        it('applies setting when templates are not configured (no template filter)', async () => {
            const context = {
                locale: 'fr_FR',
                body: { fields: { variant: 'any-variant' } },
                promises: {
                    settings: Promise.resolve({
                        checkoutWorkflow: {
                            default: {
                                name: 'checkoutWorkflow',
                                valuetype: 'text',
                                textValue: 'UCv3',
                            },
                            override: [],
                        },
                    }),
                },
            };
            const result = await settings.process(context);
            expect(result.body.settings).to.exist;
            expect(result.body.settings.checkoutWorkflow).to.equal('UCv3');
        });

        it('applies setting when templates is empty array (no template filter)', async () => {
            const context = {
                locale: 'en_US',
                body: { fields: { variant: 'plans' } },
                promises: {
                    settings: Promise.resolve({
                        secureLabel: {
                            default: {
                                name: 'secureLabel',
                                valuetype: 'optional-text',
                                templates: [],
                                booleanValue: true,
                                textValue: '{{secure-label}}',
                            },
                            override: [],
                        },
                    }),
                },
            };
            const result = await settings.process(context);
            expect(result.body.settings).to.exist;
            expect(result.body.settings.secureLabel).to.equal('{{secure-label}}');
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
                                valuetype: 'richText',
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

        it('uses perUnitLabel from fragment fields when present', async () => {
            const customPerUnitLabel = '/per-unit-custom';
            const context = {
                locale: 'en_US',
                body: {
                    fields: { perUnitLabel: customPerUnitLabel, variant: 'plans' },
                },
                promises: {
                    settings: Promise.resolve({
                        secureLabel: {
                            default: {
                                name: 'secureLabel',
                                booleanValue: false,
                            },
                            override: [],
                        },
                    }),
                },
            };
            const result = await settings.process(context);
            expect(result.body.priceLiterals).to.exist;
            expect(result.body.priceLiterals.perUnitLabel).to.equal(customPerUnitLabel);
        });

        it('uses displayPlanType (showPlanType) from fragment settings when present', async () => {
            const context = {
                locale: 'fr_FR',
                body: {
                    fields: { variant: 'plans', showPlanType: false },
                },
                promises: {
                    settings: Promise.resolve({
                        displayPlanType: {
                            default: {
                                name: 'displayPlanType',
                                valuetype: 'boolean',
                                booleanValue: true,
                            },
                            override: [],
                        },
                    }),
                },
            };
            const result = await settings.process(context);
            expect(result.body.settings.displayPlanType).to.be.false;
        });

        it('returns empty string for optional-text when fragment sets secureLabel to false', async () => {
            const context = {
                locale: 'en_US',
                body: {
                    fields: { variant: 'plans', showSecureLabel: false },
                },
                promises: {
                    settings: Promise.resolve({
                        secureLabel: {
                            default: {
                                name: 'secureLabel',
                                valuetype: 'optional-text',
                                templates: ['plans'],
                                booleanValue: true,
                                textValue: '{{secure-label}}',
                            },
                            override: [],
                        },
                    }),
                },
            };
            const result = await settings.process(context);
            expect(result.body.settings.secureLabel).to.equal('');
        });

        it('uses fragment value for text-type setting when fragment provides one', async () => {
            const context = {
                locale: 'en_US',
                body: {
                    fields: { customLabel: 'fragment-override' },
                },
                promises: {
                    settings: Promise.resolve({
                        customLabel: {
                            default: {
                                name: 'customLabel',
                                valuetype: 'text',
                                textValue: '{{default-label}}',
                            },
                            override: [],
                        },
                    }),
                },
            };
            const result = await settings.process(context);
            expect(result.body.settings.customLabel).to.equal('fragment-override');
        });

        describe('booleanValue from entry or fragment.fields (true, false, "true", "false")', () => {
            it('normalizes entry booleanValue string "true" to boolean true for boolean type', async () => {
                const context = {
                    locale: 'en_US',
                    body: { fields: {} },
                    promises: {
                        settings: Promise.resolve({
                            displayAnnual: {
                                default: {
                                    name: 'displayAnnual',
                                    valuetype: 'boolean',
                                    booleanValue: 'true',
                                },
                                override: [],
                            },
                        }),
                    },
                };
                const result = await settings.process(context);
                expect(result.body.settings.displayAnnual).to.equal(true);
            });

            it('normalizes entry booleanValue string "false" to boolean false for boolean type', async () => {
                const context = {
                    locale: 'en_US',
                    body: { fields: {} },
                    promises: {
                        settings: Promise.resolve({
                            displayAnnual: {
                                default: {
                                    name: 'displayAnnual',
                                    valuetype: 'boolean',
                                    booleanValue: 'false',
                                },
                                override: [],
                            },
                        }),
                    },
                };
                const result = await settings.process(context);
                expect(result.body.settings.displayAnnual).to.equal(false);
            });

            it('normalizes fragment.fields boolean string "true" for boolean type (e.g. showPlanType)', async () => {
                const context = {
                    locale: 'en_US',
                    body: {
                        fields: { variant: 'plans', showPlanType: 'true' },
                    },
                    promises: {
                        settings: Promise.resolve({
                            displayPlanType: {
                                default: {
                                    name: 'displayPlanType',
                                    valuetype: 'boolean',
                                    booleanValue: false,
                                },
                                override: [],
                            },
                        }),
                    },
                };
                const result = await settings.process(context);
                expect(result.body.settings.displayPlanType).to.equal(true);
            });

            it('normalizes fragment.fields boolean string "false" for boolean type (e.g. showPlanType)', async () => {
                const context = {
                    locale: 'en_US',
                    body: {
                        fields: { variant: 'plans', showPlanType: 'false' },
                    },
                    promises: {
                        settings: Promise.resolve({
                            displayPlanType: {
                                default: {
                                    name: 'displayPlanType',
                                    valuetype: 'boolean',
                                    booleanValue: true,
                                },
                                override: [],
                            },
                        }),
                    },
                };
                const result = await settings.process(context);
                expect(result.body.settings.displayPlanType).to.equal(false);
            });

            it('optional-text returns empty string when entry booleanValue is string "false"', async () => {
                const context = {
                    locale: 'en_US',
                    body: { fields: { variant: 'plans' } },
                    promises: {
                        settings: Promise.resolve({
                            secureLabel: {
                                default: {
                                    name: 'secureLabel',
                                    valuetype: 'optional-text',
                                    booleanValue: 'false',
                                    textValue: '{{secure-label}}',
                                },
                                override: [],
                            },
                        }),
                    },
                };
                const result = await settings.process(context);
                expect(result.body.settings.secureLabel).to.equal('');
            });

            it('optional-text returns textValue when entry booleanValue is string "true"', async () => {
                const context = {
                    locale: 'en_US',
                    body: { fields: { variant: 'plans' } },
                    promises: {
                        settings: Promise.resolve({
                            secureLabel: {
                                default: {
                                    name: 'secureLabel',
                                    valuetype: 'optional-text',
                                    booleanValue: 'true',
                                    textValue: '{{secure-label}}',
                                },
                                override: [],
                            },
                        }),
                    },
                };
                const result = await settings.process(context);
                expect(result.body.settings.secureLabel).to.equal('{{secure-label}}');
            });

            it('optional-text returns empty string when fragment.fields showSecureLabel is string "false"', async () => {
                const context = {
                    locale: 'en_US',
                    body: {
                        fields: { variant: 'plans', showSecureLabel: 'false' },
                    },
                    promises: {
                        settings: Promise.resolve({
                            secureLabel: {
                                default: {
                                    name: 'secureLabel',
                                    valuetype: 'optional-text',
                                    booleanValue: true,
                                    textValue: '{{secure-label}}',
                                },
                                override: [],
                            },
                        }),
                    },
                };
                const result = await settings.process(context);
                expect(result.body.settings.secureLabel).to.equal('');
            });
        });
    });
});
