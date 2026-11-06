import {
    EVENT_MAS_READY,
    EVENT_MERCH_CARD_ACTION_MENU_TOGGLE,
    EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED,
    EVENT_MERCH_CARD_QUANTITY_CHANGE,
    EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
    EVENT_TYPE_RESOLVED,
    SELECTOR_MAS_INLINE_PRICE,
    TEMPLATE_PRICE_LEGAL,
} from './constants.js';
import { ARROW_DOWN, ARROW_UP, ENTER, TAB } from './focus.js';
import { extractBackgroundUrl } from './image-markup.js';
import { Log } from './log.js';
import { createMasElement } from './mas-element.js';
import Media, { isDesktop, MOBILE_LANDSCAPE, TABLET_UP } from './media.js';
import { TemplateLayout } from './template-layout.js';
import {
    createTag,
    escapeHTML,
    getOuterHeight,
    isMobileOrTablet,
    keepInHeadingPriceForAnnual,
} from './utils.js';

/**
 * What merch-card hands every template file's `define`. Template bundles are
 * deployed separately from merch-card.js, so this is a contract: add names
 * freely, but removing or changing one breaks bundles already deployed.
 */
export const templateDeps = Object.freeze({
    ARROW_DOWN,
    ARROW_UP,
    ENTER,
    EVENT_MAS_READY,
    EVENT_MERCH_CARD_ACTION_MENU_TOGGLE,
    EVENT_MERCH_CARD_COLLECTION_LITERALS_CHANGED,
    EVENT_MERCH_CARD_QUANTITY_CHANGE,
    EVENT_MERCH_QUANTITY_SELECTOR_CHANGE,
    EVENT_TYPE_RESOLVED,
    Log,
    MOBILE_LANDSCAPE,
    Media,
    SELECTOR_MAS_INLINE_PRICE,
    TAB,
    TABLET_UP,
    TEMPLATE_PRICE_LEGAL,
    TemplateLayout,
    createMasElement,
    createTag,
    escapeHTML,
    extractBackgroundUrl,
    getOuterHeight,
    isDesktop,
    isMobileOrTablet,
    keepInHeadingPriceForAnnual,
});
