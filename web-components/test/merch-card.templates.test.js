// merch-card.js ships only the headless family: pages load a template bundle
// next to it (templates/<bundle>.js, picked by Milo from the page URL). This
// file loads merch-card.js alone on purpose.
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import '../src/merch-card.js';
import { templateDeps } from '../src/template-deps.js';
import { TEMPLATE_LOAD_TIMEOUT } from '../src/constants.js';

const MerchCard = customElements.get('merch-card');
let counter = 0;
const uniqueName = () => `test-template-${++counter}`;

const defineTemplate =
    (name, markup = '<slot></slot>') =>
    ({ TemplateLayout }) => ({
        [name]: {
            class: class extends TemplateLayout {
                renderLayout() {
                    return markup;
                }
            },
            fragmentMapping: { title: { tag: 'h3', slot: 'heading-xs' } },
        },
    });

describe('merch-card templates', () => {
    it('ships only the headless family in merch-card.js', () => {
        // The global nav uses headless cards on every page.
        for (const name of ['headless', 'marquee', 'faq', 'banner-blade']) {
            expect(MerchCard.getTemplate(name), name).to.exist;
        }
        for (const name of ['pro', 'plans', 'catalog', 'fries', 'mini']) {
            expect(MerchCard.getTemplate(name), name).to.be.undefined;
            expect(MerchCard.getFragmentMapping(name), name).to.be.undefined;
        }
    });

    it('injects a fixed set of dependencies into template files', () => {
        // Bundles are deployed separately from merch-card.js: removing or
        // renaming one of these breaks templates already in production.
        expect(Object.keys(templateDeps).sort()).to.deep.equal([
            'ARROW_DOWN',
            'ARROW_UP',
            'ENTER',
            'EVENT_MAS_READY',
            'EVENT_MERCH_CARD_ACTION_MENU_TOGGLE',
            'EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED',
            'EVENT_MERCH_CARD_QUANTITY_CHANGE',
            'EVENT_MERCH_QUANTITY_SELECTOR_CHANGE',
            'EVENT_TYPE_RESOLVED',
            'Log',
            'MOBILE_LANDSCAPE',
            'Media',
            'SELECTOR_MAS_INLINE_PRICE',
            'TAB',
            'TABLET_UP',
            'TEMPLATE_PRICE_LEGAL',
            'TemplateLayout',
            'createMasElement',
            'createTag',
            'escapeHTML',
            'extractBackgroundUrl',
            'getOuterHeight',
            'isDesktop',
            'isMobileOrTablet',
            'keepInHeadingPriceForAnnual',
        ]);
        expect(Object.isFrozen(templateDeps)).to.be.true;
    });

    it('registers every template a file defines, with the injected dependencies', () => {
        const [a, b] = [uniqueName(), uniqueName()];
        const define = sinon.spy((deps) => ({
            ...defineTemplate(a)(deps),
            ...defineTemplate(b)(deps),
        }));
        MerchCard.registerTemplates(define);
        expect(define.calledOnceWith(templateDeps)).to.be.true;
        expect(MerchCard.getTemplate(a).class.prototype).to.be.instanceOf(
            templateDeps.TemplateLayout,
        );
        expect(MerchCard.getFragmentMapping(b).title.slot).to.equal(
            'heading-xs',
        );
    });

    it('keeps the first registration when two bundles bring the same template', () => {
        const name = uniqueName();
        MerchCard.registerTemplates(defineTemplate(name, '<p>first</p>'));
        const first = MerchCard.getTemplate(name);
        MerchCard.registerTemplates(defineTemplate(name, '<p>second</p>'));
        expect(MerchCard.getTemplate(name)).to.equal(first);
    });

    it('resolves whenTemplate once the template registers', async () => {
        const name = uniqueName();
        const waiting = MerchCard.whenTemplate(name);
        MerchCard.registerTemplates(defineTemplate(name));
        expect(await waiting).to.equal(MerchCard.getTemplate(name));
        expect(await MerchCard.whenTemplate(name)).to.equal(
            MerchCard.getTemplate(name),
        );
    });

    describe('when the template never loads', () => {
        let clock;
        beforeEach(() => {
            // The wait only counts while the page is visible.
            Object.defineProperty(document, 'visibilityState', {
                configurable: true,
                get: () => 'visible',
            });
            clock = sinon.useFakeTimers({ toFake: ['setTimeout'] });
        });
        afterEach(() => {
            clock.restore();
            delete document.visibilityState;
        });

        it(`rejects whenTemplate after ${TEMPLATE_LOAD_TIMEOUT} ms with a hint`, async () => {
            const name = uniqueName();
            const waiting = MerchCard.whenTemplate(name);
            clock.tick(TEMPLATE_LOAD_TIMEOUT);
            const error = await waiting.catch((e) => e);
            expect(error.message).to.include(`template "${name}"`);
            expect(error.message).to.include('MERCH_CARD_TEMPLATE_RULES');
        });

        it('waits again after a timeout, and resolves if it registers later', async () => {
            const name = uniqueName();
            const first = MerchCard.whenTemplate(name);
            clock.tick(TEMPLATE_LOAD_TIMEOUT);
            await first.catch(() => {});
            const second = MerchCard.whenTemplate(name);
            MerchCard.registerTemplates(defineTemplate(name));
            expect(await second).to.equal(MerchCard.getTemplate(name));
        });
    });
});

describe('merch-card template attribute', () => {
    let card;
    beforeEach(() => {
        card = document.createElement('merch-card');
    });

    it('copies variant into template', () => {
        card.setAttribute('variant', 'plans');
        expect(card.getAttribute('template')).to.equal('plans');
        expect(card.template).to.equal('plans');
    });

    it('copies template into variant, so [variant] CSS keeps matching', () => {
        card.template = 'pro';
        expect(card.getAttribute('variant')).to.equal('pro');
        expect(card.variant).to.equal('pro');
    });

    it('clears both', () => {
        card.template = 'pro';
        card.variant = undefined;
        expect(card.hasAttribute('template')).to.be.false;
        expect(card.hasAttribute('variant')).to.be.false;
    });
});

describe('merch-card-collection template names', () => {
    it('waits for the card templates, not the collection grouping', async () => {
        const { getCardTemplateNames } = await import(
            '../src/merch-card-collection.js'
        );
        expect(
            getCardTemplateNames([
                { fields: { variant: 'pro' } },
                { fields: { variant: 'bizpro' } },
                { fields: { variant: 'compare-chart-column' } },
                { fields: { variant: '' } },
                { fields: {} },
            ]),
        ).to.deep.equal(['pro', 'compare-chart-column']);
    });
});
