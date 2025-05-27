import { CSSResultArray, PropertyValues, TemplateResult } from '@spectrum-web-components/base';
import '@spectrum-web-components/popover/sp-popover.js';
import '@spectrum-web-components/menu/sp-menu.js';
import '@spectrum-web-components/button/sp-button.js';
import { ButtonVariants } from '@spectrum-web-components/button';
import { PickerBase } from '@spectrum-web-components/picker';
import '@spectrum-web-components/icons-ui/icons/sp-icon-chevron100.js';
import '@spectrum-web-components/icons-workflow/icons/sp-icon-more.js';
export type SplitButtonTypes = 'field' | 'more';
declare const SplitButton_base: typeof PickerBase & {
    new (...args: any[]): import("@spectrum-web-components/base").SizedElementInterface;
    prototype: import("@spectrum-web-components/base").SizedElementInterface;
};
/**
 * @element sp-split-button
 *
 * @slot - menu items to be listed in the Button
 * @slot tooltip - Tooltip to to be applied to the the main Button
 **/
export declare class SplitButton extends SplitButton_base {
    static get styles(): CSSResultArray;
    left: boolean;
    /**
     * The visual variant to apply to this button.
     */
    variant: ButtonVariants;
    type: SplitButtonTypes;
    private trigger;
    protected listRole: 'listbox' | 'menu';
    protected itemRole: string;
    button: HTMLButtonElement;
    get focusElement(): HTMLElement;
    private passClick;
    protected get buttonContent(): TemplateResult[];
    protected update(changes: PropertyValues<this>): void;
    protected render(): TemplateResult;
    protected bindButtonKeydownListener(): void;
    protected manageSelection(): Promise<void>;
    private manageSplitButtonItems;
}
export {};
