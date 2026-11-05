export default class MasProductC2 {
    constructor(page) {
        this.page = page;
        this.cssPropBlack = {
            card: {
                color: 'rgb(255, 255, 255)',
                'background-color': 'rgb(0, 0, 0)',
            },
            badge: {
                color: 'rgb(0, 0, 0)',
                'background-color': 'rgb(255, 255, 255)',
            },
        };
        this.cssPropGray = {
            card: {
                color: 'rgb(0, 0, 0)',
                'background-color': 'rgb(248, 248, 248)',
            },
            badge: {
                color: 'rgb(255, 255, 255)',
                'background-color': 'rgb(5, 131, 78)',
            },
        };
    }

    getCard(id) {
        return this.page.locator(`merch-card:has(aem-fragment[fragment="${id}"])`).first();
    }

    getCardBadge(id) {
        const card = this.getCard(id);
        return card.locator('merch-badge');
    }
}
