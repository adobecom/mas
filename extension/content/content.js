let initialized = false;
let extensionEnabled = true;
// Show sources is on, so cards detected later are outlined as they arrive.
let outlinesOn = false;

function enableSourceOutlines() {
    outlinesOn = true;
    window.MASSourceOutlines.enable().catch(() => {});
}

function disableSourceOutlines() {
    outlinesOn = false;
    window.MASSourceOutlines.disable();
}

let masPrefersDark = false;
(function initDarkModePreference() {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    masPrefersDark = mq.matches;
    mq.addEventListener('change', (e) => {
        masPrefersDark = e.matches;
        if (window.MASCardOverlay && typeof window.MASCardOverlay.applyTheme === 'function') {
            window.MASCardOverlay.applyTheme(masPrefersDark);
        }
    });
})();

function masGetThemeClasses() {
    return 'spectrum spectrum--express spectrum--medium spectrum--' + (masPrefersDark ? 'dark' : 'light');
}

if (typeof window !== 'undefined') {
    window.masGetThemeClasses = masGetThemeClasses;
}

function extractCardNameFromFragment(fragmentData) {
    const fields = fragmentData.fields;
    if (!fields) return fragmentData.name || fragmentData.title || null;

    const cardTitle = typeof fields.cardTitle === 'object' ? fields.cardTitle?.value : fields.cardTitle;
    if (cardTitle) return cardTitle;

    const cardName = typeof fields.cardName === 'object' ? fields.cardName?.value : fields.cardName;
    if (cardName) return cardName;

    return fragmentData.name || fragmentData.title || null;
}

function extractVariantFromFragment(fragmentData) {
    const fields = fragmentData.fields;
    if (!fields) return null;

    const variant = typeof fields.variant === 'object' ? fields.variant?.value : fields.variant;
    return variant || null;
}

function initialize() {
    if (initialized) return;
    if (window.location.pathname.endsWith('/studio.html')) {
        return;
    }
    initialized = true;

    // The page bridge's on-load state can arrive before this world listens, so ask again.
    window.MASMepState.request();

    window.MASCardDetector.onCardDetected((cardData) => {
        const badge = window.MASCardOverlay.createBadge(cardData);
        if (!extensionEnabled) {
            badge.style.display = 'none';
        }

        requestAnimationFrame(() => {
            window.MASCardOverlay.updatePositions();
        });

        if (outlinesOn) {
            window.MASSourceOutlines.outline(cardData.fragmentId).catch(() => {});
        }

        if (!cardData.sourceFragmentId) return;

        window.MASSources.fetchFragment(cardData.sourceFragmentId, cardData.locale, cardData.country).then((data) => {
            if (!data) return;
            const cardName = extractCardNameFromFragment(data);
            if (cardName) {
                window.MASCardDetector.updateCardName(cardData.fragmentId, cardName);
                window.MASCardOverlay.updateCardNameInPanel(cardData.fragmentId, cardName);
            }
            // Only cards are labelled by their template; a price, cta or field
            // badge keeps the label for its own role.
            const isCard = cardData.elementType === 'card' || cardData.elementType === 'collection';
            const variant = isCard ? extractVariantFromFragment(data) : null;
            if (variant) {
                window.MASCardOverlay.updateBadgeVariant(cardData.fragmentId, variant);
            }
        });
    });

    chrome.storage.local.get(['masExtensionEnabled', 'masShowSources'], (result) => {
        extensionEnabled = result.masExtensionEnabled !== false;

        window.MASCardDetector.initialize();

        if (!extensionEnabled) {
            window.MASCardOverlay.hide();
        } else if (result.masShowSources === true) {
            enableSourceOutlines();
        }
    });

    let scrollTimeout;
    window.addEventListener(
        'scroll',
        () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                window.MASCardOverlay.updatePositions();
            }, 100);
        },
        { passive: true },
    );

    window.addEventListener('resize', () => {
        window.MASCardOverlay.updatePositions();
    });

    window.addEventListener('load', () => {
        window.MASCardOverlay.updatePositions();
    });

    setTimeout(() => {
        window.MASCardOverlay.updatePositions();
    }, 500);

    setTimeout(() => {
        window.MASCardOverlay.updatePositions();
    }, 1500);

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'HIGHLIGHT_CARD') {
            window.MASCardDetector.highlightCard(message.fragmentId);
            sendResponse({ success: true });
        } else if (message.type === 'GET_ALL_CARDS') {
            const cards = window.MASCardDetector.getAllCards();
            sendResponse({ success: true, cards, serviceConfig: window.MASCardDetector.getServiceConfig() });
        } else if (message.type === 'SET_EXTENSION_ENABLED') {
            extensionEnabled = message.enabled;
            if (extensionEnabled) {
                window.MASCardOverlay.show();
                chrome.storage.local.get(['masShowSources'], (result) => {
                    if (result.masShowSources === true) {
                        enableSourceOutlines();
                    }
                });
            } else {
                disableSourceOutlines();
                window.MASCardOverlay.hide();
            }
            sendResponse({ success: true });
        } else if (message.type === 'SET_SOURCE_OUTLINES') {
            if (message.enabled && extensionEnabled) {
                enableSourceOutlines();
            } else {
                disableSourceOutlines();
            }
            sendResponse({ success: true });
        } else if (message.type === 'GET_PAGE_TRACE') {
            window.MASSources.getPageGroups().then(
                (groups) =>
                    sendResponse({
                        success: true,
                        trace: window.MASSourceEngine.buildPageTrace(groups, window.MASMepState.latest()),
                    }),
                () => sendResponse({ success: false, error: 'trace_failed' }),
            );
        }
        return true;
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
