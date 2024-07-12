/**
 * Common namespace prefix for CSS classes and DOM event types.
 * @see https://git.corp.adobe.com/wcms/team/discussions/27
 */
export const NAMESPACE = 'merch';
/**
 * This CSS class name is used to:
 * - show only selected offer on a card connected to a subscription panel
 * - TBD
 */
export const CLASS_NAME_HIDDEN = 'hidden';
/**
 * Event type dispatched by the commenrce service whenever it is ready.
 * Should be in sync with `packages/commerce/src/constants.js`.
 */
export const EVENT_TYPE_READY = 'wcms:commerce:ready';
/**
 * Tag name of the commerce service component.
 * Should be in sync with `packages/commerce/src/constants.js`.
 */
export const TAG_NAME_SERVICE = 'wcms-commerce';

/** Event to dispatch when a merch-offer is ready */
export const EVENT_MERCH_OFFER_READY = 'merch-offer:ready';

/** Event to dispatch when all the offers of a merch-offer-select sont ready */
export const EVENT_MERCH_OFFER_SELECT_READY = 'merch-offer-select:ready';

/** Event to dispatch when a merch-card is ready */
export const EVENT_MERCH_CARD_READY = 'merch-card:ready';

export const EVENT_OFFER_SELECTED = 'merch-offer:selected';

export const EVENT_MERCH_STOCK_CHANGE = 'merch-stock:change';

export const EVENT_MERCH_STORAGE_CHANGE = 'merch-storage:change';

export const EVENT_MERCH_QUANTITY_SELECTOR_CHANGE =
    'merch-quantity-selector:change';

/** Event to dispatch when any action is done that requires analytics report from the parent */
export const EVENT_MERCH_CHANGE = 'merch-change';
