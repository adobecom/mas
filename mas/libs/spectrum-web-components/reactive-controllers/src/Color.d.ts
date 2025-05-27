import type { ReactiveElement } from 'lit';
import { HSL, HSLA, HSV, HSVA, RGB, RGBA, TinyColor } from '@ctrl/tinycolor';
export type { HSL, HSLA, HSV, HSVA, RGB, RGBA, TinyColor };
export type ColorValue = string | number | TinyColor | HSVA | HSV | RGB | RGBA | HSL | HSLA;
export declare const extractHueAndSaturationRegExp: RegExp;
export declare const replaceHueAndSaturationRegExp: RegExp;
export declare const replaceHueRegExp: RegExp;
export declare class ColorController {
    protected host: ReactiveElement;
    protected applyColorToState: ({ h, s, v, }: {
        h: number;
        s: number;
        v: number;
    }) => void;
    protected extractColorFromState: (controller: ColorController) => ColorValue;
    protected setColorProcess(currentColor: TinyColor, nextColor: ColorValue, format: string, isString: boolean): void;
    protected setColorMaintainHue(currentColor: TinyColor, nextColor: ColorValue, format: string, isString: boolean): void;
    protected setColorMaintainSaturation(currentColor: TinyColor, nextColor: ColorValue, format: string, isString: boolean): void;
    protected maintains: 'hue' | 'saturation';
    private saturation;
    constructor(host: ReactiveElement, { applyColorToState, extractColorFromState, maintains, }: {
        applyColorToState({ h, s, v, }: {
            h: number;
            s: number;
            v: number;
        }): void;
        extractColorFromState(controller: ColorController): ColorValue;
        maintains?: 'hue' | 'saturation';
    });
    applyColorFromState(): void;
    get hue(): number;
    set hue(value: number);
    private _hue;
    protected getColorProcesses: Record<string, (color: TinyColor, isString: boolean) => ColorValue>;
    get value(): ColorValue;
    get color(): ColorValue;
    set color(color: ColorValue);
    private _color;
    getColor(format: string): ColorValue;
    setColor(color: TinyColor): void;
    getHslString(): string;
    private _previousColor;
    savePreviousColor(): void;
    restorePreviousColor(): void;
    private _format;
}
