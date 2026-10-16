import { expect } from '@esm-bundle/chai';
import Store from '../src/store.js';
import '../src/baselines/mas-baselines.js';

const email = 'editor@adobe.com';
const originalProfile = Store.profile.get();
const originalUsers = Store.users.get();

async function renderCreateButton(groups, userEmail = email) {
    Store.profile.set(userEmail ? { email: userEmail } : {});
    Store.users.set(userEmail ? [{ userPrincipalName: userEmail, groups }] : []);

    const el = document.createElement('mas-baselines');
    document.body.append(el);
    await el.updateComplete;
    return el.shadowRoot.querySelector('sp-button');
}

describe('MasBaselines', () => {
    afterEach(() => {
        for (const el of document.querySelectorAll('mas-baselines')) {
            el.remove();
        }
        Store.profile.set(originalProfile);
        Store.users.set(originalUsers);
    });

    it('renders the Baselines page heading', async () => {
        const button = await renderCreateButton([]);

        expect(button.getRootNode().textContent).to.include('Baselines');
    });

    it('disables project creation when no user is identified', async () => {
        const button = await renderCreateButton([], '');

        expect(button.hasAttribute('disabled')).to.be.true;
    });

    it('disables project creation for users outside the allowed groups', async () => {
        const button = await renderCreateButton(['OTHER-GROUP']);

        expect(button.hasAttribute('disabled')).to.be.true;
    });

    it('enables project creation for promo editors', async () => {
        const button = await renderCreateButton(['GRP-ODIN-MAS-PROMO-EDITORS']);

        expect(button.hasAttribute('disabled')).to.be.false;
    });

    it('enables project creation once both profile and user groups arrive, in either order', async () => {
        const setProfile = () => Store.profile.set({ email });
        const setUsers = () => Store.users.set([{ userPrincipalName: email, groups: ['GRP-ODIN-MAS-PROMO-EDITORS'] }]);

        for (const order of [
            [setUsers, setProfile],
            [setProfile, setUsers],
        ]) {
            const button = await renderCreateButton([], '');
            const el = button.getRootNode().host;
            for (const setStore of order) {
                setStore();
                await el.updateComplete;
            }

            expect(button.hasAttribute('disabled')).to.be.false;
        }
    });

    it('enables project creation for admins', async () => {
        const button = await renderCreateButton(['GRP-ODIN-MAS-ADMINS']);

        expect(button.hasAttribute('disabled')).to.be.false;
    });
});
