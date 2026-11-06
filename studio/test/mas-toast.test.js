import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture } from '@open-wc/testing-helpers/pure';
import '../src/swc.js';
import '../src/mas-toast.js';
import Events from '../src/events.js';

describe('mas-toast', () => {
    async function setup() {
        const el = await fixture(html`<mas-toast></mas-toast>`);
        const [regular, pinned] = el.shadowRoot.querySelectorAll('sp-toast');
        return { regular, pinned };
    }

    it('shows a regular toast that auto-closes', async () => {
        const { regular } = await setup();
        Events.toast.emit({ variant: 'info', content: 'hello' });
        expect([regular.textContent, regular.open, regular.timeout]).to.deep.equal(['hello', true, 6000]);
    });

    it('shows a pinned toast that closes after 30 seconds', async () => {
        const { pinned } = await setup();
        Events.toast.emit({ variant: 'warning', content: 'hello', pinned: true });
        expect([pinned.textContent, pinned.open, pinned.timeout]).to.deep.equal(['hello', true, 30000]);
    });

    it('keeps a pinned toast when a regular toast follows', async () => {
        const { pinned } = await setup();
        Events.toast.emit({ variant: 'warning', content: 'keep me', pinned: true });
        Events.toast.emit({ variant: 'positive', content: 'saved' });
        expect([pinned.textContent, pinned.open]).to.deep.equal(['keep me', true]);
    });

    it('takes no space while a toast is closed', async () => {
        const { pinned } = await setup();
        expect(getComputedStyle(pinned).display).to.equal('none');
    });
});
