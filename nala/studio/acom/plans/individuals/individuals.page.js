export default class ACOMPlansIndividualsPage {
    constructor(page) {
        this.page = page;

        // Card element selectors
        this.cardIcon = page.locator('merch-icon');
        this.cardTitle = page.locator('p[slot="heading-xs"]');
        this.cardBadge = page.locator('merch-badge');
        this.cardBadgeLabel = page.locator('.plans-badge');
        this.cardDescription = page.locator('div[slot="body-xs"] p');
        this.cardLegalLink = page.locator('a.modal-Link');
        this.cardPhoneLink = page.locator(
            'div[slot="body-xs"] a[href^="tel:"]',
        );
        this.cardPrice = page.locator('p[slot="heading-m"]');
        this.cardPriceStrikethrough = page.locator(
            'p[slot="heading-m"] span.price-strikethrough',
        );
        this.cardCTA = page.locator('div[slot="footer"] > a[is="checkout-link"]');
        this.cardPromoText = page.locator('p[slot="promo-text"]');
        this.cardStockCheckbox = page.locator('[id="stock-checkbox"]');
        this.cardStockCheckboxIcon = page.locator(
            '[id="stock-checkbox"] > span',
        );
        this.cardCallout = page.locator('div[slot="callout-content"] > p');
        this.cardSecureTransaction = page.locator('.secure-transaction-label');
        this.cardQuantitySelector = page.locator('merch-quantity-select');
        this.cardWhatsIncluded = page.locator('div[slot="whats-included"]');
        this.cardWhatsIncludedLabel = page.locator(
            'merch-whats-included div[slot="heading"]',
        );
        this.cardWhatsIncludedIcon = page.locator(
            'merch-whats-included merch-icon',
        );
        this.cardWhatsIncludedIconLabel = page.locator(
            'merch-whats-included p[slot="description"]',
        );

        // Plans individual card properties:
        this.cssProp = {
            card: {
                'background-color': 'rgb(255, 255, 255)',
                'border-color': 'rgb(245, 199, 0)',
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
                color: 'rgb(0, 122, 77)',
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
