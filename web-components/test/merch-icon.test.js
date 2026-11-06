import { expect } from '@esm-bundle/chai';
import { getDefaultIconAlt } from '../src/merch-icon.js';

async function makeIcon(attrs = {}) {
    const el = document.createElement('merch-icon');
    for (const [key, value] of Object.entries(attrs)) {
        el.setAttribute(key, value);
    }
    document.body.append(el);
    await el.updateComplete;
    return el;
}

describe('merch-icon – accessible name', () => {
    afterEach(() => {
        document.body
            .querySelectorAll('merch-icon')
            .forEach((el) => el.remove());
    });

    it('derives the img alt from the src filename when no alt is authored', async () => {
        const el = await makeIcon({ src: 'creative-cloud.svg' });
        const img = el.shadowRoot.querySelector('img');
        expect(img.getAttribute('alt')).to.equal(
            getDefaultIconAlt('creative-cloud.svg'),
        );
        expect(img.getAttribute('alt')).to.equal('Creative Cloud');
    });

    it('derives a different name for a different icon, not a single shared default', async () => {
        const el = await makeIcon({
            src: 'https://example.com/federal/assets/svgs/photoshop.svg',
        });
        const img = el.shadowRoot.querySelector('img');
        expect(img.getAttribute('alt')).to.equal('Photoshop');
    });

    it('uses an authored alt instead of the derived default', async () => {
        const el = await makeIcon({ src: 'photoshop.svg', alt: 'Photoshop' });
        const img = el.shadowRoot.querySelector('img');
        expect(img.getAttribute('alt')).to.equal('Photoshop');
    });

    it('preserves an explicit empty alt as decorative', async () => {
        const el = await makeIcon({ src: 'decorative.svg', alt: '' });
        const img = el.shadowRoot.querySelector('img');
        expect(img.getAttribute('alt')).to.equal('');
    });

    it('never sets aria-hidden on the host or the rendered img', async () => {
        const el = await makeIcon({ src: 'creative-cloud.svg' });
        const img = el.shadowRoot.querySelector('img');
        expect(el.hasAttribute('aria-hidden')).to.be.false;
        expect(img.hasAttribute('aria-hidden')).to.be.false;
    });

    it('still derives the default when wrapped in a link', async () => {
        const el = await makeIcon({
            src: 'creative-cloud.svg',
            href: 'https://example.com',
        });
        const img = el.shadowRoot.querySelector('img');
        expect(img.getAttribute('alt')).to.equal('Creative Cloud');
    });
});

describe('getDefaultIconAlt', () => {
    it('humanizes a kebab-case filename', () => {
        expect(getDefaultIconAlt('creative-cloud.svg')).to.equal(
            'Creative Cloud',
        );
    });

    it('humanizes a filename within a full URL and ignores query/hash', () => {
        expect(
            getDefaultIconAlt(
                'https://www.adobe.com/federal/assets/svgs/acrobat.svg?v=2#frag',
            ),
        ).to.equal('Acrobat');
    });

    it('returns an empty string when there is no src', () => {
        expect(getDefaultIconAlt('')).to.equal('');
        expect(getDefaultIconAlt(undefined)).to.equal('');
    });
});
