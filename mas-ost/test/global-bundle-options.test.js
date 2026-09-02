import { expect } from '@esm-bundle/chai';
import { store } from '../src/store/ost-store.js';
// global.js exports nothing; it installs window.ost as a side effect.
import '../src/global.js';

const openOfferSelectorTool = (options) => window.ost.openOfferSelectorTool(options);

/**
 * openOfferSelectorTool destructures a fixed set of options and forwards them
 * to store.init. Anything not in that destructure is dropped silently, and
 * two of the bundle flow's inputs are:
 *
 *   bundleOsis      studio/src/rte/ost.js:364 computes it from a soft-bundle
 *                   placeholder and passes it. It is not destructured, so a
 *                   reopened bundle opens with nothing selected — while
 *                   authoringFlow: 'bundle' IS forwarded, so the user lands in
 *                   bundle mode on an empty selection.
 *   onBundleSelect  read by mas-ost-app.selectBundle(), declared null on the
 *                   store, never assigned by any caller. The bundle footer's
 *                   Use button therefore does nothing.
 *
 * studio/test/rte/ost.test.js asserts bundleOsis is PASSED, which is true and
 * which is why this looked wired. Nothing asserted it arrives. These tests
 * record the boundary as it actually behaves, and fail when it is fixed, at
 * which point they should be rewritten to assert the working behaviour.
 *
 * Restoring a bundle needs each OSI resolved back into an offer, which is more
 * than a wiring change: the existing deep-link path resolves one offer, not N.
 */
describe('mas-ost global options boundary', () => {
    it('drops bundleOsis, so a reopened bundle has no selection', () => {
        const osis = ['osi-a', 'osi-b', 'osi-c'];

        openOfferSelectorTool({ bundleOsis: osis, authoringFlow: 'bundle', rootElement: document.createElement('div') });

        expect(store.authoringFlow, 'the flow IS forwarded').to.equal('bundle');
        expect(store.selectedOffers, 'but nothing is selected in it').to.deep.equal([]);
    });

    it('leaves onBundleSelect unassigned, so the bundle Use button is a no-op', () => {
        const onBundleSelect = () => {};

        openOfferSelectorTool({ onBundleSelect, authoringFlow: 'bundle', rootElement: document.createElement('div') });

        expect(store.onBundleSelect, 'callers cannot supply this yet').to.equal(null);
    });

    it('forwards the callbacks that ARE wired, so this is a gap and not a broken boundary', () => {
        const onMultiSelect = () => {};

        openOfferSelectorTool({ onMultiSelect, multiSelect: true, rootElement: document.createElement('div') });

        expect(store.onMultiSelect).to.equal(onMultiSelect);
        expect(store.authoringFlow).to.equal('tryBuy');
    });
});
