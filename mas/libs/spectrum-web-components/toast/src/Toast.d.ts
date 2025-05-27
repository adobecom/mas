import { CSSResultArray, PropertyValues, SpectrumElement, TemplateResult } from '@spectrum-web-components/base';
import '@spectrum-web-components/button/sp-close-button.js';
import '@spectrum-web-components/icons-workflow/icons/sp-icon-alert.js';
import '@spectrum-web-components/icons-workflow/icons/sp-icon-info.js';
import '@spectrum-web-components/icons-workflow/icons/sp-icon-checkmark-circle.js';
export declare const toastVariants: ToastVariants[];
export type ToastVariants = 'negative' | 'positive' | 'info' | 'error' | 'warning' | '';
declare const Toast_base: typeof SpectrumElement;
/**
 * @element sp-toast
 *
 * @slot - The toast content
 * @slot action - button element surfacing an action in the Toast
 *
 * @fires close - Announces that the Toast has been closed by the user or by its timeout.
 */
export declare class Toast extends Toast_base {
    static get styles(): CSSResultArray;
    open: boolean;
    /**
     * When a timeout is provided it represents the number of milliseconds from when
     * the Toast was placed on the page before it will automatically dismiss itself.
     * Accessibility concerns require that a Toast is available for at least 6000ms
     * before being dismissed, so any timeout of less than 6000ms will be raised to
     * that baseline. It is suggested that messages longer than 120 words should
     * receive another 1000ms in their timeout for each additional 120 words in the
     * message. E.G. 240 words = 7000ms, 360 words = 8000ms, etc.
     *
     * @param {Number} timeout
     */
    set timeout(timeout: number | null);
    get timeout(): number | null;
    _timeout: number | null;
    /**
     * The variant applies specific styling when set to `negative`, `positive`, `info`, `error`, or `warning`.
     * `variant` attribute is removed when not matching one of the above.
     *
     * @param {String} variant
     */
    set variant(variant: ToastVariants);
    get variant(): ToastVariants;
    private _variant;
    private renderIcon;
    private countdownStart;
    private nextCount;
    private doCountdown;
    private countdown;
    private holdCountdown;
    private resumeCountdown;
    private startCountdown;
    private stopCountdown;
    private shouldClose;
    close(): void;
    protected render(): TemplateResult;
    protected updated(changes: PropertyValues): void;
}
export {};
