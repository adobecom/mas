/**
 * Studio URL Builder
 * Generates deep links to Merch at Scale Studio with filters and context applied
 */
export class StudioURLBuilder {
    constructor(baseUrl = 'https://mas.adobe.com/studio.html') {
        this.baseUrl = baseUrl;
    }

    /**
     * Build a studio URL with specified parameters
     */
    build(params) {
        const searchParams = new URLSearchParams();

        if (params.page) {
            searchParams.set('page', params.page);
        } else if (params.path || params.query || params.tags) {
            searchParams.set('page', 'content');
        }

        if (params.path) {
            searchParams.set('path', params.path);
        }

        if (params.query) {
            searchParams.set('query', params.query);
        }

        if (params.tags) {
            const tagString = this.buildTagString(params.tags);
            if (tagString) {
                searchParams.set('tags', tagString);
            }
        }

        if (params.locale && params.locale !== 'en_US') {
            searchParams.set('locale', params.locale);
        }

        if (params.commerceLandscape && params.commerceLandscape !== 'PUBLISHED') {
            searchParams.set('commerce.landscape', params.commerceLandscape);
        }

        if (params.sortBy) {
            searchParams.set('sortBy', params.sortBy);
            if (params.sortDirection) {
                searchParams.set('sortDirection', params.sortDirection);
            }
        }

        const hashString = searchParams.toString();
        return hashString ? `${this.baseUrl}#${hashString}` : this.baseUrl;
    }

    /**
     * Build a link to the content browser with filters
     */
    buildContentLink(params) {
        return this.build({
            page: 'content',
            ...params,
        });
    }

    /**
     * Build a link to the AI chat page
     */
    buildChatLink(params = {}) {
        const linkParams = {
            page: 'chat',
        };

        return this.build(linkParams);
    }

    /**
     * Build a link to the placeholders page
     */
    buildPlaceholdersLink(params = {}) {
        return this.build({
            page: 'placeholders',
        });
    }

    /**
     * Build a link to the welcome page
     */
    buildWelcomeLink() {
        return this.build({
            page: 'welcome',
        });
    }

    /**
     * Build tag string from structured tags object
     */
    buildTagString(tags) {
        const tagArray = [];

        if (tags.offerType?.length) {
            tags.offerType.forEach((type) => tagArray.push(`mas:offer_type/${type.toLowerCase()}`));
        }

        if (tags.planType?.length) {
            tags.planType.forEach((type) => tagArray.push(`mas:plan_type/${type.toLowerCase()}`));
        }

        if (tags.marketSegments?.length) {
            tags.marketSegments.forEach((segment) => tagArray.push(`mas:market_segments/${segment.toLowerCase()}`));
        }

        if (tags.customerSegment?.length) {
            tags.customerSegment.forEach((segment) => tagArray.push(`mas:customer_segment/${segment.toLowerCase()}`));
        }

        if (tags.productCode?.length) {
            tags.productCode.forEach((code) => tagArray.push(`mas:product_code/${code}`));
        }

        if (tags.variant?.length) {
            tags.variant.forEach((variant) => tagArray.push(`mas:variant/${variant}`));
        }

        if (tags.status?.length) {
            tags.status.forEach((status) => tagArray.push(`mas:status/${status.toLowerCase()}`));
        }

        if (tags.contentType?.length) {
            tags.contentType.forEach((type) => tagArray.push(`mas:studio/content-type/${type}`));
        }

        return tagArray.join(',');
    }

    /**
     * Create action links for a card
     */
    createCardLinks(card) {
        const parentPath = card.parentPath || card.path.substring(0, card.path.lastIndexOf('/'));

        return {
            view: this.buildContentLink({
                path: parentPath,
            }),
            folder: this.buildContentLink({
                path: parentPath,
            }),
        };
    }

    /**
     * Create action links for a collection
     */
    createCollectionLinks(collection) {
        return {
            view: this.buildContentLink({
                tags: {
                    contentType: ['merch-card-collection'],
                },
            }),
        };
    }

    /**
     * Create links for offer-related operations
     */
    createOfferLinks(offer) {
        const tags = {};

        if (offer.customer_segment) {
            tags.customerSegment = [offer.customer_segment];
        }

        if (offer.offer_type) {
            tags.offerType = [offer.offer_type];
        }

        return {
            viewCards: this.buildContentLink({ tags }),
            createWithAI: this.buildChatLink(),
        };
    }
}
