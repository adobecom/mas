import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';
import '../../src/swc.js';
import '../../src/translation/mas-translation-languages.js';
import Store from '../../src/store.js';

describe('MasTranslationLanguages', () => {
    afterEach(() => {
        fixtureCleanup();
    });

    describe('initialization', () => {
        it('should initialize with locales array from store surface, excluding en_US', async () => {
            Store.search.set({ path: 'acom' });
            const el = await fixture(html`<mas-translation-langs .selectedLanguages=${[]}></mas-translation-langs>`);
            expect(el.localesArray).to.be.an('array');
            expect(el.localesArray.length).to.be.greaterThan(0);
            expect(el.localesArray.some((item) => item.lang === 'en' && item.country === 'US')).to.be.false;
        });
    });
});
