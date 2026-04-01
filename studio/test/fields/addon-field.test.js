import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture } from '@open-wc/testing-helpers/pure';
import '../../src/swc.js';
import '../../src/fields/addon-field.js';
import { spTheme } from '../utils.js';

describe('Addon field', () => {
    let repository;
    let loadCount;

    beforeEach(() => {
        loadCount = 0;
        repository = document.createElement('mas-repository');
        repository.setAttribute('bucket', 'test');
        repository.loadAddonPlaceholders = async () => {
            loadCount += 1;
        };
        document.body.append(repository);
    });

    afterEach(() => {
        repository?.remove();
    });

    it('loads addon placeholders when an inherited placeholder value arrives after connect', async () => {
        const el = await fixture(html`<mas-addon-field label="Show Addon"></mas-addon-field>`, { parentNode: spTheme() });

        expect(loadCount).to.equal(0);

        el.value = '{{addon-stock-trial}}';
        await el.updateComplete;

        expect(loadCount).to.equal(1);

        const combobox = el.querySelector('sp-combobox');
        expect(combobox).to.exist;
        expect(combobox.value).to.equal('addon-stock-trial');
    });
});
