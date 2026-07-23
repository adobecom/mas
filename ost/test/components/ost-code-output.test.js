import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/ost-placeholder-panel.js';
import '../../src/components/ost-code-output.js';
import { store } from '../../src/store/ost-store.js';

const outputForType = (panel, type) =>
    panel.shadowRoot.querySelector(`[data-testid="ost-placeholder-row-${type}"] ost-code-output`);

describe('ost-code-output', () => {
    beforeEach(() => {
        store.selectedOffer = { offer_id: 'TEST123', offer_type: 'BASE' };
        store.selectedOsi = 'abc123';
        store.placeholderTypes = [
            { type: 'price', name: 'Price' },
            { type: 'optical', name: 'Optical price' },
            { type: 'annual', name: 'Annual price' },
            { type: 'strikethrough', name: 'Strikethrough price' },
            { type: 'promo-strikethrough', name: 'Promo strikethrough price' },
            { type: 'discount', name: 'Discount percentage' },
            { type: 'legal', name: 'Legal disclaimer', overrides: { displayPlanType: true } },
            { type: 'checkoutUrl', name: 'Checkout URL' },
        ];
        store.defaultPlaceholderOptions = {
            displayFormatted: true,
            displayRecurrence: true,
            displayPerUnit: false,
            displayTax: false,
            forceTaxExclusive: false,
            displayOldPrice: true,
        };
        store.placeholderOptions = { ...store.defaultPlaceholderOptions };
        store.aosParams = { marketSegment: 'COM' };
        store.checkoutClientId = 'mas-commerce-service';
        store.placeholderTab = 'price';
    });

    afterEach(() => {
        store.selectedOffer = undefined;
        store.selectedOsi = undefined;
        store.placeholderOptions = { ...store.defaultPlaceholderOptions };
        store.placeholderTab = 'price';
    });

    it('prefers its osi property over store.selectedOsi in the code string', async () => {
        const codeOutput = await fixture(html`<ost-code-output .placeholderType=${'price'}></ost-code-output>`);
        codeOutput.osi = 'override-osi';
        await codeOutput.updateComplete;
        expect(codeOutput.getCodeString()).to.include('osi="override-osi"');
    });

    it('forwards the override osi and offer through handleUse', async () => {
        const original = navigator.clipboard?.writeText;
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: async () => {} },
            configurable: true,
        });
        const ostApp = document.createElement('div');
        Object.defineProperty(ostApp, 'tagName', { value: 'OST-APP' });
        ostApp.attachShadow({ mode: 'open' });
        document.body.appendChild(ostApp);
        const codeOutput = document.createElement('ost-code-output');
        codeOutput.placeholderType = 'price';
        codeOutput.osi = 'trial-osi';
        codeOutput.offer = { offer_id: 'TRIAL1' };
        ostApp.shadowRoot.appendChild(codeOutput);
        await codeOutput.updateComplete;

        let captured;
        ostApp.select = (arg) => {
            captured = arg;
        };
        await codeOutput.handleUse();
        expect(captured.osi).to.equal('trial-osi');
        expect(captured.offer.offer_id).to.equal('TRIAL1');

        ostApp.remove();
        if (original) {
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: original },
                configurable: true,
            });
        }
    });

    it('builds code string with OSI when inside placeholder panel', async () => {
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        await panel.updateComplete;
        const codeOutput = outputForType(panel, 'price');
        await codeOutput.updateComplete;
        expect(codeOutput.getCodeString()).to.include('abc123');
    });

    it('does not display the code string', async () => {
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        await panel.updateComplete;
        const codeOutput = outputForType(panel, 'price');
        await codeOutput.updateComplete;
        expect(Boolean(codeOutput.shadowRoot.querySelector('code'))).to.be.false;
    });

    it('renders Use button', async () => {
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const codeOutput = outputForType(panel, 'price');
        await codeOutput.updateComplete;
        const button = codeOutput.shadowRoot.querySelector('sp-button');
        expect(button).to.exist;
        expect(button.textContent.trim()).to.equal('Use');
    });

    it('disables Use button when no OSI is selected', async () => {
        store.selectedOsi = undefined;
        const codeOutput = await fixture(html`<ost-code-output .placeholderType=${'price'}></ost-code-output>`);
        const button = codeOutput.shadowRoot.querySelector('sp-button');
        expect(button.hasAttribute('disabled')).to.be.true;
    });

    it('includes type in code string for non-price types', async () => {
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        await panel.updateComplete;
        const codeOutput = outputForType(panel, 'optical');
        await codeOutput.updateComplete;
        expect(codeOutput.getCodeString()).to.include('type="optical"');
    });

    it('omits options that equal their default value', async () => {
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        await panel.updateComplete;
        const codeOutput = outputForType(panel, 'price');
        await codeOutput.updateComplete;
        const text = codeOutput.getCodeString();
        expect(text).to.not.include('displayFormatted');
        expect(text).to.not.include('displayRecurrence');
        expect(text).to.not.include('displayOldPrice');
    });

    it('emits promotionCode="cancel-context" when storedPromoOverride is set to the sentinel', async () => {
        store.storedPromoOverride = 'cancel-context';
        store.promotionCode = 'BLACK_FRIDAY';
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        await panel.updateComplete;
        const codeOutput = outputForType(panel, 'price');
        codeOutput.requestUpdate();
        await codeOutput.updateComplete;
        expect(codeOutput.getCodeString()).to.include('promotionCode="cancel-context"');
        store.storedPromoOverride = undefined;
        store.promotionCode = undefined;
    });

    it('emits an option only when it differs from the default', async () => {
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        await panel.updateComplete;
        store.setPlaceholderOptions({ ...store.placeholderOptions, displayTax: true });
        const codeOutput = outputForType(panel, 'price');
        codeOutput.requestUpdate();
        await codeOutput.updateComplete;
        expect(codeOutput.getCodeString()).to.include('displayTax="true"');
    });

    async function setupCheckoutType(panel) {
        store.placeholderTab = 'checkout';
        await panel.updateComplete;
        const codeOutput = outputForType(panel, 'checkoutUrl');
        const checkoutOptions = panel.shadowRoot.querySelector(
            '[data-testid="ost-placeholder-row-checkoutUrl"] ost-checkout-options',
        );
        await checkoutOptions.updateComplete;
        return { codeOutput, checkoutOptions };
    }

    async function getCodeText(codeOutput) {
        codeOutput.requestUpdate();
        await codeOutput.updateComplete;
        return codeOutput.getCodeString();
    }

    it('emits workflowStep when checkout controller has a non-default step', async () => {
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const { codeOutput, checkoutOptions } = await setupCheckoutType(panel);
        checkoutOptions.setWorkflowStep('checkout');
        expect(await getCodeText(codeOutput)).to.include('workflowStep="checkout"');
    });

    it('omits workflowStep when it is the default ("email")', async () => {
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const { codeOutput, checkoutOptions } = await setupCheckoutType(panel);
        checkoutOptions.setWorkflowStep('email');
        expect(await getCodeText(codeOutput)).to.not.include('workflowStep');
    });

    it('emits ctaText when checkout controller has one', async () => {
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const { codeOutput, checkoutOptions } = await setupCheckoutType(panel);
        checkoutOptions.setCtaText('buy-now');
        expect(await getCodeText(codeOutput)).to.include('ctaText="buy-now"');
    });

    it('emits modal when both enableModal and modalType are set', async () => {
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const { codeOutput, checkoutOptions } = await setupCheckoutType(panel);
        checkoutOptions.toggleModal(true);
        checkoutOptions.setModalType('twp');
        expect(await getCodeText(codeOutput)).to.include('modal="twp"');
    });

    it('omits modal when enableModal is true but modalType is empty', async () => {
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const { codeOutput, checkoutOptions } = await setupCheckoutType(panel);
        checkoutOptions.toggleModal(true);
        expect(await getCodeText(codeOutput)).to.not.include('modal=');
    });

    it('emits entitlement and upgrade flags when toggled on', async () => {
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const { codeOutput, checkoutOptions } = await setupCheckoutType(panel);
        checkoutOptions.toggleEntitlement(true);
        checkoutOptions.toggleUpgrade(true);
        const text = await getCodeText(codeOutput);
        expect(text).to.include('entitlement="true"');
        expect(text).to.include('upgrade="true"');
    });

    it('combines OSI with referenceOsi for discount type', async () => {
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        await panel.updateComplete;
        const codeOutput = outputForType(panel, 'discount');
        codeOutput.referenceOsi = 'ref-osi';
        const text = await getCodeText(codeOutput);
        expect(text).to.include('osi="abc123,ref-osi"');
    });

    describe('handleUse', () => {
        it('does nothing when the component has no placeholderType', async () => {
            const codeOutput = await fixture(html`<ost-code-output></ost-code-output>`);
            await codeOutput.handleUse();
            expect(codeOutput.buttonText).to.equal('Use');
        });

        it('writes the code string to the clipboard and flips the button label', async () => {
            const original = navigator.clipboard?.writeText;
            let written;
            Object.defineProperty(navigator, 'clipboard', {
                value: {
                    writeText: async (text) => {
                        written = text;
                    },
                },
                configurable: true,
            });

            const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
            await panel.updateComplete;
            const codeOutput = outputForType(panel, 'price');
            await codeOutput.handleUse();
            expect(written).to.include('abc123');
            expect(codeOutput.buttonText).to.equal('Copied');

            if (original) {
                Object.defineProperty(navigator, 'clipboard', {
                    value: { writeText: original },
                    configurable: true,
                });
            }
        });

        it('survives clipboard failure without throwing', async () => {
            const original = navigator.clipboard?.writeText;
            Object.defineProperty(navigator, 'clipboard', {
                value: {
                    writeText: async () => {
                        throw new Error('blocked');
                    },
                },
                configurable: true,
            });

            const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
            await panel.updateComplete;
            const codeOutput = outputForType(panel, 'price');
            await codeOutput.handleUse();
            expect(codeOutput.buttonText).to.equal('Copied');

            if (original) {
                Object.defineProperty(navigator, 'clipboard', {
                    value: { writeText: original },
                    configurable: true,
                });
            }
        });

        it('forwards the selection to the host OST-APP via app.select', async () => {
            const original = navigator.clipboard?.writeText;
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: async () => {} },
                configurable: true,
            });

            const ostApp = document.createElement('div');
            Object.defineProperty(ostApp, 'tagName', { value: 'OST-APP' });
            ostApp.attachShadow({ mode: 'open' });
            document.body.appendChild(ostApp);

            const panel = document.createElement('ost-placeholder-panel');
            ostApp.shadowRoot.appendChild(panel);
            await panel.updateComplete;

            let capturedArg;
            ostApp.select = (arg) => {
                capturedArg = arg;
            };

            const codeOutput = outputForType(panel, 'price');
            await codeOutput.handleUse();

            expect(capturedArg).to.exist;
            expect(capturedArg.osi).to.equal('abc123');
            expect(capturedArg.type).to.equal('price');
            expect(capturedArg.country).to.equal(store.country);

            ostApp.remove();
            if (original) {
                Object.defineProperty(navigator, 'clipboard', {
                    value: { writeText: original },
                    configurable: true,
                });
            }
        });

        it('passes the cancel-context sentinel through to app.select when context promo is cancelled', async () => {
            const original = navigator.clipboard?.writeText;
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: async () => {} },
                configurable: true,
            });

            const ostApp = document.createElement('div');
            Object.defineProperty(ostApp, 'tagName', { value: 'OST-APP' });
            ostApp.attachShadow({ mode: 'open' });
            document.body.appendChild(ostApp);

            const panel = document.createElement('ost-placeholder-panel');
            ostApp.shadowRoot.appendChild(panel);
            await panel.updateComplete;

            store.storedPromoOverride = 'cancel-context';
            store.promotionCode = 'BLACK_FRIDAY';

            let captured;
            ostApp.select = (arg) => {
                captured = arg;
            };
            const codeOutput = panel.shadowRoot.querySelector('ost-code-output');
            await codeOutput.handleUse();
            expect(captured.promoOverride).to.equal('cancel-context');

            store.storedPromoOverride = undefined;
            store.promotionCode = undefined;
            ostApp.remove();
            if (original) {
                Object.defineProperty(navigator, 'clipboard', {
                    value: { writeText: original },
                    configurable: true,
                });
            }
        });

        it('combines base OSI with referenceOsi when type is discount', async () => {
            const original = navigator.clipboard?.writeText;
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: async () => {} },
                configurable: true,
            });

            const ostApp = document.createElement('div');
            Object.defineProperty(ostApp, 'tagName', { value: 'OST-APP' });
            ostApp.attachShadow({ mode: 'open' });
            document.body.appendChild(ostApp);

            const panel = document.createElement('ost-placeholder-panel');
            ostApp.shadowRoot.appendChild(panel);
            await panel.updateComplete;

            let captured;
            ostApp.select = (arg) => {
                captured = arg;
            };
            const codeOutput = outputForType(panel, 'discount');
            codeOutput.referenceOsi = 'ref-osi';

            await codeOutput.handleUse();
            expect(captured.osi).to.equal('abc123,ref-osi');

            ostApp.remove();
            if (original) {
                Object.defineProperty(navigator, 'clipboard', {
                    value: { writeText: original },
                    configurable: true,
                });
            }
        });

        it('folds checkout controller state into options when present', async () => {
            const original = navigator.clipboard?.writeText;
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: async () => {} },
                configurable: true,
            });

            const ostApp = document.createElement('div');
            Object.defineProperty(ostApp, 'tagName', { value: 'OST-APP' });
            ostApp.attachShadow({ mode: 'open' });
            document.body.appendChild(ostApp);

            const panel = document.createElement('ost-placeholder-panel');
            ostApp.shadowRoot.appendChild(panel);
            store.placeholderTab = 'checkout';
            await panel.updateComplete;

            const checkoutOptions = panel.shadowRoot.querySelector(
                '[data-testid="ost-placeholder-row-checkoutUrl"] ost-checkout-options',
            );
            await checkoutOptions.updateComplete;
            checkoutOptions.toggleModal(true);
            checkoutOptions.setModalType('twp');
            checkoutOptions.toggleEntitlement(true);
            checkoutOptions.toggleUpgrade(true);
            checkoutOptions.setCtaText('buy-now');

            let captured;
            ostApp.select = (arg) => {
                captured = arg;
            };

            const codeOutput = outputForType(panel, 'checkoutUrl');
            await codeOutput.handleUse();
            expect(captured.options.modal).to.equal('twp');
            expect(captured.options.entitlement).to.equal(true);
            expect(captured.options.upgrade).to.equal(true);
            expect(captured.options.ctaText).to.equal('buy-now');
            expect(captured.options.workflow).to.equal('UCv3');
            expect(captured.options.clientId).to.equal('mas-commerce-service');

            ostApp.remove();
            if (original) {
                Object.defineProperty(navigator, 'clipboard', {
                    value: { writeText: original },
                    configurable: true,
                });
            }
        });

        it('forwards the effective promo as promoOverride so it writes back to the card', async () => {
            const original = navigator.clipboard?.writeText;
            Object.defineProperty(navigator, 'clipboard', {
                value: { writeText: async () => {} },
                configurable: true,
            });

            store.storedPromoOverride = 'SAVE20';

            const ostApp = document.createElement('div');
            Object.defineProperty(ostApp, 'tagName', { value: 'OST-APP' });
            ostApp.attachShadow({ mode: 'open' });
            document.body.appendChild(ostApp);
            const panel = document.createElement('ost-placeholder-panel');
            ostApp.shadowRoot.appendChild(panel);
            await panel.updateComplete;

            let capturedArg;
            ostApp.select = (arg) => {
                capturedArg = arg;
            };

            const codeOutput = outputForType(panel, 'price');
            await codeOutput.handleUse();

            expect(capturedArg.promoOverride).to.equal('SAVE20');

            ostApp.remove();
            store.storedPromoOverride = undefined;
            if (original) {
                Object.defineProperty(navigator, 'clipboard', {
                    value: { writeText: original },
                    configurable: true,
                });
            }
        });
    });
});
