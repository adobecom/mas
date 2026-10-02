class StudioLinker {
    openInStudio(fragmentId, options = {}) {
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
