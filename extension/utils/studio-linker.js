class StudioLinker {
    openInStudio(fragmentId, options = {}) {
        chrome.runtime.sendMessage({
            type: 'OPEN_STUDIO_LINK',
            view: 'content',
            fragmentId,
            variant: options.variant,
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

    copyLinkToClipboard(fragmentId, options = {}) {
        const locale = options.locale || 'en_US';
        const path = options.path || '/content/dam/mas';
        const params = new URLSearchParams({ page: 'content', query: fragmentId, locale, path });
        const link = `https://mas.adobe.com/studio.html#${params.toString()}`;
        navigator.clipboard.writeText(link).catch(() => {});
        return link;
    }
}

if (typeof window !== 'undefined') {
    window.MASStudioLinker = new StudioLinker();
}
