class StudioLinker {
    openInStudio(fragmentId, options = {}) {
        // Only cards and collections carry a template variant the content view maps to a
        // surface. A field, or a price/CTA unwrapped from its <mas-field>, has no such
        // variant, so a content search would default to the acom surface and miss the real
        // one. Open their source fragment by UUID instead, which resolves regardless of
        // surface.
        if (options.elementType !== 'card' && options.elementType !== 'collection') {
            chrome.runtime.sendMessage({
                type: 'OPEN_STUDIO_LINK',
                view: 'fragment-editor',
                fragmentId,
                locale: options.locale,
            });
            return;
        }
        chrome.runtime.sendMessage({
            type: 'OPEN_STUDIO_LINK',
            view: 'content',
            fragmentId,
            variant: options.variant,
            locale: options.locale,
        });
    }

    openParentInStudio(variationInfo, parentFragmentId) {
        if (!variationInfo || !variationInfo.isVariation) return;
        chrome.runtime.sendMessage({
            type: 'OPEN_STUDIO_LINK',
            view: 'fragment-editor',
            locale: variationInfo.localeDefaultLocale,
            surface: variationInfo.surface,
            fragmentId: parentFragmentId,
        });
    }

    openVariationInStudio(variation) {
        if (!variation) return;
        chrome.runtime.sendMessage({
            type: 'OPEN_STUDIO_LINK',
            view: 'fragment-editor',
            locale: variation.locale,
            surface: variation.surface,
            fragmentId: variation.id || null,
        });
    }
}

if (typeof window !== 'undefined') {
    window.MASStudioLinker = new StudioLinker();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StudioLinker };
}
