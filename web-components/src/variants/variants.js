import { Catalog, CATALOG_AEM_FRAGMENT_MAPPING } from './catalog.js';
import { Image } from './image.js';
import { InlineHeading } from './inline-heading.js';
import { MiniCompareChart } from './mini-compare-chart.js';
import {
    Plans,
    PLANS_AEM_FRAGMENT_MAPPING,
    PLANS_EDUCATION_AEM_FRAGMENT_MAPPING,
    PLANS_STUDENTS_AEM_FRAGMENT_MAPPING,
} from './plans.js';
import { Product } from './product.js';
import { Segment } from './segment.js';
import {
    SPECIAL_OFFERS_AEM_FRAGMENT_MAPPING,
    SpecialOffer,
} from './special-offer.js';
import {
    SimplifiedPricingExpress,
    SIMPLIFIED_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING,
} from './simplified-pricing-express.js';
import {
    FullPricingExpress,
    FULL_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING,
} from './full-pricing-express.js';
import { Mini, MINI_AEM_FRAGMENT_MAPPING } from './mini.js';
import {
    CCDSuggested,
    CCD_SUGGESTED_AEM_FRAGMENT_MAPPING,
} from './ccd-suggested.js';
import { CCDSlice, CCD_SLICE_AEM_FRAGMENT_MAPPING } from './ccd-slice.js';
import {
    AHTryBuyWidget,
    AH_TRY_BUY_WIDGET_AEM_FRAGMENT_MAPPING,
} from './ah-try-buy-widget.js';
import {
    AHPromotedPlans,
    AH_PROMOTED_PLANS_AEM_FRAGMENT_MAPPING,
} from './ah-promoted-plans.js';
import { FriesCard, FRIES_AEM_FRAGMENT_MAPPING } from './fries.js';

// Registry for dynamic variants
const variantRegistry = new Map();

// Function to register a new variant
export const registerVariant = (
    name,
    variantClass,
    fragmentMapping = null,
    style = null,
) => {
    variantRegistry.set(name, {
        class: variantClass,
        fragmentMapping,
        style,
    });
};

// Add core variants to registry
registerVariant(
    'catalog',
    Catalog,
    CATALOG_AEM_FRAGMENT_MAPPING,
    Catalog.variantStyle,
);
registerVariant('image', Image);
registerVariant('inline-heading', InlineHeading);
registerVariant(
    'mini-compare-chart',
    MiniCompareChart,
    null,
    MiniCompareChart.variantStyle,
);
registerVariant('plans', Plans, PLANS_AEM_FRAGMENT_MAPPING, Plans.variantStyle);
registerVariant(
    'plans-students',
    Plans,
    PLANS_STUDENTS_AEM_FRAGMENT_MAPPING,
    Plans.variantStyle,
);
registerVariant(
    'plans-education',
    Plans,
    PLANS_EDUCATION_AEM_FRAGMENT_MAPPING,
    Plans.variantStyle,
);
registerVariant('product', Product, null, Product.variantStyle);
registerVariant('segment', Segment, null, Segment.variantStyle);
registerVariant(
    'special-offers',
    SpecialOffer,
    SPECIAL_OFFERS_AEM_FRAGMENT_MAPPING,
    SpecialOffer.variantStyle,
);
registerVariant(
    'simplified-pricing-express',
    SimplifiedPricingExpress,
    SIMPLIFIED_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING,
    SimplifiedPricingExpress.variantStyle,
);
registerVariant(
    'full-pricing-express',
    FullPricingExpress,
    FULL_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING,
    FullPricingExpress.variantStyle,
);
registerVariant('mini', Mini, MINI_AEM_FRAGMENT_MAPPING, Mini.variantStyle);
registerVariant(
    'ccd-suggested',
    CCDSuggested,
    CCD_SUGGESTED_AEM_FRAGMENT_MAPPING,
    CCDSuggested.variantStyle,
);
registerVariant(
    'ccd-slice',
    CCDSlice,
    CCD_SLICE_AEM_FRAGMENT_MAPPING,
    CCDSlice.variantStyle,
);
registerVariant(
    'ah-try-buy-widget',
    AHTryBuyWidget,
    AH_TRY_BUY_WIDGET_AEM_FRAGMENT_MAPPING,
    AHTryBuyWidget.variantStyle,
);
registerVariant(
    'ah-promoted-plans',
    AHPromotedPlans,
    AH_PROMOTED_PLANS_AEM_FRAGMENT_MAPPING,
    AHPromotedPlans.variantStyle,
);
registerVariant(
    'fries',
    FriesCard,
    FRIES_AEM_FRAGMENT_MAPPING,
    FriesCard.variantStyle,
);

const getVariantLayout = (card, mustMatch = false) => {
    const variantInfo = variantRegistry.get(card.variant);
    if (!variantInfo) {
        return mustMatch ? undefined : new Product(card);
    }
    const { class: VariantClass, style } = variantInfo;
    if (style) {
        try {
            const sheet = new CSSStyleSheet();
            sheet.replaceSync(style.cssText);
            card.shadowRoot.adoptedStyleSheets.push(sheet);
        } catch (e) {
            // If CSSStyleSheet constructor fails, fall back to style element
            const styleElement = document.createElement('style');
            styleElement.textContent = style.cssText;
            card.shadowRoot.appendChild(styleElement);
        }
    }
    return new VariantClass(card);
};

export function getFragmentMapping(variant) {
    return variantRegistry.get(variant)?.fragmentMapping;
}

export { getVariantLayout };
