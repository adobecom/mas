import { expect } from '@open-wc/testing';
import { SearchController } from '../../src/controllers/search-controller.js';

function createMockHost() {
    return {
        controllers: [],
        addController(c) { this.controllers.push(c); },
        removeController() {},
        requestUpdate() {},
    };
}

describe('SearchController', () => {
    let host;
    let ctrl;

    beforeEach(() => {
        host = createMockHost();
        ctrl = new SearchController(host);
    });

    it('registers itself on the host', () => {
        expect(host.controllers).to.include(ctrl);
    });

    it('initializes with empty state', () => {
        expect(ctrl.query).to.equal('');
        expect(ctrl.resultType).to.equal('');
    });

    it('detects product name text', () => {
        expect(ctrl.detectType('Photoshop')).to.equal('product');
    });

    it('detects a 32-char hex offer ID', () => {
        expect(ctrl.detectType('257E1D82082387D152029F93C1030624')).to.equal('offer');
    });

    it('detects a 43-char base64 OSI', () => {
        const osi = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0ABC';
        expect(ctrl.detectType(osi)).to.equal('osi');
    });

    it('returns product for empty string', () => {
        expect(ctrl.detectType('')).to.equal('product');
    });

    it('updates query and resultType on handleInput', async () => {
        ctrl.handleInput('257E1D82082387D152029F93C1030624');
        await new Promise((r) => setTimeout(r, 300));
        expect(ctrl.query).to.equal('257E1D82082387D152029F93C1030624');
        expect(ctrl.resultType).to.equal('offer');
    });

    it('updates query for product name', async () => {
        ctrl.handleInput('Acrobat Pro');
        await new Promise((r) => setTimeout(r, 300));
        expect(ctrl.query).to.equal('Acrobat Pro');
        expect(ctrl.resultType).to.equal('product');
    });

    it('debounces input handling', async () => {
        let updateCount = 0;
        host.requestUpdate = () => { updateCount++; };
        ctrl.handleInput('A');
        ctrl.handleInput('Ab');
        ctrl.handleInput('Abc');
        await new Promise((r) => setTimeout(r, 300));
        expect(updateCount).to.be.greaterThan(0);
        expect(ctrl.query).to.equal('Abc');
    });

    it('hostConnected and hostDisconnected are callable', () => {
        ctrl.hostConnected();
        ctrl.hostDisconnected();
    });
});
