import { CSSResultArray, PropertyValues, SpectrumElement, TemplateResult } from '@spectrum-web-components/base';
import type { Placement } from '@floating-ui/dom';
import type { Overlay } from './Overlay.js';
import type { OverlayTriggerInteractions } from './overlay-types';
export type OverlayContentTypes = 'click' | 'hover' | 'longpress';
/**
 * @element overlay-trigger
 *
 * @slot trigger - The content that will trigger the various overlays
 * @slot hover-content - The content that will be displayed on hover
 * @slot click-content - The content that will be displayed on click
 * @slot longpress-content - The content that will be displayed on click
 *
 * @fires sp-opened - Announces that the overlay has been opened
 * @fires sp-closed - Announces that the overlay has been closed
 */
export declare class OverlayTrigger extends SpectrumElement {
    static get styles(): CSSResultArray;
    content: string;
    /**
     * @type {"top" | "top-start" | "top-end" | "right" | "right-start" | "right-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "left-start" | "left-end"}
     * @attr
     */
    placement?: Placement;
    type?: OverlayTriggerInteractions;
    offset: number;
    open?: OverlayContentTypes;
    disabled: boolean;
    receivesFocus: 'true' | 'false' | 'auto';
    private clickContent;
    private clickPlacement?;
    private longpressContent;
    private longpressPlacement?;
    private hoverContent;
    private hoverPlacement?;
    private targetContent;
    clickOverlayElement: Overlay;
    longpressOverlayElement: Overlay;
    hoverOverlayElement: Overlay;
    private getAssignedElementsFromSlot;
    private handleTriggerContent;
    private handleSlotContent;
    private handleBeforetoggle;
    protected update(changes: PropertyValues): void;
    protected renderSlot(name: string): TemplateResult;
    protected renderClickOverlay(): TemplateResult;
    protected renderHoverOverlay(): TemplateResult;
    protected renderLongpressOverlay(): TemplateResult;
    protected render(): TemplateResult;
    protected updated(changes: PropertyValues): void;
    protected getUpdateComplete(): Promise<boolean>;
}
