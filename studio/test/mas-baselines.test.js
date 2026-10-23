import { expect } from '@esm-bundle/chai';
import '../src/baselines/mas-baselines.js';

async function renderBaselines() {
    const el = document.createElement('mas-baselines');
    document.body.append(el);
    await el.updateComplete;
    return el;
}

describe('MasBaselines', () => {
    afterEach(() => {
        for (const el of document.querySelectorAll('mas-baselines')) {
            el.remove();
        }
    });

    it('renders the Baselines page heading', async () => {
        const el = await renderBaselines();

        expect(el.shadowRoot.querySelector('h1').textContent).to.equal('Baselines');
    });

    it('renders the create dialog only while it is open', async () => {
        const el = await renderBaselines();
        expect(el.shadowRoot.querySelector('mas-create-dialog')).to.not.exist;

        el.createDialogOpen = true;
        await el.updateComplete;
        const dialog = el.shadowRoot.querySelector('mas-create-dialog');
        expect(dialog.getAttribute('type')).to.equal('baseline');

        dialog.dispatchEvent(new CustomEvent('close'));
        await el.updateComplete;

        expect(el.createDialogOpen).to.be.false;
        expect(el.shadowRoot.querySelector('mas-create-dialog')).to.not.exist;
    });

    it('renders an enabled Create Baseline button', async () => {
        const el = await renderBaselines();
        const button = el.shadowRoot.querySelector('sp-button');

        expect(button.textContent.trim()).to.equal('Create Baseline');
        expect(button.hasAttribute('disabled')).to.be.false;
    });
});
