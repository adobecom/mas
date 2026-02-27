import { expect } from '@esm-bundle/chai';
import { Fragment } from '../../src/aem/fragment.js';
import { SettingStore } from '../../src/settings/setting-store.js';

describe('SettingStore', () => {
    const settingFragment = {
        id: 'setting-secure-label',
        title: 'Show secure label',
        status: 'PUBLISHED',
        modified: {
            by: 'Mr Bean',
            at: '2025-10-16T11:14:00.000Z',
        },
        tags: [{ id: 'mas:keyword/legal', title: 'Legal' }],
        path: '/content/dam/mas/acom/en_US/show-secure-label',
        fields: [
            { name: 'name', values: ['showSecureLabel'] },
            { name: 'label', values: ['Show secure label'] },
            { name: 'description', values: ["Show/hide the security label near the card's checkout button."] },
            { name: 'templates', values: ['catalog'] },
            { name: 'tags', values: ['mas:keyword/legal'] },
            { name: 'valuetype', values: ['boolean'] },
            { name: 'booleanValue', values: [true] },
            { name: 'textValue', values: [] },
            { name: 'richTextValue', values: [] },
            { name: 'overrides', values: ['[{"id":"o1","label":"Show secure label","locale":"FR (FR)"}]'] },
        ],
    };

    it('normalizes fragment data', () => {
        const store = new SettingStore(new Fragment(settingFragment));
        expect(store.value.id).to.equal('setting-secure-label');
        expect(store.value.name).to.equal('showSecureLabel');
        expect(store.value.label).to.equal('Show secure label');
        expect(store.value.value).to.equal(true);
        expect(store.value.booleanValue).to.equal(true);
        expect(store.value.templateIds).to.deep.equal(['catalog']);
        expect(store.value.tags).to.deep.equal(['mas:keyword/legal']);
        expect(store.value.overrides).to.have.length(1);
    });

    it('supports generic data mutators', () => {
        const store = new SettingStore(new Fragment(settingFragment));
        store.patchData({ foo: 'bar' });
        expect(store.value.data.foo).to.equal('bar');

        store.setValue(false);
        expect(store.value.value).to.equal(false);
        expect(store.value.data.value).to.equal(false);

        store.addOverride({ id: 'o2', label: 'Show secure label' });
        expect(store.value.overrides).to.have.length(2);

        store.removeOverride('o1');
        expect(store.value.overrides).to.have.length(1);
        expect(store.value.overrides[0].id).to.equal('o2');
    });
});
