import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { BASELINE_STATUS, CardBaselinesController } from '../../src/baselines/card-baselines-controller.js';
import { Fragment } from '../../src/aem/fragment.js';

const CARD_PATH = '/content/dam/mas/sandbox/fr_FR/card';

const field = (name, ...values) => ({ name, values });
const templateBaseline = {
    id: 'template',
    title: 'Photoshop catalog',
    fields: [field('subtitle', 'Baseline subtitle'), field('mnemonicIcon', 'template.svg')],
};
const offerBaseline = { id: 'offer', fields: [field('mnemonicIcon', 'offer.svg'), field('mnemonicAlt', 'Photoshop')] };

const flush = () => new Promise((resolve) => setTimeout(resolve));

const createHost = (values = {}, path = CARD_PATH, fields = []) => {
    const fragment = new Fragment({ id: 'card', path, fields });
    return {
        values: { osi: 'OSI', variant: 'catalog', ...values },
        fragmentStore: { get: () => fragment, setBaselineParent: sinon.spy() },
        localeDefaultFragment: null,
        effectiveIsVariation: false,
        addController: sinon.spy(),
        requestUpdate: sinon.spy(),
        getEffectiveFieldValue(name) {
            return this.values[name];
        },
        getEffectiveFieldValues(name) {
            return [this.values[name] ?? []].flat();
        },
    };
};

describe('CardBaselinesController', () => {
    let repository;
    let fragmentsApi;

    beforeEach(() => {
        fragmentsApi = { getByPath: sinon.stub() };
        repository = document.createElement('mas-repository');
        repository.aem = { sites: { cf: { fragments: fragmentsApi } } };
        document.body.append(repository);
    });

    afterEach(() => {
        repository.remove();
        sinon.restore();
    });

    it('registers itself on its host', () => {
        const host = createHost();

        const controller = new CardBaselinesController(host, sinon.stub());

        expect(host.addController.calledOnceWithExactly(controller)).to.be.true;
    });

    it('does nothing before the host has a fragment', () => {
        const find = sinon.stub();
        const controller = new CardBaselinesController({ addController() {}, fragmentStore: null }, find);

        controller.hostUpdate();

        expect(find.called).to.be.false;
        expect(controller.status).to.equal(BASELINE_STATUS.NONE);
    });

    it('looks nothing up without an offer or a template', () => {
        const find = sinon.stub();
        for (const values of [{ osi: '' }, { variant: '' }]) {
            const controller = new CardBaselinesController(createHost(values), find);

            controller.hostUpdate();

            expect(controller.status).to.equal(BASELINE_STATUS.NONE);
            expect(controller.message).to.equal('Select an offer and a template to look for a baseline');
        }
        expect(find.called).to.be.false;
    });

    it('looks nothing up for a baseline itself', () => {
        const find = sinon.stub();
        const host = createHost({}, '/content/dam/mas/sandbox/en_US/baselines/catalog/PA-1/baseline');
        const controller = new CardBaselinesController(host, find);

        controller.hostUpdate();

        expect(find.called).to.be.false;
        expect(controller.status).to.equal(BASELINE_STATUS.NONE);
    });

    it('looks up the card baselines and reports the most specific one found', async () => {
        const find = sinon
            .stub()
            .resolves({ offerBaseline, fragmentBaseline: templateBaseline, fragmentSegmentBaseline: null });
        const host = createHost();
        const controller = new CardBaselinesController(host, find);

        controller.hostUpdate();

        expect(controller.status).to.equal(BASELINE_STATUS.PENDING);
        expect(controller.message).to.equal('Looking for a baseline…');
        await flush();
        expect(
            find.calledOnceWithExactly(fragmentsApi, { surface: 'sandbox', locale: 'fr_FR', osi: 'OSI', template: 'catalog' }),
        ).to.be.true;
        expect(controller.status).to.equal(BASELINE_STATUS.FOUND);
        expect(controller.message).to.equal('Baseline found: Photoshop catalog');
        expect(host.requestUpdate.calledOnce).to.be.true;
    });

    it('reports an offer baseline alone as found, with its product name', async () => {
        const namedOfferBaseline = { ...offerBaseline, fields: [field('cardTitle', 'Photoshop'), ...offerBaseline.fields] };
        const controller = new CardBaselinesController(
            createHost(),
            sinon.stub().resolves({ offerBaseline: namedOfferBaseline, fragmentBaseline: null, fragmentSegmentBaseline: null }),
        );

        controller.hostUpdate();
        await flush();

        expect(controller.message).to.equal('Offer baseline found: Photoshop');
        expect(controller.baseline).to.be.null;
    });

    it('describes an offer baseline without a product name by what it provides', async () => {
        const controller = new CardBaselinesController(
            createHost(),
            sinon.stub().resolves({
                offerBaseline: { id: 'offer', fields: [field('mnemonicIcon', 'offer.svg')] },
                fragmentBaseline: null,
                fragmentSegmentBaseline: null,
            }),
        );

        controller.hostUpdate();
        await flush();

        expect(controller.message).to.equal('Offer baseline found: product title and icon');
    });

    it('exposes the most specific baseline fragment found', async () => {
        const segmentBaseline = { id: 'segment', title: 'Photoshop catalog EDU', fields: [] };
        const controller = new CardBaselinesController(
            createHost(),
            sinon
                .stub()
                .resolves({ offerBaseline, fragmentBaseline: templateBaseline, fragmentSegmentBaseline: segmentBaseline }),
        );

        expect(controller.baseline).to.be.null;
        controller.hostUpdate();
        await flush();

        expect(controller.baseline).to.equal(segmentBaseline);
        expect(controller.message).to.equal('Baseline found: Photoshop catalog EDU');
    });

    it('reports missing baselines with the template, PA code and market segment they were looked up for', async () => {
        const controller = new CardBaselinesController(
            createHost(),
            sinon.stub().resolves({
                productArrangementCode: 'PA-1',
                marketSegment: 'com',
                offerBaseline: null,
                fragmentBaseline: null,
                fragmentSegmentBaseline: null,
            }),
        );

        controller.hostUpdate();
        await flush();

        expect(controller.status).to.equal(BASELINE_STATUS.MISSING);
        expect(controller.lookup).to.deep.equal({ template: 'catalog', productArrangementCode: 'PA-1', marketSegment: 'com' });
        expect(controller.message).to.equal('Baseline for Catalog, PA-1, and COM not found');
    });

    it('reports missing baselines of an offer without market segment', async () => {
        const controller = new CardBaselinesController(
            createHost(),
            sinon.stub().resolves({ productArrangementCode: 'PA-1', offerBaseline: null, fragmentBaseline: null }),
        );

        controller.hostUpdate();
        await flush();

        expect(controller.message).to.equal('Baseline for Catalog and PA-1 not found');
    });

    it('reports an offer without PA code as missing baselines', async () => {
        const controller = new CardBaselinesController(createHost(), sinon.stub().resolves(null));

        controller.hostUpdate();
        await flush();

        expect(controller.status).to.equal(BASELINE_STATUS.MISSING);
        expect(controller.message).to.equal('No PA code found for this offer');
    });

    it('reports a failed lookup', async () => {
        sinon.stub(console, 'error');
        const host = createHost();
        const controller = new CardBaselinesController(host, sinon.stub().rejects(new Error('Forbidden')));

        controller.hostUpdate();
        await flush();

        expect(controller.status).to.equal(BASELINE_STATUS.ERROR);
        expect(controller.message).to.equal('Baselines could not be looked up');
        expect(host.requestUpdate.calledOnce).to.be.true;
    });

    it('looks up again only when the offer, template, locale or card change', async () => {
        const find = sinon.stub().resolves(null);
        const host = createHost();
        const controller = new CardBaselinesController(host, find);

        controller.hostUpdate();
        controller.hostUpdate();
        host.values.variant = 'plans';
        controller.hostUpdate();
        await flush();

        expect(find.callCount).to.equal(2);
        expect(find.secondCall.args[1].template).to.equal('plans');
    });

    it('ignores the result of a superseded lookup', async () => {
        let resolveFirst;
        const find = sinon.stub();
        find.onFirstCall().returns(new Promise((resolve) => (resolveFirst = resolve)));
        find.onSecondCall().resolves(null);
        const host = createHost();
        const controller = new CardBaselinesController(host, find);

        controller.hostUpdate();
        host.values.osi = 'OTHER-OSI';
        controller.hostUpdate();
        await flush();
        resolveFirst({ fragmentBaseline: templateBaseline });
        await flush();

        expect(controller.status).to.equal(BASELINE_STATUS.MISSING);
    });

    it('ignores a lookup finishing after the host is disconnected', async () => {
        const host = createHost();
        const controller = new CardBaselinesController(host, sinon.stub().resolves({ fragmentBaseline: templateBaseline }));

        controller.hostUpdate();
        controller.hostDisconnected();
        await flush();

        expect(controller.status).to.equal(BASELINE_STATUS.PENDING);
        expect(host.requestUpdate.called).to.be.false;
    });

    describe('baseline parent', () => {
        const lookUp = async (values) => {
            const host = createHost(values);
            const controller = new CardBaselinesController(
                host,
                sinon.stub().resolves({ offerBaseline, fragmentBaseline: templateBaseline, fragmentSegmentBaseline: null }),
            );
            controller.hostUpdate();
            await flush();
            controller.hostUpdate();
            return { host, controller };
        };
        const lastParent = (host) => host.fragmentStore.setBaselineParent.lastCall.args[0];

        it('hands the merged baselines to the store when the card has baselines enabled', async () => {
            const { host } = await lookUp({ enableBaselines: true });

            expect(lastParent(host)).to.be.instanceOf(Fragment);
            expect(lastParent(host).getFieldValues('subtitle')).to.deep.equal(['Baseline subtitle']);
        });

        it('hands no parent to the store when the card has baselines disabled', async () => {
            const { host } = await lookUp({ enableBaselines: false });

            expect(lastParent(host)).to.be.null;
        });

        it('hands no parent to the store while the lookup is pending', () => {
            const host = createHost({ enableBaselines: true });
            const controller = new CardBaselinesController(host, () => new Promise(() => {}));

            controller.hostUpdate();

            expect(lastParent(host)).to.be.null;
        });

        const offerOnly = () => sinon.stub().resolves({ offerBaseline, fragmentBaseline: null, fragmentSegmentBaseline: null });

        it('drops the offer icon when the card has its own icon', async () => {
            const host = createHost({ enableBaselines: true }, CARD_PATH, [field('mnemonicIcon', 'card.svg')]);
            const controller = new CardBaselinesController(host, offerOnly());

            controller.hostUpdate();
            await flush();
            controller.hostUpdate();

            expect(lastParent(host)).to.be.null;
        });

        it('drops the offer icon when the locale default card of a variation has an icon', async () => {
            const host = createHost({ enableBaselines: true }, CARD_PATH);
            host.effectiveIsVariation = true;
            host.localeDefaultFragment = new Fragment({ fields: [field('mnemonicIcon', 'default.svg')] });
            const controller = new CardBaselinesController(host, offerOnly());

            controller.hostUpdate();
            await flush();
            controller.hostUpdate();

            expect(lastParent(host)).to.be.null;
        });

        it('keeps the offer icon it provides itself across updates', async () => {
            const host = createHost({ enableBaselines: true });
            const controller = new CardBaselinesController(host, offerOnly());

            controller.hostUpdate();
            await flush();
            controller.hostUpdate();
            host.values.mnemonicIcon = 'offer.svg';
            controller.hostUpdate();

            expect(lastParent(host).getFieldValues('mnemonicIcon')).to.deep.equal(['offer.svg']);
        });

        it('does not rebuild the parent when nothing it depends on changed', async () => {
            const { host, controller } = await lookUp({ enableBaselines: true });
            const calls = host.fragmentStore.setBaselineParent.callCount;

            controller.hostUpdate();

            expect(host.fragmentStore.setBaselineParent.callCount).to.equal(calls);
        });

        it('rebuilds the parent when baselines are turned off', async () => {
            const { host, controller } = await lookUp({ enableBaselines: true });

            host.values.enableBaselines = false;
            controller.hostUpdate();

            expect(lastParent(host)).to.be.null;
        });

        it('hands the parent to a new store of the host', async () => {
            const { host, controller } = await lookUp({ enableBaselines: true });
            const fragment = host.fragmentStore.get();
            host.fragmentStore = { get: () => fragment, setBaselineParent: sinon.spy() };

            controller.hostUpdate();

            expect(lastParent(host).getFieldValues('subtitle')).to.deep.equal(['Baseline subtitle']);
        });
    });
});
