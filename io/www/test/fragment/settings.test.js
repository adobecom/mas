import { expect } from 'chai';
import { transformer as settings, PLAN_TYPE_LOCALES } from '../../src/fragment/transformers/settings.js';
import sinon from 'sinon';
import { createResponse } from './mocks/MockFetch.js';

describe('settings transformer init', () => {
    let fetchStub;

    beforeEach(() => {
        fetchStub = sinon.stub(globalThis, 'fetch');
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should return null localeSettings when surface is missing', async () => {
        const result = await settings.init({ parsedLocale: 'en_US' });
        expect(result).to.deep.equal({ localeSettings: null });
    });

    it('should return null localeSettings when parsedLocale is missing', async () => {
        const result = await settings.init({ surface: 'sandbox' });
        expect(result).to.deep.equal({ localeSettings: null });
    });

    it('should return null localeSettings when fragment not found', async () => {
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FRcard-settings')
            .returns(createResponse(200, { items: [] }));

        const result = await settings.init({
            surface: 'sandbox',
            parsedLocale: 'fr_FR',
        });
        expect(result).to.deep.equal({ localeSettings: null });
    });

    it('should return null localeSettings when fetch fails', async () => {
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/settings')
            .returns(createResponse(200, { items: [{ id: 'settings-id' }] }));

        fetchStub
            .withArgs('https://odin.adobe.com/adobe/sites/fragments/settings-id')
            .returns(createResponse(500, null, 'Internal Server Error'));

        const result = await settings.init({
            surface: 'sandbox',
            parsedLocale: 'fr_FR',
        });
        expect(result).to.deep.equal({ localeSettings: null });
    });

    it('should parse fields object correctly with showSecureLabel true', async () => {
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/settings')
            .returns(createResponse(200, { items: [{ id: 'settings-id' }] }));

        fetchStub.withArgs('https://odin.adobe.com/adobe/sites/fragments/settings-id').returns(
            createResponse(200, {
                fields: {
                    showSecureLabel: true,
                    checkoutWorkflow: 'UCv3',
                },
            }),
        );

        const result = await settings.init({
            surface: 'sandbox',
            parsedLocale: 'fr_FR',
        });
        expect(result.localeSettings).to.deep.equal({
            showSecureLabel: true,
            checkoutWorkflow: 'UCv3',
        });
    });

    it('should parse fields object correctly with showSecureLabel false', async () => {
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/settings')
            .returns(createResponse(200, { items: [{ id: 'settings-id' }] }));

        fetchStub.withArgs('https://odin.adobe.com/adobe/sites/fragments/settings-id').returns(
            createResponse(200, {
                fields: {
                    showSecureLabel: false,
                    checkoutWorkflow: 'test workflow',
                },
            }),
        );

        const result = await settings.init({
            surface: 'sandbox',
            parsedLocale: 'fr_FR',
        });
        expect(result.localeSettings).to.deep.equal({
            showSecureLabel: false,
            checkoutWorkflow: 'test workflow',
        });
    });

    it('should default to false and empty string when fields are missing', async () => {
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/settings')
            .returns(createResponse(200, { items: [{ id: 'settings-id' }] }));

        fetchStub.withArgs('https://odin.adobe.com/adobe/sites/fragments/settings-id').returns(
            createResponse(200, {
                fields: {},
            }),
        );

        const result = await settings.init({
            surface: 'sandbox',
            parsedLocale: 'fr_FR',
        });
        expect(result.localeSettings).to.deep.equal({
            showSecureLabel: false,
            checkoutWorkflow: '',
        });
    });

    it('should handle undefined fields gracefully', async () => {
        fetchStub
            .withArgs('https://odin.adobe.com/adobe/sites/fragments?path=/content/dam/mas/sandbox/fr_FR/settings')
            .returns(createResponse(200, { items: [{ id: 'settings-id' }] }));

        fetchStub.withArgs('https://odin.adobe.com/adobe/sites/fragments/settings-id').returns(createResponse(200, {}));

        const result = await settings.init({
            surface: 'sandbox',
            parsedLocale: 'fr_FR',
        });
        expect(result.localeSettings).to.deep.equal({
            showSecureLabel: false,
            checkoutWorkflow: '',
        });
    });
});

describe('settings transformer process with localeSettings', () => {
    it('should apply secureLabel from localeSettings when showSecureLabel is true', async () => {
        const context = {
            locale: 'fr_FR',
            body: {
                fields: { variant: 'plans' },
            },
            promises: {
                settings: Promise.resolve({
                    localeSettings: {
                        showSecureLabel: true,
                        checkoutWorkflow: '',
                    },
                }),
            },
        };

        const result = await settings.process(context);
        expect(result.body.settings.secureLabel).to.equal('{{secure-label}}');
    });

    it('should apply checkoutWorkflow from localeSettings', async () => {
        const context = {
            locale: 'fr_FR',
            body: {
                fields: { variant: 'plans' },
            },
            promises: {
                settings: Promise.resolve({
                    localeSettings: {
                        showSecureLabel: false,
                        checkoutWorkflow: 'UCv3',
                    },
                }),
            },
        };

        const result = await settings.process(context);
        expect(result.body.settings.checkoutWorkflow).to.equal('UCv3');
        expect(result.body.settings.secureLabel).to.be.undefined;
    });

    it('should apply localeSettings to mini variant', async () => {
        const context = {
            locale: 'en_AU',
            body: {
                fields: { variant: 'mini' },
            },
            promises: {
                settings: Promise.resolve({
                    localeSettings: {
                        showSecureLabel: true,
                        checkoutWorkflow: 'custom-workflow',
                    },
                }),
            },
        };

        const result = await settings.process(context);
        expect(result.body.settings.secureLabel).to.equal('{{secure-label}}');
        expect(result.body.settings.checkoutWorkflow).to.equal('custom-workflow');
    });
});

describe('settings transformer', () => {
    let context;

    beforeEach(() => {
        context = {
            locale: 'en_US',
            body: {
                fields: {},
            },
        };
    });

    it('should add displayPlanType when variant is plans and locale is in PLAN_TYPE_LOCALES', async () => {
        context.body.fields.variant = 'plans';

        const result = await settings.process(context);
        expect(result.body.settings).to.deep.equal({
            displayPlanType: true,
        });
    });

    it('should add perUnitLabel when variant is plans and perUnitLabel is provided', async () => {
        context.body.fields = {
            variant: 'plans',
            perUnitLabel: '{perUnit, select, LICENSE {per user} other {}}',
        };

        const result = await settings.process(context);
        expect(result.body.priceLiterals).to.deep.equal({
            alternativePriceAriaLabel: '{{price-literal-alternative-price-aria-label}}',
            freeAriaLabel: '{{price-literal-free-aria-label}}',
            freeLabel: '{{price-literal-free-label}}',
            perUnitAriaLabel: '{{price-literal-per-unit-aria-label}}',
            perUnitLabel: '{perUnit, select, LICENSE {per user} other {}}',
            planTypeLabel: '{{price-literal-plan-type-label}}',
            recurrenceAriaLabel: '{{price-literal-recurrence-aria-label}}',
            recurrenceLabel: '{{price-literal-recurrence-label}}',
            strikethroughAriaLabel: '{{price-literal-strikethrough-aria-label}}',
            taxExclusiveLabel: '{{price-literal-tax-exclusive-label}}',
            taxInclusiveLabel: '{{price-literal-tax-inclusive-label}}',
        });
    });

    it('should not add perUnitLabel when variant is plans and perUnitLabel is not provided', async () => {
        context.body.fields = {
            variant: 'plans',
        };

        const result = await settings.process(context);
        expect(result.body.settings).to.deep.equal({
            displayPlanType: true,
        });
        expect(result.body.priceLiterals.perUnitLabel).to.equal('{{price-literal-per-unit-label}}');
    });

    it('should handle references with plans variant', async () => {
        context.body = {
            model: {
                id: 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24',
            },
            references: {
                ref1: {
                    type: 'content-fragment',
                    value: {
                        fields: {
                            variant: 'plans',
                        },
                    },
                },
            },
        };

        const result = await settings.process(context);
        expect(result.body.references.ref1.value.settings).to.deep.equal({
            displayPlanType: true,
        });
    });

    it('should handle multiple references with different variants', async () => {
        context.body = {
            model: {
                id: 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24',
            },
            references: {
                ref1: {
                    type: 'content-fragment',
                    value: {
                        fields: {
                            variant: 'plans',
                        },
                    },
                },
                ref2: {
                    type: 'content-fragment',
                    value: {
                        fields: {
                            variant: 'other',
                        },
                    },
                },
            },
        };

        const result = await settings.process(context);
        expect(result.body.references.ref1.value.settings).to.deep.equal({
            displayPlanType: true,
        });
        expect(result.body.references.ref2.value.settings).to.be.undefined;
    });

    it('should not add displayPlanType when locale is not in PLAN_TYPE_LOCALES', async () => {
        context.locale = 'fr_FR';
        context.body.fields.variant = 'plans';

        const result = await settings.process(context);
        expect(result.body.settings).to.deep.equal({});
    });

    it('should add displayPlanType when locale is APAC', async () => {
        context.body.fields.variant = 'plans';
        PLAN_TYPE_LOCALES.forEach(async (loc) => {
            context.locale = loc;
            const result = await settings.process(context);
            expect(result.body.settings).to.deep.equal({
                displayPlanType: true,
            });
        });
    });

    it('should not add any settings when variant is not plans', async () => {
        context.body.fields.variant = 'other';

        const result = await settings.process(context);
        expect(result.body.settings).to.be.undefined;
    });

    it('should handle missing body', async () => {
        context = { locale: 'en_US' };

        const result = await settings.process(context);
        expect(result).to.deep.equal(context);
    });

    it('should handle missing fields', async () => {
        context = {
            locale: 'en_US',
            body: {},
        };

        const result = await settings.process(context);
        expect(result).to.deep.equal(context);
    });

    it('should handle invalid reference structure', async () => {
        context.body = {
            model: {
                id: 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24',
            },
            references: {
                ref1: null,
                ref2: {},
                ref3: { type: 'content-fragment' },
            },
        };

        const result = await settings.process(context);
        expect(result).to.deep.equal(context);
    });

    it('should handle no references collection', async () => {
        context.body = {
            model: {
                id: 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24',
            },
        };

        const result = await settings.process(context);
        expect(result).to.deep.equal(context);
    });

    it('should override plan type when variant is plans and showPlanType is false', async () => {
        context.body.fields = {
            locale: 'en_US',
            showPlanType: false,
            variant: 'plans',
        };

        const result = await settings.process(context);
        expect(result.body.settings).to.deep.equal({
            displayPlanType: false,
        });
    });

    it('should not add plan type when variant is mini and locale is not en_AU', async () => {
        context.body.fields = {
            variant: 'mini',
        };
        const result = await settings.process(context);
        expect(result.body.settings).to.deep.equal({});
    });

    it('should add plan type when variant is mini and locale is en_AU', async () => {
        context.locale = 'en_AU';
        context.body.fields = {
            variant: 'mini',
        };
        const result = await settings.process(context);
        expect(result.body.settings).to.deep.equal({
            displayPlanType: true,
            displayAnnual: true,
        });
    });

    it('should handle references with mini variant', async () => {
        context.locale = 'en_AU';
        context.body = {
            model: {
                id: 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24',
            },
            references: {
                ref1: {
                    type: 'content-fragment',
                    value: {
                        fields: {
                            variant: 'mini',
                        },
                    },
                },
            },
        };

        const result = await settings.process(context);
        expect(result.body.references.ref1.value.settings).to.deep.equal({
            displayPlanType: true,
            displayAnnual: true,
        });
    });

    it('should add perUnitLabel when variant is plans and perUnitLabel is empty string', async () => {
        context.body.fields = {
            variant: 'plans',
            perUnitLabel: '',
        };

        const result = await settings.process(context);
        expect(result.body.settings).to.deep.equal({
            displayPlanType: true,
        });
        expect(result.body.priceLiterals.perUnitLabel).to.equal('{{price-literal-per-unit-label}}');
    });

    it('should handle references with perUnitLabel', async () => {
        context.body = {
            model: {
                id: 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24',
            },
            references: {
                ref1: {
                    type: 'content-fragment',
                    value: {
                        fields: {
                            variant: 'plans',
                            perUnitLabel: '{perUnit, select, LICENSE {per license} other {}}',
                        },
                    },
                },
            },
        };

        const result = await settings.process(context);
        expect(result.body.references.ref1.value.priceLiterals).to.deep.equal({
            perUnitLabel: '{perUnit, select, LICENSE {per license} other {}}',
        });
    });

    it('should apply perUnitLabel to priceLiterals when provided', async () => {
        context.body = {
            fields: {
                variant: 'plans',
                perUnitLabel: '{perUnit, select, LICENSE {per user} other {}}',
            },
        };

        const result = await settings.process(context);
        expect(result.body.priceLiterals.perUnitLabel).to.equal('{perUnit, select, LICENSE {per user} other {}}');
    });

    it('should use default perUnitLabel placeholder when not provided', async () => {
        context.body = {
            fields: {},
        };

        const result = await settings.process(context);
        expect(result.body.priceLiterals.perUnitLabel).to.equal('{{price-literal-per-unit-label}}');
    });
});
