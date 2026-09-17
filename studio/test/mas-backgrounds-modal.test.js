import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, oneEvent } from '@open-wc/testing-helpers/pure';
import '../src/swc.js';
import '../src/mas-backgrounds-modal.js';
import { spTheme } from './utils.js';

const DESKTOP_URL = 'https://main--da-cc--adobecom.aem.page/media_desktop.png';
const TABLET_URL = 'https://main--da-cc--adobecom.aem.page/media_tablet.png';
const MOBILE_URL = 'https://main--da-cc--adobecom.aem.page/media_mobile.png';

describe('MAS Backgrounds Modal', () => {
    it('dispatches save with all three URLs when all three inputs are filled', async () => {
        const el = await fixture(html`<mas-backgrounds-modal open></mas-backgrounds-modal>`, { parentNode: spTheme() });

        el.desktop = DESKTOP_URL;
        el.tablet = TABLET_URL;
        el.mobile = MOBILE_URL;
        await el.updateComplete;

        const listener = oneEvent(el, 'save');
        el.shadowRoot.querySelector('sp-button[variant="accent"]').click();
        const event = await listener;

        expect(event.detail).to.deep.equal({ desktop: DESKTOP_URL, tablet: TABLET_URL, mobile: MOBILE_URL });
        expect(el.open).to.be.false;
    });

    it('dispatches save with only the fields that are filled', async () => {
        const el = await fixture(html`<mas-backgrounds-modal open></mas-backgrounds-modal>`, { parentNode: spTheme() });

        el.desktop = '';
        el.tablet = '';
        el.mobile = MOBILE_URL;
        await el.updateComplete;

        const listener = oneEvent(el, 'save');
        el.shadowRoot.querySelector('sp-button[variant="accent"]').click();
        const event = await listener;

        expect(event.detail).to.deep.equal({ desktop: '', tablet: '', mobile: MOBILE_URL });
    });

    it('restores original values and fires modal-close on cancel', async () => {
        const el = await fixture(html`<mas-backgrounds-modal open desktop="${DESKTOP_URL}"></mas-backgrounds-modal>`, {
            parentNode: spTheme(),
        });
        await el.updateComplete;

        el.desktop = 'https://main--da-cc--adobecom.aem.page/changed.png';
        await el.updateComplete;

        const listener = oneEvent(el, 'modal-close');
        el.shadowRoot.querySelector('sp-button[variant="secondary"]').click();
        await listener;

        expect(el.desktop).to.equal(DESKTOP_URL);
        expect(el.open).to.be.false;
    });
});
