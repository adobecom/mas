import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture } from '@open-wc/testing-helpers/pure';
import '../../src/swc.js';
import '../../src/mas-quick-actions.js';
import { QUICK_ACTION } from '../../src/constants.js';
import { spTheme } from '../utils.js';

describe('mas-quick-actions renders VALIDATE', () => {
    it('renders a validate button with the expected title', async () => {
        const el = await fixture(
            html`<mas-quick-actions .actions=${[QUICK_ACTION.VALIDATE]} .disabled=${new Set()}></mas-quick-actions>`,
            { parentNode: spTheme() },
        );
        await el.updateComplete;
        const btn = el.shadowRoot.querySelector('sp-action-button');
        expect(btn, 'validate button rendered').to.exist;
        expect(btn.title).to.equal('Validate');
    });
});
