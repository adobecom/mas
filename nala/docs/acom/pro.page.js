export default class MasPro {
    constructor(page) {
        this.page = page;
        this.cssProp = {
            card: { 'border-top-left-radius': '16px' },
            icon: { width: '24px', height: '24px' },
            title: { color: 'rgb(255, 255, 255)', 'font-size': '24px', 'font-weight': '900', 'line-height': '24px' },
            subtitle: {
                color: 'rgba(255, 255, 255, 0.64)',
                'font-size': '16px',
                'font-weight': '700',
                'line-height': '20px',
            },
            price: { color: 'rgb(255, 255, 255)', 'font-size': '18px', 'font-weight': '900', 'line-height': '21px' },
            description: { color: 'rgb(255, 255, 255)', 'font-size': '14px', 'font-weight': '400', 'line-height': '18px' },
            primaryCta: {
                'background-color': 'rgb(59, 99, 251)',
                color: 'rgb(255, 255, 255)',
                'border-top-left-radius': '999px',
                height: '40px',
            },
            outlineCta: {
                'background-color': 'rgba(0, 0, 0, 0)',
                color: 'rgb(255, 255, 255)',
                'border-top-left-radius': '999px',
                height: '40px',
            },
        };
        this.eduCssProp = {
            card: { 'max-width': '1068px' },
            title: { color: 'rgb(0, 0, 0)', 'font-size': '24px', 'font-weight': '900', 'line-height': '24px' },
            whatsIncludedTitle: {
                color: 'rgb(255, 255, 255)',
                'font-size': '36px',
                'font-weight': '900',
                'line-height': '32px',
            },
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
        return this.getCard(id).locator('merch-icon[slot="icons"]');
    }

    getCardTitle(id) {
        return this.getCard(id).locator('h3[slot="heading-xs"]');
    }

    getCardSubtitle(id) {
        return this.getCard(id).locator('p[slot="subtitle"]');
    }

    getCardPrice(id) {
        return this.getCard(id).locator('[slot="heading-m"] span[data-template="price"]');
    }

    getCardPriceRow(id) {
        return this.getCard(id).locator('[slot="heading-m"]');
    }

    getCardPlanType(id) {
        return this.getCard(id).locator('[slot="heading-m"] span.price-plan-type');
    }

    getCardDescription(id) {
        return this.getCard(id).locator('div[slot="body-xs"]');
    }

    getCardCTAs(id) {
        return this.getCard(id).locator('div[slot="footer"] a');
    }

    getCardWhatsIncluded(id) {
        return this.getCard(id).locator('div[slot="whats-included"]');
    }

    getEduTitle(id) {
        return this.getCardWhatsIncluded(id).locator('.whats-included-title');
    }

    getEduLabel(id) {
        return this.getCardWhatsIncluded(id).locator('.whats-included-label');
    }

    getEduDisclaimer(id) {
        return this.getCardWhatsIncluded(id).locator('.whats-included-disclaimer');
    }

    getEduAddon(id) {
        return this.getCard(id).locator('[slot="addon"]');
    }

    // Per card: row key (top) and the synced height custom properties.
    // Rows are measured, not assumed, since the column count follows the viewport.
    getRows(cards) {
        return cards.evaluateAll((els) => {
            const rows = new Map();
            for (const card of els.filter((c) => c.getBoundingClientRect().width > 2)) {
                const top = Math.round(card.getBoundingClientRect().top);
                const vars = [...card.style].filter(
                    (p) => p.startsWith('--consonant-merch-card-pro-') && p.endsWith('-height'),
                );
                const row = rows.get(top) ?? [];
                row.push(Object.fromEntries(vars.map((v) => [v, card.style.getPropertyValue(v)])));
                rows.set(top, row);
            }
            return [...rows.values()];
        });
    }
}
