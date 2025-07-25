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
            secureLabel: '{{secure-label}}',
            displayPlanType: true,
        });
    });

    it('should add perUnitLabel when variant is plans and perUnitLabel is provided', async () => {
        context.body.fields = {
            variant: 'plans',
            perUnitLabel: '{perUnit, select, LICENSE {per user} other {}}',
        };

        const result = await settings(context);
        expect(result.body.settings).to.deep.equal({
            secureLabel: '{{secure-label}}',
            displayPlanType: true,
            perUnitLabel: '{perUnit, select, LICENSE {per user} other {}}',
        });
    });

    it('should not add perUnitLabel when variant is plans and perUnitLabel is not provided', async () => {
        context.body.fields = {
            variant: 'plans',
        };

        const result = await settings(context);
        expect(result.body.settings).to.deep.equal({
            secureLabel: '{{secure-label}}',
            displayPlanType: true,
        });
        expect(result.body.settings.perUnitLabel).to.be.undefined;
    });

    it('should add secure label when variant is plans and showSecureLabel is true', async () => {
        context.body.fields = {
            variant: 'plans',
            showSecureLabel: true,
        };

        const result = await settings(context);
        expect(result.body.settings).to.deep.equal({
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
            displayPlanType: true,
        });
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
                            showSecureLabel: true,
                        },
                    },
                },
            },
        };

        const result = await settings(context);
        expect(result.body.references.ref1.value.settings).to.deep.equal({
            secureLabel: '{{secure-label}}',
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

        const result = await settings(context);
        expect(result.body.references.ref1.value.settings).to.deep.equal({
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

        const result = await settings(context);
        expect(result).to.deep.equal(context);
    });

    it('should handle no references collection', async () => {
        context.body = {
            model: {
                id: 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NvbGxlY3Rpb24',
            },
        };

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
            secureLabel: '{{secure-label}}',
            displayPlanType: false,
        });
    });

    it('should not add plan type when variant is mini and locale is not en_AU', async () => {
        context.body.fields = {
            variant: 'mini',
        };
        const result = await settings(context);
        expect(result.body.settings).to.be.undefined;
    });

    it('should add plan type when variant is mini and locale is en_AU', async () => {
        context.locale = 'en_AU';
        context.body.fields = {
            variant: 'mini',
        };
        const result = await settings(context);
        expect(result.body.settings).to.deep.equal({
            displayPlanType: true,
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

        const result = await settings(context);
        expect(result.body.references.ref1.value.settings).to.deep.equal({
            displayPlanType: true,
        });
    });

    it('should add perUnitLabel when variant is plans and perUnitLabel is provided', async () => {
        context.body.fields = {
            variant: 'plans',
            perUnitLabel: '{perUnit, select, LICENSE {per user} other {}}',
        };

        const result = await settings(context);
        expect(result.body.settings).to.deep.equal({
            secureLabel: '{{secure-label}}',
            displayPlanType: true,
            perUnitLabel: '{perUnit, select, LICENSE {per user} other {}}',
        });
    });

    it('should not add perUnitLabel when variant is plans and perUnitLabel is not provided', async () => {
        context.body.fields = {
            variant: 'plans',
        };

        const result = await settings(context);
        expect(result.body.settings).to.deep.equal({
            secureLabel: '{{secure-label}}',
            displayPlanType: true,
        });
        expect(result.body.settings.perUnitLabel).to.be.undefined;
    });

    it('should add perUnitLabel when variant is plans and perUnitLabel is empty string', async () => {
        context.body.fields = {
            variant: 'plans',
            perUnitLabel: '',
        };

        const result = await settings(context);
        expect(result.body.settings).to.deep.equal({
            secureLabel: '{{secure-label}}',
            displayPlanType: true,
        });
        expect(result.body.settings.perUnitLabel).to.be.undefined;
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

        const result = await settings(context);
        expect(result.body.references.ref1.value.settings).to.deep.equal({
            secureLabel: '{{secure-label}}',
            displayPlanType: true,
            perUnitLabel: '{perUnit, select, LICENSE {per license} other {}}',
        });
    });

    it('should apply perUnitLabel to priceLiterals when provided', async () => {
        context.body = {
            fields: {
                perUnitLabel: '{perUnit, select, LICENSE {per user} other {}}',
            },
        };

        const result = await settings(context);
        expect(result.body.priceLiterals.perUnitLabel).to.equal('{perUnit, select, LICENSE {per user} other {}}');
    });

    it('should use default perUnitLabel placeholder when not provided', async () => {
        context.body = {
            fields: {},
        };

        const result = await settings(context);
        expect(result.body.priceLiterals.perUnitLabel).to.equal('{{price-literal-per-unit-label}}');
    });
});
