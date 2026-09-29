import { expect } from '@esm-bundle/chai';
// mas.js first to break the circular dep between variant-layout and variants
import '../src/mas.js';

before(async () => {
    if (!document.querySelector('mas-commerce-service')) {
        document.head.appendChild(
            document.createElement('mas-commerce-service'),
        );
    }
    await customElements.whenDefined('merch-card');
});

async function renderCard(innerHTML) {
    const card = document.createElement('merch-card');
    card.setAttribute('variant', 'pro');
    card.innerHTML = innerHTML;
    document.body.appendChild(card);
    await card.updateComplete;
    // firstUpdated swaps in a fresh variantLayout after the first render;
    // re-render so the shadow DOM event listeners bind to card.variantLayout.
    card.requestUpdate();
    await card.updateComplete;
    return card;
}

// WCAG relative luminance / contrast ratio (spec formula), used to verify the
// selected/highlighted option meets the 3:1 non-text contrast minimum (MWPW-198036).
function relativeLuminance([r, g, b]) {
    const [rs, gs, bs] = [r, g, b].map((c) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(rgbA, rgbB) {
    const lA = relativeLuminance(rgbA);
    const lB = relativeLuminance(rgbB);
    const [lighter, darker] = lA >= lB ? [lA, lB] : [lB, lA];
    return (lighter + 0.05) / (darker + 0.05);
}

function toRgbArray(rgbString) {
    return rgbString.match(/\d+/g).map(Number).slice(0, 3);
}

describe('pro license dropdown selected/highlighted contrast (MWPW-198036)', () => {
    let card;
    afterEach(() => card?.remove());

    const QS =
        '<div slot="quantity-select"><merch-quantity-select title="License" min="1" max="5" step="1" default-value="3"></merch-quantity-select></div>';

    // Options are values 1..5, so the default "3" is at index 2.

    function key(target, keyName) {
        const event = new KeyboardEvent('keydown', {
            key: keyName,
            bubbles: true,
            cancelable: true,
        });
        target.dispatchEvent(event);
        return event;
    }

    const trigger = () =>
        card.shadowRoot.querySelector('.license-select-trigger');
    const options = () => [
        ...card.shadowRoot.querySelectorAll('.license-select-option'),
    ];

    it('gives the selected option a solid blue background and white text', async () => {
        card = await renderCard(QS);
        trigger().click();
        await card.updateComplete;

        const selected = card.shadowRoot.querySelector(
            '.license-select-option.selected',
        );
        const cs = getComputedStyle(selected);
        expect(cs.backgroundColor).to.equal('rgb(59, 99, 251)');
        expect(cs.color).to.equal('rgb(255, 255, 255)');
    });

    it('gives the keyboard-highlighted option the same background/text pair', async () => {
        card = await renderCard(QS);
        // First ArrowDown opens the popover and highlights the selected option
        // (index 2); the second moves the highlight to index 3, which is not
        // the selected option — exercising the highlight state in isolation.
        key(trigger(), 'ArrowDown');
        await card.updateComplete;
        key(trigger(), 'ArrowDown');
        await card.updateComplete;

        const highlighted = card.shadowRoot.querySelector(
            '.license-select-option.highlighted',
        );
        expect(highlighted.classList.contains('selected')).to.be.false;
        const cs = getComputedStyle(highlighted);
        expect(cs.backgroundColor).to.equal('rgb(59, 99, 251)');
        expect(cs.color).to.equal('rgb(255, 255, 255)');
    });

    it('leaves a plain (non-selected, non-highlighted) option unchanged', async () => {
        card = await renderCard(QS);
        trigger().click();
        await card.updateComplete;

        const plain = options().find(
            (li) =>
                !li.classList.contains('selected') &&
                !li.classList.contains('highlighted'),
        );
        const cs = getComputedStyle(plain);
        expect(cs.backgroundColor).to.equal('rgba(0, 0, 0, 0)');
        expect(cs.color).to.equal('rgb(0, 0, 0)');
    });

    it('meets the 3:1 non-text contrast minimum against the popover surface', async () => {
        card = await renderCard(QS);
        trigger().click();
        await card.updateComplete;

        const selectedBg = toRgbArray(
            getComputedStyle(
                card.shadowRoot.querySelector(
                    '.license-select-option.selected',
                ),
            ).backgroundColor,
        );
        const popoverBg = toRgbArray(
            getComputedStyle(
                card.shadowRoot.querySelector('.license-select-popover'),
            ).backgroundColor,
        );
        expect(contrastRatio(selectedBg, popoverBg)).to.be.at.least(3);
    });
});
