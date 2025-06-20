// @ts-nocheck
import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';

import '../../src/mas-repository.js';
import '../../src/mas-content.js';

// import { mockFetch } from '@adobecom/milo/libs/features/mas/test/mocks/fetch.js';
// import { withAem } from '@adobecom/milo/libs/features/mas/test/mocks/aem.js';
import { getTemplateContent } from '../utils.js';

const spTheme = document.querySelector('sp-theme');

const initElementFromTemplate = (templateId) => {
    const [root] = getTemplateContent(templateId);
    spTheme.append(root);
    return root;
};

runTests(async () => {
    // mockFetch(withAem);
    describe('mas-content component', () => {
        it('uses a reactive store, managed by mas-repository, as data source', () => {
            const [masRepository, masContent] = initElementFromTemplate('mas-content-with-data-source').children;
        });
    });
});
