import { expect } from '@esm-bundle/chai';
import { html } from 'lit';
import { fixture, fixtureCleanup } from '@open-wc/testing-helpers/pure';

import '../src/swc.js';

import { spTheme } from './utils.js';

describe('sp-textfield placeholder', () => {
    afterEach(() => fixtureCleanup());

    it('draws the placeholder in gray 600 and keeps the typed value color', async () => {
        // Same system as studio.html, otherwise the Spectrum color tokens do not resolve.
        const theme = spTheme();
        theme.system = 'spectrum-two';
        const root = await fixture(
            html`<div>
                <sp-textfield id="empty" placeholder="Hint"></sp-textfield>
                <sp-textfield id="filled" placeholder="Hint" value="Typed"></sp-textfield>
                <div id="probe" style="color: var(--spectrum-gray-600)"></div>
            </div>`,
            { parentNode: theme },
        );
        const empty = root.querySelector('#empty');
        const filled = root.querySelector('#filled');
        await Promise.all([empty.updateComplete, filled.updateComplete]);

        // Resolve the token inside the theme so the test follows the token value.
        const gray600 = getComputedStyle(root.querySelector('#probe')).color;
        const placeholderColor = getComputedStyle(empty.shadowRoot.querySelector('.input'), '::placeholder').color;
        const valueColor = getComputedStyle(filled.shadowRoot.querySelector('.input')).color;
        const emptyInputColor = getComputedStyle(empty.shadowRoot.querySelector('.input')).color;

        expect(placeholderColor).to.equal(gray600);
        // The rule targets ::placeholder only: the input text color is unchanged and stays darker than the hint.
        expect(valueColor).to.equal(emptyInputColor);
        expect(valueColor).to.not.equal(gray600);
    });
});
