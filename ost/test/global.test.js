import { expect } from '@open-wc/testing';
import '../src/global.js';

describe('openOfferSelectorTool config forwarding', () => {
    let close;
    let root;

    beforeEach(() => {
        root = document.createElement('div');
        document.body.appendChild(root);
    });

    afterEach(() => {
        close?.();
        root.remove();
    });

    function openWith(options) {
        close = window.ost.openOfferSelectorTool({ rootElement: root, ...options });
        return root.querySelector('ost-app');
    }

    it('forwards bundleOsis and authoringFlow to app.config for a bundle reopen', () => {
        const app = openWith({ bundleOsis: ['osi-a', 'osi-b', 'osi-c'], authoringFlow: 'bundle' });
        expect(app.config.bundleOsis).to.deep.equal(['osi-a', 'osi-b', 'osi-c']);
        expect(app.config.authoringFlow).to.equal('bundle');
    });

    it('forwards searchOfferSelectorId and initialReferenceOsi for a single/discount reopen', () => {
        const app = openWith({ searchOfferSelectorId: 'osi-base', initialReferenceOsi: 'osi-ref' });
        expect(app.config.searchOfferSelectorId).to.equal('osi-base');
        expect(app.config.initialReferenceOsi).to.equal('osi-ref');
        expect(app.config.bundleOsis).to.be.undefined;
    });
});
