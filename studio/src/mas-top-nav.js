import { ENVS, EnvColorCode, WCS_LANDSCAPE_DRAFT, WCS_LANDSCAPE_PUBLISHED, PAGE_NAMES } from './constants.js';
import { LitElement, html, nothing } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { until } from 'lit/directives/until.js';
import Store from './store.js';
import ReactiveController from './reactivity/reactive-controller.js';
import router from './router.js';
import { extractLocaleFromPath } from './utils.js';
import { getDefaultLocaleCode } from '../../io/www/src/fragment/locales.js';
import './mas-nav-folder-picker.js';
import './mas-locale-picker.js';

class MasTopNav extends LitElement {
    page = Store.page;
    inEdit = Store.fragments.inEdit;
    editorContext = Store.fragmentEditor.editorContext;
    search = Store.search;
    filters = Store.filters;
    landscape = Store.landscape;
    settings = Store.settings;
    version = Store.version;
    promotions = Store.promotions;
    translationProjects = Store.translationProjects;

    reactiveController = new ReactiveController(this, [
        this.page,
        this.inEdit,
        this.editorContext,
        this.search,
        this.filters,
        this.landscape,
        this.settings.fragmentId,
        this.settings.creating,
        this.version.fragmentId,
        this.promotions.promotionId,
        this.translationProjects.translationProjectId,
        this.translationProjects.inEdit,
    ]);

    createRenderRoot() {
        return this;
    }
    async profileBuilder() {
        try {
            const accessToken = window.adobeIMS.getAccessToken();
            const ioResp = await fetch(`https://${ENVS[this.aemEnv].adobeIO}/profile`, {
                headers: new Headers({
                    Authorization: `Bearer ${accessToken.token}`,
                }),
            });
            const profiles = {};
            profiles.ims = await window.adobeIMS.getProfile();
            profiles.io = await ioResp.json();
            const { displayName, email } = profiles.ims;
            const { user } = profiles.io;
            const { avatar } = user;
            const profileEl = document.createElement('div');
            profileEl.classList.add('profile');
            profileEl.innerHTML = `
            <button class="profile-button">
                    <img src="${avatar}" alt="${displayName}" height="26">
                </button>
                <div class="profile-body">
                    <div class="account-menu-header">
                        <div class="avatar-container"><img src="${avatar}" alt="${displayName}" class="avatar-image"></div>
                        <div class="account-info">
                            <h2>${displayName}</h2>
                            <p>${email}</p>
                            <a href="https://account.adobe.com" target="_blank">Manage account</a>
                        </div>
                    </div>
                    <div class="account-menu">
                        <hr>
                        <a class="signout-link">
                            <div class="account-menu-item">Sign out</div>
                        </a>
                    </div>
                </div>
            `;
            const profileButton = profileEl.querySelector('.profile-button');
            const profileBody = profileEl.querySelector('.profile-body');
            const signOutLink = profileEl.querySelector('.signout-link');
            const studioContentEl = document.querySelector('.studio-content');

            profileButton.addEventListener('click', () => {
                profileBody.classList.toggle('show');
            });
            signOutLink.addEventListener('click', (e) => {
                e.preventDefault();
                window.adobeIMS.signOut();
            });
            studioContentEl?.addEventListener('click', () => {
                profileBody.classList.remove('show');
            });

            return profileEl;
        } catch (error) {
            console.error('Failed to build profile:', error);
            const fallbackEl = document.createElement('div');
            fallbackEl.classList.add('profile-error');
            fallbackEl.innerHTML = '<div>Profile unavailable</div>';
            return fallbackEl;
        }
    }

    static properties = {
        aemEnv: { type: String, attribute: 'aem-env' },
        showPickers: { type: Boolean, attribute: 'show-pickers' },
    };

    profileTemplatePromise = null;

    constructor() {
        super();
        this.aemEnv = 'prod';
        this.showPickers = true;
        this.search.subscribe(() => {
            this.requestUpdate();
        });
    }

    willUpdate(changedProperties) {
        if (changedProperties.has('aemEnv')) {
            this.profileTemplatePromise = null;
        }
    }

    getProfileTemplate() {
        if (!this.profileTemplatePromise) {
            this.profileTemplatePromise = this.profileBuilder().then((profile) => html`${profile}`);
        }
        return this.profileTemplatePromise;
    }

    get shouldShowPickers() {
        return this.showPickers;
    }

    get isContentPage() {
        return this.page.value === PAGE_NAMES.CONTENT;
    }

    get isPlaceholdersPage() {
        return this.page.value === PAGE_NAMES.PLACEHOLDERS;
    }

    get isSettingsPage() {
        return this.page.value === PAGE_NAMES.SETTINGS || this.page.value === PAGE_NAMES.SETTINGS_EDITOR;
    }

    get isWelcomePage() {
        return this.page.value === PAGE_NAMES.WELCOME;
    }

    get isFragmentEditorPage() {
        return this.page.value === PAGE_NAMES.FRAGMENT_EDITOR;
    }

    get isTranslationEditorPage() {
        return this.page.value === PAGE_NAMES.TRANSLATION_EDITOR;
    }

    get isTranslationsPage() {
        return this.page.value === PAGE_NAMES.TRANSLATIONS;
    }

    get isSettingsEditorPage() {
        return this.page.value === PAGE_NAMES.SETTINGS_EDITOR;
    }

    get topNavLocale() {
        if (this.isFragmentEditorPage) {
            const fragmentId = this.inEdit.get()?.get()?.id;
            if (this.editorContext.isVariation(fragmentId) && this.editorContext.localeDefaultFragment?.path) {
                return extractLocaleFromPath(this.editorContext.localeDefaultFragment.path);
            }
        }
        const locale = Store.localeOrRegion();
        return getDefaultLocaleCode(Store.surface(), locale) || locale;
    }

    get isLocalePickerDisabled() {
        if (this.isWelcomePage || this.isContentPage || this.isPlaceholdersPage) {
            return false;
        }
        if (this.isFragmentEditorPage) {
            // Enable picker when viewing default locale fragment (not a variation)
            // so users can browse to locale variations
            const fragmentId = this.inEdit.get()?.get()?.id;
            return this.editorContext.isVariation(fragmentId);
        }
        return true;
    }

    get isDraftLandscape() {
        return this.landscape.value === WCS_LANDSCAPE_DRAFT;
    }

    async onLocaleChanged(e) {
        const { locale, fragmentId } = e.detail;
        if (this.isFragmentEditorPage) {
            const currentFragment = this.inEdit.get()?.get();
            if (fragmentId && fragmentId !== currentFragment?.id) {
                if (currentFragment?.hasChanges) {
                    const editor = document.querySelector('mas-fragment-editor');
                    const confirmed = await editor?.promptDiscardChanges();
                    if (!confirmed) {
                        // Reset the picker to the current locale
                        this.requestUpdate();
                        return;
                    }
                }
                // Clear the region override and update locale filter before navigating
                Store.search.set((prev) => ({ ...prev, region: null }));
                this.filters.set((prev) => ({ ...prev, locale }));
                router.navigateToFragmentEditor(fragmentId);
            } else if (fragmentId && fragmentId === currentFragment?.id) {
                // User selected the same fragment's locale
                Store.editor.resetChanges();
                Store.search.set((prev) => ({ ...prev, region: null }));
                this.filters.set((prev) => ({ ...prev, locale }));
            } else if (!fragmentId) {
                // If no translation exists for this locale, navigate to en_US fragment
                // and show the "missing variation" state
                Store.editor.resetChanges();
                const translatedLocales = Store.fragmentEditor.translatedLocales.get();
                const enUsTranslation = translatedLocales?.find((t) => t.locale === 'en_US');
                const enUsFragmentId = enUsTranslation?.id || currentFragment?.id;
                Store.search.set((prev) => ({ ...prev, region: locale }));
                this.filters.set((prev) => ({ ...prev, locale }));
                router.navigateToFragmentEditor(enUsFragmentId);
            }
            return;
        }
        this.filters.set((prev) => ({ ...prev, locale }));
    }

    get environmentIndicator() {
        if (this.aemEnv === 'prod') {
            return html``;
        }
        return html` <sp-badge size="small" variant="${EnvColorCode[this.aemEnv]}"> ${this.aemEnv.toUpperCase()} </sp-badge> `;
    }

    get settingEditorBreadcrumbLabel() {
        return this.settings.creating.get() ? 'Create new setting' : 'Edit setting';
    }

    get promotionsEditorBreadcrumbLabel() {
        return this.promotions.promotionId.get() ? 'Edit project' : 'Create new project';
    }

    get translationEditorBreadcrumbLabel() {
        if (!this.translationProjects.translationProjectId.get()) return 'Create new project';
        const project = this.translationProjects.inEdit.get()?.get();
        if (project?.getFieldValue('submissionDate')) return 'Translation Project';
        return 'Edit project';
    }

    get breadcrumbItems() {
        const handlers = {
            content: () => router.navigateToPage(PAGE_NAMES.CONTENT)(),
            settings: () => router.navigateToPage(PAGE_NAMES.SETTINGS)(),
            promotions: () => router.navigateToPage(PAGE_NAMES.PROMOTIONS)(),
            translations: () => router.navigateToPage(PAGE_NAMES.TRANSLATIONS)(),
            editor: () => {
                const fragmentId = this.version.fragmentId.get();
                if (!fragmentId) return;
                router.navigateToFragmentEditor(fragmentId);
            },
        };

        if (this.page.value === PAGE_NAMES.FRAGMENT_EDITOR) {
            return [{ label: 'Fragments', handler: handlers.content }, { label: 'Editor' }];
        }
        if (this.page.value === PAGE_NAMES.VERSION) {
            return [
                { label: 'Fragments', handler: handlers.content },
                { label: 'Editor', handler: handlers.editor },
                { label: 'Version history' },
            ];
        }
        if (this.page.value === PAGE_NAMES.SETTINGS_EDITOR) {
            if (!this.settings.fragmentId.get() && !this.settings.creating.get()) {
                return [];
            }
            return [{ label: 'Settings', handler: handlers.settings }, { label: this.settingEditorBreadcrumbLabel }];
        }
        if (this.page.value === PAGE_NAMES.PROMOTIONS_EDITOR) {
            return [{ label: 'Promotions', handler: handlers.promotions }, { label: this.promotionsEditorBreadcrumbLabel }];
        }
        if (this.page.value === PAGE_NAMES.TRANSLATION_EDITOR) {
            return [
                { label: 'Translations', handler: handlers.translations },
                { label: this.translationEditorBreadcrumbLabel },
            ];
        }

        return [];
    }

    get breadcrumbsTemplate() {
        const items = this.breadcrumbItems;
        if (!items.length) return nothing;
        const breadcrumbKey = items.map((item) => item.label).join('|');
        return keyed(
            breadcrumbKey,
            html`
                <div class="nav-breadcrumbs">
                    <sp-breadcrumbs>
                        ${items.map(
                            (item) =>
                                html`<sp-breadcrumb-item @click=${item.handler || nothing}>${item.label}</sp-breadcrumb-item>`,
                        )}
                    </sp-breadcrumbs>
                </div>
            `,
        );
    }

    get historyNavigationTemplate() {
        return html`
            <div class="history-navigation" aria-label="History navigation">
                <button class="history-nav-button" type="button" aria-label="Back">
                    <sp-icon-chevron-left size="s"></sp-icon-chevron-left>
                </button>
                <button class="history-nav-button" type="button" aria-label="Forward" disabled>
                    <sp-icon-chevron-right size="s"></sp-icon-chevron-right>
                </button>
            </div>
        `;
    }

    render() {
        return html`
            <nav>
                <div class="left-section">
                    <a id="brand" href="#page=welcome">
                        <svg
                            id="logo"
                            aria-label="Adobe"
                            width="32"
                            height="32"
                            viewBox="0 0 32 32"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M26.3349 0.666667H5.66504C2.53633 0.666667 0 3.18733 0 6.29675V25.7033C0 28.8127 2.53633 31.3333 5.66504 31.3333H26.3349C29.4637 31.3333 32 28.8127 32 25.7033V6.29675C32 3.18733 29.4637 0.666667 26.3349 0.666667Z"
                                fill="#EB1000"
                            />
                            <path
                                d="M24.7188 23.9036H20.9785C20.6313 23.9036 20.3349 23.7067 20.2113 23.4121L16.1731 14.0141C16.1 13.8439 15.9049 13.8424 15.8304 14.0097L13.2999 20.2949C13.2403 20.4355 13.3441 20.5908 13.4976 20.5908H16.2791C16.4513 20.5908 16.6069 20.6932 16.6741 20.8508L17.8696 23.2123C18.0097 23.5409 17.7669 23.9036 17.4095 23.9036H7.28312C6.95989 23.9036 6.73789 23.5839 6.86155 23.264L13.3249 8.02212C13.45 7.70235 13.7719 7.48178 14.1427 7.48178H17.8577C18.2287 7.48178 18.5519 7.70235 18.6756 8.02212L25.1389 23.264C25.2625 23.5839 25.0407 23.9036 24.7188 23.9036L24.7188 23.9036Z"
                                fill="white"
                            />
                        </svg>
                        <span id="mas-studio">Merch At Scale Studio</span>
                        ${this.environmentIndicator}
                    </a>
                    ${this.historyNavigationTemplate} ${this.breadcrumbsTemplate}
                </div>

                <div class="spacer"></div>

                <div class="right-section">
                    ${this.shouldShowPickers
                        ? html`
                              <mas-nav-folder-picker
                                  ?disabled=${this.isFragmentEditorPage ||
                                  this.isTranslationEditorPage ||
                                  this.isSettingsEditorPage}
                              ></mas-nav-folder-picker>
                              <mas-locale-picker
                                  displayMode="strong"
                                  @locale-changed=${this.onLocaleChanged}
                                  ?disabled=${this.isLocalePickerDisabled}
                                  surface=${Store.surface()}
                                  locale=${this.topNavLocale}
                              ></mas-locale-picker>
                              <sp-switch
                                  class="landscape-switch"
                                  size="m"
                                  ?checked=${this.isDraftLandscape}
                                  @change=${(e) => {
                                      Store.landscape.set(e.target.checked ? WCS_LANDSCAPE_DRAFT : WCS_LANDSCAPE_PUBLISHED);
                                  }}
                              >
                                  Draft landscape offer
                              </sp-switch>
                              <div class="divider"></div>
                              <div class="universal-elements">
                                  <button class="icon-button" title="Help">
                                      <sp-icon-help size="m"></sp-icon-help>
                                  </button>
                                  <button class="icon-button" title="Notifications">
                                      <sp-icon-bell size="m"></sp-icon-bell>
                                  </button>
                              </div>
                          `
                        : ''}
                    ${until(this.getProfileTemplate())}
                </div>
            </nav>
        `;
    }
}

customElements.define('mas-top-nav', MasTopNav);
