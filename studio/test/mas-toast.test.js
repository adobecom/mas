import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture } from '@open-wc/testing-helpers/pure';
import '../src/swc.js';
import '../src/mas-toast.js';
import Events from '../src/events.js';

describe('mas-toast', () => {
    async function setup() {
        const el = await fixture(html`<mas-toast></mas-toast>`);
        const [regular, persistent] = el.shadowRoot.querySelectorAll('sp-toast');
        return { regular, persistent };
    }

    it('shows a regular toast that auto-closes', async () => {
        const { regular } = await setup();
        Events.toast.emit({ variant: 'info', content: 'hello' });
        expect([regular.textContent, regular.open, regular.timeout]).to.deep.equal(['hello', true, 6000]);
    });

    it('shows a persistent toast that stays open', async () => {
        const { persistent } = await setup();
        Events.toast.emit({ variant: 'warning', content: 'hello', persistent: true });
        expect([persistent.textContent, persistent.open, persistent.timeout]).to.deep.equal(['hello', true, null]);
    });

    it('keeps a persistent toast when a regular toast follows', async () => {
        const { persistent } = await setup();
        Events.toast.emit({ variant: 'warning', content: 'keep me', persistent: true });
        Events.toast.emit({ variant: 'positive', content: 'saved' });
        expect([persistent.textContent, persistent.open]).to.deep.equal(['keep me', true]);
    });

    it('takes no space while a toast is closed', async () => {
        const { persistent } = await setup();
        expect(getComputedStyle(persistent).display).to.equal('none');
    });
});
