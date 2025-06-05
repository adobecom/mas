export default class CCDFriesPage {
    constructor(page) {
        this.page = page;

        this.title = page.locator('h3[slot="heading-xxs"]');
        this.description = page.locator('div[slot="body-s"]');
        this.price = page.locator('p[slot="price"] span[is="inline-price"]');
        this.cta = page.locator(
            '[slot="cta"] a.spectrum-Button, [slot="cta"] button, div[slot="cta"] button, div[slot="cta"] a',
        );
        this.icon = page.locator('merch-icon[slot="icons"]');
        this.trialBadge = page.locator('div[slot="trial-badge"] merch-badge');
        this.badge = page.locator('div[slot="badge"] merch-badge');

        // fries card properties:
        this.cssProp = {
            card: {
                'background-color': 'rgb(255, 255, 255)',
                'border-top-color': 'rgb(213, 213, 213)',
                'border-right-color': 'rgb(213, 213, 213)',
                'border-bottom-color': 'rgb(213, 213, 213)',
                'border-left-color': 'rgb(213, 213, 213)',
                'min-width': '0px',
                'max-width': '620px',
            },
            title: {
                color: 'rgb(19, 19, 19)',
            },
            description: {
                color: 'rgb(19, 19, 19)',
            },
            price: {
                color: 'rgb(0, 0, 0)',
            },
            cta: {
                color: 'rgb(34, 34, 34)',
            },
            icon: {
                color: 'rgb(19, 19, 19)',
                width: '24px',
                height: '24px',
            },
            trialBadge: {
                color: 'rgb(0, 143, 93)',
            },
            badge: {
                color: 'rgb(0, 0, 0)',
                'background-color': 'rgb(248, 217, 4)',
            },
        };
    }
}
