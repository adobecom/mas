import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import Store from '../../src/store.js';
import '../../src/masks/mas-masks.js';
import '../../src/mas-confirm-dialog.js';

function createAemMock() {
    return {
        sites: {
            cf: {
                fragments: {
                    search: async function* () {
                        yield [
                            { id: 'm1', title: 'Mask One', path: '/content/dam/mas/acom/en_US/masks/m1', fields: [] },
                            { id: 'm2', title: 'Mask Two', path: '/content/dam/mas/acom/en_US/masks/m2', fields: [] },
                        ];
                    },
                    getById: sinon.stub(),
                },
            },
        },
        folders: { create: sinon.stub().resolves() },
        wait: sinon.stub().resolves(),
        saveTags: sinon.stub().resolves(),
    };
}

async function mount() {
    const el = document.createElement('mas-masks');
    document.body.appendChild(el);
    await el.updateComplete;
    return el;
}

describe('mas-masks', () => {
    afterEach(() => {
        Store.profile.set({});
        Store.users.set([]);
        Store.search.set({});
        Store.masks.destroy();
        Store.masks.setAem(null);
        document.querySelectorAll('mas-masks').forEach((node) => node.remove());
    });

    it('shows a no-access message when the user cannot access masks', async () => {
        Store.search.set({ path: 'acom' });
        const el = await mount();
        await el.updateComplete;
        expect(el.shadowRoot.querySelector('.no-access')).to.not.equal(null);
    });

    it('lists masks as a table for the current surface/locale for an authorized user', async () => {
        Store.profile.set({ email: 'admin@adobe.com' });
        Store.users.set([{ userPrincipalName: 'admin@adobe.com', groups: ['GRP-ODIN-MAS-ADMINS'] }]);
        Store.search.set({ path: 'acom' });
        Store.masks.setAem(createAemMock());

        const el = await mount();
        await Store.masks.ensureLoaded('acom', Store.localeOrRegion());
        await el.updateComplete;

        const rows = el.shadowRoot.querySelectorAll('sp-table-row');
        expect(rows.length).to.equal(2);
        expect(rows[0].querySelector('sp-table-cell').textContent.trim()).to.equal('Mask One');
    });

    describe('delete confirmation', () => {
        async function mountWithMasks() {
            Store.profile.set({ email: 'admin@adobe.com' });
            Store.users.set([{ userPrincipalName: 'admin@adobe.com', groups: ['GRP-ODIN-MAS-ADMINS'] }]);
            Store.search.set({ path: 'acom' });
            Store.masks.setAem(createAemMock());
            const el = await mount();
            await Store.masks.ensureLoaded('acom', Store.localeOrRegion());
            await el.updateComplete;
            return el;
        }

        it('shows confirmation dialog before deleting from list', async () => {
            const el = await mountWithMasks();
            const deleteMaskStub = sinon.stub(Store.masks, 'deleteMask').resolves(true);

            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            // Delete is the 3rd menu item (index 2): Edit, Publish, Delete
            rows[0].querySelectorAll('sp-menu-item')[2].click();

            await new Promise((r) => setTimeout(r, 0));

            expect(Store.confirmDialogOptions.get()).to.not.equal(null);
            expect(Store.confirmDialogOptions.get().title).to.equal('Delete mask');

            const confirmEl = document.createElement('mas-confirm-dialog');
            document.body.appendChild(confirmEl);
            confirmEl.handleDialogAction(false);

            await new Promise((r) => setTimeout(r, 0));
            expect(deleteMaskStub.called).to.be.false;

            deleteMaskStub.restore();
            confirmEl.remove();
        });

        it('deletes mask from list after confirming', async () => {
            const el = await mountWithMasks();
            const deleteMaskStub = sinon.stub(Store.masks, 'deleteMask').resolves(true);

            const rows = el.shadowRoot.querySelectorAll('sp-table-row');
            rows[0].querySelectorAll('sp-menu-item')[2].click();

            await new Promise((r) => setTimeout(r, 0));

            const confirmEl = document.createElement('mas-confirm-dialog');
            document.body.appendChild(confirmEl);
            confirmEl.handleDialogAction(true);

            await new Promise((r) => setTimeout(r, 20));
            expect(deleteMaskStub.calledWith('m1')).to.be.true;

            deleteMaskStub.restore();
            confirmEl.remove();
        });
    });
});
