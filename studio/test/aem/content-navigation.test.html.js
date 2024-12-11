// @ts-nocheck
import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';

import '../../src/aem/content-navigation.js';
import '../../src/aem/aem-fragments.js';
import '../../src/aem/table-view.js';
import '../../src/aem/render-view.js';

import { mockFetch } from '@adobecom/milo/libs/features/mas/test/mocks/fetch.js';
import { withAem } from '@adobecom/milo/libs/features/mas/test/mocks/aem.js';
import { getTemplateContent } from '../utils.js';

const spTheme = document.querySelector('sp-theme');

const initElementFromTemplate = (templateId) => {
    const [root] = getTemplateContent(templateId);
    spTheme.append(root);
    return root;
};

runTests(async () => {
    // mockFetch(withAem);
    describe('content-navigation web component', () => {
        it('uses aem-fragments custom element as datasource', () => {
            const [aemFragments, contentNavigation] =
                initElementFromTemplate('content-navigation').children;
        });
    });
});
