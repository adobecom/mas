// Every template, for mas.js (CCD, Adobe Home, Studio) and unit tests. Pages
// load a bundle of templates instead (templates/<bundle>.js, see build.mjs).
// The headless family comes with merch-card.js.
import { registerTemplates } from './template-registry.js';
import { define as ahPromotedPlans } from './templates/ah-promoted-plans.js';
import { define as ahTryBuyWidget } from './templates/ah-try-buy-widget.js';
import { define as brandConciergeProduct } from './templates/brand-concierge-product.js';
import { define as catalog } from './templates/catalog.js';
import { define as ccdSlice } from './templates/ccd-slice.js';
import { define as ccdSuggested } from './templates/ccd-suggested.js';
import { define as compareChartColumn } from './templates/compare-chart-column.js';
import { define as fries } from './templates/fries.js';
import { define as fullPricingExpress } from './templates/full-pricing-express.js';
import { define as image } from './templates/image.js';
import { define as inlineHeading } from './templates/inline-heading.js';
import { define as media } from './templates/media.js';
import { define as mini } from './templates/mini.js';
import { define as miniCompareChart } from './templates/mini-compare-chart.js';
import { define as miniCompareChartMweb } from './templates/mini-compare-chart-mweb.js';
import { define as plans } from './templates/plans.js';
import { define as plansV2 } from './templates/plans-v2.js';
import { define as pro } from './templates/pro.js';
import { define as product } from './templates/product.js';
import { define as productC2 } from './templates/product-c2.js';
import { define as productPricing } from './templates/product-pricing.js';
import { define as segment } from './templates/segment.js';
import { define as simplifiedPricingExpress } from './templates/simplified-pricing-express.js';
import { define as specialOffers } from './templates/special-offers.js';

for (const define of [
    ahPromotedPlans,
    ahTryBuyWidget,
    brandConciergeProduct,
    catalog,
    ccdSlice,
    ccdSuggested,
    compareChartColumn,
    fries,
    fullPricingExpress,
    image,
    inlineHeading,
    media,
    mini,
    miniCompareChart,
    miniCompareChartMweb,
    plans,
    plansV2,
    pro,
    product,
    productC2,
    productPricing,
    segment,
    simplifiedPricingExpress,
    specialOffers,
]) {
    registerTemplates(define);
}
