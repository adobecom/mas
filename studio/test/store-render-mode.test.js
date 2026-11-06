import { expect } from '@open-wc/testing';

const RENDER_MODE_KEY = 'mas-render-mode';

describe('store renderMode default', () => {
    let savedRenderMode;
    let importCount = 0;

    const loadStore = async () => {
        importCount += 1;
        const { default: Store } = await import(`../src/store.js?render-mode=${importCount}`);
        return Store;
    };

    beforeEach(() => {
        savedRenderMode = localStorage.getItem(RENDER_MODE_KEY);
    });

    afterEach(() => {
        if (savedRenderMode === null) {
            localStorage.removeItem(RENDER_MODE_KEY);
        } else {
            localStorage.setItem(RENDER_MODE_KEY, savedRenderMode);
        }
    });

    it('defaults to table when no view choice is saved', async () => {
        localStorage.removeItem(RENDER_MODE_KEY);
        const Store = await loadStore();
        expect(Store.renderMode.get()).to.equal('table');
    });

    it('restores a saved render view', async () => {
        localStorage.setItem(RENDER_MODE_KEY, 'render');
        const Store = await loadStore();
        expect(Store.renderMode.get()).to.equal('render');
    });

    it('restores a saved table view', async () => {
        localStorage.setItem(RENDER_MODE_KEY, 'table');
        const Store = await loadStore();
        expect(Store.renderMode.get()).to.equal('table');
    });
});
