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
    return document.querySelector('mas-text');
}

runTests(async () => {
    const { cache } = customElements.get('aem-fragment');

    describe('mas-text', () => {
        let aemMock;

        beforeEach(async () => {
            [aemMock] = await mockFetch(withAem, withWcs);
            cache.clear();
        });

        afterEach(() => {
            // Only remove mas-text elements, not templates
            document.querySelectorAll('mas-text').forEach((el) => el.remove());
        });

        describe('core functionality', () => {
            it('should render with fragment attribute', async () => {
                const masText = appendTemplate('mas-text-basic');

                const loadEvent = await new Promise((resolve) => {
                    masText.addEventListener(EVENT_AEM_LOAD, resolve, { once: true });
                });

                expect(loadEvent.detail.field).to.equal('description');
                expect(masText.textContent).to.include('Get Photoshop');
                expect(masText.innerHTML).to.include('inline-price');
                expect(masText.classList.contains('error')).to.be.false;
            });

            it('should create an internal aem-fragment element', async () => {
                const masText = appendTemplate('mas-text-basic');
                await masText.updateComplete;

                const aemFragment = masText.querySelector('aem-fragment');
                expect(aemFragment).to.exist;
                expect(aemFragment.getAttribute('fragment')).to.equal('fragment-text-faq');
            });

            it('should use description field by default', async () => {
                const masText = appendTemplate('mas-text-basic');

                const loadEvent = await new Promise((resolve) => {
                    masText.addEventListener(EVENT_AEM_LOAD, resolve, { once: true });
                });

                expect(loadEvent.detail.field).to.equal('description');
                expect(masText.textContent).to.include('Get Photoshop');
            });

            it('should render specified field - promoText', async () => {
                const masText = appendTemplate('mas-text-with-field');

                const loadEvent = await new Promise((resolve) => {
                    masText.addEventListener(EVENT_AEM_LOAD, resolve, { once: true });
                });

                expect(loadEvent.detail.field).to.equal('promoText');
                expect(masText.textContent).to.include('Save 50%');
            });

            it('should render specified field - shortDescription', async () => {
                const masText = appendTemplate('mas-text-short-description');

                const loadEvent = await new Promise((resolve) => {
                    masText.addEventListener(EVENT_AEM_LOAD, resolve, { once: true });
                });

                expect(loadEvent.detail.field).to.equal('shortDescription');
                expect(masText.textContent).to.include('Professional photo editing');
            });

            it('should expose fragment data via data getter', async () => {
                const masText = appendTemplate('mas-text-basic');

                await new Promise((resolve) => {
                    masText.addEventListener(EVENT_AEM_LOAD, resolve, { once: true });
                });

                expect(masText.data).to.exist;
                expect(masText.data.id).to.equal('fragment-text-faq');
                expect(masText.data.fields).to.exist;
            });

            it('should expose aemFragment getter', async () => {
                const masText = appendTemplate('mas-text-basic');
                await masText.updateComplete;

                expect(masText.aemFragment).to.exist;
                expect(masText.aemFragment.tagName).to.equal('AEM-FRAGMENT');
            });
        });

        describe('error handling', () => {
            it('should fire aem:error event for missing fragment attribute', async () => {
                const masText = appendTemplate('mas-text-missing-fragment');

                const errorEvent = await new Promise((resolve) => {
                    masText.addEventListener(EVENT_AEM_ERROR, resolve, { once: true });
                });

                expect(errorEvent.detail.message).to.include('Missing fragment');
                expect(masText.classList.contains('error')).to.be.true;
            });

            it('should fire aem:error event on fetch failure', async () => {
                const masText = appendTemplate('mas-text-not-found');

                const errorEvent = await new Promise((resolve) => {
                    masText.addEventListener(EVENT_AEM_ERROR, resolve, { once: true });
                });

                expect(errorEvent.detail).to.exist;
                expect(masText.classList.contains('error')).to.be.true;
            });
        });

        describe('refresh functionality', () => {
            it('should have refresh method that delegates to aem-fragment', async () => {
                const masText = appendTemplate('mas-text-basic');

                await new Promise((resolve) => {
                    masText.addEventListener(EVENT_AEM_LOAD, resolve, { once: true });
                });

                expect(masText.refresh).to.be.a('function');
                expect(masText.aemFragment.refresh).to.be.a('function');

                const refreshPromise = masText.refresh();
                expect(refreshPromise).to.be.a('promise');
            });
        });

        describe('cleanup', () => {
            it('should remove event listeners on disconnect', async () => {
                const masText = appendTemplate('mas-text-basic');

                await new Promise((resolve) => {
                    masText.addEventListener(EVENT_AEM_LOAD, resolve, { once: true });
                });

                expect(() => masText.remove()).to.not.throw;
            });
        });
    });
});
