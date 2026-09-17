import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture } from '@open-wc/testing-helpers/pure';
import '../../src/swc.js';
import '../../src/fields/backgrounds-field.js';
import { EVENT_CHANGE } from '../../src/constants.js';
import { spTheme } from '../utils.js';

const DESKTOP_URL = 'https://main--da-cc--adobecom.aem.page/media_desktop.png';
const MOBILE_URL = 'https://main--da-cc--adobecom.aem.page/media_mobile.png';

describe('Backgrounds field', () => {
    it('shows an "Add backgrounds" button and no summary when empty', async () => {
        const el = await fixture(html`<mas-backgrounds-field></mas-backgrounds-field>`, { parentNode: spTheme() });

        const button = el.shadowRoot.querySelector('sp-button');
        expect(button.textContent.trim()).to.equal('Add backgrounds');
        expect(el.shadowRoot.querySelector('.summary')).to.not.exist;
    });

    it('shows a summary and an "Edit backgrounds" button when a value is set', async () => {
        const el = await fixture(
            html`<mas-backgrounds-field desktop="${DESKTOP_URL}" mobile="${MOBILE_URL}"></mas-backgrounds-field>`,
            { parentNode: spTheme() },
        );

        const button = el.shadowRoot.querySelector('sp-button');
        expect(button.textContent.trim()).to.equal('Edit backgrounds');

        const summary = el.shadowRoot.querySelector('.summary').textContent;
        expect(summary).to.include(`Desktop: ${DESKTOP_URL}`);
        expect(summary).to.include(`Mobile: ${MOBILE_URL}`);
        expect(summary).to.not.include('Tablet:');
    });

    it('opens the modal when the button is clicked', async () => {
        const el = await fixture(html`<mas-backgrounds-field></mas-backgrounds-field>`, { parentNode: spTheme() });

        el.shadowRoot.querySelector('sp-button').click();
        await el.updateComplete;

        expect(el.modalOpen).to.be.true;
        expect(el.shadowRoot.querySelector('mas-backgrounds-modal').open).to.be.true;
    });

    it('updates its values and dispatches change when the modal saves', async () => {
        const el = await fixture(html`<mas-backgrounds-field></mas-backgrounds-field>`, { parentNode: spTheme() });

        let changeDetail = null;
        el.addEventListener(EVENT_CHANGE, (e) => {
            changeDetail = e.detail;
        });

        const modal = el.shadowRoot.querySelector('mas-backgrounds-modal');
        modal.dispatchEvent(new CustomEvent('save', { detail: { desktop: DESKTOP_URL, tablet: '', mobile: MOBILE_URL } }));
        await el.updateComplete;

        expect(el.desktop).to.equal(DESKTOP_URL);
        expect(el.mobile).to.equal(MOBILE_URL);
        expect(el.modalOpen).to.be.false;
        expect(changeDetail).to.equal(el);
    });
});
