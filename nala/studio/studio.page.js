export default class StudioPage {
    constructor(page) {
        this.page = page;

        this.quickActions = page.locator('.quick-actions');
        this.recentlyUpdated = page.locator('.recently-updated');
        this.gotoContent = page.locator(
            '.quick-action-card[heading="Go to Content"]',
        );

        this.searchInput = page.locator('sp-search  input');
        this.searchIcon = page.locator('sp-search sp-icon-magnify');
        this.filter = page.locator('sp-action-button[label="Filter"]');
        this.topFolder = page.locator('sp-picker[label="TopFolder"] > button');
        this.renderView = page.locator('#render');
        this.quickActions = page.locator('.quick-actions');
        this.editorPanel = page.locator('editor-panel');
        this.suggestedCard = page.locator(
            'merch-card[variant="ccd-suggested"]',
        );
        this.sliceCard = page.locator('merch-card[variant="ccd-slice"]');
        this.sliceCardWide = page.locator(
            'merch-card[variant="ccd-slice"][size="wide"]',
        );
        this.price = page.locator('span[data-template="price"]');
        this.priceStrikethrough = page.locator(
            'span[data-template="strikethrough"]',
        );
        this.cardIcon = page.locator('merch-icon');
        this.cardBadge = page.locator('.ccd-slice-badge');
        // Editor panel fields
        this.editorTitle = page.locator('#card-title');
        // suggested cards
        this.suggestedCard = page.locator(
            'merch-card[variant="ccd-suggested"]',
        );
        this.suggestedCardTitle = this.page.locator('h3[slot="heading-xs"]');
        this.suggestedCardEyebrow = page.locator('h4[slot="detail-s"]');
        this.suggestedCardDescription = page
            .locator('div[slot="body-xs"] p')
            .first();
        this.suggestedCardLegalLink = page.locator('div[slot="body-xs"] p > a');
        this.suggestedCardPrice = page.locator('p[slot="price"]');
        this.suggestedCardCTA = page.locator('div[slot="cta"] > sp-button');
        this.suggestedCardCTALink = page.locator(
            'div[slot="cta"] a[is="checkout-link"]',
        );
        // slice cards
        this.sliceCard = page.locator('merch-card[variant="ccd-slice"]');
        this.sliceCardWide = page.locator(
            'merch-card[variant="ccd-slice"][size="wide"]',
        );
        this.sliceCardImage = page.locator('div[slot="image"] img');
        this.sliceCardDescription = page
            .locator('div[slot="body-s"] p > strong')
            .first();
        this.sliceCardLegalLink = page.locator('div[slot="body-s"] p > a');
        this.sliceCardCTA = page.locator('div[slot="footer"] > sp-button');
        this.sliceCardCTALink = page.locator(
            'div[slot="footer"] a[is="checkout-link"]',
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

        return card
            .filter({
                has: this.page.locator(`aem-fragment[fragment="${id}"]`),
            })
            .locator('..');
    }
}
