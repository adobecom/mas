import { expect } from '@esm-bundle/chai';
import { Fragment } from '../../src/aem/fragment.js';
import { SettingStore } from '../../src/settings/setting-store.js';

describe('SettingStore', () => {
    const settingFragment = {
        id: 'setting-secure-transaction',
        title: 'Show secure transaction',
        status: 'PUBLISHED',
        modified: {
            by: 'Mr Bean',
            at: '2025-10-16T11:14:00.000Z',
        },
        tags: [{ id: 'mas:keyword/legal', title: 'Legal' }],
        path: '/content/dam/mas/acom/en_US/show-secure-transaction',
        fields: [
            { name: 'name', values: ['showSecureTransaction'] },
            { name: 'label', values: ['Show secure transaction'] },
            { name: 'description', values: ["Show/hide the security lock icon and label near the card's checkout button."] },
            { name: 'variant', values: ['catalog'] },
            { name: 'value', values: [true] },
            { name: 'overrides', values: ['[{"id":"o1","label":"Show secure transaction","locale":"FR (FR)"}]'] },
        ],
    };

    it('normalizes fragment data', () => {
        const store = new SettingStore(new Fragment(settingFragment));
        expect(store.value.id).to.equal('setting-secure-transaction');
        expect(store.value.name).to.equal('showSecureTransaction');
        expect(store.value.label).to.equal('Show secure transaction');
        expect(store.value.value).to.equal(true);
        expect(store.value.templateIds).to.deep.equal(['catalog']);
        expect(store.value.tags).to.deep.equal(['Legal']);
        expect(store.value.overrides).to.have.length(1);
    });

    it('supports generic data mutators', () => {
        const store = new SettingStore(new Fragment(settingFragment));
        store.patchData({ foo: 'bar' });
        expect(store.value.data.foo).to.equal('bar');

        store.setValue(false);
        expect(store.value.value).to.equal(false);
        expect(store.value.data.value).to.equal(false);

        store.addOverride({ id: 'o2', label: 'Show secure transaction' });
        expect(store.value.overrides).to.have.length(2);

        store.removeOverride('o1');
        expect(store.value.overrides).to.have.length(1);
        expect(store.value.overrides[0].id).to.equal('o2');
    });
});
