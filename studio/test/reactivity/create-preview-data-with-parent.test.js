import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { Fragment } from '../../src/aem/fragment.js';
import { createPreviewDataWithParent } from '../../src/reactivity/source-fragment-store.js';
import Store from '../../src/store.js';

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
});
