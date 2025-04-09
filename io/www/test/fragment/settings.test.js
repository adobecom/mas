const { expect } = require('chai');
const { settings } = require('../../src/fragment/settings.js');

describe('settings transformer', () => {
    let context;

    beforeEach(() => {
        context = {
            body: {
                fields: {}
            }
        };
    });

    it('should add secure label and stock settings when variant is plans and showSecureLabel is undefined', async () => {
        context.body.fields.variant = 'plans';
        
        const result = await settings(context);
        expect(result.body.settings).to.deep.equal({
            stockCheckboxLabel: '{{stock-checkbox-label}}',
            stockOfferOsis: '',
            secureLabel: '{{secure-label}}'
        });
    });

    it('should add secure label when variant is plans and showSecureLabel is true', async () => {
        context.body.fields = {
            variant: 'plans',
            showSecureLabel: true
        };
        
        const result = await settings(context);
        expect(result.body.settings).to.deep.equal({
            stockCheckboxLabel: '{{stock-checkbox-label}}',
            stockOfferOsis: '',
            secureLabel: '{{secure-label}}'
        });
    });

    it('should not add secure label when variant is plans and showSecureLabel is false', async () => {
        context.body.fields = {
            variant: 'plans',
            showSecureLabel: false
        };
        
        const result = await settings(context);
        expect(result.body.settings).to.deep.equal({
            stockCheckboxLabel: '{{stock-checkbox-label}}',
            stockOfferOsis: ''
        });
    });

    it('should not add any settings when variant is not plans', async () => {
        context.body.fields.variant = 'other';
        
        const result = await settings(context);
        expect(result.body.settings).to.be.undefined;
    });

    it('should handle missing body', async () => {
        context = {};
        
        const result = await settings(context);
        expect(result).to.deep.equal(context);
    });

    it('should handle missing fields', async () => {
        context = { body: {} };
        
        const result = await settings(context);
        expect(result).to.deep.equal(context);
    });
});
