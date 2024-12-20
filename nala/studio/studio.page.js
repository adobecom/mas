export default class StudioPage {
    constructor(page) {
        this.page = page;

        this.searchInput = page.locator('sp-search  input');
        this.searchIcon = page.locator('sp-search sp-icon-magnify');
        this.filter = page.locator('sp-action-button[label="Filter"]');
        this.topFolder = page.locator('sp-picker[label="TopFolder"] > button');
        this.renderView = page.locator('render-view');
        this.suggestedCard = page.locator(
            'merch-card[variant="ccd-suggested"]',
        );
        this.sliceCard = page.locator('merch-card[variant="ccd-slice"]');
        this.sliceCardWide = page.locator(
            'merch-card[variant="ccd-slice"][size="wide"]',
        );
    }

    async getCard(id, cardType) {
        const cardVariant = {
            suggested: this.suggestedCard,
            slice: this.sliceCard,
            'slice-wide': this.sliceCardWide,
        };

        const card = cardVariant[cardType];
        if (!card) {
            throw new Error(`Invalid card type: ${cardType}`);
        }

        return card.filter({
            has: this.page.locator(`aem-fragment[fragment="${id}"]`),
        });
    }
}
