import { runTests } from '@web/test-runner-mocha';
import { expect } from '@esm-bundle/chai';
import { delay } from '../utils.js';
import '../../src/sidenav/merch-sidenav.js';
import '../../src/sidenav/merch-sidenav-list.js';
import { CSS as CATALOG_CSS } from '../../src/variants/catalog.css.js';

const shouldSkipTests = sessionStorage.getItem('skipTests') ?? false;

const injectCatalogStyles = () => {
    if (document.getElementById('catalog-variant-styles')) return;
    const style = document.createElement('style');
    style.id = 'catalog-variant-styles';
    style.innerHTML = CATALOG_CSS;
    document.head.appendChild(style);
};

const render = async (templateId, containerId) => {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    container.append(
        document.getElementById(templateId).content.cloneNode(true),
    );
    await delay(20);
};

const selectedBackgroundOf = (sidenav) =>
    getComputedStyle(sidenav)
        .getPropertyValue('--merch-sidenav-item-selected-background')
        .trim();

runTests(async () => {
    if (shouldSkipTests === 'true') {
        return;
    }

    describe('Catalog sidenav selected item background (accessibility contrast)', () => {
        before(() => {
            injectCatalogStyles();
        });

        it('resolves the catalog-scoped selected background to #919191', async () => {
            await render(
                'merch-sidenav-catalog-template',
                'merch-sidenav-catalog',
            );
            const sidenav = document.querySelector(
                '#merch-sidenav-catalog merch-sidenav.catalog',
            );
            expect(selectedBackgroundOf(sidenav)).to.equal('#919191');
        });

        it('leaves the shared default selected background untouched for non-catalog sidenavs', async () => {
            await render(
                'merch-sidenav-default-template',
                'merch-sidenav-default',
            );
            const sidenav = document.querySelector(
                '#merch-sidenav-default merch-sidenav',
            );
            const background = selectedBackgroundOf(sidenav);
            expect(background).to.not.equal('#919191');
            expect(background).to.include('--spectrum-gray-300');
        });
    });
});
