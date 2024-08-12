// @ts-nocheck
import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';

import '../src/swc.js';
import '../src/studio.js';

import { mockFetch } from './mocks/fetch.js';
import { mockIms } from './mocks/ims.js';
import { withAem } from './mocks/aem.js';
import { withWcs } from './mocks/wcs.js';

import mas from './mocks/mas.js?features=merch-card';
import { getTemplateContent } from '@adobe/mas-commons/test/utils.js';
import { delay } from './utils.js';

import '@tinymce/tinymce-webcomponent';

runTests(async () => {
    await mockFetch(withAem, withWcs);
    await mockIms();
    await mas();

    describe('M@S Studio', () => {
        beforeEach(() => {
            document.location.hash = '#';
        });
        it('should render', () => {
            const [studio] = getTemplateContent('studio');
            document.querySelector('main').append(studio);
            expect(studio).exist;
        });
        it.skip('should search via deeplink', async () => {
            document.location.hash =
                '#path=%2Fcontent%2Fdam%2Fsandbox%2Fmas&query=ccd';
            const [studio] = getTemplateContent('studio');
            document.querySelector('main').append(studio);
            await delay(100);
            const [cc, photoshop] = document.querySelectorAll('merch-card');
            expect(cc).to.exist;
            expect(photoshop).to.exist;
            cc.dispatchEvent(new Event('dblclick'));
            await studio.updateComplate;
            const editor = document.getElementById('editor');
            await delay(100);
            expect(editor.innerText).to.not.empty;
        });
    });
});
