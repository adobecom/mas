export default class CCDSuggestedPage {
    constructor(page) {
        this.page = page;
        this.priceStrikethrough = page.locator('.price-strikethrough');
        this.cardIcon = page.locator('merch-icon');
        this.cardTitle = this.page.locator('h3[slot="heading-xs"]');
        this.cardEyebrow = page.locator('h4[slot="detail-s"]');
        this.cardDescription = page.locator('div[slot="body-xs"] p').first();
        this.cardLegalLink = page.locator('div[slot="body-xs"] p > a');
        this.cardPrice = page.locator('p[slot="price"]');
        this.cardCTA = page.locator('div[slot="cta"] > button');
        this.cardCTALink = page.locator(
            'div[slot="cta"] a[is="checkout-link"]',
        );

        // Suggested card properties:
        this.cssProp = {
            card: {
                'background-color': 'rgb(245, 245, 245)',
                'border-bottom-color': 'rgb(225, 225, 225)',
                'border-left-color': 'rgb(225, 225, 225)',
                'border-right-color': 'rgb(225, 225, 225)',
                'border-top-color': 'rgb(225, 225, 225)',
                'min-width': '270px',
                'max-width': '305px',
                'min-height': '205px',
            },
            icon: {
                width: '40px',
                height: '38px',
            },
            title: {
                color: 'rgb(44, 44, 44)',
                'font-size': '16px',
                'font-weight': '700',
                'line-height': '20px',
            },
            eyebrow: {
                color: 'rgb(110, 110, 110)',
                'font-size': '11px',
                'font-weight': '700',
                'line-height': '14px',
            },
            description: {
                color: 'rgb(75, 75, 75)',
                'font-size': '14px',
                'font-weight': '400',
                'line-height': '21px',
            },
            legalLink: {
                color: 'rgb(2, 101, 220)',
                'font-size': '12px',
                'font-weight': '400',
                'line-height': '18px',
            },
            price: {
                color: 'rgb(34, 34, 34)',
                'font-size': '14px',
                'font-weight': '400',
                'line-height': '21px',
            },
            strikethroughPrice: {
                color: 'rgb(109, 109, 109)',
                'font-size': '14px',
                'font-weight': '400',
                'text-decoration-line': 'line-through',
                'text-decoration-color': 'rgb(109, 109, 109)',
            },
            cta: {
                color: 'rgb(34, 34, 34)',
                'font-size': '14px',
                'font-weight': '700',
            },
        };
    }
}
