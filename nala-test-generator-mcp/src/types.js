/**
 * @typedef {Object} CardConfig
 * @property {string} cardType
 * @property {string} cardId
 * @property {string} testSuite
 * @property {Object} elements
 * @property {ElementConfig} [elements.title]
 * @property {ElementConfig} [elements.eyebrow]
 * @property {ElementConfig} [elements.description]
 * @property {ElementConfig} [elements.price]
 * @property {ElementConfig} [elements.strikethroughPrice]
 * @property {ElementConfig} [elements.cta]
 * @property {ElementConfig} [elements.icon]
 * @property {ElementConfig} [elements.legalLink]
 * @property {ElementConfig} [elements.backgroundImage]
 * @property {Record<string, CSSProperties>} [cssProperties]
 * @property {TestType[]} testTypes
 * @property {Object} [metadata]
 * @property {string[]} [metadata.tags]
 * @property {string} [metadata.browserParams]
 * @property {string} [metadata.path]
 */

/**
 * @typedef {Object} ElementConfig
 * @property {string} selector
 * @property {string} [expectedText]
 * @property {string} [expectedValue]
 * @property {string} [expectedAttribute]
 * @property {CSSProperties} [cssProperties]
 * @property {InteractionConfig[]} [interactions]
 */

/**
 * @typedef {Object} InteractionConfig
 * @property {'click' | 'hover' | 'type' | 'select' | 'edit'} type
 * @property {string} [value]
 * @property {string} [waitFor]
 * @property {string} [expectedResult]
 */

/**
 * @typedef {Object} CSSProperties
 * @property {string} [background-color]
 * @property {string} [border-color]
 * @property {string} [border-bottom-color]
 * @property {string} [border-left-color]
 * @property {string} [border-right-color]
 * @property {string} [border-top-color]
 * @property {string} [min-width]
 * @property {string} [max-width]
 * @property {string} [min-height]
 * @property {string} [width]
 * @property {string} [height]
 * @property {string} [color]
 * @property {string} [font-size]
 * @property {string} [font-weight]
 * @property {string} [line-height]
 * @property {string} [text-decoration-line]
 * @property {string} [text-decoration-color]
 */

/**
 * @typedef {'css' | 'functional' | 'edit' | 'save' | 'discard' | 'interaction'} TestType
 */

/**
 * @typedef {Object} TestSpec
 * @property {string} tcid
 * @property {string} name
 * @property {string} path
 * @property {Record<string, any>} data
 * @property {string} browserParams
 * @property {string} tags
 */

/**
 * @typedef {Object} TestSuiteConfig
 * @property {string} FeatureName
 * @property {TestSpec[]} features
 */

/**
 * @typedef {Object} PageObjectConfig
 * @property {string} className
 * @property {Record<string, string>} selectors
 * @property {Record<string, CSSProperties>} cssProperties
 */

export {}; 