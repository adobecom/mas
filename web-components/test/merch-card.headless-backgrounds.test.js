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

async function renderCard(variant, innerHTML) {
    const card = document.createElement('merch-card');
    card.setAttribute('variant', variant);
    card.innerHTML = innerHTML;
    document.body.appendChild(card);
    await card.updateComplete;
    card.requestUpdate();
    await card.updateComplete;
    return card;
}

const DESKTOP_URL = 'https://main--da-cc--adobecom.aem.page/media_desktop.png';
const TABLET_URL = 'https://main--da-cc--adobecom.aem.page/media_tablet.png';
const MOBILE_URL = 'https://main--da-cc--adobecom.aem.page/media_mobile.png';
const BACKGROUNDS_PICTURE =
    `<picture slot="backgrounds">` +
    `<source srcset="${DESKTOP_URL}" media="(min-width: 1200px)">` +
    `<source srcset="${TABLET_URL}" media="(min-width: 600px)">` +
    `<img loading="lazy" alt="" src="${MOBILE_URL}">` +
    `</picture>`;

for (const variant of ['headless', 'marquee', 'banner-blade']) {
    describe(`${variant} variant – Backgrounds row expand/collapse`, () => {
        let card;
        afterEach(() => card?.remove());

        it('renders a "Background Desktop" row with a toggle button', async () => {
            card = await renderCard(variant, BACKGROUNDS_PICTURE);
            const rows = [...card.shadowRoot.querySelectorAll('.headless-row')];
            const row = rows.find(
                (r) =>
                    r.querySelector('.headless-label')?.textContent ===
                    'Background Desktop',
            );
            expect(row).to.exist;
            expect(row.querySelector('.headless-backgrounds-toggle')).to.exist;
        });

        it('keeps the per-breakpoint detail collapsed by default', async () => {
            card = await renderCard(variant, BACKGROUNDS_PICTURE);
            const detail = card.shadowRoot.querySelector(
                '.headless-backgrounds-detail',
            );
            expect(detail.classList.contains('hidden')).to.be.true;
        });

        it('expands and populates only tablet/mobile images on click (desktop is already the default row)', async () => {
            card = await renderCard(variant, BACKGROUNDS_PICTURE);
            const toggle = card.shadowRoot.querySelector(
                '.headless-backgrounds-toggle',
            );
            toggle.click();

            const detail = card.shadowRoot.querySelector(
                '.headless-backgrounds-detail',
            );
            expect(detail.classList.contains('hidden')).to.be.false;

            expect(
                detail.querySelector('[data-backgrounds-breakpoint="desktop"]'),
            ).to.not.exist;
            const tabletImg = detail.querySelector(
                '[data-backgrounds-breakpoint="tablet"] img',
            );
            const mobileImg = detail.querySelector(
                '[data-backgrounds-breakpoint="mobile"] img',
            );
            expect(tabletImg?.src).to.equal(TABLET_URL);
            expect(mobileImg?.src).to.equal(MOBILE_URL);

            const detailLabels = [
                ...detail.querySelectorAll('.headless-label'),
            ].map((el) => el.textContent);
            expect(detailLabels).to.deep.equal([
                'Background Tablet',
                'Background Mobile',
            ]);
        });

        it('renames the toggle to "See all backgrounds" / "Show default only"', async () => {
            card = await renderCard(variant, BACKGROUNDS_PICTURE);
            const toggle = card.shadowRoot.querySelector(
                '.headless-backgrounds-toggle',
            );
            expect(toggle.textContent.trim()).to.equal('See all backgrounds');

            toggle.click();
            expect(toggle.textContent.trim()).to.equal('Show default only');
        });

        it('collapses again on a second click', async () => {
            card = await renderCard(variant, BACKGROUNDS_PICTURE);
            const toggle = card.shadowRoot.querySelector(
                '.headless-backgrounds-toggle',
            );
            toggle.click();
            toggle.click();

            const detail = card.shadowRoot.querySelector(
                '.headless-backgrounds-detail',
            );
            expect(detail.classList.contains('hidden')).to.be.true;
        });
    });
}
