import { expect } from '@esm-bundle/chai';
import {
    createPreview,
    getPreviewSettings,
    renderPreview,
} from '../docs/mas-preview.js';
import { getSurfaceLocales } from '../../io/www/src/fragment/locales.js';

describe('preview', () => {
    const id = '0ef2a804-e788-4959-abb8-b4d96a18b0ef';

    it('creates a card without choosing its Spectrum setup before loading', () => {
        const card = createPreview(new URLSearchParams({ 'fragment-id': id }));
        expect(card.localName).to.equal('merch-card');
        expect(card.hasAttribute('spectrum')).to.be.false;
        expect(
            card.querySelector('aem-fragment').getAttribute('fragment'),
        ).to.equal(id);
    });

    it('creates a collection without choosing its Spectrum setup before loading', () => {
        const collection = createPreview(
            new URLSearchParams({
                'fragment-id': id,
                'content-type': 'merch-card-collection',
            }),
        );
        expect(collection.localName).to.equal('merch-card-collection');
        expect(collection.hasAttribute('spectrum')).to.be.false;
        expect(
            collection.querySelector('aem-fragment').getAttribute('fragment'),
        ).to.equal(id);
    });

    it('preserves mask and personalization parameters', () => {
        const card = createPreview(
            new URLSearchParams({
                'fragment-id': id,
                mask: 'promotion',
                pzn: 'students',
            }),
        );
        const fragment = card.querySelector('aem-fragment');
        expect(fragment.getAttribute('mask')).to.equal('promotion');
        expect(fragment.getAttribute('pzn')).to.equal('students');
    });

    it('rejects invalid fragment IDs before creating a preview', () => {
        expect(() =>
            createPreview(
                new URLSearchParams({
                    'fragment-id': '<img src=x onerror=alert(1)>',
                }),
            ),
        ).to.throw('Enter a valid fragment ID.');
    });

    it('does not create arbitrary elements from the URL', () => {
        expect(() =>
            createPreview(
                new URLSearchParams({
                    'fragment-id': id,
                    'content-type': 'script',
                }),
            ),
        ).to.throw('Unsupported content type.');
    });
});

describe('preview settings from fragment metadata', () => {
    for (const [surface, spectrum] of [
        ['ccd', 'css'],
        ['adobe-home', 'swc'],
        ['commerce', 'swc'],
    ]) {
        it(`chooses the Spectrum setup from a ${surface} fragment path`, () => {
            const settings = getPreviewSettings({
                path: `/content/dam/mas/${surface}/en_US/card`,
                fields: { variant: 'mini' },
            });

            expect(settings.spectrum).to.equal(spectrum);
        });

        it(`uses the locales of the actual ${surface} namespace`, () => {
            const settings = getPreviewSettings({
                path: `/content/dam/mas/${surface}/en_US/card`,
                fields: { variant: 'mini' },
            });

            expect(settings.locales).to.deep.equal(getSurfaceLocales(surface));
        });
    }

    it('preserves Spectrum CSS for a CCD variant in a test namespace', () => {
        const settings = getPreviewSettings({
            path: '/content/dam/mas/nala/en_US/card',
            fields: { variant: 'ccd-slice' },
        });

        expect(settings.spectrum).to.equal('css');
    });

    it('uses the collection path without requiring a card variant', () => {
        const settings = getPreviewSettings({
            path: '/content/dam/mas/ccd/en_US/collection',
            fields: {},
        });

        expect(settings.spectrum).to.equal('css');
    });

    it('does not confuse a test namespace with a card display style', () => {
        const settings = getPreviewSettings({
            path: '/content/dam/mas/nala/en_US/card',
            fields: { variant: 'ccd-slice' },
        });

        expect(settings.locales).to.deep.equal(getSurfaceLocales('nala'));
    });
});

describe('preview loading', () => {
    let container;
    let status;

    beforeEach(() => {
        container = document.createElement('div');
        status = document.createElement('p');
        document.body.append(container, status);
    });

    afterEach(() => {
        container.remove();
        status.remove();
    });

    const preparePreview = (type, modelType = type) => {
        const preview = createPreview(
            new URLSearchParams({
                'fragment-id': '0ef2a804-e788-4959-abb8-b4d96a18b0ef',
                'content-type': type,
            }),
        );
        const fragment = preview.querySelector('aem-fragment');
        fragment.rawData = {
            path: '/content/dam/mas/commerce/en_US/fragment',
            fields: {},
            model: {
                id: btoa(
                    `/conf/mas/settings/dam/cfm/models/${modelType === 'merch-card' ? 'card' : 'collection'}`,
                ).replace(/=+$/, ''),
            },
        };
        preview.checkReady = async () => {
            fragment.dispatchEvent(
                new CustomEvent('aem:load', { bubbles: true }),
            );
            return type === 'merch-card' ? preview : true;
        };
        return preview;
    };

    for (const result of [false, undefined]) {
        it(`shows an error when readiness resolves to ${result} without an error event`, async () => {
            const preview = preparePreview('merch-card-collection');
            preview.checkReady = async () => result;

            await renderPreview(preview, container, status);

            expect(status.textContent).to.include('Cannot load fragment.');
        });

        it(`shows a readiness ${result} error after the URL was copied while loading`, async () => {
            const preview = preparePreview('merch-card-collection');
            preview.checkReady = async () => {
                status.textContent = 'URL copied.';
                return result;
            };

            await renderPreview(preview, container, status);

            expect(status.textContent).to.include('Cannot load fragment.');
        });
    }

    it('preserves the clipboard confirmation when loading succeeds', async () => {
        const preview = preparePreview('merch-card');
        preview.checkReady = async () => {
            status.textContent = 'URL copied.';
            return preview;
        };

        await renderPreview(preview, container, status);

        expect(status.textContent).to.equal('URL copied.');
    });

    for (const type of ['merch-card', 'merch-card-collection']) {
        it(`clears the loading message for a successfully loaded ${type}`, async () => {
            const preview = preparePreview(type);

            await renderPreview(preview, container, status);

            expect(status.textContent).to.equal('');
            expect(container.firstElementChild).to.equal(preview);
        });

        it(`applies the metadata-derived Spectrum setup to ${type} before hydration`, async () => {
            const preview = preparePreview(type);
            preview.checkReady = async () => {
                preview
                    .querySelector('aem-fragment')
                    .dispatchEvent(
                        new CustomEvent('aem:load', { bubbles: true }),
                    );
                expect(preview.getAttribute('spectrum')).to.equal('swc');
                return true;
            };

            await renderPreview(preview, container, status);
        });

        it(`rejects a fragment whose model does not match ${type}`, async () => {
            const modelType =
                type === 'merch-card' ? 'merch-card-collection' : 'merch-card';
            const preview = preparePreview(type, modelType);
            preview.checkReady = () => {
                preview
                    .querySelector('aem-fragment')
                    .dispatchEvent(
                        new CustomEvent('aem:load', { bubbles: true }),
                    );
                return new Promise(() => {});
            };

            await renderPreview(preview, container, status);

            expect(status.textContent).to.equal(
                'Selected content type does not match this fragment.',
            );
            expect(container.children).to.have.length(0);
        });
    }

    it('does not let a child ready event hide a collection timeout', async () => {
        const preview = preparePreview('merch-card-collection');
        const child = document.createElement('merch-card');
        preview.append(child);
        preview.checkReady = async () => {
            child.dispatchEvent(
                new CustomEvent('mas:ready', { bubbles: true }),
            );
            return false;
        };

        await renderPreview(preview, container, status);

        expect(status.textContent).to.include('Cannot load fragment.');
    });

    it('shows an error when the preview reports failure after readiness', async () => {
        const preview = preparePreview('merch-card');
        preview.failed = true;

        await renderPreview(preview, container, status);

        expect(status.textContent).to.include('Cannot load fragment.');
    });

    it('preserves a load error when readiness subsequently completes', async () => {
        const preview = preparePreview('merch-card');
        preview.checkReady = async () => {
            preview.dispatchEvent(
                new CustomEvent('aem:error', { bubbles: true }),
            );
            return preview;
        };

        await renderPreview(preview, container, status);

        expect(status.textContent).to.include('Cannot load fragment.');
    });
});

describe('preview validation field', () => {
    let fixture;
    let styles;

    before(async () => {
        await import('../../studio/libs/swc.js');
        styles = ['spectrum.css', 'mas-preview.css'].map((name) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = new URL(`../docs/${name}`, import.meta.url).href;
            return link;
        });
        await Promise.all(
            styles.map(
                (link) =>
                    new Promise((resolve, reject) => {
                        link.onload = resolve;
                        link.onerror = () =>
                            reject(new Error(`Cannot load ${link.href}`));
                        document.head.append(link);
                    }),
            ),
        );
    });

    after(() => {
        for (const link of styles) link.remove();
    });

    afterEach(() => {
        fixture?.remove();
    });

    it('keeps the warning inside the fragment field and vertically centered', async () => {
        const response = await fetch(
            new URL('../docs/mas-preview.html', import.meta.url),
        );
        expect(response.ok).to.be.true;
        const page = new DOMParser().parseFromString(
            await response.text(),
            'text/html',
        );
        fixture = page.querySelector('sp-theme');
        fixture.className = page.body.className;
        document.body.append(fixture);
        await fixture.updateComplete;
        const field = fixture.querySelector('#fragment-id');
        await field.updateComplete;
        field.checkValidity();
        await field.updateComplete;
        const warning = field.shadowRoot.querySelector('#invalid');
        await warning.updateComplete;
        const fieldBox = field.shadowRoot
            .querySelector('input')
            .getBoundingClientRect();
        const warningBox = warning.getBoundingClientRect();

        expect(warningBox.width).to.be.greaterThan(0);
        expect(warningBox.height).to.be.greaterThan(0);
        expect(warningBox.left).to.be.greaterThan(fieldBox.left);
        expect(warningBox.right).to.be.lessThan(fieldBox.right);
        expect(warningBox.top).to.be.greaterThan(fieldBox.top);
        expect(warningBox.bottom).to.be.lessThan(fieldBox.bottom);
        expect(
            Math.abs(
                warningBox.top +
                    warningBox.height / 2 -
                    fieldBox.top -
                    fieldBox.height / 2,
            ),
        ).to.be.lessThan(1);
    });
});
