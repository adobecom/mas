import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { BASELINE_STATUS, CardBaselinesController } from '../../src/baselines/card-baselines-controller.js';
import { Fragment } from '../../src/aem/fragment.js';
import { getDefaultLocaleCode } from '../../../io/www/src/fragment/locales.js';

const CARD_PATH = '/content/dam/mas/sandbox/fr_FR/card';
const DEFAULT_LOCALE = getDefaultLocaleCode('sandbox', 'fr_FR');

const field = (name, ...values) => ({ name, values });
const templateBaseline = {
    id: 'template',
    title: 'Photoshop catalog',
    fields: [field('subtitle', 'Baseline subtitle'), field('mnemonicIcon', 'template.svg')],
};
const offerBaseline = { id: 'offer', fields: [field('mnemonicIcon', 'offer.svg'), field('mnemonicAlt', 'Photoshop')] };

const flush = () => new Promise((resolve) => setTimeout(resolve));

const createHost = (values = {}, path = CARD_PATH) => {
    const fragment = new Fragment({ id: 'card', path, fields: [] });
    return {
        values: { osi: 'OSI', variant: 'catalog', ...values },
        fragmentStore: { get: () => fragment, setBaselineParent: sinon.spy() },
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
            expect(controller.message).to.equal('');
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

    it('reports an offer baseline alone as found', async () => {
        const controller = new CardBaselinesController(
            createHost(),
            sinon.stub().resolves({ offerBaseline, fragmentBaseline: null, fragmentSegmentBaseline: null }),
        );

        controller.hostUpdate();
        await flush();

        expect(controller.message).to.equal('Offer baseline found: product title and icon');
    });

    it('reports missing baselines with the locale they were looked up in', async () => {
        for (const baselines of [null, { offerBaseline: null, fragmentBaseline: null, fragmentSegmentBaseline: null }]) {
            const controller = new CardBaselinesController(createHost(), sinon.stub().resolves(baselines));

            controller.hostUpdate();
            await flush();

            expect(controller.status).to.equal(BASELINE_STATUS.MISSING);
            expect(controller.message).to.equal(`No baseline for this offer and template in ${DEFAULT_LOCALE}`);
        }
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

        it('drops the offer icon when the card has its own icon', async () => {
            const host = createHost({ enableBaselines: true, mnemonicIcon: 'card.svg' });
            const controller = new CardBaselinesController(
                host,
                sinon.stub().resolves({ offerBaseline, fragmentBaseline: null, fragmentSegmentBaseline: null }),
            );

            controller.hostUpdate();
            await flush();
            controller.hostUpdate();

            expect(lastParent(host)).to.be.null;
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
