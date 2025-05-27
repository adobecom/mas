import { CSSResultArray, TemplateResult } from '@spectrum-web-components/base';
import { StyledButton } from './StyledButton.js';
import '@spectrum-web-components/icons-ui/icons/sp-icon-cross200.js';
import '@spectrum-web-components/icons-ui/icons/sp-icon-cross300.js';
import '@spectrum-web-components/icons-ui/icons/sp-icon-cross400.js';
import '@spectrum-web-components/icons-ui/icons/sp-icon-cross500.js';
import type { ButtonStatics } from './Button.js';
declare const CloseButton_base: typeof StyledButton & {
    new (...args: any[]): import("@spectrum-web-components/base").SizedElementInterface;
    prototype: import("@spectrum-web-components/base").SizedElementInterface;
};
/**
 * @element sp-close-button
 *
 * @slot - text label of the Close Button
 * @slot icon - The icon to use for Close Button
 */
export declare class CloseButton extends CloseButton_base {
    static get styles(): CSSResultArray;
    /**
     * The visual variant to apply to this button.
     */
    variant: ButtonStatics | '';
    static: 'black' | 'white' | undefined;
    protected get buttonContent(): TemplateResult[];
}
export {};
