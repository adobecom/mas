import { LitElement, html, nothing, repeat } from 'lit';
import { styles } from './mas-fragment-picker.css.js';
import Store from './store.js';
import { ROOT_PATH, EDITABLE_FRAGMENT_MODEL_IDS } from './constants.js';
import { showToast } from './utils.js';

class MasFragmentPicker extends LitElement {
    static styles = styles;

    static properties = {
        translationProject: { type: Object },
        selectedFragments: { type: Array },
        fragments: { type: Array, state: true },
        loading: { type: Boolean, state: true },
        error: { type: String, state: true },
        fragmentsById: { type: Map, state: true },
    };

    constructor() {
        super();
        this.translationProject = null;
        this.selectedFragments = [];
        this.fragments = [];
        this.fragmentsById = new Map();
        this.loading = false;
        this.error = null;
        this.abortController = null;
        this.unsubscribe = null;
    }

    /** @type {import('./mas-repository.js').MasRepository} */
    get repository() {
        return document.querySelector('mas-repository');
    }

    connectedCallback() {
        super.connectedCallback();
        this.unsubscribe = Store.search.subscribe(() => {
            this.fetchFragments();
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.abortController) {
            this.abortController.abort();
        }
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    get loadingIndicator() {
        if (!this.loading) return nothing;
        return html`<sp-progress-circle indeterminate size="l"></sp-progress-circle>`;
    }

    async fetchFragments() {
        const surface = Store.search.value?.path?.split('/').filter(Boolean)[0]?.toLowerCase();
        if (!surface) return;

        const aem = this.repository?.aem;
        if (!aem) {
            this.error = 'Repository not available';
            return;
        }

        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();

        this.fragments = [
            {
                path: '/content/dam/mas/sandbox/en_US/angelo/ccd-slice-wide-cc-all-app312',
                title: 'Acom Plans CC All Apps',
                description: 'test card for plans',
                id: 'e717cb6f-510d-45a1-8c90-6e7f834c2850',
                created: {
                    at: '2025-03-04T13:57:08.268Z',
                    by: 'cod23684@adobe.com',
                    fullName: 'cod23684@adobe.com',
                },
                modified: {
                    at: '2025-12-24T14:41:31.676Z',
                    by: 'cod23684@adobe.com',
                    fullName: 'cod23684@adobe.com',
                },
                published: {
                    at: '2025-12-04T11:44:45.478Z',
                    by: 'cod23684@adobe.com',
                    fullName: 'cod23684@adobe.com',
                },
                status: 'MODIFIED',
                previewReplicationStatus: 'NEVER_PUBLISHED',
                model: {
                    id: 'L2NvbmYvbWFzL3NldHRpbmdzL2RhbS9jZm0vbW9kZWxzL2NhcmQ',
                    path: '/conf/mas/settings/dam/cfm/models/card',
                    name: 'Card',
                    title: 'Card',
                    description: 'universal m@s card model',
                },
                validationStatus: [],
                fields: [
                    {
                        name: 'variant',
                        type: 'text',
                        multiple: false,
                        locked: false,
                        values: ['plans'],
                    },
                    {
                        name: 'osi',
                        type: 'text',
                        multiple: false,
                        locked: false,
                        values: ['Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ'],
                    },
                    {
                        name: 'size',
                        type: 'text',
                        multiple: false,
                        locked: false,
                        values: ['super-wide'],
                    },
                    {
                        name: 'mnemonicIcon',
                        type: 'text',
                        multiple: true,
                        locked: false,
                        values: ['https://www.adobe.com/cc-shared/assets/img/product-icons/svg/creative-cloud.svg'],
                    },
                    {
                        name: 'mnemonicAlt',
                        type: 'text',
                        multiple: true,
                        locked: false,
                        values: [''],
                    },
                    {
                        name: 'mnemonicLink',
                        type: 'text',
                        multiple: true,
                        locked: false,
                        values: ['http://www.adobe.com/creativecloud/plans.html'],
                    },
                    {
                        name: 'badge',
                        type: 'long-text',
                        multiple: false,
                        locked: false,
                        mimeType: 'text/html',
                        values: [
                            '<merch-badge background-color="spectrum-green-900-plans" color="#fff" border-color="spectrum-yellow-300-plans" variant="plans">badge</merch-badge>',
                        ],
                    },
                    {
                        name: 'trialBadge',
                        type: 'long-text',
                        multiple: false,
                        locked: false,
                        mimeType: 'text/html',
                        values: [],
                    },
                    {
                        name: 'backgroundColor',
                        type: 'text',
                        multiple: false,
                        locked: false,
                        values: [],
                    },
                    {
                        name: 'borderColor',
                        type: 'text',
                        multiple: false,
                        locked: false,
                        values: ['spectrum-gray-300-plans'],
                    },
                    {
                        name: 'backgroundImage',
                        type: 'text',
                        multiple: false,
                        locked: false,
                        values: [
                            'https://main--milo--adobecom.hlx.page/drafts/axel/media_144906e76fce812811940ce88ceded4f8d12098b5.png?width=2000&format=webply&optimize=medium',
                        ],
                    },
                    {
                        name: 'backgroundImageAltText',
                        type: 'text',
                        multiple: false,
                        locked: false,
                        values: [],
                    },
                    {
                        name: 'cardTitle',
                        type: 'text',
                        multiple: false,
                        locked: false,
                        values: ['Mili Test Cardssea'],
                    },
                    {
                        name: 'cardName',
                        type: 'text',
                        multiple: false,
                        locked: false,
                        values: [],
                    },
                    {
                        name: 'cardTitleLink',
                        type: 'text',
                        multiple: false,
                        locked: false,
                        values: [],
                    },
                    {
                        name: 'subtitle',
                        type: 'text',
                        multiple: false,
                        locked: false,
                        values: ['blahasdasdaaaa'],
                    },
                    {
                        name: 'prices',
                        type: 'long-text',
                        multiple: false,
                        locked: false,
                        mimeType: 'text/html',
                        values: [
                            '<span is="inline-price" data-display-per-unit="true" data-display-tax="true" data-promotion-code="UMRM2MUSPr501YOC" data-template="price" data-wcs-osi="yIcVsmjmQCHKQ-TvUJxH3-kop4ifvwoMBBzVg3qfaTg"></span>',
                        ],
                    },
                    {
                        name: 'shortDescription',
                        type: 'long-text',
                        multiple: false,
                        locked: false,
                        mimeType: 'text/html',
                        values: [],
                    },
                    {
                        name: 'promoText',
                        type: 'text',
                        multiple: false,
                        locked: false,
                        values: ['test promo text new July 16th again'],
                    },
                    {
                        name: 'promoCode',
                        type: 'text',
                        multiple: false,
                        locked: false,
                        values: [],
                    },
                    {
                        name: 'description',
                        type: 'long-text',
                        multiple: false,
                        locked: false,
                        mimeType: 'text/html',
                        values: [
                            '<p>Body XS/Regular Get 20+ apps for all kinds of creative work, from editing photos and videos to designing logos and more.. <a class="secondary-link" href="tel:01234567" title="text" target="_self">01234567</a></p><p><strong><span is="inline-price" data-template="price" data-wcs-osi="Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ"></span> </strong><span is="inline-price" data-display-tax="true" data-template="legal" data-wcs-osi="Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ"></span></p><p><a class="primary-link" href="https://example.com" target="_self">Learn more</a></p>',
                        ],
                    },
                    {
                        name: 'callout',
                        type: 'long-text',
                        multiple: false,
                        locked: false,
                        mimeType: 'text/html',
                        values: ['<p>This is some callout text...</p>'],
                    },
                    {
                        name: 'showSecureLabel',
                        type: 'boolean',
                        multiple: false,
                        locked: false,
                        values: [],
                    },
                    {
                        name: 'showPlanType',
                        type: 'boolean',
                        multiple: false,
                        locked: false,
                        values: [],
                    },
                    {
                        name: 'quantitySelect',
                        type: 'text',
                        multiple: false,
                        locked: false,
                        values: [
                            '<merch-quantity-select title="Select quantity:" min="2" max="10" step="2"></merch-quantity-select>',
                        ],
                    },
                    {
                        name: 'addon',
                        type: 'text',
                        multiple: false,
                        locked: false,
                        values: ['{{addon-mili-test}}'],
                    },
                    {
                        name: 'addonConfirmation',
                        type: 'text',
                        multiple: false,
                        locked: false,
                        values: [],
                    },
                    {
                        name: 'ctas',
                        type: 'long-text',
                        multiple: false,
                        locked: false,
                        mimeType: 'text/html',
                        values: [
                            '<a class="accent" data-extra-options="{&quot;mv&quot;:&quot;1&quot;,&quot;cs&quot;:&quot;tr&quot;,&quot;ms&quot;:&quot;ind&quot;,&quot;promoid&quot;:&quot;12345&quot;,&quot;mv2&quot;:&quot;2&quot;}" data-wcs-osi="A1xn6EL4pK93bWjM8flffQpfEL-bnvtoQKQAvkx574M" data-template="checkoutUrl" target="_self" data-analytics-id="buy-now">Buy now</a>',
                        ],
                    },
                    {
                        name: 'variations',
                        type: 'content-fragment',
                        multiple: true,
                        locked: false,
                        values: [],
                    },
                    {
                        name: 'product',
                        type: 'content-reference',
                        multiple: false,
                        locked: false,
                        values: [],
                    },
                    {
                        name: 'whatsIncluded',
                        type: 'text',
                        multiple: false,
                        locked: false,
                        values: [
                            '<merch-whats-included><div slot="heading">List of items:</div><div slot="content"><merch-mnemonic-list><div slot="icon"><merch-icon size="s" src="https://www.adobe.com/cc-shared/assets/img/product-icons/svg/creative-cloud.svg" alt="Creative Cloud"></merch-icon></div><p slot="description"><strong>Creative Cloud</strong></p></merch-mnemonic-list><merch-mnemonic-list><div slot="icon"><merch-icon size="s" src="https://www.adobe.com/cc-shared/assets/img/product-icons/svg/photoshop.svg" alt="Photoshop"></merch-icon></div><p slot="description"><strong>Photoshop</strong></p></merch-mnemonic-list><merch-mnemonic-list><div slot="icon"><merch-icon size="s" src="https://www.adobe.com/cc-shared/assets/img/product-icons/svg/illustrator.svg" alt="Illustrator"></merch-icon></div><p slot="description"><strong>Illustrator</strong></p></merch-mnemonic-list><merch-mnemonic-list><div slot="icon"><merch-icon size="s" src="https://www.adobe.com/cc-shared/assets/img/product-icons/svg/indesign.svg" alt="InDesign"></merch-icon></div><p slot="description"><strong>InDesign</strong></p></merch-mnemonic-list><merch-mnemonic-list><div slot="icon"><merch-icon size="s" src="https://www.adobe.com/cc-shared/assets/img/product-icons/svg/acrobat-pro.svg" alt="Acrobat Pro"></merch-icon></div><p slot="description"><strong>Acrobat Pro</strong></p></merch-mnemonic-list></div></merch-whats-included>',
                        ],
                    },
                    {
                        name: 'tags',
                        type: 'tag',
                        multiple: true,
                        locked: false,
                        values: [
                            'mas:product_family',
                            'mas:offer_type/base',
                            'mas:commitment/access_pass',
                            'mas:market_segments/com',
                            'mas:plan_type/abm',
                            'mas:customer_segment/individual',
                            'mas:promotion/back-to-school',
                        ],
                    },
                    {
                        name: 'perUnitLabel',
                        type: 'text',
                        multiple: false,
                        locked: false,
                        values: [],
                    },
                    {
                        name: 'originalId',
                        type: 'text',
                        multiple: false,
                        locked: false,
                        values: ['e717cb6f-510d-45a1-8c90-6e7f834c2850'],
                    },
                    {
                        name: 'locReady',
                        type: 'boolean',
                        multiple: false,
                        locked: false,
                        values: [false],
                    },
                ],
                variations: [],
                tags: [
                    {
                        id: 'mas:product_family',
                        title: 'Product family',
                        i18n: [],
                        titlePath: 'Merch at Scale : Product family',
                        name: 'product_family',
                        path: '/content/cq:tags/mas/product_family',
                    },
                    {
                        id: 'mas:offer_type/base',
                        title: 'Base',
                        i18n: [],
                        titlePath: 'Merch at Scale : Offer type / Base',
                        name: 'base',
                        path: '/content/cq:tags/mas/offer_type/base',
                    },
                    {
                        id: 'mas:commitment/access_pass',
                        title: 'ACCESS_PASS',
                        i18n: [],
                        titlePath: 'Merch at Scale : Commitment / ACCESS_PASS',
                        name: 'access_pass',
                        path: '/content/cq:tags/mas/commitment/access_pass',
                        description: '',
                    },
                    {
                        id: 'mas:market_segments/com',
                        title: 'COM',
                        i18n: [],
                        titlePath: 'Merch at Scale : Market segments / COM',
                        name: 'com',
                        path: '/content/cq:tags/mas/market_segments/com',
                        description: '',
                    },
                    {
                        id: 'mas:plan_type/abm',
                        title: 'ABM',
                        i18n: [],
                        titlePath: 'Merch at Scale : Plan type / ABM',
                        name: 'abm',
                        path: '/content/cq:tags/mas/plan_type/abm',
                        description: '',
                    },
                    {
                        id: 'mas:promotion/back-to-school',
                        title: 'Back To School',
                        i18n: [],
                        titlePath: 'Merch at Scale : Promotion / Back To School',
                        name: 'back-to-school',
                        path: '/content/cq:tags/mas/promotion/back-to-school',
                        description: '',
                    },
                    {
                        id: 'mas:customer_segment/individual',
                        title: 'Individual',
                        i18n: [],
                        titlePath: 'Merch at Scale : Customer segment / Individual',
                        name: 'individual',
                        path: '/content/cq:tags/mas/customer_segment/individual',
                    },
                ],
                references: [],
                fieldTags: [
                    {
                        id: 'mas:product_family',
                        title: 'Product family',
                        i18n: [],
                        titlePath: 'Merch at Scale : Product family',
                        name: 'product_family',
                        path: '/content/cq:tags/mas/product_family',
                    },
                    {
                        id: 'mas:offer_type/base',
                        title: 'Base',
                        i18n: [],
                        titlePath: 'Merch at Scale : Offer type / Base',
                        name: 'base',
                        path: '/content/cq:tags/mas/offer_type/base',
                    },
                    {
                        id: 'mas:commitment/access_pass',
                        title: 'ACCESS_PASS',
                        i18n: [],
                        titlePath: 'Merch at Scale : Commitment / ACCESS_PASS',
                        name: 'access_pass',
                        path: '/content/cq:tags/mas/commitment/access_pass',
                        description: '',
                    },
                    {
                        id: 'mas:market_segments/com',
                        title: 'COM',
                        i18n: [],
                        titlePath: 'Merch at Scale : Market segments / COM',
                        name: 'com',
                        path: '/content/cq:tags/mas/market_segments/com',
                        description: '',
                    },
                    {
                        id: 'mas:plan_type/abm',
                        title: 'ABM',
                        i18n: [],
                        titlePath: 'Merch at Scale : Plan type / ABM',
                        name: 'abm',
                        path: '/content/cq:tags/mas/plan_type/abm',
                        description: '',
                    },
                    {
                        id: 'mas:customer_segment/individual',
                        title: 'Individual',
                        i18n: [],
                        titlePath: 'Merch at Scale : Customer segment / Individual',
                        name: 'individual',
                        path: '/content/cq:tags/mas/customer_segment/individual',
                    },
                    {
                        id: 'mas:promotion/back-to-school',
                        title: 'Back To School',
                        i18n: [],
                        titlePath: 'Merch at Scale : Promotion / Back To School',
                        name: 'back-to-school',
                        path: '/content/cq:tags/mas/promotion/back-to-school',
                        description: '',
                    },
                ],
                etag: '"824d3c90739afcee5864e58dc7964de3"',
                tagsCount: 7,
                card: {
                    assets: [],
                    texts: [
                        'plans',
                        'Mutn1LYoGojkrcMdCLO7LQlx1FyTHw27ETsfLv0h8DQ',
                        'super-wide',
                        'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/creative-cloud.svg',
                        'http://www.adobe.com/creativecloud/plans.html',
                        'badge',
                        'spectrum-gray-300-plans',
                    ],
                },
            },
        ];
        this.fragmentsById = new Map(this.fragments.map((fragment) => [fragment.id, fragment]));
        console.log('fragments', this.fragments);
        console.log('fragmentsById', this.fragmentsById);

        // this.loading = true;
        // this.error = null;

        // try {
        //     const cursor = await aem.sites.cf.fragments.search(
        //         {
        //             path: `${ROOT_PATH}/${surface}/${Store.filters.value?.locale || 'en_US'}`,
        //             modelIds: EDITABLE_FRAGMENT_MODEL_IDS,
        //             sort: [{ on: 'modifiedOrCreated', order: 'DESC' }],
        //         },
        //         null,
        //         this.abortController,
        //     );
        //     const fetchedFragments = [];
        //     for await (const result of cursor) {
        //         for (const item of result) {
        //             fetchedFragments.push(item);
        //         }
        //     }
        //     this.fragments = fetchedFragments;
        //     this.fragmentsById = new Map(this.fragments.map((fragment) => [fragment.id, fragment]));
        // } catch (err) {
        //     if (err.name !== 'AbortError') {
        //         console.error('Failed to fetch fragments:', err);
        //         this.error = err.message;
        //         showToast('Failed to fetch fragments.', 'negative');
        //     }
        // } finally {
        //     this.loading = false;
        // }
    }

    getTruncatedOfferId(offerId) {
        if (!offerId || offerId.length <= 5) return offerId;
        return `...${offerId.slice(-5)}`;
    }s

    handleSelectionChange({ target: { selected } }) {
        this.selectedFragments = selected?.length ? selected.map((id) => this.fragmentsById.get(id)).filter(Boolean) : [];
    }

    async copyOfferIdToClipboard(e, offerId) {
        e?.stopPropagation();
        if (!offerId) return;
        try {
            await navigator.clipboard.writeText(offerId);
            showToast('Offer ID copied to clipboard', 'positive');
        } catch (err) {
            console.error('Failed to copy offer ID:', err);
            showToast('Failed to copy Offer ID', 'negative');
        }
    }

    renderStatus(status) {
        if (!status) return nothing;
        let statusClass = '';
        if (status === 'PUBLISHED') {
            statusClass = 'green';
        } else if (status === 'MODIFIED') {
            statusClass = 'yellow';
        }
        return html`<sp-table-cell class="status-cell">
            <div class="status-dot ${statusClass}"></div>
            ${status.charAt(0).toUpperCase()}${status.slice(1).toLowerCase()}
        </sp-table-cell>`;
    }

    renderTable() {
        return html` <div class="container">
                ${this.loading
                    ? html`<div class="loading-container">${this.loadingIndicator}</div>`
                    : html`<sp-table emphasized scroller selects="multiple" @change=${this.handleSelectionChange}>
                          <sp-table-head>
                              <sp-table-head-cell sortable>Offer</sp-table-head-cell>
                              <sp-table-head-cell>Fragment title</sp-table-head-cell>
                              <sp-table-head-cell>Offer ID</sp-table-head-cell>
                              <sp-table-head-cell>Path</sp-table-head-cell>
                              <sp-table-head-cell>Status</sp-table-head-cell>
                          </sp-table-head>
                          <sp-table-body>
                              ${repeat(
                                  this.fragments,
                                  (fragment) => fragment.id,
                                  (fragment) => {
                                      const offerId = fragment.fields?.find(({ name }) => name === 'osi')?.values?.[0];
                                      return html`<sp-table-row value=${fragment.id}>
                                          <sp-table-cell>${fragment.title}</sp-table-cell>
                                          <sp-table-cell>${fragment.title}</sp-table-cell>
                                          <sp-table-cell class="offer-id">
                                              <div>${this.getTruncatedOfferId(offerId)}</div>
                                              ${offerId
                                                  ? html`<sp-button
                                                        icon-only
                                                        aria-label="Copy Offer ID to clipboard"
                                                        @click=${(e) => this.copyOfferIdToClipboard(e, offerId)}
                                                    >
                                                        <sp-icon-copy slot="icon"></sp-icon-copy>
                                                    </sp-button>`
                                                  : ''}
                                          </sp-table-cell>
                                          <sp-table-cell class="path">${fragment.path}</sp-table-cell>
                                          ${this.renderStatus(fragment.status)}
                                      </sp-table-row>`;
                                  },
                              )}
                          </sp-table-body>
                      </sp-table>`}
                ${this.selectedFragments.length
                    ? html`<ul class="selected-files">
                          ${repeat(
                              this.selectedFragments,
                              (fragment) => fragment.id,
                              (fragment) =>
                                  html`<li class="file">
                                      <h3 class="title">${fragment.title}</h3>
                                      <div class="details">Default fragment: ${fragment.locale}</div>
                                      <sp-button variant="secondary" size="l" icon-only>
                                          <sp-icon-close slot="icon"></sp-icon-close>
                                      </sp-button>
                                  </li>`,
                          )}
                      </ul>`
                    : ''}
            </div>

            <div class="selected-files-count">Selected files (${this.selectedFragments.length})</div>`;
    }

    render() {
        return html`
            <div class="search">
                <sp-search size="m" placeholder="Search" disabled></sp-search>
                <div>1507 result(s)</div>
            </div>

            <div class="filters">
                <sp-picker>
                    <span slot="label">Template</span>
                    <sp-menu-item>Template 1</sp-menu-item>
                    <sp-menu-item>Template 2</sp-menu-item>
                    <sp-menu-item>Template 3</sp-menu-item>
                </sp-picker>

                <sp-picker>
                    <span slot="label">Segment</span>
                    <sp-menu-item>Segment 1</sp-menu-item>
                    <sp-menu-item>Segment 2</sp-menu-item>
                    <sp-menu-item>Segment 3</sp-menu-item>
                </sp-picker>

                <sp-picker>
                    <span slot="label">Product</span>
                    <sp-menu-item>Product 1</sp-menu-item>
                    <sp-menu-item>Product 2</sp-menu-item>
                    <sp-menu-item>Product 3</sp-menu-item>
                </sp-picker>
            </div>
            ${this.renderTable()}
        `;
    }
}

customElements.define('mas-fragment-picker', MasFragmentPicker);
