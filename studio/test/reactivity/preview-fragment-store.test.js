import { expect } from '@esm-bundle/chai';
import { mergeResolvedPreviewFields, serializePreviewFields } from '../../src/reactivity/preview-fragment-store.js';

describe('serializePreviewFields', () => {
    it('omits single-value settings inherit sentinels from preview payloads', () => {
        const result = serializePreviewFields([
            { name: 'showSecureLabel', values: [''] },
            { name: 'showPlanType', values: [''] },
            { name: 'addon', values: [''] },
            { name: 'description', values: [''] },
            { name: 'tags', multiple: true, values: [''] },
        ]);

        expect(result).to.not.have.property('showSecureLabel');
        expect(result).to.not.have.property('showPlanType');
        expect(result).to.not.have.property('addon');
        expect(result.description).to.equal('');
        expect(result.tags).to.deep.equal(['']);
    });

    it('keeps explicit setting values in preview payloads', () => {
        const result = serializePreviewFields([
            { name: 'showSecureLabel', values: ['true'] },
            { name: 'showPlanType', values: ['false'] },
            { name: 'addon', values: ['{{addon-stock-trial}}'] },
        ]);

        expect(result.showSecureLabel).to.equal('true');
        expect(result.showPlanType).to.equal('false');
        expect(result.addon).to.equal('{{addon-stock-trial}}');
    });
});

describe('mergeResolvedPreviewFields', () => {
    it('uses resolved field values from the preview response', () => {
        const result = mergeResolvedPreviewFields(
            [
                { name: 'variant', values: ['plans'] },
                { name: 'addon', values: [] },
            ],
            { variant: 'plans', addon: '<p>Resolved addon</p>' },
        );

        expect(result.find((field) => field.name === 'addon')?.values).to.deep.equal(['<p>Resolved addon</p>']);
    });

    it('backfills inherited settings from resolvedSettings when not in resolvedFields', () => {
        const result = mergeResolvedPreviewFields(
            [
                { name: 'variant', values: ['plans'] },
                { name: 'addon', values: [] },
                { name: 'showPlanType', values: [] },
                { name: 'showSecureLabel', values: [] },
            ],
            { variant: 'plans' },
            { addon: '<p>Resolved addon</p>', showPlanType: 'true', showSecureLabel: 'true' },
        );

        expect(result.find((field) => field.name === 'addon')?.values).to.deep.equal(['<p>Resolved addon</p>']);
        expect(result.find((field) => field.name === 'showPlanType')?.values).to.deep.equal(['true']);
        expect(result.find((field) => field.name === 'showSecureLabel')?.values).to.deep.equal(['true']);
    });

    it('preserves unresolved author fields instead of writing undefined', () => {
        const result = mergeResolvedPreviewFields(
            [
                { name: 'addon', values: [] },
                { name: 'showPlanType', values: [''] },
            ],
            {},
            {},
        );

        expect(result.find((field) => field.name === 'addon')?.values).to.deep.equal([]);
        expect(result.find((field) => field.name === 'showPlanType')?.values).to.deep.equal(['']);
    });

    it('does not mutate the original field objects', () => {
        const originalFields = [
            { name: 'variant', values: ['plans'] },
            { name: 'addon', values: [] },
        ];

        const result = mergeResolvedPreviewFields(originalFields, { variant: 'business' }, { addon: '<p>Resolved addon</p>' });

        expect(originalFields[0].values).to.deep.equal(['plans']);
        expect(originalFields[1].values).to.deep.equal([]);
        expect(result[0].values).to.deep.equal(['business']);
        expect(result[1].values).to.deep.equal(['<p>Resolved addon</p>']);
        expect(result[0]).to.not.equal(originalFields[0]);
        expect(result[1]).to.not.equal(originalFields[1]);
    });
});
