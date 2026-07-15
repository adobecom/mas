let initialized = false;
let extensionEnabled = true;

const FETCH_BUDGET = 50;
let fetchCount = 0;

function isContextInvalidated(err) {
    return err && typeof err.message === 'string' && err.message.includes('Extension context invalidated');
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
    initialized = true;

    console.log('Merch At Scale Studio Extension: Initializing...');

    window.MASCardDetector.onCardDetected((cardData) => {
        const badge = window.MASCardOverlay.createBadge(cardData);
        if (!extensionEnabled) {
            badge.style.display = 'none';
        }

        requestAnimationFrame(() => {
            window.MASCardOverlay.updatePositions();
        });

        if (fetchCount >= FETCH_BUDGET) return;
        fetchCount += 1;
        try {
            chrome.runtime.sendMessage(
                {
                    type: 'FETCH_FRAGMENT_DATA',
                    fragmentId: cardData.fragmentId,
                    locale: cardData.locale,
                    country: cardData.country,
                },
                (response) => {
                    if (chrome.runtime.lastError) return;
                    if (response?.success && response.data) {
                        const cardName = extractCardNameFromFragment(response.data);
                        if (cardName) {
                            window.MASCardDetector.updateCardName(cardData.fragmentId, cardName);
                            window.MASCardOverlay.updateCardNameInPanel(cardData.fragmentId, cardName);
                        }
                        const variant = extractVariantFromFragment(response.data);
                        if (variant) {
                            window.MASCardOverlay.updateBadgeVariant(cardData.fragmentId, variant);
                        }
                    }
                },
            );
        } catch (err) {
            if (!isContextInvalidated(err)) throw err;
        }
    });

    chrome.storage.local.get(['masExtensionEnabled'], (result) => {
        extensionEnabled = result.masExtensionEnabled !== false;

        window.MASCardDetector.initialize();

        if (!extensionEnabled) {
            window.MASCardOverlay.hide();
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
            sendResponse({ success: true, cards });
        } else if (message.type === 'SET_EXTENSION_ENABLED') {
            extensionEnabled = message.enabled;
            if (extensionEnabled) {
                window.MASCardOverlay.show();
            } else {
                window.MASCardOverlay.hide();
            }
            sendResponse({ success: true });
        }
        return true;
    });

    console.log('Merch At Scale Studio Extension: Initialized successfully');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
