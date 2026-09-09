import { CheckoutLink } from '../src/checkout-link.js';
import { CheckoutButton } from '../src/checkout-button.js';
import { launchAupCheckout } from '../src/aup-checkout.js';
import { mockFetch } from './mocks/fetch.js';
import { withWcs } from './mocks/wcs.js';
import { mockLana, unmockLana } from './mocks/lana.js';
import { unmockIms } from './mocks/ims.js';
import {
    expect,
    sinon,
    initMasCommerceService,
    removeMasCommerceService,
} from './utilities.js';
import '../src/mas.js';
import '../src/mas-field.js';

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

describe('aup-select checkout routing', () => {
    let meta;
    let container;
    let sdk;
    let previousSdk;
    let launch;
    let legacy;
    let service;
    let cleanup;

    beforeEach(async () => {
        await mockFetch(withWcs);
        mockLana();
        cleanup = [];
        previousSdk = window.aupsdk;
        launch = sinon.stub().resolves({ status: 'cancel' });
        sdk = {
            getOrchestratorContext: sinon
                .stub()
                .resolves({ launchWorkflowInModal: launch }),
        };
        window.aupsdk = sdk;
        legacy = sinon.spy((event) => event.preventDefault());
        service = initMasCommerceService({}, () => ({ handler: legacy }));
        container = document.createElement('div');
        document.body.append(container);
        meta = document.createElement('meta');
        meta.name = 'aup-select';
        meta.content = 'on';
        document.head.append(meta);
    });

    afterEach(async () => {
        cleanup.forEach((callback) => callback());
        await Promise.all(
            [...container.querySelectorAll('[is]')].map(
                (element) => element.aupCheckoutPromise,
            ),
        );
        meta.remove();
        container.remove();
        window.aupsdk = previousSdk;
        removeMasCommerceService();
        unmockIms();
        unmockLana();
        sinon.restore();
    });

    async function create(Class = CheckoutLink, options = {}) {
        const factory = Class.createCheckoutLink ?? Class.createCheckoutButton;
        const element = factory({ wcsOsi: 'abm', ...options }, 'Checkout');
        container.append(element);
        await element.onceSettled();
        return element;
    }

    function click(element, init = {}) {
        const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            ...init,
        });
        element.dispatchEvent(event);
        return event;
    }

    async function createCard(Class = CheckoutLink) {
        await customElements.whenDefined('merch-card');
        const card = document.createElement('merch-card');
        card.setAttribute('variant', 'plans');
        const footer = document.createElement('div');
        footer.slot = 'footer';
        const addon = document.createElement('merch-addon');
        addon.innerHTML =
            '<p data-plan-type="ABM"><span is="inline-price" data-offer-type="TRIAL" data-wcs-osi="stock-abm"></span></p>';
        card.append(addon, footer);
        container.append(card);
        await addon.querySelector('[is="inline-price"]').onceSettled();
        const link = await create(Class);
        link.setAttribute('data-modal-id', 'checkout-modal');
        footer.append(link);
        await link.onceSettled();
        await card.updateComplete;
        expect(card.checkoutLinks).to.include(link);
        return { card, addon, link };
    }

    function closeMessage(cart) {
        return {
            subType: 'AppClosed',
            data: {
                statusCode: 0,
                actions: [
                    {
                        required: true,
                        actionMessage: {
                            type: 'System',
                            subType: 'ReportState',
                            data: { commerce: { cart } },
                        },
                    },
                ],
            },
        };
    }

    function launchWithCart(cart, exit = Promise.resolve()) {
        launch.callsFake(async (request, handler) => {
            await exit;
            handler('System', closeMessage(cart), sinon.spy());
            return { status: 'cancel' };
        });
    }

    it('applies the AUP cart to only the originating card on close', async () => {
        const first = await createCard();
        const second = await createCard();
        const exit = deferred();
        const items = [
            {
                productArrangementCode:
                    first.link.value[0].productArrangementCode,
                quantity: 1,
            },
            {
                productArrangementCode: first.addon.querySelector(
                    '[is="inline-price"]',
                ).value[0].productArrangementCode,
                quantity: 1,
            },
        ];
        launchWithCart(items, exit.promise);
        click(first.link);
        expect(first.addon.checked).to.be.false;
        exit.resolve();
        await first.link.aupCheckoutPromise;
        expect(first.addon.checked).to.be.true;
        expect(first.link.dataset.wcsOsi).to.equal('abm,stock-abm');
        expect(second.addon.checked).to.be.false;
        expect(second.link.dataset.wcsOsi).to.equal('abm');
    });

    for (const cart of [
        undefined,
        [],
        {},
        [null, { productArrangementCode: 'ccsn_direct_individual' }],
        [{ productArrangementCode: 'another-product' }],
    ]) {
        it(`does not update the card for an absent or unrelated AUP cart: ${JSON.stringify(cart)}`, async () => {
            const { card, addon, link } = await createCard();
            const update = sinon.spy();
            card.addEventListener(
                'merch-modal:addon-and-quantity-update',
                update,
            );
            launchWithCart(cart);
            click(link);
            await link.aupCheckoutPromise;
            expect(update.called).to.be.false;
            expect(addon.checked).to.be.false;
            expect(legacy.called).to.be.false;
        });
    }

    it('applies Stock deselection made while an AUP dialog is open', async () => {
        const { addon, link } = await createCard();
        const exit = deferred();
        const mainProduct = link.value[0].productArrangementCode;
        launchWithCart(
            [{ productArrangementCode: mainProduct, quantity: 1 }],
            exit.promise,
        );
        click(link);
        addon.checked = true;
        exit.resolve();
        await link.aupCheckoutPromise;
        expect(addon.checked).to.be.false;
        expect(link.dataset.wcsOsi).to.equal('abm');
    });

    it('does not select Stock when Select returns a different addon', async () => {
        const { addon, link } = await createCard();
        launchWithCart([
            {
                productArrangementCode: link.value[0].productArrangementCode,
                quantity: 1,
            },
            { productArrangementCode: 'ai-assistant', quantity: 1 },
        ]);
        click(link);
        await link.aupCheckoutPromise;
        expect(addon.checked).to.be.false;
        expect(link.dataset.wcsOsi).to.equal('abm');
    });

    it('does not apply the cart if the originating card now shows another product', async () => {
        const { addon, link } = await createCard();
        const exit = deferred();
        launchWithCart(
            [
                {
                    productArrangementCode:
                        link.value[0].productArrangementCode,
                    quantity: 1,
                },
                {
                    productArrangementCode: 'stks_direct_individual',
                    quantity: 1,
                },
            ],
            exit.promise,
        );
        click(link);
        link.updateOptions({ wcsOsi: 'stock-m2m' });
        await link.onceSettled();
        exit.resolve();
        await link.aupCheckoutPromise;
        expect(addon.checked).to.be.false;
    });

    it('preserves the host handler and SDK default handler for all messages', async () => {
        const { link } = await createCard();
        const parent = sinon.spy();
        const host = sinon.spy((name, payload, parentHandler) =>
            parentHandler(name, payload),
        );
        sdk.getOrchestratorContext.resolves({
            launchWorkflowInModal: launch,
            clientMessageHandler: host,
        });
        const payload = closeMessage([
            {
                productArrangementCode: link.value[0].productArrangementCode,
                quantity: 1,
            },
        ]);
        launch.callsFake(async (request, handler) => {
            handler('Analytics', { subType: 'track' }, parent);
            handler(
                'System',
                { subType: 'AppClosed', data: { actions: {} } },
                parent,
            );
            handler('System', payload, parent);
            return { status: 'cancel' };
        });
        click(link);
        await link.aupCheckoutPromise;
        expect(host.callCount).to.equal(3);
        expect(parent.callCount).to.equal(3);
        expect(parent.lastCall.args).to.deep.equal(['System', payload]);
        expect(
            (await sdk.getOrchestratorContext()).clientMessageHandler,
        ).to.equal(host);
    });

    for (const Class of [CheckoutLink, CheckoutButton]) {
        for (const href of [null, '#', '/checkout', 'https://[invalid']) {
            it(`syncs ${Class.is} without an explicit PA when href is ${href}`, async () => {
                const { card, addon, link } = await createCard(Class);
                if (href === null) {
                    link.removeAttribute('href');
                    link.removeAttribute('data-href');
                } else {
                    link.setCheckoutUrl(href);
                }
                const mainItem = {
                    productArrangementCode:
                        link.value[0].productArrangementCode,
                    quantity: 1,
                };
                const update = (items) =>
                    card.handleAddonAndQuantityUpdate({
                        detail: { id: 'checkout-modal', items },
                    });
                update([
                    mainItem,
                    {
                        productArrangementCode: 'stks_direct_individual',
                        quantity: 1,
                    },
                ]);
                expect(addon.checked).to.be.true;
                expect(link.dataset.wcsOsi).to.equal('abm,stock-abm');
                await link.onceSettled();
                update([mainItem]);
                expect(addon.checked).to.be.false;
                expect(link.dataset.wcsOsi).to.equal('abm');
            });
        }
    }

    for (const checked of [false, true]) {
        it(`preserves addon selection (${checked}) when the main PA is unavailable`, async () => {
            const { card, addon, link } = await createCard();
            addon.checked = checked;
            link.masElement.value = undefined;
            card.handleAddonAndQuantityUpdate({
                detail: {
                    id: 'checkout-modal',
                    items: [
                        {
                            productArrangementCode: 'stks_direct_individual',
                            quantity: 1,
                        },
                    ],
                },
            });
            expect(addon.checked).to.equal(checked);
            expect(link.dataset.wcsOsi).to.equal('abm');
        });
    }

    for (const Class of [CheckoutLink, CheckoutButton]) {
        for (const href of [
            '#',
            'https://commerce.adobe.com/store/email?items[0][id]=offer',
        ]) {
            it(`syncs ${Class.is} with a checkout URL without pa: ${href}`, async () => {
                const { addon, link } = await createCard(Class);
                link.setCheckoutUrl(href);
                launchWithCart([
                    {
                        productArrangementCode:
                            link.value[0].productArrangementCode,
                        quantity: 1,
                    },
                    {
                        productArrangementCode: 'stks_direct_individual',
                        quantity: 1,
                    },
                ]);
                click(link);
                await link.aupCheckoutPromise;
                expect(addon.checked).to.be.true;
                expect(link.dataset.wcsOsi).to.equal('abm,stock-abm');
                expect(launch.calledOnce).to.be.true;
                expect(legacy.called).to.be.false;
            });
        }
    }

    for (const state of ['pending', 'failed', 'missing']) {
        it(`preserves Stock selection when addon prices are ${state}`, async () => {
            const { addon, link } = await createCard();
            const exit = deferred();
            cleanup.push(() => exit.resolve());
            launchWithCart(
                [
                    {
                        productArrangementCode:
                            link.value[0].productArrangementCode,
                        quantity: 1,
                    },
                    {
                        productArrangementCode: 'stks_direct_individual',
                        quantity: 1,
                    },
                ],
                exit.promise,
            );
            click(link);
            addon.checked = true;
            const price = addon.querySelector('[is="inline-price"]');
            if (state === 'pending') {
                price.masElement.togglePending(price.options);
            } else if (state === 'failed') {
                const failedPrice = document.createElement('span', {
                    is: 'inline-price',
                });
                failedPrice.dataset.wcsOsi = 'network-error';
                price.replaceWith(failedPrice);
                await failedPrice.onceSettled().then(
                    () => expect.fail('Expected addon fetch failure'),
                    (error) => expect(error).to.exist,
                );
            } else {
                price.remove();
            }
            const change = sinon.spy();
            addon.addEventListener('change', change);
            exit.resolve();
            await link.aupCheckoutPromise;
            expect(addon.checked).to.be.true;
            expect(change.called).to.be.false;
            expect(legacy.called).to.be.false;
        });
    }

    it('does not fall back or keep checkout locked after a cart synchronization error', async () => {
        const { card, link } = await createCard();
        launchWithCart([
            {
                productArrangementCode: link.value[0].productArrangementCode,
                quantity: 1,
            },
        ]);
        const query = sinon.stub(card, 'querySelectorAll').callThrough();
        query
            .withArgs('merch-addon [is="inline-price"]')
            .throws(new Error('Cart update failed'));
        click(link);
        await link.aupCheckoutPromise;
        expect(legacy.called).to.be.false;
        query.restore();
        click(link);
        await link.aupCheckoutPromise;
        expect(launch.calledTwice).to.be.true;
        expect(legacy.called).to.be.false;
    });

    for (const Class of [CheckoutLink, CheckoutButton]) {
        describe(Class.is, () => {
            it('routes resolved buy checkout without changing the URL or emitting another click', async () => {
                const element = await create(Class);
                const href = element.href;
                const analytics = sinon.spy();
                container.addEventListener('click', analytics);
                const event = click(element);
                expect(event.defaultPrevented).to.be.true;
                await element.aupCheckoutPromise;
                expect(launch.calledOnce).to.be.true;
                expect(launch.firstCall.args).to.deep.equal([
                    {
                        intent: 'buy',
                        context: {
                            clientId: 'adobe_com',
                            clientType: 'web',
                            co: 'US',
                            pa: 'ccsn_direct_individual',
                            cs: 'INDIVIDUAL',
                            ms: 'COM',
                        },
                        params: {
                            lang: 'en',
                            ctxrturl: window.location.href,
                            ot: 'BASE',
                        },
                    },
                ]);
                expect(element.href).to.equal(href);
                expect(legacy.called).to.be.false;
                expect(analytics.calledOnceWithExactly(event)).to.be.true;
            });

            it('uses try for a resolved trial offer and supports keyboard-generated clicks', async () => {
                const element = await create(Class, { wcsOsi: 'stock-m2m' });
                click(element, { detail: 0 });
                await element.aupCheckoutPromise;
                expect(launch.firstCall.args[0].intent).to.equal('try');
                expect(launch.firstCall.args[0].params.ot).to.equal('TRIAL');
            });

            it('reads metadata at each click, including late insertion, replacement, and removal', async () => {
                meta.remove();
                const element = await create(Class);
                click(element);
                expect(legacy.callCount).to.equal(1);
                document.head.append(meta);
                click(element);
                await element.aupCheckoutPromise;
                expect(launch.callCount).to.equal(1);
                meta.content = 'off';
                click(element);
                expect(legacy.callCount).to.equal(2);
                const replacement = meta.cloneNode();
                replacement.content = 'on';
                meta.replaceWith(replacement);
                meta = replacement;
                click(element);
                await element.aupCheckoutPromise;
                expect(launch.callCount).to.equal(2);
                meta.remove();
                click(element);
                expect(legacy.callCount).to.equal(3);
            });

            it('falls back synchronously when the host SDK is not ready, and uses it on a later click', async () => {
                const element = await create(Class);
                delete window.aupsdk;
                click(element);
                expect(legacy.calledOnce).to.be.true;
                window.aupsdk = sdk;
                click(element);
                await element.aupCheckoutPromise;
                expect(launch.calledOnce).to.be.true;
                expect(legacy.calledOnce).to.be.true;
            });

            for (const failure of ['context', 'launch']) {
                it(`runs the saved action once after ${failure} rejection`, async () => {
                    const element = await create(Class);
                    const failed =
                        failure === 'context'
                            ? sdk.getOrchestratorContext
                            : launch;
                    failed.rejects(new Error('SDK unavailable'));
                    const event = click(element);
                    const replacement = sinon.spy();
                    element.checkoutActionHandler = replacement;
                    await element.aupCheckoutPromise;
                    expect(legacy.calledOnceWithExactly(event)).to.be.true;
                    expect(replacement.called).to.be.false;
                });
            }

            for (const className of ['download', 'upgrade']) {
                it(`preserves ${className} checkout actions`, async () => {
                    await service.registerCheckoutAction(() => ({
                        handler: legacy,
                        className,
                    }));
                    const element = await create(Class);
                    click(element);
                    expect(legacy.calledOnce).to.be.true;
                    expect(sdk.getOrchestratorContext.called).to.be.false;
                });
            }

            it('suppresses repeated clicks until workflow exit, then allows reopening', async () => {
                const exit = deferred();
                const opened = deferred();
                cleanup.push(() => exit.resolve({ status: 'cancel' }));
                launch.callsFake(() => {
                    opened.resolve();
                    return exit.promise;
                });
                const element = await create(Class);
                click(element);
                click(element);
                await opened.promise;
                expect(launch.calledOnce).to.be.true;
                meta.content = 'off';
                click(element);
                expect(legacy.called).to.be.false;
                exit.resolve({ status: 'cancel' });
                await element.aupCheckoutPromise;
                meta.content = 'on';
                click(element);
                await element.aupCheckoutPromise;
                expect(launch.calledTwice).to.be.true;
                expect(legacy.called).to.be.false;
            });

            for (const status of ['success', 'cancel']) {
                it(`does not fall back after workflow ${status}`, async () => {
                    launch.resolves({ status });
                    const element = await create(Class);
                    click(element);
                    await element.aupCheckoutPromise;
                    expect(legacy.called).to.be.false;
                });
            }

            it('preserves the saved URL when there is no host action', async () => {
                const element = await create(Class);
                element.checkoutActionHandler = undefined;
                element.setCheckoutUrl('#aup-fallback');
                launch.rejects(new Error('Launch failed'));
                click(element);
                element.setCheckoutUrl('#another-checkout');
                await element.aupCheckoutPromise;
                expect(window.location.hash).to.equal('#aup-fallback');
                history.replaceState(
                    null,
                    '',
                    window.location.pathname + window.location.search,
                );
            });
        });
    }

    for (const value of ['', 'true', 'ON', 'off']) {
        it(`does not opt in for metadata value ${JSON.stringify(value)}`, async () => {
            meta.content = value;
            const element = await create();
            click(element);
            expect(sdk.getOrchestratorContext.called).to.be.false;
            expect(legacy.calledOnce).to.be.true;
        });
    }

    it('routes using live commerce service configuration without metadata', async () => {
        meta.remove();
        const element = await create();
        click(element);
        expect(legacy.calledOnce).to.be.true;
        service.setAttribute('aup-select', 'on');
        click(element);
        await element.aupCheckoutPromise;
        expect(launch.calledOnce).to.be.true;
        service.setAttribute('aup-select', 'off');
        click(element);
        expect(legacy.calledTwice).to.be.true;
    });

    it('does not accept the old metadata name', async () => {
        meta.name = 'mas-select';
        const element = await create();
        click(element);
        expect(legacy.calledOnce).to.be.true;
        expect(sdk.getOrchestratorContext.called).to.be.false;
    });

    for (const init of [
        { ctrlKey: true },
        { metaKey: true },
        { shiftKey: true },
        { altKey: true },
        { button: 1 },
    ]) {
        it(`preserves modified clicks ${JSON.stringify(init)}`, async () => {
            const element = await create();
            click(element, init);
            expect(sdk.getOrchestratorContext.called).to.be.false;
            expect(legacy.calledOnce).to.be.true;
        });
    }

    it('preserves links with a target or download attribute', async () => {
        const element = await create();
        element.target = '_blank';
        click(element);
        element.removeAttribute('target');
        element.setAttribute('download', '');
        click(element);
        expect(sdk.getOrchestratorContext.called).to.be.false;
        expect(legacy.calledTwice).to.be.true;
    });

    it('does not launch from a cancelled event or stale offers during resolution', async () => {
        const element = await create();
        const event = new MouseEvent('click', { cancelable: true });
        event.preventDefault();
        element.dispatchEvent(event);
        element.masElement.togglePending(element.options);
        click(element);
        expect(sdk.getOrchestratorContext.called).to.be.false;
    });

    it('suppresses another CTA while the orchestrator is loading', async () => {
        const context = deferred();
        sdk.getOrchestratorContext.returns(context.promise);
        const link = await create();
        const button = await create(CheckoutButton);
        click(link);
        click(button);
        context.resolve({ launchWorkflowInModal: launch });
        await link.aupCheckoutPromise;
        expect(launch.calledOnce).to.be.true;
        expect(legacy.called).to.be.false;
    });

    it('retains the clicked offer if the CTA updates while the SDK is loading', async () => {
        const context = deferred();
        sdk.getOrchestratorContext.returns(context.promise);
        const element = await create();
        click(element);
        element.updateOptions({ wcsOsi: 'stock-m2m' });
        click(element);
        expect(legacy.called).to.be.false;
        await element.onceSettled();
        context.resolve({ launchWorkflowInModal: launch });
        await element.aupCheckoutPromise;
        expect(launch.firstCall.args[0].context.pa).to.equal(
            'ccsn_direct_individual',
        );
        click(element);
        await element.aupCheckoutPromise;
        expect(launch.secondCall.args[0].intent).to.equal('try');
    });

    it('falls back if the context has no modal support', async () => {
        sdk.getOrchestratorContext.resolves({});
        const element = await create();
        click(element);
        await element.aupCheckoutPromise;
        expect(legacy.calledOnce).to.be.true;
    });

    it('falls back if no workflow is found', async () => {
        launch.resolves({ status: 'no-workflow-found' });
        const element = await create();
        click(element);
        await element.aupCheckoutPromise;
        expect(legacy.calledOnce).to.be.true;
    });

    for (const options of [
        { quantity: 2 },
        { extraOptions: '{"q":"2"}' },
        { wcsOsi: 'abm,stock-m2m' },
        { wcsOsi: 'abm-promo', promotionCode: 'nicopromo' },
        { extraOptions: '{"ao":"stock"}' },
        { upgrade: true },
        { wcsOsi: 'perpetual', perpetual: true },
        { checkoutWorkflowStep: 'change-plan/team-upgrade/plans' },
    ]) {
        it(`preserves unsupported checkout ${JSON.stringify(options)}`, async () => {
            const element = await create(CheckoutLink, options);
            click(element);
            await element.aupCheckoutPromise;
            expect(launch.called).to.be.false;
            expect(legacy.calledOnce).to.be.true;
        });
    }

    it('forwards the configured client ID without an allowlist', async () => {
        removeMasCommerceService();
        service = initMasCommerceService(
            { 'checkout-client-id': 'other-client' },
            () => ({ handler: legacy }),
        );
        const element = await create();
        click(element);
        await element.aupCheckoutPromise;
        expect(launch.calledOnce).to.be.true;
        expect(launch.firstCall.args[0].context.clientId).to.equal(
            'other-client',
        );
        expect(legacy.called).to.be.false;
    });

    it('maps optional context and params without forwarding internal variants or mode flags', async () => {
        const element = await create(CheckoutLink, {
            extraOptions: JSON.stringify({
                cs: 't',
                ms: 'e',
                svar: 'campaign',
                customerIntent: 'personal',
                sid: 'session-id',
                ctxrturl: 'https://www.adobe.com/plans',
                rtc: 't',
                lo: 'sl',
                af: 'feature',
                wvar: 'internal',
                cvar: 'internal',
                enableRenderIn: 'iframe',
            }),
        });
        click(element);
        await element.aupCheckoutPromise;
        expect(launch.firstCall.args[0]).to.deep.equal({
            intent: 'buy',
            context: {
                clientId: 'adobe_com',
                clientType: 'web',
                co: 'US',
                pa: 'ccsn_direct_individual',
                cs: 'TEAM',
                ms: 'EDU',
                svar: 'campaign',
                customerIntent: 'personal',
                sid: 'session-id',
            },
            params: {
                lang: 'en',
                ctxrturl: 'https://www.adobe.com/plans',
                ot: 'BASE',
                rtc: 't',
                lo: 'sl',
                af: 'feature',
            },
        });
    });

    it('maps product code and plan preselection from resolved offer data', async () => {
        const element = await create();
        const offer = {
            ...element.value[0],
            productArrangement: { productCode: 'CCSN' },
        };
        await launchAupCheckout(sdk, [offer], {
            ...element.options,
            preselectPlan: 'EDU',
        });
        expect(launch.firstCall.args[0].context).to.include({
            pc: 'CCSN',
            ms: 'EDU',
        });
        await launchAupCheckout(sdk, [offer], {
            ...element.options,
            preselectPlan: 'TEAM',
        });
        expect(launch.secondCall.args[0].context.cs).to.equal('TEAM');
    });

    it('routes a headless CTA after its mas-field wrapper is removed', async () => {
        const field = document.createElement('mas-field');
        field.setAttribute('field', 'ctas');
        const fragment = document.createElement('aem-fragment');
        field.append(fragment);
        container.append(field);
        fragment.dispatchEvent(
            new CustomEvent('aem:load', {
                bubbles: true,
                detail: {
                    fields: {
                        ctas: '<a data-wcs-osi="abm" data-analytics-id="buy-now">Buy now</a>',
                    },
                },
            }),
        );
        const element = field.querySelector('a[is="checkout-link"]');
        expect(element).to.exist;
        await element.onceSettled();
        field.replaceWith(element);
        await element.onceSettled();
        click(element);
        await element.aupCheckoutPromise;
        expect(launch.calledOnce).to.be.true;
    });
});
