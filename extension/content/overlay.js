class CardOverlay {
    constructor() {
        this.overlays = new Map();
        this.expandedOverlays = new Set();
        this.fragmentDataCache = new Map();
        this.expandableTextStore = new Map();
    }

    createBadge(cardData) {
        if (this.overlays.has(cardData.fragmentId)) {
            return this.overlays.get(cardData.fragmentId).badge;
        }

        const badge = document.createElement('div');
        badge.className =
            (typeof window.masGetThemeClasses === 'function' ? window.masGetThemeClasses() + ' ' : '') + 'mas-ext-badge';
        badge.dataset.fragmentId = cardData.fragmentId;
        if (cardData.elementType) {
            badge.dataset.elementType = cardData.elementType;
        }

        const iconWrap = document.createElement('span');
        iconWrap.className = 'mas-ext-badge-icon';
        iconWrap.innerHTML = window.MASIcons.get('Edit', 'XS');
        badge.appendChild(iconWrap);

        const variantLabel = document.createElement('span');
        variantLabel.className = 'mas-ext-badge-variant';
        variantLabel.textContent = cardData.variant;
        badge.appendChild(variantLabel);

        badge.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel(cardData);
        });

        this.positionBadge(badge, cardData.element);
        document.body.appendChild(badge);
        this.overlays.set(cardData.fragmentId, { badge, cardData });

        return badge;
    }

    positionBadge(badge, cardElement, retryCount = 0) {
        const rect = cardElement.getBoundingClientRect();

        if ((rect.width === 0 || rect.height === 0) && retryCount < 10) {
            setTimeout(() => this.positionBadge(badge, cardElement, retryCount + 1), 100);
            return;
        }

        const isCollection = cardElement.tagName === 'MERCH-CARD-COLLECTION';
        const offset = isCollection ? 60 : 32;
        badge.style.top = `${Math.max(8, rect.top - offset)}px`;
        badge.style.left = `${rect.left + 8}px`;
    }

    togglePanel(cardData) {
        const fragmentId = cardData.fragmentId;

        if (this.expandedOverlays.has(fragmentId)) {
            this.closePanel(fragmentId);
        } else {
            this.openPanel(cardData);
        }
    }

    async openPanel(cardData) {
        const panel = document.createElement('div');
        panel.className =
            (typeof window.masGetThemeClasses === 'function' ? window.masGetThemeClasses() + ' ' : '') + 'mas-ext-panel';
        panel.dataset.fragmentId = cardData.fragmentId;

        const icons = window.MASIcons;
        const isCollection = cardData.elementType === 'collection';
        const headerLabel = isCollection
            ? `Collection: ${this.escapeHtml(cardData.cardName)}`
            : this.escapeHtml(cardData.cardName);
        panel.innerHTML = `
      <div class="mas-ext-panel-header">
        <h3>${headerLabel}</h3>
        <button class="mas-ext-icon-btn mas-ext-close-btn" aria-label="Close">
          ${icons.get('Close', 'S')}
        </button>
      </div>
      <div class="mas-ext-panel-body">
        <section class="mas-ext-section mas-ext-section-basic">
          <h4 class="mas-ext-section-title">Basic info</h4>
          <div class="mas-ext-field">
            <span class="mas-ext-field-label">Fragment ID</span>
            <span class="mas-ext-field-value mas-ext-mono">${this.escapeHtml(cardData.fragmentId)}</span>
            <button class="mas-ext-icon-btn mas-ext-copy-btn" data-value="${this.escapeAttr(cardData.fragmentId)}" aria-label="Copy Fragment ID">
              ${icons.get('Copy', 'S')}
            </button>
          </div>
          ${
              isCollection
                  ? ''
                  : `
          <div class="mas-ext-field">
            <span class="mas-ext-field-label">Template</span>
            <span class="mas-ext-tag">${this.escapeHtml(cardData.variant)}</span>
          </div>`
          }
          ${
              cardData.size
                  ? `
          <div class="mas-ext-field">
            <span class="mas-ext-field-label">Size</span>
            <span class="mas-ext-field-value">${this.escapeHtml(cardData.size)}</span>
          </div>
          `
                  : ''
          }
          <div class="mas-ext-field">
            <span class="mas-ext-field-label">Path</span>
            <span class="mas-ext-field-value mas-ext-mono mas-ext-path-value">Loading…</span>
            <button class="mas-ext-icon-btn mas-ext-copy-btn mas-ext-copy-path-btn" data-value="" aria-label="Copy Path" style="visibility:hidden">
              ${icons.get('Copy', 'S')}
            </button>
          </div>
        </section>
        <hr class="mas-ext-divider"/>
        <section class="mas-ext-section mas-ext-section-variation" style="display:none">
          <h4 class="mas-ext-section-title">Variation info</h4>
          <div class="mas-ext-variation-content">
            <div class="mas-ext-loading">Loading variation data…</div>
          </div>
        </section>
        <hr class="mas-ext-divider"/>
        <section class="mas-ext-section mas-ext-section-expandable mas-ext-collapsed" data-section="details">
          <h4 class="mas-ext-section-title mas-ext-section-toggle">
            <span>Additional details</span>
            <span class="mas-ext-chevron">${icons.get('ChevronRight', 'S')}</span>
          </h4>
          <div class="mas-ext-section-content">
            <div class="mas-ext-loading">Loading fragment data…</div>
          </div>
        </section>
      </div>
      <div class="mas-ext-panel-footer">
        <button class="mas-ext-btn mas-ext-btn-secondary mas-ext-refresh-btn">
          ${icons.get('Refresh', 'S')}
          <span>Refresh</span>
        </button>
        <button class="mas-ext-btn mas-ext-btn-accent mas-ext-edit-btn">
          ${icons.get('Edit', 'S')}
          <span>Edit in Studio</span>
        </button>
      </div>
    `;

        const closeBtn = panel.querySelector('.mas-ext-close-btn');
        closeBtn.addEventListener('click', () => this.closePanel(cardData.fragmentId));

        const editBtn = panel.querySelector('.mas-ext-edit-btn');
        editBtn.addEventListener('click', () => {
            window.MASStudioLinker.openInStudio(cardData.fragmentId, {
                variant: cardData.variant,
            });
        });

        const refreshBtn = panel.querySelector('.mas-ext-refresh-btn');
        refreshBtn.addEventListener('click', () => this.refreshFragmentData(cardData.fragmentId));

        const copyBtns = panel.querySelectorAll('.mas-ext-copy-btn');
        copyBtns.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget;
                const value = target.dataset.value;
                if (!value) return;
                navigator.clipboard.writeText(value);
                target.classList.add('mas-ext-copy-success');
                setTimeout(() => target.classList.remove('mas-ext-copy-success'), 1200);
            });
        });

        const toggleSection = panel.querySelector('.mas-ext-section-toggle');
        toggleSection.addEventListener('click', () => {
            const section = panel.querySelector('[data-section="details"]');
            section.classList.toggle('mas-ext-collapsed');
            if (!section.classList.contains('mas-ext-collapsed')) {
                this.loadFragmentDetails(cardData.fragmentId);
            }
        });

        this.positionPanel(panel, cardData.element);
        document.body.appendChild(panel);

        const overlayData = this.overlays.get(cardData.fragmentId);
        if (overlayData) {
            overlayData.panel = panel;
        }
        this.expandedOverlays.add(cardData.fragmentId);
    }

    positionPanel(panel, cardElement) {
        const rect = cardElement.getBoundingClientRect();
        panel.style.top = `${rect.top}px`;
        panel.style.left = `${rect.right + 16}px`;

        setTimeout(() => {
            const panelRect = panel.getBoundingClientRect();
            const margin = 8;
            const gap = 16;
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            const fitsRight = rect.right + gap + panelRect.width <= vw - margin;
            const fitsLeft = rect.left - gap - panelRect.width >= margin;

            let left;
            if (fitsRight) {
                left = rect.right + gap;
            } else if (fitsLeft) {
                left = rect.left - panelRect.width - gap;
            } else {
                const centered = rect.left + rect.width / 2 - panelRect.width / 2;
                left = Math.max(margin, Math.min(centered, vw - panelRect.width - margin));
            }

            let top = rect.top;
            if (top + panelRect.height > vh - margin) {
                top = vh - panelRect.height - margin;
            }
            if (top < margin) {
                top = margin;
            }

            panel.style.left = `${left}px`;
            panel.style.top = `${top}px`;
        }, 0);
    }

    closePanel(fragmentId) {
        const overlayData = this.overlays.get(fragmentId);
        if (overlayData && overlayData.panel) {
            overlayData.panel.remove();
            delete overlayData.panel;
        }
        this.expandedOverlays.delete(fragmentId);
    }

    cacheKey(fragmentId, locale, country) {
        return `${fragmentId}|${locale || 'en_US'}|${country || ''}`;
    }

    async loadFragmentDetails(fragmentId) {
        const overlayData = this.overlays.get(fragmentId);
        if (!overlayData || !overlayData.panel) return;

        const contentDiv = overlayData.panel.querySelector('[data-section="details"] .mas-ext-section-content');

        const cardData = overlayData.cardData;
        const key = this.cacheKey(fragmentId, cardData?.locale, cardData?.country);

        if (this.fragmentDataCache.has(key)) {
            const cachedData = this.fragmentDataCache.get(key);
            this.updateBasicInfoPath(fragmentId, cachedData.path);
            this.renderVariationInfo(fragmentId, cachedData);
            this.renderFragmentDetails(fragmentId, cachedData);
            return;
        }

        try {
            chrome.runtime.sendMessage(
                {
                    type: 'FETCH_FRAGMENT_DATA',
                    fragmentId: fragmentId,
                    locale: cardData?.locale || 'en_US',
                    country: cardData?.country,
                },
                (response) => {
                    if (chrome.runtime.lastError) return;
                    if (response && response.success && response.data) {
                        this.fragmentDataCache.set(key, response.data);
                        this.updateBasicInfoPath(fragmentId, response.data.path);
                        this.renderVariationInfo(fragmentId, response.data);
                        this.renderFragmentDetails(fragmentId, response.data);
                    } else {
                        this.updateBasicInfoPath(fragmentId, null);
                        const message = this.formatFragmentError(response?.error);
                        contentDiv.innerHTML = `<div class="mas-ext-error">${this.escapeHtml(message)}</div>`;
                    }
                },
            );
        } catch (err) {
            if (!(err && typeof err.message === 'string' && err.message.includes('Extension context invalidated'))) {
                throw err;
            }
        }
    }

    formatFragmentError(code) {
        const map = {
            invalid_fragment_id: 'Invalid fragment ID.',
            invalid_locale: 'Invalid locale.',
            invalid_country: 'Invalid country.',
            fetch_failed: 'Could not fetch fragment data.',
            'Fragment not found.': 'Fragment not found for this locale.',
        };
        if (!code) return 'Could not load fragment data.';
        return map[code] || code;
    }

    renderFragmentDetails(fragmentId, fragmentData) {
        const overlayData = this.overlays.get(fragmentId);
        if (!overlayData || !overlayData.panel) return;

        const contentDiv = overlayData.panel.querySelector('[data-section="details"] .mas-ext-section-content');
        const parsed = window.MASFragmentParser.parseFragmentData(fragmentData);
        const grouped = window.MASFragmentParser.groupFieldsByCategory(parsed);

        let html = '';

        const categoryLabels = {
            content: 'Content',
            styling: 'Styling',
            pricing: 'Pricing',
            actions: 'Actions',
            metadata: 'Metadata',
        };

        Object.entries(grouped).forEach(([category, fields]) => {
            if (category === 'basic') return;

            const fieldCount = Object.keys(fields).length;
            if (fieldCount === 0) return;

            html += `
        <div class="mas-ext-subsection">
          <h5>${categoryLabels[category] || category}</h5>
      `;

            Object.entries(fields).forEach(([fieldName, fieldData]) => {
                if (fieldName === 'tags' && Array.isArray(fieldData)) {
                    html += `
            <div class="mas-ext-field">
              <label>Tags:</label>
              <span class="mas-ext-value">${fieldData.map((t) => this.escapeHtml(t.title)).join(', ') || 'None'}</span>
            </div>
          `;
                } else if (fieldData && typeof fieldData === 'object' && fieldData.value !== undefined) {
                    const displayValue = window.MASFragmentParser.formatFieldForDisplay(fieldData);
                    if (displayValue.truncated) {
                        const expandId = `expand-${fragmentId}-${fieldName}`;
                        this.expandableTextStore.set(expandId, {
                            short: displayValue.text,
                            full: displayValue.fullText,
                        });
                        html += `
              <div class="mas-ext-field">
                <label>${this.formatFieldName(fieldName)}:</label>
                <span class="mas-ext-value mas-ext-expandable" data-expand-id="${this.escapeAttr(expandId)}" data-expanded="false">${this.escapeHtml(displayValue.text)} <button class="mas-ext-expand-btn">Show more</button></span>
              </div>
            `;
                    } else {
                        html += `
              <div class="mas-ext-field">
                <label>${this.formatFieldName(fieldName)}:</label>
                <span class="mas-ext-value">${this.escapeHtml(displayValue.text)}</span>
              </div>
            `;
                    }
                } else if (fieldData) {
                    let displayText;
                    if (typeof fieldData === 'object') {
                        if (fieldData.value !== undefined && fieldData.value !== null) {
                            displayText =
                                typeof fieldData.value === 'object' ? JSON.stringify(fieldData.value) : String(fieldData.value);
                        } else {
                            displayText = '';
                        }
                    } else {
                        displayText = String(fieldData);
                    }

                    if (displayText) {
                        const shouldTruncate = displayText.length > 100;
                        const shortText = shouldTruncate ? displayText.substring(0, 100) + '...' : displayText;

                        if (shouldTruncate) {
                            const expandId = `expand-${fragmentId}-${fieldName}`;
                            this.expandableTextStore.set(expandId, {
                                short: shortText,
                                full: displayText,
                            });
                            html += `
                <div class="mas-ext-field">
                  <label>${this.formatFieldName(fieldName)}:</label>
                  <span class="mas-ext-value mas-ext-expandable" data-expand-id="${this.escapeAttr(expandId)}" data-expanded="false">${this.escapeHtml(shortText)} <button class="mas-ext-expand-btn">Show more</button></span>
                </div>
              `;
                        } else {
                            html += `
                <div class="mas-ext-field">
                  <label>${this.formatFieldName(fieldName)}:</label>
                  <span class="mas-ext-value">${this.escapeHtml(displayText)}</span>
                </div>
              `;
                        }
                    }
                }
            });

            html += `</div>`;
        });

        contentDiv.innerHTML = html;

        contentDiv.querySelectorAll('.mas-ext-expand-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const span = btn.parentElement;
                const expandId = span.dataset.expandId;
                const textData = this.expandableTextStore.get(expandId);
                if (!textData) return;

                const isExpanded = span.dataset.expanded === 'true';
                const newText = isExpanded ? textData.short : textData.full;
                span.childNodes[0].textContent = newText + ' ';
                btn.textContent = isExpanded ? 'Show more' : 'Show less';
                span.dataset.expanded = isExpanded ? 'false' : 'true';
            });
        });
    }

    updateBasicInfoPath(fragmentId, path) {
        const overlayData = this.overlays.get(fragmentId);
        if (!overlayData || !overlayData.panel) return;

        const pathValue = overlayData.panel.querySelector('.mas-ext-path-value');
        const copyPathBtn = overlayData.panel.querySelector('.mas-ext-copy-path-btn');

        if (pathValue) {
            pathValue.textContent = path || 'N/A';
        }
        if (copyPathBtn && path) {
            copyPathBtn.dataset.value = path;
            copyPathBtn.style.visibility = 'visible';
        }
    }

    renderVariationBucket(title, entries, labelFor) {
        const rows = entries
            .map(
                (v) => `
      <a href="#" class="mas-ext-variation-link"
         data-locale="${this.escapeAttr(v.locale)}"
         data-surface="${this.escapeAttr(v.surface)}"
         data-id="${this.escapeAttr(v.id || '')}">
        ${labelFor(v)}
      </a>
    `,
            )
            .join('');
        return `
      <div class="mas-ext-field mas-ext-variations-list">
        <label>${this.escapeHtml(title)}:</label>
        <div class="mas-ext-variation-links">${rows}</div>
      </div>
    `;
    }

    renderVariationInfo(fragmentId, fragmentData) {
        const overlayData = this.overlays.get(fragmentId);
        if (!overlayData || !overlayData.panel) return;

        const variationSection = overlayData.panel.querySelector('.mas-ext-section-variation');
        const contentDiv = variationSection.querySelector('.mas-ext-variation-content');

        const variationInfo = window.MASFragmentParser.parseVariationInfo(fragmentData);

        variationSection.style.display = 'block';

        if (!variationInfo.locale) {
            contentDiv.innerHTML = `
        <div class="mas-ext-field">
          <label>Locale:</label>
          <span class="mas-ext-value">Unable to detect locale from path</span>
        </div>
      `;
            return;
        }

        const localeName = window.MASFragmentParser.getLocaleDisplayName(variationInfo.locale);

        let html = `
      <div class="mas-ext-field">
        <label>Locale:</label>
        <span class="mas-ext-value">${this.escapeHtml(localeName)} (${variationInfo.locale})</span>
      </div>
    `;

        if (variationInfo.isVariation) {
            const parentLocaleName = window.MASFragmentParser.getLocaleDisplayName(variationInfo.localeDefaultLocale);
            html += `
        <div class="mas-ext-field">
          <label>Type:</label>
          <span class="mas-ext-value mas-ext-variation-badge">Locale Variation</span>
        </div>
        <div class="mas-ext-field">
          <label>Parent:</label>
          <span class="mas-ext-value">
            <a href="#" class="mas-ext-parent-link" data-locale="${this.escapeAttr(variationInfo.localeDefaultLocale)}" data-surface="${this.escapeAttr(variationInfo.surface)}">
              ${this.escapeHtml(parentLocaleName)} (${variationInfo.localeDefaultLocale}) →
            </a>
          </span>
        </div>
      `;
        } else {
            html += `
        <div class="mas-ext-field">
          <label>Type:</label>
          <span class="mas-ext-value mas-ext-locale-default-badge">Locale Default</span>
        </div>
      `;
        }

        const buckets = variationInfo.variations || { locale: [], promo: [], grouped: [] };

        if (buckets.locale && buckets.locale.length > 0) {
            html += this.renderVariationBucket('Locale variations', buckets.locale, (v) =>
                this.escapeHtml(window.MASFragmentParser.getLocaleDisplayName(v.locale)),
            );
        }

        if (buckets.promo && buckets.promo.length > 0) {
            html += this.renderVariationBucket('Promotional variations', buckets.promo, (v) =>
                this.escapeHtml(v.promotionName || v.name || 'Promotion'),
            );
        }

        if (buckets.grouped && buckets.grouped.length > 0) {
            html += this.renderVariationBucket('Grouped variations', buckets.grouped, (v) => {
                const label = v.pznCountries && v.pznCountries.length ? v.pznCountries.join(', ') : v.name || 'Group';
                return this.escapeHtml(label);
            });
        }

        contentDiv.innerHTML = html;

        const parentLink = contentDiv.querySelector('.mas-ext-parent-link');
        if (parentLink) {
            parentLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.MASStudioLinker.openParentInStudio(variationInfo);
            });
        }

        const variationLinks = contentDiv.querySelectorAll('.mas-ext-variation-link');
        variationLinks.forEach((link) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const variation = {
                    id: link.dataset.id || null,
                    locale: link.dataset.locale,
                    surface: link.dataset.surface,
                };
                window.MASStudioLinker.openVariationInStudio(variation);
            });
        });
    }

    refreshFragmentData(fragmentId) {
        const overlayData = this.overlays.get(fragmentId);
        const cardData = overlayData?.cardData;
        const key = this.cacheKey(fragmentId, cardData?.locale, cardData?.country);
        this.fragmentDataCache.delete(key);
        this.loadFragmentDetails(fragmentId);
    }

    updateCardNameInPanel(fragmentId, cardName) {
        const overlayData = this.overlays.get(fragmentId);
        if (!overlayData) return;

        overlayData.cardData.cardName = cardName;

        if (overlayData.panel) {
            const header = overlayData.panel.querySelector('.mas-ext-panel-header h3');
            if (header) {
                header.textContent = cardName;
            }
        }
    }

    updateBadgeVariant(fragmentId, variant) {
        const overlayData = this.overlays.get(fragmentId);
        if (!overlayData) return;

        overlayData.cardData.variant = variant;

        const variantLabel = overlayData.badge.querySelector('.mas-ext-badge-variant');
        if (variantLabel) {
            variantLabel.textContent = variant;
        }
    }

    formatFieldName(fieldName) {
        return fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase())
            .trim();
    }

    escapeHtml(text) {
        return window.MASEscape.escapeHtmlText(text);
    }

    escapeAttr(text) {
        return window.MASEscape.escapeHtmlAttr(text);
    }

    updatePositions() {
        this.overlays.forEach((overlayData) => {
            this.positionBadge(overlayData.badge, overlayData.cardData.element);

            if (overlayData.panel) {
                this.positionPanel(overlayData.panel, overlayData.cardData.element);
            }
        });
    }

    destroy() {
        this.overlays.forEach((overlayData) => {
            overlayData.badge.remove();
            if (overlayData.panel) {
                overlayData.panel.remove();
            }
        });
        this.overlays.clear();
        this.expandedOverlays.clear();
        this.expandableTextStore.clear();
    }

    hide() {
        this.overlays.forEach((overlayData) => {
            overlayData.badge.style.display = 'none';
            if (overlayData.panel) {
                overlayData.panel.style.display = 'none';
            }
        });
    }

    show() {
        this.overlays.forEach((overlayData) => {
            overlayData.badge.style.display = '';
            if (overlayData.panel) {
                overlayData.panel.style.display = '';
            }
        });
    }

    applyTheme(isDark) {
        const themeClass = 'spectrum spectrum--express spectrum--medium spectrum--' + (isDark ? 'dark' : 'light');
        this.overlays.forEach(({ badge, panel }) => {
            if (badge) {
                badge.className = themeClass + ' mas-ext-badge';
            }
            if (panel) {
                panel.className = themeClass + ' mas-ext-panel';
            }
        });
    }
}

if (typeof window !== 'undefined') {
    window.MASCardOverlay = new CardOverlay();
}
