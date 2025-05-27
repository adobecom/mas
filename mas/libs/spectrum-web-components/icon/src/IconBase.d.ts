import { CSSResultArray, PropertyValues, SpectrumElement, TemplateResult } from '@spectrum-web-components/base';
export declare class IconBase extends SpectrumElement {
    static get styles(): CSSResultArray;
    label: string;
    size?: 'xxs' | 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl';
    protected update(changes: PropertyValues): void;
    protected render(): TemplateResult;
}
