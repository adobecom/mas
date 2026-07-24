import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
// mas.js first to break the circular dep between variant-layout and variants
import '../src/mas.js';

let Plans;

before(async () => {
    // merch-card's connectedCallback needs a commerce service in the DOM,
    // mirroring the setup in hydrate.test.js.
    if (!document.querySelector('mas-commerce-service')) {
        document.head.appendChild(
            document.createElement('mas-commerce-service'),
        );
    }
    await customElements.whenDefined('merch-card');
    ({ Plans } = await import('../src/variants/plans.js'));
});

const calloutHtml = (title) => `
    <div slot="callout-content">
        <p>AI Assistant included
            <span class="icon-button" title="${title}"><img alt="" /></span>
        </p>
    </div>`;

async function renderCard(innerHTML) {
    const card = document.createElement('merch-card');
    card.setAttribute('variant', 'plans');
    card.innerHTML = innerHTML;
    document.body.appendChild(card);
    await card.updateComplete;
    card.requestUpdate();
    await card.updateComplete;
    return card;
}

describe('plans callout tooltip listeners', () => {
    let addSpy;
    let removeSpy;
    const cards = [];

    beforeEach(() => {
        addSpy = sinon.spy(document, 'addEventListener');
        removeSpy = sinon.spy(document, 'removeEventListener');
    });

    afterEach(() => {
        cards.splice(0).forEach((card) => card.remove());
        addSpy.restore();
        removeSpy.restore();
    });

    const callsFor = (spy, type) =>
        spy.getCalls().filter((call) => call.args[0] === type);

    it('installs one shared passive listener pair for all plans callouts', async () => {
        const card1 = await renderCard(calloutHtml('tip one'));
        const card2 = await renderCard(calloutHtml('tip two'));
        cards.push(card1, card2);

        const touchCalls = callsFor(addSpy, 'touchstart');
        const mouseCalls = callsFor(addSpy, 'mouseover');
        expect(touchCalls.length, 'one shared touchstart listener').to.equal(1);
        expect(mouseCalls.length, 'one shared mouseover listener').to.equal(1);
        expect(touchCalls[0].args[2]?.passive, 'touchstart is passive').to.be
            .true;
        expect(mouseCalls[0].args[2]?.passive, 'mouseover is passive').to.be
            .true;
    });

    it('routes pointer events to the hovered icon and hides the others', async () => {
        const card1 = await renderCard(calloutHtml('tip one'));
        const card2 = await renderCard(calloutHtml('tip two'));
        cards.push(card1, card2);
        const icon1 = card1.querySelector('.icon-button');
        const icon2 = card2.querySelector('.icon-button');
        expect(icon1.classList.contains('hide-tooltip')).to.be.true;

        icon1.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        expect(icon1.classList.contains('hide-tooltip')).to.be.false;
        expect(icon2.classList.contains('hide-tooltip')).to.be.true;

        // a child of the icon still routes to its icon via closest()
        icon2
            .querySelector('img')
            .dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        expect(icon2.classList.contains('hide-tooltip')).to.be.false;
        expect(icon1.classList.contains('hide-tooltip')).to.be.true;

        // touchstart on the icon toggles it, elsewhere hides it
        icon1.dispatchEvent(new Event('touchstart', { bubbles: true }));
        expect(icon1.classList.contains('hide-tooltip')).to.be.false;
        icon1.dispatchEvent(new Event('touchstart', { bubbles: true }));
        expect(icon1.classList.contains('hide-tooltip')).to.be.true;
        document.body.dispatchEvent(new Event('touchstart', { bubbles: true }));
        expect(icon2.classList.contains('hide-tooltip')).to.be.true;
    });

    it('removes the shared listeners when the last callout card disconnects', async () => {
        const card1 = await renderCard(calloutHtml('tip one'));
        const card2 = await renderCard(calloutHtml('tip two'));
        cards.push(card1, card2);

        card1.remove();
        expect(callsFor(removeSpy, 'touchstart').length).to.equal(0);
        card2.remove();
        expect(callsFor(removeSpy, 'touchstart').length).to.equal(1);
        expect(callsFor(removeSpy, 'mouseover').length).to.equal(1);
    });
});

describe('Plans.postCardUpdateHook gating', () => {
    let card;
    afterEach(() => card?.remove());

    it('runs adaptForMedia only when variant or size changed', async () => {
        card = await renderCard('<h3 slot="heading-xs">Photoshop</h3>');
        const layout = card.variantLayout;
        const spy = sinon.spy(layout, 'adaptForMedia');
        await layout.postCardUpdateHook(new Map([['selected', false]]));
        expect(spy.called, 'skipped for unrelated property').to.be.false;
        await layout.postCardUpdateHook(new Map([['size', undefined]]));
        expect(spy.calledOnce, 'runs when size changes').to.be.true;
        await layout.postCardUpdateHook();
        expect(spy.calledTwice, 'runs when no changedProperties given').to.be
            .true;
        spy.restore();
    });
});

describe('Plans.adjustAddon one-shot', () => {
    it('adjusts the addon only once per layout', async () => {
        const addon = { setAttribute: sinon.spy() };
        const price = {
            onceSettled: () => Promise.resolve(),
            value: [{ planType: 'PUF' }],
        };
        const headingM = { querySelector: () => price };
        const layout = Object.create(Plans.prototype);
        layout.card = {
            updateComplete: Promise.resolve(),
            addon,
            querySelector: () => headingM,
        };
        await layout.adjustAddon();
        await layout.adjustAddon();
        expect(addon.setAttribute.calledOnce).to.be.true;
        expect(layout.addonAdjusted).to.be.true;
        expect(addon.planType).to.equal('PUF');
    });
});
