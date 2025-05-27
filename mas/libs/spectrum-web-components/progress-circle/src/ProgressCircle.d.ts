import { CSSResultArray, PropertyValues, SpectrumElement, TemplateResult } from '@spectrum-web-components/base';
declare const ProgressCircle_base: typeof SpectrumElement & {
    new (...args: any[]): import("@spectrum-web-components/base").SizedElementInterface;
    prototype: import("@spectrum-web-components/base").SizedElementInterface;
};
/**
 * @element sp-progress-circle
 */
export declare class ProgressCircle extends ProgressCircle_base {
    static get styles(): CSSResultArray;
    indeterminate: boolean;
    label: string;
    overBackground: boolean;
    static?: 'white';
    progress: number;
    private slotEl;
    private makeRotation;
    protected willUpdate(changes: PropertyValues<this>): void;
    protected render(): TemplateResult;
    protected handleSlotchange(): void;
    protected firstUpdated(changes: PropertyValues): void;
    protected updated(changes: PropertyValues): void;
}
export {};
