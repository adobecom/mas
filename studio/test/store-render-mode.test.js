import { expect } from '@esm-bundle/chai';
import '../src/mas-toolbar.js';
import Store from '../src/store.js';

const KEY = 'mas-render-mode';
const clearCookie = () => {
    document.cookie = `${KEY}=; path=/; max-age=0`;
};

// wds-import-map=0 keeps the dev server propagating the import map, so only store.js is re-evaluated.
const loadStore = async () => (await import(`../src/store.js?wds-import-map=0&render-mode=${Date.now()}`)).default;

describe('Store.renderMode default', function () {
    this.timeout(30000);

    beforeEach(() => {
        clearCookie();
        localStorage.removeItem(KEY);
    });

    afterEach(() => {
        clearCookie();
        localStorage.removeItem(KEY);
    });

    it('defaults to table without a saved view', async () => {
        expect((await loadStore()).renderMode.get()).to.equal('table');
    });

    it('restores the view saved for this browser session', async () => {
        document.cookie = `${KEY}=render; path=/`;
        expect((await loadStore()).renderMode.get()).to.equal('render');
    });

    it('ignores a stale localStorage value', async () => {
        localStorage.setItem(KEY, 'render');
        expect((await loadStore()).renderMode.get()).to.equal('table');
    });

    it('saves the toolbar choice in the session cookie only', () => {
        const savedMode = Store.renderMode.get();
        try {
            document.createElement('mas-toolbar').handleRenderModeChange({ target: { value: 'render' } });
            expect(document.cookie).to.include(`${KEY}=render`);
            expect(localStorage.getItem(KEY)).to.be.null;
            expect(Store.renderMode.get()).to.equal('render');
        } finally {
            Store.renderMode.set(savedMode);
        }
    });
});
