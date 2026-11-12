import { expect } from '@esm-bundle/chai';
import '../src/mas-toolbar.js';
import Store from '../src/store.js';

const KEY = 'mas-render-mode';
let importCounter = 0;

// wds-import-map=0 keeps the dev server propagating the import map to store.js's imports, so only store.js is
// re-evaluated; without it every dependency would be reloaded as a duplicate module (e.g. re-registering elements).
const loadStore = async () =>
    (await import(`../src/store.js?wds-import-map=0&render-mode=${Date.now()}-${importCounter++}`)).default;

const restore = (storage, value) => {
    if (value === null) storage.removeItem(KEY);
    else storage.setItem(KEY, value);
};

describe('Store.renderMode default', function () {
    // Each fresh store.js import is fetched and instrumented by the dev server, which can exceed the 5s default.
    this.timeout(30000);

    let savedSession;
    let savedLocal;

    beforeEach(() => {
        savedSession = sessionStorage.getItem(KEY);
        savedLocal = localStorage.getItem(KEY);
        sessionStorage.removeItem(KEY);
        localStorage.removeItem(KEY);
    });

    afterEach(() => {
        restore(sessionStorage, savedSession);
        restore(localStorage, savedLocal);
    });

    it('defaults to table when sessionStorage is empty', async () => {
        const store = await loadStore();
        expect(store.renderMode.get()).to.equal('table');
    });

    it('ignores a stale localStorage render value and defaults to table', async () => {
        localStorage.setItem(KEY, 'render');
        const store = await loadStore();
        expect(store.renderMode.get()).to.equal('table');
        expect(localStorage.getItem(KEY)).to.equal('render');
        expect(sessionStorage.getItem(KEY)).to.be.null;
    });

    it('uses render when sessionStorage has render', async () => {
        sessionStorage.setItem(KEY, 'render');
        const store = await loadStore();
        expect(store.renderMode.get()).to.equal('render');
    });

    it('uses table when sessionStorage has table', async () => {
        sessionStorage.setItem(KEY, 'table');
        const store = await loadStore();
        expect(store.renderMode.get()).to.equal('table');
    });

    it('toolbar view change writes sessionStorage and not localStorage', () => {
        const savedMode = Store.renderMode.get();
        try {
            const toolbar = document.createElement('mas-toolbar');
            toolbar.handleRenderModeChange({ target: { value: 'render' } });
            expect(sessionStorage.getItem(KEY)).to.equal('render');
            expect(localStorage.getItem(KEY)).to.be.null;
            expect(Store.renderMode.get()).to.equal('render');
        } finally {
            Store.renderMode.set(savedMode);
        }
    });
});
