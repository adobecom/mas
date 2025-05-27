import type { ReactiveController, ReactiveElement } from '@spectrum-web-components/base';
import { Placement } from '@floating-ui/dom';
import type { VirtualTrigger } from './VirtualTrigger.js';
import type { OpenableElement } from './overlay-types.js';
type OverlayOptionsV1 = {
    abortPromise?: Promise<boolean>;
    delayed?: boolean;
    offset?: number | [number, number];
    placement: Placement;
    notImmediatelyClosable?: boolean;
    receivesFocus?: 'auto';
    root?: HTMLElement;
    tipPadding?: number;
    trigger: HTMLElement | VirtualTrigger;
    type?: 'modal' | 'page' | 'hint' | 'auto' | 'manual';
};
export declare const placementUpdatedSymbol: unique symbol;
export declare class PlacementController implements ReactiveController {
    private cleanup?;
    initialHeight?: number;
    isConstrained?: boolean;
    private host;
    private options;
    private originalPlacements;
    private target;
    constructor(host: ReactiveElement & {
        elements: OpenableElement[];
    });
    placeOverlay(target?: HTMLElement, options?: OverlayOptionsV1): Promise<void>;
    allowPlacementUpdate: boolean;
    closeForAncestorUpdate: () => void;
    updatePlacement: () => void;
    computePlacement(): Promise<void>;
    clearOverlayPosition(): void;
    resetOverlayPosition: () => void;
    hostConnected(): void;
    hostUpdated(): void;
    hostDisconnected(): void;
}
export {};
