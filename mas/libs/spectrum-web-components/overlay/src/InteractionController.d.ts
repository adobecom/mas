import type { ReactiveController } from '@spectrum-web-components/base';
import { AbstractOverlay } from './AbstractOverlay.js';
export declare enum InteractionTypes {
    'click' = 0,
    'hover' = 1,
    'longpress' = 2
}
export type ControllerOptions = {
    overlay?: AbstractOverlay;
    handleOverlayReady?: (overlay: AbstractOverlay) => void;
    isPersistent?: boolean;
};
export declare class InteractionController implements ReactiveController {
    target: HTMLElement;
    abortController: AbortController;
    get activelyOpening(): boolean;
    private handleOverlayReady?;
    private isLazilyOpen;
    get open(): boolean;
    /**
     * Set `open` against the associated Overlay lazily.
     */
    set open(open: boolean);
    get overlay(): AbstractOverlay;
    set overlay(overlay: AbstractOverlay | undefined);
    private _overlay;
    protected isPersistent: boolean;
    type: InteractionTypes;
    constructor(target: HTMLElement, { overlay, isPersistent, handleOverlayReady }: ControllerOptions);
    prepareDescription(_: HTMLElement): void;
    releaseDescription(): void;
    shouldCompleteOpen(): void;
    init(): void;
    initOverlay(): void;
    abort(): void;
    hostConnected(): void;
    hostDisconnected(): void;
}
