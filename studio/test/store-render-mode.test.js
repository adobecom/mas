import { expect } from '@open-wc/testing';

const STORAGE_KEY = 'mas-render-mode';
let importCounter = 0;

const loadFreshStore = async () => (await import(`../src/store.js?render-mode-test=${Date.now()}-${importCounter++}`)).default;

describe('store renderMode default', () => {
    let originalValue;

    beforeEach(() => {
        originalValue = localStorage.getItem(STORAGE_KEY);
    });

    afterEach(() => {
        if (originalValue === null) {
            localStorage.removeItem(STORAGE_KEY);
        } else {
            localStorage.setItem(STORAGE_KEY, originalValue);
        }
    });

    it('defaults to table view when no view choice is stored', async () => {
        localStorage.removeItem(STORAGE_KEY);
        const Store = await loadFreshStore();
        expect(Store.renderMode.get()).to.equal('table');
    });

    it('keeps a stored render view choice', async () => {
        localStorage.setItem(STORAGE_KEY, 'render');
        const Store = await loadFreshStore();
        expect(Store.renderMode.get()).to.equal('render');
    });

    it('keeps a stored table view choice', async () => {
        localStorage.setItem(STORAGE_KEY, 'table');
        const Store = await loadFreshStore();
        expect(Store.renderMode.get()).to.equal('table');
    });

    it('persists the toggle choice for later loads', async () => {
        await import('../src/mas-toolbar.js');
        const { default: MainStore } = await import('../src/store.js');
        const previousMode = MainStore.renderMode.get();
        const el = document.createElement('mas-toolbar');
        try {
            el.handleRenderModeChange({ target: { value: 'render' } });
            expect(localStorage.getItem(STORAGE_KEY)).to.equal('render');
            expect(MainStore.renderMode.get()).to.equal('render');
            const Store = await loadFreshStore();
            expect(Store.renderMode.get()).to.equal('render');
        } finally {
            MainStore.renderMode.set(previousMode);
        }
    });
});
