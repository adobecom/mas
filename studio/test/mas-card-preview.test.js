import { expect, fixture, html } from '@open-wc/testing';
import '../src/swc.js';
import '../src/mas-card-preview.js';
import '../src/mas-fragment-table.js';
import { closePreview, isWhitePreviewVariant, openPreview } from '../src/mas-card-preview.js';
import Store from '../src/store.js';

describe('mas-card-preview', () => {
    afterEach(() => {
        closePreview();
    });

    describe('isWhitePreviewVariant', () => {
        it('is true for headless-style variants', () => {
            for (const variant of ['headless', 'marquee', 'faq', 'banner-blade']) {
                expect(isWhitePreviewVariant(variant), variant).to.be.true;
            }
        });

        it('is false for other values', () => {
            for (const variant of ['catalog', 'plans', 'mini', 'fries', '', null, undefined]) {
                expect(isWhitePreviewVariant(variant), String(variant)).to.be.false;
            }
        });
    });

    describe('popover class', () => {
        it('adds white-background for a headless-style variant', async () => {
            const el = await fixture(html`<mas-card-preview></mas-card-preview>`);
            openPreview('frag-1', { left: '0' }, 'marquee');
            await el.updateComplete;
            expect(el.querySelector('.preview-popover').classList.contains('white-background')).to.be.true;
        });

        it('omits white-background for other variants', async () => {
            const el = await fixture(html`<mas-card-preview></mas-card-preview>`);
            openPreview('frag-1', { left: '0' }, 'catalog');
            await el.updateComplete;
            expect(el.querySelector('.preview-popover').classList.contains('white-background')).to.be.false;
        });

        it('omits white-background when no variant is given', async () => {
            const el = await fixture(html`<mas-card-preview></mas-card-preview>`);
            openPreview('frag-1', { left: '0' });
            await el.updateComplete;
            expect(el.querySelector('.preview-popover').classList.contains('white-background')).to.be.false;
            expect(Store.preview.value.variant).to.be.undefined;
        });
    });

    describe('table row hover', () => {
        it('stores the row variant in Store.preview', async () => {
            const fragmentStore = {
                id: 'frag-1',
                value: {
                    id: 'frag-1',
                    path: '/test/path',
                    title: 'Test Fragment',
                    status: 'PUBLISHED',
                    variant: 'faq',
                    model: { path: '/models/card' },
                    getFieldValue: () => '',
                    getField: () => null,
                    getTagTitle: () => null,
                    getCurrentTagTitle: () => null,
                    getValidationErrors: () => [],
                },
                get() {
                    return this.value;
                },
                subscribe: () => ({ unsubscribe() {} }),
                unsubscribe() {},
            };
            const el = await fixture(html`<mas-fragment-table .fragmentStore=${fragmentStore}></mas-fragment-table>`);
            el.openCardPreview();
            expect(Store.preview.value.id).to.equal('frag-1');
            expect(Store.preview.value.variant).to.equal('faq');
        });
    });
});
