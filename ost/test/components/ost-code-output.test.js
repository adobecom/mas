import { expect, fixture, html } from '@open-wc/testing';
import '../../src/components/ost-placeholder-panel.js';
import '../../src/components/ost-code-output.js';
import { store } from '../../src/store/ost-store.js';

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
        store.aosParams = { marketSegment: 'COM' };
        store.checkoutClientId = 'mas-commerce-service';
    });

    afterEach(() => {
        store.selectedOffer = undefined;
        store.selectedOsi = undefined;
    });

    it('renders code string with OSI when inside placeholder panel', async () => {
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        await panel.updateComplete;
        const codeOutput = panel.shadowRoot.querySelector('ost-code-output');
        await codeOutput.updateComplete;
        const code = codeOutput.shadowRoot.querySelector('code');
        expect(code).to.exist;
        expect(code.textContent).to.include('abc123');
    });

    it('renders Use button', async () => {
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const codeOutput = panel.shadowRoot.querySelector('ost-code-output');
        await codeOutput.updateComplete;
        const button = codeOutput.shadowRoot.querySelector('sp-button');
        expect(button).to.exist;
        expect(button.textContent.trim()).to.equal('Use');
    });

    it('disables Use button when no OSI is selected', async () => {
        store.selectedOsi = undefined;
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        const codeOutput = panel.shadowRoot.querySelector('ost-code-output');
        await codeOutput.updateComplete;
        const button = codeOutput.shadowRoot.querySelector('sp-button');
        expect(button.hasAttribute('disabled')).to.be.true;
    });

    it('includes type in code string for non-price types', async () => {
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        panel.placeholderCtrl.setType('optical');
        await panel.updateComplete;
        const codeOutput = panel.shadowRoot.querySelector('ost-code-output');
        codeOutput.requestUpdate();
        await codeOutput.updateComplete;
        const code = codeOutput.shadowRoot.querySelector('code');
        expect(code.textContent).to.include('type="optical"');
    });

    it('omits options that equal their default value', async () => {
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        await panel.updateComplete;
        const codeOutput = panel.shadowRoot.querySelector('ost-code-output');
        await codeOutput.updateComplete;
        const code = codeOutput.shadowRoot.querySelector('code');
        // displayFormatted=true and displayRecurrence=true and displayOldPrice=true
        // are all defaults — they MUST NOT appear in the emitted markup.
        expect(code.textContent).to.not.include('displayFormatted');
        expect(code.textContent).to.not.include('displayRecurrence');
        expect(code.textContent).to.not.include('displayOldPrice');
    });

    it('emits promotionCode="cancel-context" when storedPromoOverride is set to the sentinel', async () => {
        store.storedPromoOverride = 'cancel-context';
        store.promotionCode = 'BLACK_FRIDAY';
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        await panel.updateComplete;
        const codeOutput = panel.shadowRoot.querySelector('ost-code-output');
        codeOutput.requestUpdate();
        await codeOutput.updateComplete;
        const code = codeOutput.shadowRoot.querySelector('code');
        expect(code.textContent).to.include('promotionCode="cancel-context"');
        store.storedPromoOverride = undefined;
        store.promotionCode = undefined;
    });

    it('emits an option only when it differs from the default', async () => {
        const panel = await fixture(html`<ost-placeholder-panel></ost-placeholder-panel>`);
        await panel.updateComplete;
        // Default for displayTax is false. Flipping to true should emit it.
        panel.toggleOption('displayTax');
        await panel.updateComplete;
        const codeOutput = panel.shadowRoot.querySelector('ost-code-output');
        codeOutput.requestUpdate();
        await codeOutput.updateComplete;
        const code = codeOutput.shadowRoot.querySelector('code');
        expect(code.textContent).to.include('displayTax="true"');
    });

    async function setupCheckoutType(panel) {
        panel.placeholderCtrl.setType('checkoutUrl');
        await panel.updateComplete;
        const codeOutput = panel.shadowRoot.querySelector('ost-code-output');
        const checkoutOptions = panel.shadowRoot.querySelector('ost-checkout-options');
        await checkoutOptions.updateComplete;
        return { codeOutput, checkoutOptions };
    }

    async function getCodeText(codeOutput) {
        codeOutput.requestUpdate();
        await codeOutput.updateComplete;
        return codeOutput.shadowRoot.querySelector('code').textContent;
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
        panel.placeholderCtrl.setType('discount');
        await panel.updateComplete;
        const codeOutput = panel.shadowRoot.querySelector('ost-code-output');
        codeOutput.referenceOsi = 'ref-osi';
        const text = await getCodeText(codeOutput);
        expect(text).to.include('osi="abc123,ref-osi"');
    });

    describe('handleUse', () => {
        it('does nothing when the component is not inside a placeholder panel', async () => {
            const codeOutput = await fixture(html`<ost-code-output></ost-code-output>`);
            // No throw, no state change.
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
            const codeOutput = panel.shadowRoot.querySelector('ost-code-output');
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
            const codeOutput = panel.shadowRoot.querySelector('ost-code-output');
            await codeOutput.handleUse();
            // Still flips the label even when clipboard rejects.
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

            // Fake ost-app host that captures select() calls.
            const ostApp = document.createElement('div');
            ostApp.tagName_ = 'OST-APP';
            // Lit fixtures live inside a temporary container; reparent the
            // panel under our fake ost-app so getRootNode().host walks land
            // on our captor.
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

            const codeOutput = panel.shadowRoot.querySelector('ost-code-output');
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
            panel.placeholderCtrl.setType('discount');
            await panel.updateComplete;

            let captured;
            ostApp.select = (arg) => {
                captured = arg;
            };
            const codeOutput = panel.shadowRoot.querySelector('ost-code-output');
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
            await panel.updateComplete;
            panel.placeholderCtrl.setType('checkoutUrl');
            await panel.updateComplete;

            const checkoutOptions = panel.shadowRoot.querySelector('ost-checkout-options');
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

            const codeOutput = panel.shadowRoot.querySelector('ost-code-output');
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
    });
});
