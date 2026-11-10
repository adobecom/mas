export default class MasProductPricing {
    constructor(page) {
        this.page = page;
        this.cssProp = {
            card: {
                'background-color': 'rgb(255, 255, 255)',
                'border-top-left-radius': '16px',
                'border-top-color': 'rgb(235, 235, 235)',
            },
            icon: { width: '24px', height: '24px' },
            title: {
                color: 'rgb(0, 0, 0)',
                'font-size': '18px',
                'font-weight': '900',
                'line-height': '18px',
            },
            price: {
                color: 'rgb(0, 0, 0)',
                'font-size': '16px',
                'font-weight': '700',
                'line-height': '20px',
            },
            description: {
                color: 'rgb(92, 92, 92)',
                'font-size': '14px',
                'font-weight': '400',
                'line-height': '18px',
            },
            primaryCta: {
                'background-color': 'rgb(59, 99, 251)',
                color: 'rgb(255, 255, 255)',
                'border-top-left-radius': '999px',
                height: '40px',
            },
            outlineCta: {
                'background-color': 'rgba(0, 0, 0, 0)',
                color: 'rgb(0, 0, 0)',
                'border-top-left-radius': '999px',
                height: '40px',
            },
        };
        this.strikethroughCssProp = {
            color: 'rgb(92, 92, 92)',
            'font-size': '14px',
            'font-weight': '700',
            'line-height': '18px',
            'text-decoration-line': 'line-through',
        };
    }

    getCard(id) {
        return this.page.locator(`merch-card:has(aem-fragment[fragment="${id}"])`);
    }

    getCollection(id) {
        return this.page.locator(`merch-card-collection[id="${id}"]`);
    }

    getCollectionCards(collectionId) {
        return this.getCollection(collectionId).locator('merch-card');
    }

    getCardIcon(id) {
        return this.getCard(id).locator('merch-icon');
    }

    getCardTitle(id) {
        return this.getCard(id).locator('[slot="heading-s"]');
    }

    getCardPrice(id) {
        return this.getCard(id).locator('[slot="heading-xs"] span[data-template="price"]');
    }

    getCardStrikethroughPrice(id) {
        return this.getCard(id).locator('[slot="heading-xs"] .price-strikethrough');
    }

    getCardAlternativePrice(id) {
        return this.getCard(id).locator('[slot="heading-xs"] .price-alternative');
    }

    getCardPriceRow(id) {
        return this.getCard(id).locator('[slot="heading-xs"]');
    }

    getCardDescription(id) {
        return this.getCard(id).locator('div[slot="body-xs"]');
    }

    getCardPlanType(id) {
        return this.getCard(id).locator('p[slot="legal"] span.price-plan-type');
    }

    getCardCTAs(id) {
        return this.getCard(id).locator('div[slot="footer"] a');
    }

    // Groups the cards by row (same top) and reads each card's synced row height vars.
    // Rows are measured, not assumed, since the column count follows the viewport.
    getRowHeights(cards) {
        return cards.evaluateAll((els) => {
            const vars = ['heading-s', 'body-xs', 'price', 'fine', 'footer'].map(
                (name) => `--consonant-merch-card-product-pricing-${name}-height`,
            );
            const rows = new Map();
            for (const card of els.filter((c) => c.getBoundingClientRect().width > 2)) {
                const top = Math.round(card.getBoundingClientRect().top);
                const row = rows.get(top) ?? [];
                row.push(vars.map((v) => card.style.getPropertyValue(v)));
                rows.set(top, row);
            }
            return [...rows.values()];
        });
    }
}
