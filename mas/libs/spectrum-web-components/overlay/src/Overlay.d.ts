import { PropertyValues, TemplateResult } from '@spectrum-web-components/base';
import { ElementResolutionController } from '@spectrum-web-components/reactive-controllers/src/ElementResolution.js';
import type { OpenableElement, OverlayState, OverlayTypes, Placement, TriggerInteraction } from './overlay-types.js';
import { AbstractOverlay } from './AbstractOverlay.js';
import { VirtualTrigger } from './VirtualTrigger.js';
import { PlacementController } from './PlacementController.js';
import type { ClickController } from './ClickController.js';
import type { HoverController } from './HoverController.js';
import type { LongpressController } from './LongpressController.js';
export { LONGPRESS_INSTRUCTIONS } from './LongpressController.js';
declare let OverlayFeatures: typeof AbstractOverlay & import("./overlay-types.js").Constructor<import("@spectrum-web-components/base").SpectrumElement>;
/**
 * @element sp-overlay
 *
 * @fires sp-opened - announces that an overlay has completed any entry animations
 * @fires sp-closed - announce that an overlay has compelted any exit animations
 * @fires slottable-request - requests to add or remove slottable content
 */
export declare class Overlay extends OverlayFeatures {
    static styles: import("@spectrum-web-components/base").CSSResult[];
    /**
     * An Overlay that is `delayed` will wait until a warm-up period of 1000ms
     * has completed before opening. Once the warmup period has completed, all
     * subsequent Overlays will open immediately. When no Overlays are opened,
     * a cooldown period of 1000ms will begin. Once the cooldown has completed,
     * the next Overlay to be opened will be subject to the warm-up period if
     * provided that option.
     */
    get delayed(): boolean;
    set delayed(delayed: boolean);
    private _delayed;
    dialogEl: HTMLDialogElement & {
        showPopover(): void;
        hidePopover(): void;
    };
    /**
     * Whether the overlay is currently functional or not
     */
    get disabled(): boolean;
    set disabled(disabled: boolean);
    private _disabled;
    elements: OpenableElement[];
    parentOverlayToForceClose?: Overlay;
    private get hasNonVirtualTrigger();
    /**
     * The `offset` property accepts either a single number, to
     * define the offset of the Overlay along the main axis from
     * the trigger, or 2-tuple, to define the offset along the
     * main axis and the cross axis. This option has no effect
     * when there is no trigger element.
     */
    offset: number | [number, number];
    protected get placementController(): PlacementController;
    /**
     * Whether the Overlay is projected onto the "top layer" or not.
     */
    get open(): boolean;
    set open(open: boolean);
    private _open;
    static openCount: number;
    /**
     * Instruct the Overlay where to place itself in
     * relationship to the trigger element.
     * @type {"top" | "top-start" | "top-end" | "right" | "right-start" | "right-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "left-start" | "left-end"}
     */
    placement?: Placement;
    /**
     * The state in which the last `request-slottable` event was dispatched.
     * Do not allow overlays from dispatching the same state twice in a row.
     */
    private lastRequestSlottableState;
    /**
     * Whether to pass focus to the overlay once opened, or
     * to the appropriate value based on the "type" of the overlay
     * when set to `"auto"`.
     *
     */
    receivesFocus: 'true' | 'false' | 'auto';
    slotEl: HTMLSlotElement;
    get state(): OverlayState;
    set state(state: OverlayState);
    _state: OverlayState;
    strategy?: ClickController | HoverController | LongpressController;
    tipPadding?: number;
    /**
     * An optional ID reference for the trigger element combined with the optional
     * interaction (click | hover | longpress) by which the overlay shold open
     * the overlay with an `@`: e.g. `trigger@click` opens the overlay when an
     * element with the ID "trigger" is clicked.
     */
    trigger?: string;
    /**
     * An element reference for the trigger element that the overlay should relate to.
     */
    triggerElement: HTMLElement | VirtualTrigger | null;
    /**
     * The specific interaction to listen for on the `triggerElement` to open the overlay.
     */
    triggerInteraction?: TriggerInteraction;
    /**
     * Configures the open/close heuristics of the Overlay.
     * @type {"auto" | "hint" | "manual" | "modal" | "page"}
     */
    type: OverlayTypes;
    protected wasOpen: boolean;
    protected get elementResolver(): ElementResolutionController;
    private get usesDialog();
    private get popoverValue();
    protected get requiresPosition(): boolean;
    protected managePosition(): void;
    protected managePopoverOpen(): Promise<void>;
    protected applyFocus(targetOpenState: boolean, focusEl: HTMLElement | null): Promise<void>;
    protected returnFocus(): void;
    private closeOnFocusOut;
    protected manageOpen(oldOpen: boolean): Promise<void>;
    protected bindEvents(): void;
    protected handleBeforetoggle(event: Event & {
        newState: string;
    }): void;
    protected handleBrowserClose(): void;
    manuallyKeepOpen(): void;
    protected handleSlotchange(): void;
    shouldPreventClose(): boolean;
    protected requestSlottable(): void;
    willUpdate(changes: PropertyValues): void;
    protected updated(changes: PropertyValues): void;
    protected renderContent(): TemplateResult;
    private get dialogStyleMap();
    protected renderDialog(): TemplateResult;
    protected renderPopover(): TemplateResult;
    render(): TemplateResult;
    connectedCallback(): void;
    disconnectedCallback(): void;
}
