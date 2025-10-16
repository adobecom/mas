import Store from '../store.js';
import { getService } from '../utils.js';

export class ProductFeedTransformer {
    static async transform(fragment) {
        if (!fragment) {
            throw new Error('Fragment is required');
        }

        const form = Object.fromEntries(fragment.fields.map((f) => [f.name, f]));

        const productData = {
            id: this.generateProductId(fragment),
            title: this.extractPlainText(form.cardTitle?.values[0]),
            description: this.extractPlainText(form.description?.values[0]),
            link: this.generateProductLink(fragment),
            price: await this.resolvePriceFromWCS(form.osi?.values[0]),
            availability: 'in_stock',
            inventory_quantity: 999999,
            product_category: this.getCategoryFromVariant(form.variant?.values[0]),
            brand: 'Adobe',
            material: 'Digital Software',
            weight: '0 lb',
            image_link: this.getImageLink(form),
            seller_name: 'Adobe',
            seller_url: 'https://www.adobe.com',
            return_policy: 'https://www.adobe.com/legal/terms.html',
            return_window: 14,
            enable_search: true,
            enable_checkout: false,
            mpn: this.generateMPN(fragment),
            gtin: this.generateGTIN(fragment),
            size: form.size?.values[0],
            color: this.extractColor(form),
            additional_image_link: this.getAdditionalImages(form),
        };

        return Object.fromEntries(Object.entries(productData).filter(([, v]) => v !== undefined));
    }

    static generateProductId(fragment) {
        const fragmentName = fragment.path.split('/').pop();
        return `adobe-mas-${fragmentName}`;
    }

    static extractPlainText(html) {
        if (!html) return '';
        const text = html.replace(/<[^>]*>/g, '').trim();
        return text.substring(0, 150);
    }

    static async resolvePriceFromWCS(osi) {
        if (!osi) return '0.00 USD';

        try {
            const service = getService();
            if (!service) {
                console.warn('[Product Feed] Commerce service not available, using fallback');
                return this.extractPriceFromOSI(osi);
            }

            const priceOptions = service.collectPriceOptions({ wcsOsi: osi });

            const offersPromises = service.resolveOfferSelectors(priceOptions);
            if (!offersPromises || !offersPromises.length) {
                return this.extractPriceFromOSI(osi);
            }

            const [offer] = await offersPromises[0];

            if (!offer || !offer.priceDetails) {
                return this.extractPriceFromOSI(osi);
            }

            const { price } = offer.priceDetails;
            const currency = this.extractCurrencyCode(offer);
            return `${parseFloat(price).toFixed(2)} ${currency}`;
        } catch (error) {
            console.error('[Product Feed] Error resolving WCS price:', error);
            return this.extractPriceFromOSI(osi);
        }
    }

    static extractCurrencyCode(offer) {
        if (offer.analytics) {
            try {
                const analyticsData = JSON.parse(offer.analytics);
                if (analyticsData.currencyCode) {
                    return analyticsData.currencyCode;
                }
            } catch (error) {
                console.warn('[Product Feed] Failed to parse analytics JSON:', error);
            }
        }

        const locale = Store.filters.get()?.locale || 'en_US';
        const country = locale.split('_')[1] || 'US';

        const currencyMap = {
            US: 'USD',
            GB: 'GBP',
            CA: 'CAD',
            AU: 'AUD',
            JP: 'JPY',
            IN: 'INR',
            DE: 'EUR',
            FR: 'EUR',
            IT: 'EUR',
            ES: 'EUR',
            NL: 'EUR',
            BR: 'BRL',
            MX: 'MXN',
            KR: 'KRW',
            CN: 'CNY',
        };

        return currencyMap[country] || 'USD';
    }

    static extractPriceFromOSI(osi) {
        if (!osi) return '0.00 USD';

        const parts = osi.split(',');
        const priceHint = parts[parts.length - 1];

        if (priceHint && !Number.isNaN(Number(priceHint))) {
            return `${parseFloat(priceHint).toFixed(2)} USD`;
        }

        return '0.00 USD';
    }

    static getCategoryFromVariant(variant) {
        const categoryMap = {
            plans: 'Software > Creative Software > Subscription Plans',
            segment: 'Software > Creative Software > Individual Apps',
            'special-offers': 'Software > Creative Software > Special Offers',
            catalog: 'Software > Creative Software > Product Catalog',
        };
        return categoryMap[variant] || 'Software > Creative Software';
    }

    static getImageLink(form) {
        if (form.backgroundImage?.values[0]) {
            return form.backgroundImage.values[0];
        }
        if (form.mnemonicIcon?.values[0]) {
            return form.mnemonicIcon.values[0];
        }
        return 'https://www.adobe.com/content/dam/shared/images/product-icons/svg/creative-cloud.svg';
    }

    static generateProductLink(fragment) {
        const locale = Store.filters.get()?.locale || 'en_US';
        const lang = locale.split('_')[0];
        const productSlug = fragment.path.split('/').pop();
        return `https://www.adobe.com/${lang}/products/${productSlug}`;
    }

    static generateMPN(fragment) {
        return `MAS-${fragment.id}`;
    }

    static generateGTIN(fragment) {
        return undefined;
    }

    static extractColor(form) {
        return form.backgroundColor?.values[0];
    }

    static getAdditionalImages(form) {
        const images = [];
        if (form.mnemonicIcon?.values[0]) images.push(form.mnemonicIcon.values[0]);
        if (form.mnemonicAlt?.values[0]) images.push(form.mnemonicAlt.values[0]);
        return images.length > 0 ? images : undefined;
    }
}
