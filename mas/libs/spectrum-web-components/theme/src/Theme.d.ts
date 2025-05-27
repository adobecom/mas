import { CSSResultGroup } from '@spectrum-web-components/base';
declare global {
    interface Window {
        ShadyCSS: {
            nativeShadow: boolean;
            prepareTemplate(template: HTMLTemplateElement, elementName: string, typeExtension?: string): void;
            styleElement(host: HTMLElement): void;
            ScopingShim: {
                prepareAdoptedCssText(cssTextArray: string[], elementName: string): void;
            };
        };
    }
}
type ShadowRootWithAdoptedStyleSheets = HTMLElement['shadowRoot'] & {
    adoptedStyleSheets?: CSSStyleSheet[];
};
type FragmentType = 'color' | 'scale' | 'system' | 'theme' | 'core' | 'app';
type SettableFragmentTypes = 'color' | 'scale' | 'system' | 'theme';
type FragmentMap = Map<string, {
    name: string;
    styles: CSSResultGroup;
}>;
export type ThemeFragmentMap = Map<FragmentType, FragmentMap>;
export type Color = 'light' | 'lightest' | 'dark' | 'darkest' | 'light-express' | 'lightest-express' | 'dark-express' | 'darkest-express' | 'light-spectrum-two' | 'dark-spectrum-two';
export type ThemeVariant = 'spectrum' | 'express' | 'spectrum-two';
export type SystemVariant = 'spectrum' | 'express' | 'spectrum-two';
export type Scale = 'medium' | 'large' | 'medium-express' | 'large-express' | 'medium-spectrum-two' | 'large-spectrum-two';
type FragmentName = Color | Scale | ThemeVariant | SystemVariant | 'core' | 'app';
export interface ThemeData {
    color?: Color;
    scale?: Scale;
    lang?: string;
    theme?: SystemVariant;
    system?: SystemVariant;
}
type ThemeKindProvider = {
    [P in SettableFragmentTypes]: ThemeVariant | SystemVariant | Color | Scale | '';
};
export interface ProvideLang {
    callback: (lang: string, unsubscribe: () => void) => void;
}
/**
 * @element sp-theme
 * @attr {string} [lang=""] - The language of the content scoped to this `sp-theme` element, see: <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang" target="_blank">MDN reference</a>.
 *
 * @slot - Content on which to apply the CSS Custom Properties defined by the current theme configuration
 */
export declare class Theme extends HTMLElement implements ThemeKindProvider {
    private static themeFragmentsByKind;
    private static defaultFragments;
    private static templateElement?;
    private static instances;
    static VERSION: string;
    static get observedAttributes(): string[];
    _dir: 'ltr' | 'rtl' | '';
    set dir(dir: 'ltr' | 'rtl' | '');
    /**
     * Reading direction of the content scoped to this `sp-theme` element.
     * @type {"ltr" | "rtl" | ""}
     * @attr
     */
    get dir(): 'ltr' | 'rtl' | '';
    protected attributeChangedCallback(attrName: SettableFragmentTypes | 'lang' | 'dir', old: string | null, value: string | null): void;
    private requestUpdate;
    shadowRoot: ShadowRootWithAdoptedStyleSheets;
    private _system;
    /**
     * The Spectrum system that is applied to the content scoped to this `sp-theme` element.
     *
     * A value is requried.
     * @type {"spectrum" | "express" }
     * @attr
     */
    get system(): SystemVariant | '';
    set system(newValue: SystemVariant | '');
    get theme(): SystemVariant | '';
    set theme(newValue: SystemVariant | '');
    private _color;
    /**
     * The Spectrum color stops to apply to content scoped by this `sp-theme` element.
     *
     * A value is requried.
     * @type {"lightest" | "light" | "dark" | "darkest" | ""}
     * @attr
     */
    get color(): Color | '';
    set color(newValue: Color | '');
    private _scale;
    /**
     * The Spectrum platform scale to apply to content scoped by this `sp-theme` element.
     *
     * A value is requried.
     * @type {"medium" | "large" | ""}
     * @attr
     */
    get scale(): Scale | '';
    set scale(newValue: Scale | '');
    private get styles();
    private static get template();
    constructor();
    updateComplete: Promise<boolean>;
    private __resolve;
    private __createDeferredPromise;
    private onQueryTheme;
    protected connectedCallback(): void;
    protected disconnectedCallback(): void;
    startManagingContentDirection(el: HTMLElement): void;
    stopManagingContentDirection(el: HTMLElement): void;
    private trackedChildren;
    private _updateRequested;
    private shouldAdoptStyles;
    protected adoptStyles(): void;
    static registerThemeFragment(name: FragmentName, kind: FragmentType, styles: CSSResultGroup): void;
    private _contextConsumers;
    private _provideContext;
    private _handleContextPresence;
}
export {};
