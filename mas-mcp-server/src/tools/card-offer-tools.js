import { AEMClient } from '../services/aem-client.js';
import { AOSClient } from '../services/aos-client.js';
import { StudioURLBuilder } from '../utils/studio-url-builder.js';

/**
 * Card-Offer Linking Tools
 * MCP tools for linking cards to offers and maintaining consistency
 */
export class CardOfferTools {
    constructor(aemClient, aosClient, urlBuilder) {
        this.aemClient = aemClient;
        this.aosClient = aosClient;
        this.urlBuilder = urlBuilder;
    }

    /**
     * Link a card to an offer selector
     */
    async linkCardToOffer(params) {
        const { cardId, offerSelectorId, etag } = params;

        const updateFields = {
            mnemonicIcon: { value: [offerSelectorId] },
        };

        const fragment = await this.aemClient.updateFragment(cardId, updateFields, etag);

        const card = {
            id: fragment.id,
            path: fragment.path,
            title: fragment.title,
            variant: fragment.fields?.variant?.value || 'plans',
            size: fragment.fields?.size?.value || 'wide',
            fields: fragment.fields,
            tags: fragment.tags || [],
            modified: fragment.modified,
            published: fragment.published,
        };

        const offers = await this.aosClient.resolveOfferSelector(offerSelectorId);
        const offer = offers[0];

        const studioLinks = this.urlBuilder.createCardLinks(card);

        return {
            card,
            offer,
            studioLinks: {
                viewInStudio: studioLinks.view,
                viewFolder: studioLinks.folder,
            },
        };
    }

    /**
     * Sync card pricing with offer selector
     */
    async syncCardPricing(params) {
        const { cardId, offerSelectorId, etag } = params;

        const [price, optical, annual, strikethrough] = await Promise.all([
            this.aosClient.getFormattedPrice(offerSelectorId, { type: 'price' }),
            this.aosClient.getFormattedPrice(offerSelectorId, { type: 'optical' }),
            this.aosClient.getFormattedPrice(offerSelectorId, { type: 'annual' }),
            this.aosClient.getFormattedPrice(offerSelectorId, { type: 'strikethrough' }),
        ]);

        const updateFields = {
            mnemonicIcon: { value: [offerSelectorId] },
            price: { value: price },
            opticalPrice: { value: optical },
            annualPrice: { value: annual },
            strikethroughPrice: { value: strikethrough },
        };

        const fragment = await this.aemClient.updateFragment(cardId, updateFields, etag);

        const card = {
            id: fragment.id,
            path: fragment.path,
            title: fragment.title,
            variant: fragment.fields?.variant?.value || 'plans',
            size: fragment.fields?.size?.value || 'wide',
            fields: fragment.fields,
            tags: fragment.tags || [],
            modified: fragment.modified,
            published: fragment.published,
        };

        const studioLinks = this.urlBuilder.createCardLinks(card);

        return {
            card,
            prices: {
                price,
                optical,
                annual,
                strikethrough,
            },
            studioLinks: {
                viewInStudio: studioLinks.view,
                viewFolder: studioLinks.folder,
            },
        };
    }

    /**
     * Validate card-offer consistency
     */
    async validateCardOfferConsistency(params) {
        const { cardId } = params;

        const fragment = await this.aemClient.getFragment(cardId);

        const card = {
            id: fragment.id,
            path: fragment.path,
            title: fragment.title,
            variant: fragment.fields?.variant?.value || 'plans',
            size: fragment.fields?.size?.value || 'wide',
            fields: fragment.fields,
            tags: fragment.tags || [],
            modified: fragment.modified,
            published: fragment.published,
        };

        const issues = [];
        let offer = null;

        const offerSelectorId = card.fields?.mnemonicIcon?.value?.[0];

        if (!offerSelectorId) {
            issues.push('No offer selector linked to card');
        } else {
            try {
                const offers = await this.aosClient.resolveOfferSelector(offerSelectorId);
                offer = offers[0];

                const cardTags = card.tags || [];
                const offerPlanType = offer.planType;
                const offerType = offer.offer_type;
                const customerSegment = offer.customer_segment;

                if (offerPlanType && !cardTags.some((tag) => tag === `mas:plan_type/${offerPlanType.toLowerCase()}`)) {
                    issues.push(`Card missing plan_type tag: mas:plan_type/${offerPlanType.toLowerCase()}`);
                }

                if (offerType && !cardTags.some((tag) => tag === `mas:offer_type/${offerType.toLowerCase()}`)) {
                    issues.push(`Card missing offer_type tag: mas:offer_type/${offerType.toLowerCase()}`);
                }

                if (
                    customerSegment &&
                    !cardTags.some((tag) => tag === `mas:customer_segment/${customerSegment.toLowerCase()}`)
                ) {
                    issues.push(`Card missing customer_segment tag: mas:customer_segment/${customerSegment.toLowerCase()}`);
                }
            } catch (error) {
                issues.push(`Failed to resolve offer selector: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        const studioLinks = this.urlBuilder.createCardLinks(card);

        return {
            card,
            offer,
            isConsistent: issues.length === 0,
            issues,
            studioLinks: {
                viewInStudio: studioLinks.view,
                viewFolder: studioLinks.folder,
            },
        };
    }

    /**
     * Find cards linked to an offer
     */
    async findCardsForOffer(params) {
        const { offerSelectorId, path = '/content/dam/mas', limit = 100 } = params;

        const fragments = await this.aemClient.searchFragments({
            path,
            tags: ['mas:studio/content-type/merch-card'],
            limit,
        });

        const cards = fragments
            .filter((fragment) => {
                const linkedOsi = fragment.fields?.mnemonicIcon?.value?.[0];
                return linkedOsi === offerSelectorId;
            })
            .map((fragment) => ({
                id: fragment.id,
                path: fragment.path,
                title: fragment.title,
                variant: fragment.fields?.variant?.value || 'plans',
                size: fragment.fields?.size?.value || 'wide',
                fields: fragment.fields,
                tags: fragment.tags || [],
                modified: fragment.modified,
                published: fragment.published,
            }));

        const offers = await this.aosClient.resolveOfferSelector(offerSelectorId);
        const offer = offers[0];

        const studioLinks = {
            viewInStudio: this.urlBuilder.buildContentLink({
                path,
                tags: {
                    contentType: ['merch-card'],
                },
            }),
        };

        return {
            cards,
            offer,
            studioLinks,
        };
    }

    /**
     * Bulk update cards with offer selector tags
     */
    async bulkUpdateCardTags(params) {
        const { cardIds, offerSelectorId } = params;

        const offers = await this.aosClient.resolveOfferSelector(offerSelectorId);
        const offer = offers[0];

        const tagsToAdd = [];

        if (offer.planType) {
            tagsToAdd.push(`mas:plan_type/${offer.planType.toLowerCase()}`);
        }
        if (offer.offer_type) {
            tagsToAdd.push(`mas:offer_type/${offer.offer_type.toLowerCase()}`);
        }
        if (offer.customer_segment) {
            tagsToAdd.push(`mas:customer_segment/${offer.customer_segment.toLowerCase()}`);
        }

        const updatedCards = await Promise.all(
            cardIds.map(async (cardId) => {
                const fragment = await this.aemClient.getFragment(cardId);
                const existingTags = fragment.tags || [];

                const newTags = [...new Set([...existingTags, ...tagsToAdd])];

                const updatedFragment = await this.aemClient.updateFragment(cardId, {
                    tags: { value: newTags },
                });

                return {
                    id: updatedFragment.id,
                    path: updatedFragment.path,
                    title: updatedFragment.title,
                    variant: updatedFragment.fields?.variant?.value || 'plans',
                    size: updatedFragment.fields?.size?.value || 'wide',
                    fields: updatedFragment.fields,
                    tags: updatedFragment.tags || [],
                    modified: updatedFragment.modified,
                    published: updatedFragment.published,
                };
            }),
        );

        return {
            updated: updatedCards.length,
            cards: updatedCards,
            offer,
        };
    }
}
