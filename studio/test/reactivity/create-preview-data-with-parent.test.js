import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { Fragment } from '../../src/aem/fragment.js';
import { createPreviewDataWithParent } from '../../src/reactivity/source-fragment-store.js';
import { variationFieldShouldInheritParent } from '../../src/aem/variation-utils.js';
import { EXPLICIT_EMPTY_SENTINEL } from '../../../io/www/src/fragment/utils/explicit-empty.js';
import Store from '../../src/store.js';

describe('variationFieldShouldInheritParent', () => {
    it('returns true for empty source values (inherit)', () => {
        expect(variationFieldShouldInheritParent([])).to.be.true;
        expect(variationFieldShouldInheritParent(null)).to.be.true;
    });

    it('returns false for explicit_empty sentinel (intentional clear — do not inherit)', () => {
        expect(variationFieldShouldInheritParent([EXPLICIT_EMPTY_SENTINEL])).to.be.false;
    });

    it('returns true for [""] on single-value field (AEM empty initializer)', () => {
        expect(variationFieldShouldInheritParent([''], false)).to.be.true;
    });

    it('returns false for [""] on multiple-value field (explicit clear)', () => {
        expect(variationFieldShouldInheritParent([''], true)).to.be.false;
    });

    it('returns false when source has actual values', () => {
        expect(variationFieldShouldInheritParent(['some value'])).to.be.false;
    });

    it('returns true for [null] and [undefined] (AEM null entries — semantically empty)', () => {
        expect(variationFieldShouldInheritParent([null])).to.be.true;
        expect(variationFieldShouldInheritParent([undefined])).to.be.true;
        expect(variationFieldShouldInheritParent([null, null])).to.be.true;
    });
});

describe('createPreviewDataWithParent', () => {
    afterEach(() => {
        sinon.restore();
    });

    it('adds quantitySelect from global settings when parent fragment has no quantitySelect field', () => {
        const qtyMarkup = '<merch-quantity-select title="Qty" min="1" max="10" step="1"></merch-quantity-select>';
        const parent = new Fragment({
            path: '/content/dam/mas/nala/en_US/test-parent-qty-inherit',
            id: 'parent-qty',
            model: { path: '/conf/mas/fragment' },
            fields: [{ name: 'variant', values: ['plans'] }],
        });

        const variation = {
            path: '/content/dam/mas/nala/en_AU/test-var-qty-inherit',
            id: 'var-qty',
            model: { path: '/conf/mas/fragment' },
            fields: [],
        };

        const settingsRows = [
            {
                value: {
                    name: 'quantitySelect',
                    templateIds: ['plans'],
                    value: qtyMarkup,
                    valueType: 'optional-text',
                    booleanValue: true,
                    tags: [],
                    locales: [],
                    overrides: [],
                },
            },
        ];

        sinon.stub(Store.settings.rows, 'get').returns(settingsRows);

        const merged = createPreviewDataWithParent(variation, parent);
        const qty = merged.fields.find((f) => f.name === 'quantitySelect');

        expect(qty?.values?.[0]).to.equal(qtyMarkup);
    });

    it('does not overwrite settings field with AEM-empty initializer [""] with settings default', () => {
        const qtyMarkup = '<merch-quantity-select title="Qty" min="1" max="10" step="1"></merch-quantity-select>';
        const parent = new Fragment({
            path: '/content/dam/mas/nala/en_US/test-parent-qty-empty',
            id: 'parent-qty-empty',
            model: { path: '/conf/mas/fragment' },
            fields: [{ name: 'variant', values: ['plans'] }],
        });

        const variation = {
            path: '/content/dam/mas/nala/en_AU/test-var-qty-empty',
            id: 'var-qty-empty',
            model: { path: '/conf/mas/fragment' },
            fields: [{ name: 'quantitySelect', values: [''], multiple: false }],
        };

        sinon.stub(Store.settings.rows, 'get').returns([
            {
                value: {
                    name: 'quantitySelect',
                    templateIds: ['plans'],
                    value: qtyMarkup,
                    valueType: 'optional-text',
                    booleanValue: true,
                    tags: [],
                    locales: [],
                    overrides: [],
                },
            },
        ]);

        const merged = createPreviewDataWithParent(variation, parent);
        const qty = merged.fields.find((f) => f.name === 'quantitySelect');

        expect(qty?.values).to.deep.equal(['']);
    });

    it('does not overwrite explicit_empty sentinel badge with parent value', () => {
        const parent = new Fragment({
            path: '/content/dam/mas/nala/en_US/parent-badge',
            id: 'parent-badge',
            model: { path: '/conf/mas/fragment' },
            fields: [{ name: 'badge', values: ['Sale'] }],
        });
        const variation = {
            path: '/content/dam/mas/nala/en_AU/var-badge',
            id: 'var-badge',
            model: { path: '/conf/mas/fragment' },
            fields: [{ name: 'badge', values: [EXPLICIT_EMPTY_SENTINEL] }],
        };

        sinon.stub(Store.settings.rows, 'get').returns([]);

        const merged = createPreviewDataWithParent(variation, parent);
        const badgeField = merged.fields.find((f) => f.name === 'badge');

        expect(badgeField.values).to.deep.equal([EXPLICIT_EMPTY_SENTINEL]);
    });
});
