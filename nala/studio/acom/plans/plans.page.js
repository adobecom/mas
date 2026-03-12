export default class ACOMPlansCardPage {
    constructor(page) {
        this.page = page;
        this.card = page.locator('merch-card');

        // Card element selectors
        this.cardIcon = this.card.locator('merch-icon').first();
        this.cardTitle = this.card.locator('h3[slot="heading-xs"]');
        this.cardBadge = this.card.locator('merch-badge');
        this.cardBadgeLabel = this.card.locator('.plans-badge');
        this.cardDescription = this.card.locator('div[slot="body-xs"] p');
        this.cardLegalLink = this.card.locator('a.modal-Link');
        this.cardPhoneLink = this.card.locator('div[slot="body-xs"] a[href^="tel:"]');
        this.cardPrice = this.card.locator('p[slot="heading-m"] span[data-template="price"]');
        this.cardPriceStrikethrough = this.card.locator('p[slot="heading-m"] span.price-strikethrough');
        this.cardPriceLegal = this.card.locator('span[is="inline-price"][data-template="legal"]');
        this.cardCTA = this.card.locator('div[slot="footer"] > a[is="checkout-link"]');
        this.cardPromoText = this.card.locator('p[slot="promo-text"]');
        this.cardStockCheckbox = this.card.locator('[id="stock-checkbox"]');
        this.cardStockCheckboxIcon = this.card.locator('[id="stock-checkbox"] > span');
        this.cardCallout = this.card.locator('div[slot="callout-content"] > p');
        this.cardSecureTransaction = this.card.locator('.secure-transaction-label');
        this.cardQuantitySelector = this.card.locator('merch-quantity-select');
        this.cardWhatsIncluded = this.card.locator('div[slot="whats-included"]');
        this.cardWhatsIncludedLabel = this.card.locator('merch-whats-included div[slot="heading"]');
        this.cardWhatsIncludedIcon = this.card.locator('merch-whats-included div[slot="content"] merch-icon');
        this.cardWhatsIncludedIconLabel = this.card.locator('merch-whats-included p[slot="description"]');
        this.cardUptLink = this.card.locator('a.upt-link');

        // Plans individual card properties:
        this.individualsCSSProp = {
            card: {
                'background-color': 'rgb(245, 199, 0)',
                'background-image': 'rgb(255, 255, 255)',
            },
            icon: {
                width: '41.5px',
                height: '40px',
            },
            badge: {
                'background-color': 'rgb(245, 199, 0)',
                'border-left-color': 'rgb(245, 199, 0)',
                'border-top-color': 'rgb(245, 199, 0)',
                'border-bottom-color': 'rgb(245, 199, 0)',
                color: 'rgb(0, 0, 0)',
                'font-size': '14px',
                'font-weight': '400',
                'line-height': '21px',
                'padding-top': '2px',
                'padding-bottom': '3px',
                'padding-left': '10px',
                'padding-right': '10px',
                'border-bottom-left-radius': '4px',
                'border-bottom-right-radius': '0px',
                'border-top-left-radius': '4px',
                'border-top-right-radius': '0px',
            },
            title: {
                color: 'rgb(44, 44, 44)',
                'font-size': '18px',
                'font-weight': '700',
                'line-height': '22.5px',
            },
            price: {
                color: 'rgb(44, 44, 44)',
                'font-size': '24px',
                'font-weight': '700',
                'line-height': '30px',
            },
            strikethroughPrice: {
                color: 'rgb(44, 44, 44)',
                'font-size': '14px',
                'font-weight': '700',
                'line-height': '21px',
                'text-decoration-color': 'rgb(44, 44, 44)',
                'text-decoration-line': 'line-through',
            },
            promoText: {
                color: 'rgb(5, 131, 78)',
                'font-size': '14px',
                'font-weight': '700',
                'line-height': '21px',
            },
            description: {
                color: 'rgb(44, 44, 44)',
                'font-size': '14px',
                'font-weight': '400',
                'line-height': '21px',
            },
            legalLink: {
                color: 'rgb(39, 77, 234)',
                'font-size': '14px',
                'font-weight': '400',
                'line-height': '21px',
                'text-decoration-line': 'underline',
                'text-decoration-style': 'solid',
            },
            callout: {
                'background-color': 'rgb(217, 217, 217)',
                color: 'rgb(0, 0, 0)',
                'font-size': '14px',
                'font-weight': '400',
                'line-height': '21px',
            },
            stockCheckbox: {
                text: {
                    color: 'rgb(34, 34, 34)',
                    'font-size': '12px',
                    'font-weight': '400',
                    'line-height': '12px',
                },
                checkbox: {
                    'border-color': 'rgb(109, 109, 109)',
                    'border-radius': '2px',
                    width: '12px',
                    height: '12px',
                },
            },
            secureTransaction: {
                color: 'rgb(80, 80, 80)',
                'font-size': '12px',
                'font-weight': '400',
                'line-height': '12px',
            },
            cta: {
                'background-color': 'rgb(59, 99, 251)',
                color: 'rgb(255, 255, 255)',
                'font-size': '15px',
                'font-weight': '700',
                'line-height': '19px',
            },
        };
    }
}
