// Fragment mappings of the lazily loaded express variants. They stay in the
// main merch-card bundle so mappings remain synchronously available (Studio,
// collections, hydrate) while the layout classes and CSS load on demand.

export const FULL_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING = {
    title: {
        tag: 'h3',
        slot: 'heading-xs',
        maxCount: 250,
        withSuffix: true,
    },
    badge: {
        tag: 'div',
        slot: 'badge',
        default: 'spectrum-blue-400',
    },
    allowedBadgeColors: [
        'spectrum-blue-400',
        'spectrum-gray-300',
        'spectrum-yellow-300',
        'gradient-purple-blue',
        'gradient-firefly-spectrum',
    ],
    description: {
        tag: 'div',
        slot: 'body-s',
        maxCount: 2000,
        withSuffix: false,
    },
    shortDescription: {
        tag: 'div',
        slot: 'short-description',
        maxCount: 3000,
        withSuffix: false,
    },
    callout: {
        tag: 'div',
        slot: 'callout-content',
        editorLabel: 'Price description',
    },
    prices: {
        tag: 'div',
        slot: 'price',
    },
    trialBadge: {
        tag: 'div',
        slot: 'trial-badge',
    },
    ctas: {
        slot: 'cta',
        size: 'XL',
    },
    mnemonics: {
        size: 'xs',
    },
    borderColor: {
        attribute: 'border-color',
        specialValues: {
            gray: 'var(--spectrum-gray-300)',
            blue: 'var(--spectrum-blue-400)',
            'gradient-purple-blue':
                'linear-gradient(96deg, #B539C8 0%, #7155FA 66%, #3B63FB 100%)',
            'gradient-firefly-spectrum':
                'linear-gradient(96deg, #D73220 0%, #D92361 33%, #7155FA 100%)',
        },
    },
    showAllSpectrumColors: true,
    multiWhatsIncluded: 'true',
    disabledAttributes: [],
};

export const SIMPLIFIED_PRICING_EXPRESS_AEM_FRAGMENT_MAPPING = {
    title: {
        tag: 'h3',
        slot: 'heading-xs',
        maxCount: 250,
        withSuffix: true,
    },
    badge: {
        tag: 'div',
        slot: 'badge',
        default: 'spectrum-blue-400',
    },
    allowedBadgeColors: [
        'spectrum-blue-400',
        'spectrum-gray-300',
        'spectrum-yellow-300',
        'gradient-purple-blue',
        'gradient-firefly-spectrum',
    ],
    description: {
        tag: 'div',
        slot: 'body-xs',
        maxCount: 2000,
        withSuffix: false,
    },
    prices: {
        tag: 'div',
        slot: 'price',
    },
    callout: {
        tag: 'div',
        slot: 'callout-content',
        editorLabel: 'Price description',
    },
    ctas: {
        slot: 'cta',
        size: 'XL',
    },
    borderColor: {
        attribute: 'border-color',
        specialValues: {
            gray: 'var(--spectrum-gray-300)',
            blue: 'var(--spectrum-blue-400)',
            'gradient-purple-blue':
                'linear-gradient(96deg, #B539C8 0%, #7155FA 66%, #3B63FB 100%)',
            'gradient-firefly-spectrum':
                'linear-gradient(96deg, #D73220 0%, #D92361 33%, #7155FA 100%)',
        },
    },
    disabledAttributes: [
        'badgeColor',
        'badgeBorderColor',
        'trialBadgeColor',
        'trialBadgeBorderColor',
    ],
    supportsDefaultChild: true,
};
