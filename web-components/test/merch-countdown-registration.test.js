import { expect } from '@esm-bundle/chai';
import '../src/merch-countdown.js';

// Own file: a second evaluation in the page of the main test would override its coverage.
describe('merch-countdown registration', () => {
    it('can be evaluated again, as when the card and collection bundles share a page', async () => {
        await import('../src/merch-countdown.js?second-bundle');
        expect(customElements.get('merch-countdown')).to.exist;
    });
});
