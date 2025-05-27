import { InteractionController, InteractionTypes } from './InteractionController.js';
export declare class MobileController extends InteractionController {
    type: InteractionTypes;
    handleClick(): void;
    handlePointerdown(): void;
    init(): void;
}
