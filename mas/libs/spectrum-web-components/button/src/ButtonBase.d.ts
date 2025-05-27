import { CSSResultArray, PropertyValues, TemplateResult } from '@spectrum-web-components/base';
import { Focusable } from '@spectrum-web-components/shared/src/focusable.js';
declare const ButtonBase_base: typeof Focusable & {
    new (...args: any[]): import("@spectrum-web-components/shared/src/like-anchor.js").LikeAnchorInterface;
    prototype: import("@spectrum-web-components/shared/src/like-anchor.js").LikeAnchorInterface;
} & {
    new (...args: any[]): import("@spectrum-web-components/shared/src/observe-slot-text.js").SlotTextObservingInterface;
    prototype: import("@spectrum-web-components/shared/src/observe-slot-text.js").SlotTextObservingInterface;
};
/**
 * @slot - text content to be displayed in the Button element
 * @slot icon - icon element(s) to display at the start of the button
 */
export declare class ButtonBase extends ButtonBase_base {
    static get styles(): CSSResultArray;
    active: boolean;
    type: 'button' | 'submit' | 'reset';
    private anchorElement;
    get focusElement(): HTMLElement;
    protected get hasLabel(): boolean;
    protected get buttonContent(): TemplateResult[];
    constructor();
    click(): void;
    private handleClickCapture;
    private proxyFocus;
    private shouldProxyClick;
    renderAnchor(): TemplateResult;
    protected renderButton(): TemplateResult;
    protected render(): TemplateResult;
    protected handleKeydown(event: KeyboardEvent): void;
    private handleKeypress;
    protected handleKeyup(event: KeyboardEvent): void;
    private manageAnchor;
    protected firstUpdated(changed: PropertyValues): void;
    protected updated(changed: PropertyValues): void;
}
export {};
