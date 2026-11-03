import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture } from '@open-wc/testing-helpers/pure';
import '../src/swc.js';
import '../src/mas-toast.js';
import Events from '../src/events.js';
import { showToast } from '../src/utils.js';

describe('mas-toast', () => {
    async function setup() {
        const el = await fixture(html`<mas-toast></mas-toast>`);
        return el.shadowRoot.querySelector('sp-toast');
    }

    it('auto-closes by default', async () => {
        const toast = await setup();
        Events.toast.emit({ variant: 'info', content: 'hello' });
        expect(toast.timeout).to.equal(6000);
    });

    it('stays open when persistent', async () => {
        const toast = await setup();
        Events.toast.emit({ variant: 'warning', content: 'hello', persistent: true });
        expect(toast.timeout).to.equal(null);
    });

    it('auto-closes a regular toast shown after a persistent one', async () => {
        const toast = await setup();
        Events.toast.emit({ variant: 'warning', content: 'first', persistent: true });
        Events.toast.emit({ variant: 'info', content: 'second' });
        expect(toast.timeout).to.equal(6000);
    });

    it('lets showToast request a persistent toast', async () => {
        const toast = await setup();
        showToast('hello', 'warning', { persistent: true });
        expect(toast.timeout).to.equal(null);
    });
});
