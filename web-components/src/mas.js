import './lana.js';
import './commerce.js';
import './merch-card.js';
import './merch-icon.js';
import './merch-addon.js';
import './merch-gradient.js';
import './merch-mnemonic-list.js';
import './merch-offer-select.js';
import './merch-offer.js';
import './merch-quantity-select.js';
import './merch-badge.js';
import './merch-whats-included.js';

import { registerVariant } from './variants/variants.js';

// Import UPW_v1
import { UPW_V1_AEM_FRAGMENT_MAPPING, UPW_v1 } from './variants/UPW_v1.js';

// Import ccd variants
import {
    CCD_SUGGESTED_AEM_FRAGMENT_MAPPING,
    CCDSuggested,
} from './variants/ccd-suggested.js';
import {
    CCD_SLICE_AEM_FRAGMENT_MAPPING,
    CCDSlice,
} from './variants/ccd-slice.js';

// import ah-try-buy-widget variant
import {
    AH_TRY_BUY_WIDGET_AEM_FRAGMENT_MAPPING,
    AHTryBuyWidget,
} from './variants/ah-try-buy-widget.js';

//Import ah-promoted-plans
import {
    AH_PROMOTED_PLANS_AEM_FRAGMENT_MAPPING,
    AHPromotedPlans,
} from './variants/ah-promoted-plans.js';

//Import fries
import { FRIES_AEM_FRAGMENT_MAPPING, FriesCard } from './variants/fries.js';

//Import single-card
import {
    SINGLE_CARD_AEM_FRAGMENT_MAPPING,
    SingleCard,
} from './variants/single-card.js';

// Register dynamic variants
registerVariant(
    'UPW_v1',
    UPW_v1,
    UPW_V1_AEM_FRAGMENT_MAPPING,
    UPW_v1.variantStyle,
);

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
registerVariant(
    'single-card',
    SingleCard,
    SINGLE_CARD_AEM_FRAGMENT_MAPPING,
    SingleCard.variantStyle,
);
