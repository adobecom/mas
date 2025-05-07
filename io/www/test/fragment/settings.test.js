const { expect } = require('chai');
const { settings } = require('../../src/fragment/settings.js');

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

    it('should add secure label and stock settings when variant is plans and showSecureLabel is undefined', async () => {
        context.body.fields.variant = 'plans';

        const result = await settings(context);
        expect(result.body.settings).to.deep.equal({
            stockCheckboxLabel: '{{stock-checkbox-label}}',
            stockOfferOsis: '',
            secureLabel: '{{secure-label}}',
            displayPlanType: true,
        });
    });

    it('should add secure label when variant is plans and showSecureLabel is true', async () => {
        context.body.fields = {
            variant: 'plans',
            showSecureLabel: true,
        };

        const result = await settings(context);
        expect(result.body.settings).to.deep.equal({
            stockCheckboxLabel: '{{stock-checkbox-label}}',
            stockOfferOsis: '',
            secureLabel: '{{secure-label}}',
            displayPlanType: true,
        });
    });

    it('should not add secure label when variant is plans and showSecureLabel is false', async () => {
        context.body.fields = {
            variant: 'plans',
            showSecureLabel: false,
        };

        const result = await settings(context);
        expect(result.body.settings).to.deep.equal({
            stockCheckboxLabel: '{{stock-checkbox-label}}',
            stockOfferOsis: '',
            displayPlanType: true,
        });
    });

    it('should handle references with plans variant', async () => {
        context.body.references = {
            ref1: {
                type: 'content-fragment',
                value: {
                    fields: {
                        variant: 'plans',
                        showSecureLabel: true,
                    },
                },
            },
        };

        const result = await settings(context);
        expect(result.body.references.ref1.value.settings).to.deep.equal({
            stockCheckboxLabel: '{{stock-checkbox-label}}',
            stockOfferOsis: '',
            secureLabel: '{{secure-label}}',
            displayPlanType: true,
        });
    });

    it('should handle multiple references with different variants', async () => {
        context.body.references = {
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
        };

        const result = await settings(context);
        expect(result.body.references.ref1.value.settings).to.deep.equal({
            stockCheckboxLabel: '{{stock-checkbox-label}}',
            stockOfferOsis: '',
            secureLabel: '{{secure-label}}',
            displayPlanType: true,
        });
        expect(result.body.references.ref2.value.settings).to.be.undefined;
    });

    it('should not add displayPlanType when locale is not en_US', async () => {
        context.locale = 'fr_FR';
        context.body.fields.variant = 'plans';

        const result = await settings(context);
        expect(result.body.settings).to.deep.equal({
            stockCheckboxLabel: '{{stock-checkbox-label}}',
            stockOfferOsis: '',
            secureLabel: '{{secure-label}}',
        });
    });

    it('should not add any settings when variant is not plans', async () => {
        context.body.fields.variant = 'other';

        const result = await settings(context);
        expect(result.body.settings).to.be.undefined;
    });

    it('should handle missing body', async () => {
        context = { locale: 'en_US' };

        const result = await settings(context);
        expect(result).to.deep.equal(context);
    });

    it('should handle missing fields', async () => {
        context = {
            locale: 'en_US',
            body: {},
        };

        const result = await settings(context);
        expect(result).to.deep.equal(context);
    });

    it('should handle invalid reference structure', async () => {
        context.body.references = {
            ref1: null,
            ref2: {},
            ref3: { type: 'content-fragment' },
        };

        const result = await settings(context);
        expect(result).to.deep.equal(context);
    });

    it('should handle empty references object', async () => {
        context.body.references = {};

        const result = await settings(context);
        expect(result).to.deep.equal(context);
    });

    it('should override plan type when variant is plans and showPlanType is false', async () => {
        context.body.fields = {
            locale: 'en_US',
            showPlanType: false,
            variant: 'plans',
        };

        const result = await settings(context);
        expect(result.body.settings).to.deep.equal({
            stockCheckboxLabel: '{{stock-checkbox-label}}',
            stockOfferOsis: '',
            secureLabel: '{{secure-label}}',
            displayPlanType: false,
        });
    });
});
