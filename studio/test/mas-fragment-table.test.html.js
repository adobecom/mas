// @ts-nocheck
import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

import '../../src/swc.js';
import '../../src/mas-fragment-table.js';
import Store from '../../src/store.js';
import Events from '../../src/events.js';
import { ReactiveStore } from '../../src/reactivity/reactive-store.js';
import { delay } from './utils.js';

runTests(async () => {
    describe('mas-fragment-table component', () => {
        let element;
        let toastMessages;
        let toastListener;
        let getServiceStub;

        beforeEach(async () => {
            // Capture toast messages by listening to events
            toastMessages = [];
            toastListener = (detail) => {
                toastMessages.push(detail);
            };
            Events.toast.subscribe(toastListener);

            element = document.createElement('mas-fragment-table');

            // Create a mock fragment store using ReactiveStore
            const mockFragmentData = {
                id: 'test-fragment-1',
                title: 'Test Fragment',
                status: 'Published',
                model: { path: '/conf/test/model' },
                getFieldValue: (field) => {
                    const fields = {
                        osi: null, // No OSI to avoid service calls
                        mnemonicIcon: 'https://example.com/icon.svg',
                    };
                    return fields[field];
                },
            };

            element.fragmentStore = new ReactiveStore(mockFragmentData);

            document.body.appendChild(element);
            await element.updateComplete;
        });

        afterEach(() => {
            Events.toast.unsubscribe(toastListener);
            element.remove();
        });

        describe('Offer ID truncation', () => {
            it('should truncate long Offer IDs to last 5 characters with ... prefix', () => {
                element.offerData = {
                    offerId: '04EA56333389C2F1EFD15EB8FCF79E87',
                    offerType: 'BASE',
                };

                const truncated = element.getTruncatedOfferId();
                expect(truncated).to.equal('...79E87');
            });

            it('should return the full Offer ID if it is 5 characters or less', () => {
                element.offerData = {
                    offerId: '12345',
                    offerType: 'BASE',
                };

                const truncated = element.getTruncatedOfferId();
                expect(truncated).to.equal('12345');
            });

            it('should return undefined if no Offer ID exists', () => {
                element.offerData = null;

                const truncated = element.getTruncatedOfferId();
                expect(truncated).to.be.undefined;
            });

            it('should handle Offer ID with exactly 6 characters', () => {
                element.offerData = {
                    offerId: 'ABCDEF',
                    offerType: 'BASE',
                };

                const truncated = element.getTruncatedOfferId();
                expect(truncated).to.equal('...BCDEF');
            });
        });

        describe('Copy to clipboard functionality', () => {
            let clipboardStub;
            let mockEvent;

            beforeEach(() => {
                clipboardStub = sinon.stub(navigator.clipboard, 'writeText');
                mockEvent = {
                    stopPropagation: sinon.stub(),
                };
            });

            afterEach(() => {
                clipboardStub.restore();
            });

            it('should copy full Offer ID to clipboard on success', async () => {
                const fullOfferId = '04EA56333389C2F1EFD15EB8FCF79E87';
                element.offerData = {
                    offerId: fullOfferId,
                    offerType: 'BASE',
                };

                clipboardStub.resolves();

                await element.copyOfferIdToClipboard(mockEvent);

                expect(mockEvent.stopPropagation.calledOnce).to.be.true;
                expect(clipboardStub.calledWith(fullOfferId)).to.be.true;

                // Check toast message
                await delay(50);
                expect(toastMessages.length).to.equal(1);
                expect(toastMessages[0].content).to.equal('Offer ID copied to clipboard');
                expect(toastMessages[0].variant).to.equal('positive');
            });

            it('should show error toast when clipboard write fails', async () => {
                element.offerData = {
                    offerId: '04EA56333389C2F1EFD15EB8FCF79E87',
                    offerType: 'BASE',
                };

                clipboardStub.rejects(new Error('Clipboard access denied'));

                await element.copyOfferIdToClipboard(mockEvent);

                expect(mockEvent.stopPropagation.calledOnce).to.be.true;

                // Check toast message
                await delay(50);
                expect(toastMessages.length).to.equal(1);
                expect(toastMessages[0].content).to.equal('Failed to copy Offer ID');
                expect(toastMessages[0].variant).to.equal('negative');
            });

            it('should do nothing if no Offer ID exists', async () => {
                element.offerData = null;

                await element.copyOfferIdToClipboard(mockEvent);

                expect(mockEvent.stopPropagation.calledOnce).to.be.true;
                expect(clipboardStub.called).to.be.false;

                // Check no toast was shown
                await delay(50);
                expect(toastMessages.length).to.equal(0);
            });

            it('should stop event propagation to prevent row selection', async () => {
                element.offerData = {
                    offerId: 'TEST123',
                    offerType: 'BASE',
                };

                clipboardStub.resolves();

                await element.copyOfferIdToClipboard(mockEvent);

                expect(mockEvent.stopPropagation.calledOnce).to.be.true;
            });
        });

        describe('Rendering', () => {
            it('should render table row with fragment data', async () => {
                await element.updateComplete;

                const row = element.querySelector('sp-table-row');
                expect(row).to.exist;
            });

            it('should display truncated Offer ID when offer data is available', async () => {
                element.offerData = {
                    offerId: '04EA56333389C2F1EFD15EB8FCF79E87',
                    offerType: 'BASE',
                };

                await element.updateComplete;

                const offerIdCell = element.querySelector('.offer-id');
                const offerIdText = offerIdCell.querySelector('.offer-id-text');

                expect(offerIdText.textContent.trim()).to.equal('...79E87');
            });

            it('should render copy icon when Offer ID exists', async () => {
                element.offerData = {
                    offerId: '04EA56333389C2F1EFD15EB8FCF79E87',
                    offerType: 'BASE',
                };

                await element.updateComplete;

                const copyIcon = element.querySelector('sp-icon-copy');
                expect(copyIcon).to.exist;
                expect(copyIcon.getAttribute('label')).to.equal('Copy to clipboard');
            });

            it('should not render copy icon when no Offer ID exists', async () => {
                element.offerData = null;

                await element.updateComplete;

                const copyIcon = element.querySelector('sp-icon-copy');
                expect(copyIcon).to.not.exist;
            });

            it('should render status with colored dot', async () => {
                await element.updateComplete;

                const statusCell = element.querySelector('.status');
                const statusDot = statusCell.querySelector('.status-dot');
                const statusText = statusCell.querySelector('.status-text');

                expect(statusDot).to.exist;
                expect(statusText).to.exist;
                expect(statusText.textContent).to.equal('Published');
            });

            it('should apply correct CSS class for status', async () => {
                await element.updateComplete;

                const statusCell = element.querySelector('.status');
                expect(statusCell.classList.contains('published-cell')).to.be.true;
            });
        });

        describe('Icon interaction', () => {
            let clipboardStub;

            beforeEach(() => {
                clipboardStub = sinon.stub(navigator.clipboard, 'writeText').resolves();
            });

            afterEach(() => {
                clipboardStub.restore();
            });

            it('should trigger copy on icon click', async () => {
                element.offerData = {
                    offerId: '04EA56333389C2F1EFD15EB8FCF79E87',
                    offerType: 'BASE',
                };

                await element.updateComplete;

                const copyIcon = element.querySelector('sp-icon-copy');
                expect(copyIcon).to.exist;

                copyIcon.click();
                await delay(100);

                expect(clipboardStub.calledWith('04EA56333389C2F1EFD15EB8FCF79E87')).to.be.true;

                // Check toast message
                expect(toastMessages.length).to.equal(1);
                expect(toastMessages[0].content).to.equal('Offer ID copied to clipboard');
                expect(toastMessages[0].variant).to.equal('positive');
            });
        });

        describe('Fragment name display', () => {
            it('should display fragment name with icon', async () => {
                await element.updateComplete;

                const nameCell = element.querySelector('.name');
                const icon = nameCell.querySelector('img.mnemonic-icon');

                expect(nameCell).to.exist;
                expect(icon).to.exist;
                expect(icon.src).to.equal('https://example.com/icon.svg');
            });
        });
    });
});
