(function initDarkMode() {
    function apply(isDark) {
        document.body.classList.toggle('spectrum--dark', isDark);
        document.body.classList.toggle('spectrum--light', !isDark);
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        apply(mq.matches);
        mq.addEventListener('change', (e) => apply(e.matches));
    }
})();

const VARIANT_ICON = {
    catalog: 'FileText',
    plans: 'FileText',
    'plans-v2': 'FileText',
    'plans-students': 'FileText',
    'plans-education': 'FileText',
    'ccd-slice': 'Layers',
    'ccd-suggested': 'Layers',
    fries: 'ShoppingCart',
    'ah-try-buy-widget': 'Home',
    'ah-promoted-plans': 'Home',
    'full-pricing-express': 'Asset',
    'simplified-pricing-express': 'Asset',
    collection: 'Layers',
};

const VARIANT_FAMILY_COLOR = {
    catalog: '#1473e6',
    plans: '#1473e6',
    'plans-v2': '#1473e6',
    'plans-students': '#1473e6',
    'plans-education': '#1473e6',
    'ccd-slice': '#2da090',
    'ccd-suggested': '#2da090',
    fries: '#c038cc',
    'ah-try-buy-widget': '#d83790',
    'ah-promoted-plans': '#d83790',
    'full-pricing-express': '#e67e22',
    'simplified-pricing-express': '#e67e22',
    collection: '#d83790',
};

function variantIcon(card) {
    if (card?.elementType === 'collection') return 'Layers';
    return VARIANT_ICON[card?.variant] || 'Asset';
}

function variantColor(card) {
    if (card?.elementType === 'collection') return '#d83790';
    return VARIANT_FAMILY_COLOR[card?.variant] || '#8b8b8b';
}

let currentCards = [];
let serviceConfig = {};

function loadExtensionEnabled() {
    chrome.storage.local.get(['masExtensionEnabled'], (result) => {
        const enabled = result.masExtensionEnabled !== false;
        document.getElementById('enableToggle').checked = enabled;
    });
}

async function toggleExtensionEnabled(enabled) {
    await chrome.storage.local.set({ masExtensionEnabled: enabled });

    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.id) {
        chrome.tabs
            .sendMessage(activeTab.id, {
                type: 'SET_EXTENSION_ENABLED',
                enabled: enabled,
            })
            .catch(() => {});
    }

    const allTabs = await chrome.tabs.query({});
    allTabs.forEach((tab) => {
        if (tab.id !== activeTab?.id) {
            chrome.tabs
                .sendMessage(tab.id, {
                    type: 'SET_EXTENSION_ENABLED',
                    enabled: enabled,
                })
                .catch(() => {});
        }
    });
}

function isAdobePage(urlStr) {
    if (typeof urlStr !== 'string' || !urlStr) return false;
    try {
        const url = new URL(urlStr);
        if (url.protocol !== 'https:') return false;
        return url.hostname === 'adobe.com' || url.hostname.endsWith('.adobe.com');
    } catch (err) {
        return false;
    }
}

function showNonAdobePageHint() {
    currentCards = [];
    renderCards();
    const noCardsHint = document.querySelector('#noCards .hint');
    if (noCardsHint) {
        noCardsHint.textContent =
            'Open an Adobe page with merch cards (e.g. adobe.com/creativecloud/plans.html) and reopen this popup.';
    }
}

async function loadCards(retryCount = 0) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !isAdobePage(tab.url)) {
        showNonAdobePageHint();
        return;
    }

    chrome.tabs.sendMessage(tab.id, { type: 'GET_ALL_CARDS' }, (response) => {
        if (chrome.runtime.lastError) {
            if (retryCount < 2) {
                setTimeout(() => loadCards(retryCount + 1), 500);
                return;
            }
            currentCards = [];
            renderCards();
            return;
        }

        if (response?.success && response.cards) {
            serviceConfig = response.serviceConfig || {};
            currentCards = response.cards;
            renderCards();
            updateVariantFilter();
            fetchCardNames(currentCards);

            if (currentCards.length === 0 && retryCount < 2) {
                setTimeout(() => loadCards(retryCount + 1), 500);
            }
        }
    });
}

function renderCards() {
    const cardList = document.getElementById('cardList');
    const noCards = document.getElementById('noCards');
    const cardCount = document.getElementById('cardCount');
    const variantFilter = document.getElementById('variantFilter').value;
    const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();

    let filteredCards = currentCards;

    if (variantFilter) {
        filteredCards = filteredCards.filter((card) => card.variant === variantFilter);
    }

    if (searchQuery) {
        filteredCards = filteredCards.filter((card) => {
            const cardName = (card.cardName || '').toLowerCase();
            const fragmentId = (card.fragmentId || '').toLowerCase();
            const variant = (card.variant || '').toLowerCase();
            const promoCode = (card.promotion?.effectiveCode || '').toLowerCase();
            return (
                cardName.includes(searchQuery) ||
                fragmentId.includes(searchQuery) ||
                variant.includes(searchQuery) ||
                promoCode.includes(searchQuery)
            );
        });
    }

    cardCount.textContent = filteredCards.length;

    if (filteredCards.length === 0) {
        noCards.style.display = 'block';
        cardList.querySelectorAll('.card-row').forEach((item) => item.remove());
        return;
    }

    noCards.style.display = 'none';

    cardList.querySelectorAll('.card-row').forEach((item) => item.remove());

    filteredCards.forEach((card) => {
        const cardItem = createCardItem(card);
        cardList.appendChild(cardItem);
    });
}

function createCardItem(card) {
    const item = document.createElement('div');
    item.className = 'card-row';
    item.dataset.fragmentId = card.fragmentId;

    const iconBg = variantColor(card);
    const iconSvg = window.MASIcons ? window.MASIcons.get(variantIcon(card), 'M') : '';

    // Only an element traced back to a real fragment can be opened in Studio; a
    // standalone price has just an OSI, and every non-card id here is synthetic.
    const canEdit = !!card.sourceFragmentId;
    const cardName = card.cardName || card.fragmentId;
    const hint = [card.variant, card.osi, card.size, promotionHint(card.promotion)].filter(Boolean).join(' · ');

    item.innerHTML = `
    <div class="card-row-thumbnail" style="background:${iconBg}">${iconSvg}</div>
    <div class="card-row-body">
      <div class="card-row-name">${escapeHtml(cardName)}</div>
      <div class="card-row-hint">${escapeHtml(hint)}</div>
    </div>
    ${
        !canEdit
            ? ''
            : `
    <button class="card-row-edit" aria-label="Edit in Studio" title="Edit in Studio">
      ${window.MASIcons ? window.MASIcons.get('Edit', 'S') : ''}
    </button>`
    }
  `;

    item.addEventListener('click', (e) => {
        if (canEdit && e.target.closest('.card-row-edit')) {
            openInStudio(card.sourceFragmentId, card.variant, card.locale);
            return;
        }
        highlightCardInPage(card.fragmentId);
    });

    return item;
}

function promotionHint(promotion) {
    if (!promotion) return '';
    if (promotion.effectiveCode) return `promo: ${promotion.effectiveCode}`;
    return 'promo cancelled';
}

function updateVariantFilter() {
    const variantFilter = document.getElementById('variantFilter');
    const variants = new Set(currentCards.map((card) => card.variant));

    const currentValue = variantFilter.value;

    variantFilter.innerHTML = '<option value="">All Variants</option>';

    Array.from(variants)
        .sort()
        .forEach((variant) => {
            const option = document.createElement('option');
            option.value = variant;
            option.textContent = variant;
            variantFilter.appendChild(option);
        });

    if (variants.has(currentValue)) {
        variantFilter.value = currentValue;
    }
}

function openInStudio(fragmentId, variant, locale) {
    chrome.runtime.sendMessage({
        type: 'OPEN_STUDIO_LINK',
        view: 'content',
        fragmentId,
        variant,
        locale,
    });
}

async function highlightCardInPage(fragmentId) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { type: 'HIGHLIGHT_CARD', fragmentId });
}

function exportCardsAsJSON() {
    const dataStr = JSON.stringify(currentCards, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `mas-cards-${new Date().getTime()}.json`;
    link.click();

    URL.revokeObjectURL(url);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

function updateCardItemInList(fragmentId, cardName) {
    const selector = `.card-row[data-fragment-id="${fragmentId}"] .card-row-name`;
    const item = document.querySelector(selector);
    if (item) {
        item.textContent = cardName;
        item.title = cardName;
    }
}

function needsCardNameFetch(cardName, fragmentId) {
    return cardName === fragmentId || cardName === 'Untitled Card' || cardName === 'Loading...' || !cardName;
}

function fetchCardNames(cards) {
    cards.forEach((card) => {
        if (needsCardNameFetch(card.cardName, card.fragmentId)) {
            chrome.runtime.sendMessage(
                {
                    type: 'FETCH_FRAGMENT_DATA',
                    fragmentId: card.fragmentId,
                    locale: card.locale || 'en_US',
                    country: card.country,
                    ...serviceConfig,
                },
                (response) => {
                    if (response?.success && response.data) {
                        const cardName = extractCardNameFromFragment(response.data);
                        if (cardName) {
                            card.cardName = cardName;
                            updateCardItemInList(card.fragmentId, cardName);
                        }
                    }
                },
            );
        }
    });
}

document.getElementById('variantFilter').addEventListener('change', renderCards);

document.getElementById('searchInput').addEventListener('input', renderCards);

document.getElementById('refreshBtn').addEventListener('click', loadCards);

document.getElementById('exportBtn').addEventListener('click', exportCardsAsJSON);

document.getElementById('enableToggle').addEventListener('change', (e) => {
    toggleExtensionEnabled(e.target.checked);
});

loadExtensionEnabled();
loadCards();

function renderPopupIcons() {
    if (!window.MASIcons) return;
    document.querySelectorAll('.mas-popup-icon[data-icon]').forEach((el) => {
        el.innerHTML = window.MASIcons.get(el.dataset.icon, 'S');
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderPopupIcons);
} else {
    renderPopupIcons();
}
