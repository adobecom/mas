export default class SandboxBrandConciergePage {
    constructor(page) {
        this.page = page;

        // Card element selectors (light DOM slots)
        this.cardIcon = page.locator('merch-icon[slot="icons"]').first();
        this.cardTitle = page.locator('h3[slot="heading-s"]');
        this.cardBadge = page.locator('div[slot="badge"] merch-badge');
        this.cardPrice = page.locator('p[slot="heading-xs"]');
        this.cardPromoText = page.locator('p[slot="promo-text"]');
        this.cardDescription = page.locator('div[slot="body-xs"]');
        this.cardCTA = page.locator('div[slot="footer"] a');

        // Shadow DOM elements (Playwright locators pierce shadow roots)
        this.cardBody = page.locator('merch-card .body');
        this.cardFooter = page.locator('merch-card footer');

        // Brand Concierge Product card CSS properties (observed on the
        // brand-concierge-product variant render):
        this.cssProp = {
            card: {
                'min-width': '248px',
                'max-width': '378px',
                'border-radius': '16px',
                'font-weight': '400',
            },
            title: {
                color: 'rgb(44, 44, 44)',
                'font-size': '20px',
                'font-weight': '700',
                'line-height': '25px',
            },
            price: {
                color: 'rgb(44, 44, 44)',
                'font-size': '18px',
                'font-weight': '700',
                'line-height': '22.5px',
            },
            description: {
                color: 'rgb(44, 44, 44)',
                'font-size': '14px',
                'font-weight': '400',
                'line-height': '21px',
            },
            body: {
                padding: '16px',
                gap: '8px',
            },
            footer: {
                padding: '0px 16px 16px',
                gap: '8px',
            },
        };
    }
}
