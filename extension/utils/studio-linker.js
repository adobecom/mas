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

    openFragmentInStudio(fragmentId) {
        chrome.runtime.sendMessage({ type: 'OPEN_STUDIO_LINK', view: 'fragment-editor', fragmentId });
    }

    openVersionHistory(fragmentId) {
        chrome.runtime.sendMessage({ type: 'OPEN_STUDIO_LINK', view: 'version', fragmentId });
    }

    // The page knows a promotion only by name and title; the background looks up its project id.
    openPromotionInStudio({ name, title }) {
        chrome.runtime.sendMessage({
            type: 'OPEN_STUDIO_LINK',
            view: 'promotion',
            promotionName: name || null,
            promotionTitle: title || null,
        });
    }

    // Rendered links carry either data-fragment-id or data-promotion-name/-title.
    openLink(dataset) {
        if (dataset.fragmentId) {
            this.openFragmentInStudio(dataset.fragmentId);
            return;
        }
        this.openPromotionInStudio({ name: dataset.promotionName, title: dataset.promotionTitle });
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StudioLinker };
}
