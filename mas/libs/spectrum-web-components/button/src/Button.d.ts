import { CSSResultArray, PropertyValues, TemplateResult } from '@spectrum-web-components/base';
import { ButtonBase } from './ButtonBase.js';
export type DeprecatedButtonVariants = 'cta' | 'overBackground';
export type ButtonStatics = 'white' | 'black';
export type ButtonVariants = 'accent' | 'primary' | 'secondary' | 'negative' | ButtonStatics | DeprecatedButtonVariants;
export declare const VALID_VARIANTS: string[];
export declare const VALID_STATICS: string[];
export type ButtonTreatments = 'fill' | 'outline';
declare const Button_base: typeof ButtonBase & {
    new (...args: any[]): import("@spectrum-web-components/base").SizedElementInterface;
    prototype: import("@spectrum-web-components/base").SizedElementInterface;
};
/**
 * @element sp-button
 *
 * @slot - text label of the Button
 * @slot icon - The icon to use for Button
 */
export declare class Button extends Button_base {
    static get styles(): CSSResultArray;
    pendingLabel: string;
    pending: boolean;
    private cachedAriaLabel;
    click(): void;
    /**
     * The visual variant to apply to this button.
     */
    get variant(): ButtonVariants;
    set variant(variant: ButtonVariants);
    private _variant;
    static: 'black' | 'white' | undefined;
    /**
     * The visual variant to apply to this button.
     */
    treatment: ButtonTreatments;
    /**
     * Style this button to be less obvious
     */
    set quiet(quiet: boolean);
    get quiet(): boolean;
    protected firstUpdated(changes: PropertyValues<this>): void;
    protected updated(changed: PropertyValues): void;
    protected renderButton(): TemplateResult;
}
export {};
