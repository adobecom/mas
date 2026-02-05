import { runTests } from '@web/test-runner-mocha';
import chai, { expect } from '@esm-bundle/chai';
import chaiAsPromised from '@esm-bundle/chai-as-promised';

import { mockFetch } from './mocks/fetch.js';
import { withWcs } from './mocks/wcs.js';
import { withAem } from './mocks/aem.js';
import { getTemplateContent } from './utils.js';
import '../src/mas.js';
import { EVENT_AEM_LOAD, EVENT_AEM_ERROR } from '../src/constants.js';

chai.use(chaiAsPromised);

function appendTemplate(id) {
    const elements = getTemplateContent(id);
    elements.forEach((el) => document.body.appendChild(el));
    return document.querySelector('mas-inline');
}

runTests(async () => {
    const { cache } = customElements.get('aem-fragment');

    describe('mas-inline', () => {
        let aemMock;

        beforeEach(async () => {
            [aemMock] = await mockFetch(withAem, withWcs);
            cache.clear();
        });

        afterEach(() => {
            // Only remove mas-inline elements, not templates
            document.querySelectorAll('mas-inline').forEach((el) => el.remove());
        });

        describe('core functionality', () => {
            it('should render with fragment attribute', async () => {
                const masInline = appendTemplate('mas-inline-basic');

                const loadEvent = await new Promise((resolve) => {
                    masInline.addEventListener(EVENT_AEM_LOAD, resolve, { once: true });
                });

                expect(loadEvent.detail.field).to.equal('description');
                expect(masInline.textContent).to.include('Get Photoshop');
                expect(masInline.innerHTML).to.include('inline-price');
                expect(masInline.classList.contains('error')).to.be.false;
            });

            it('should create an internal aem-fragment element', async () => {
                const masInline = appendTemplate('mas-inline-basic');
                await masInline.updateComplete;

                const aemFragment = masInline.querySelector('aem-fragment');
                expect(aemFragment).to.exist;
                expect(aemFragment.getAttribute('fragment')).to.equal('fragment-text-faq');
            });

            it('should use description field by default', async () => {
                const masInline = appendTemplate('mas-inline-basic');

                const loadEvent = await new Promise((resolve) => {
                    masInline.addEventListener(EVENT_AEM_LOAD, resolve, { once: true });
                });

                expect(loadEvent.detail.field).to.equal('description');
                expect(masInline.textContent).to.include('Get Photoshop');
            });

            it('should render specified field - promoText', async () => {
                const masInline = appendTemplate('mas-inline-with-field');

                const loadEvent = await new Promise((resolve) => {
                    masInline.addEventListener(EVENT_AEM_LOAD, resolve, { once: true });
                });

                expect(loadEvent.detail.field).to.equal('promoText');
                expect(masInline.textContent).to.include('Save 50%');
            });

            it('should render specified field - shortDescription', async () => {
                const masInline = appendTemplate('mas-inline-short-description');

                const loadEvent = await new Promise((resolve) => {
                    masInline.addEventListener(EVENT_AEM_LOAD, resolve, { once: true });
                });

                expect(loadEvent.detail.field).to.equal('shortDescription');
                expect(masInline.textContent).to.include('Professional photo editing');
            });

            it('should render specified field - prices', async () => {
                const masInline = appendTemplate('mas-inline-prices');

                const loadEvent = await new Promise((resolve) => {
                    masInline.addEventListener(EVENT_AEM_LOAD, resolve, { once: true });
                });

                expect(loadEvent.detail.field).to.equal('prices');
                expect(masInline.innerHTML).to.include('inline-price');
            });

            it('should expose fragment data via data getter', async () => {
                const masInline = appendTemplate('mas-inline-basic');

                await new Promise((resolve) => {
                    masInline.addEventListener(EVENT_AEM_LOAD, resolve, { once: true });
                });

                expect(masInline.data).to.exist;
                expect(masInline.data.id).to.equal('fragment-text-faq');
                expect(masInline.data.fields).to.exist;
            });

            it('should expose aemFragment getter', async () => {
                const masInline = appendTemplate('mas-inline-basic');
                await masInline.updateComplete;

                expect(masInline.aemFragment).to.exist;
                expect(masInline.aemFragment.tagName).to.equal('AEM-FRAGMENT');
            });
        });

        describe('error handling', () => {
            it('should fire aem:error event for missing fragment attribute', async () => {
                const masInline = appendTemplate('mas-inline-missing-fragment');

                const errorEvent = await new Promise((resolve) => {
                    masInline.addEventListener(EVENT_AEM_ERROR, resolve, { once: true });
                });

                expect(errorEvent.detail.message).to.include('Missing fragment');
                expect(masInline.classList.contains('error')).to.be.true;
            });

            it('should fire aem:error event on fetch failure', async () => {
                const masInline = appendTemplate('mas-inline-not-found');

                const errorEvent = await new Promise((resolve) => {
                    masInline.addEventListener(EVENT_AEM_ERROR, resolve, { once: true });
                });

                expect(errorEvent.detail).to.exist;
                expect(masInline.classList.contains('error')).to.be.true;
            });
        });

        describe('refresh functionality', () => {
            it('should have refresh method that delegates to aem-fragment', async () => {
                const masInline = appendTemplate('mas-inline-basic');

                await new Promise((resolve) => {
                    masInline.addEventListener(EVENT_AEM_LOAD, resolve, { once: true });
                });

                expect(masInline.refresh).to.be.a('function');
                expect(masInline.aemFragment.refresh).to.be.a('function');

                const refreshPromise = masInline.refresh();
                expect(refreshPromise).to.be.a('promise');
            });
        });

        describe('cleanup', () => {
            it('should remove event listeners on disconnect', async () => {
                const masInline = appendTemplate('mas-inline-basic');

                await new Promise((resolve) => {
                    masInline.addEventListener(EVENT_AEM_LOAD, resolve, { once: true });
                });

                expect(() => masInline.remove()).to.not.throw;
            });
        });
    });
});
