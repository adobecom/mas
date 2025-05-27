import { CSSResultArray, PropertyValues, TemplateResult } from '@spectrum-web-components/base';
import { StyleInfo } from '@spectrum-web-components/base/src/directives.js';
import { Focusable } from '@spectrum-web-components/shared/src/focusable.js';
import type { Tooltip } from '@spectrum-web-components/tooltip';
import '@spectrum-web-components/icons-ui/icons/sp-icon-chevron100.js';
import '@spectrum-web-components/icons-workflow/icons/sp-icon-alert.js';
import '@spectrum-web-components/menu/sp-menu.js';
import type { Menu, MenuItem, MenuItemChildren } from '@spectrum-web-components/menu';
import { Placement } from '@spectrum-web-components/overlay';
import { MatchMediaController } from '@spectrum-web-components/reactive-controllers/src/MatchMedia.js';
import { DependencyManagerController } from '@spectrum-web-components/reactive-controllers/src/DependencyManger.js';
import { Overlay } from '@spectrum-web-components/overlay/src/Overlay.js';
import type { SlottableRequestEvent } from '@spectrum-web-components/overlay/src/slottable-request-event.js';
import type { FieldLabel } from '@spectrum-web-components/field-label';
import { DesktopController } from './DesktopController.js';
import { MobileController } from './MobileController.js';
export declare const DESCRIPTION_ID = "option-picker";
declare const PickerBase_base: typeof Focusable & {
    new (...args: any[]): import("@spectrum-web-components/base").SizedElementInterface;
    prototype: import("@spectrum-web-components/base").SizedElementInterface;
};
export declare class PickerBase extends PickerBase_base {
    isMobile: MatchMediaController;
    strategy: DesktopController | MobileController;
    appliedLabel?: string;
    button: HTMLButtonElement;
    dependencyManager: DependencyManagerController;
    private deprecatedMenu;
    disabled: boolean;
    focused: boolean;
    icons?: 'only' | 'none';
    invalid: boolean;
    /** Whether the items are currently loading. */
    pending: boolean;
    /** Defines a string value that labels the Picker while it is in pending state. */
    pendingLabel: string;
    label?: string;
    open: boolean;
    readonly: boolean;
    selects: undefined | 'single';
    labelAlignment?: 'inline';
    protected get menuItems(): MenuItem[];
    optionsMenu: Menu;
    private _selfManageFocusElement;
    get selfManageFocusElement(): boolean;
    overlayElement: Overlay;
    protected tooltipEl?: Tooltip;
    /**
     * @type {"top" | "top-start" | "top-end" | "right" | "right-start" | "right-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "left-start" | "left-end"}
     * @attr
     */
    placement: Placement;
    quiet: boolean;
    value: string;
    get selectedItem(): MenuItem | undefined;
    set selectedItem(selectedItem: MenuItem | undefined);
    _selectedItem?: MenuItem;
    protected listRole: 'listbox' | 'menu';
    protected itemRole: string;
    get focusElement(): HTMLElement;
    forceFocusVisible(): void;
    click(): void;
    handleButtonBlur(): void;
    focus(options?: FocusOptions): void;
    handleHelperFocus(): void;
    handleChange(event: Event): void;
    handleButtonFocus(event: FocusEvent): void;
    protected handleKeydown: (event: KeyboardEvent) => void;
    protected setValueFromItem(item: MenuItem, menuChangeEvent?: Event): Promise<void>;
    protected setMenuItemSelected(item: MenuItem, value: boolean): void;
    toggle(target?: boolean): void;
    close(): void;
    protected get containerStyles(): StyleInfo;
    protected get selectedItemContent(): MenuItemChildren;
    protected set selectedItemContent(selectedItemContent: MenuItemChildren | undefined);
    _selectedItemContent?: MenuItemChildren;
    protected handleTooltipSlotchange(event: Event & {
        target: HTMLSlotElement;
    }): void;
    handleSlottableRequest: (_event: SlottableRequestEvent) => void;
    protected renderLabelContent(content: Node[]): TemplateResult | Node[];
    protected get buttonContent(): TemplateResult[];
    applyFocusElementLabel: (value: string, labelElement: FieldLabel) => void;
    protected renderOverlay(menu: TemplateResult): TemplateResult;
    protected get renderDescriptionSlot(): TemplateResult;
    protected render(): TemplateResult;
    protected update(changes: PropertyValues<this>): void;
    protected bindButtonKeydownListener(): void;
    protected updated(changes: PropertyValues<this>): void;
    protected firstUpdated(changes: PropertyValues<this>): void;
    protected get dismissHelper(): TemplateResult;
    protected renderContainer(menu: TemplateResult): TemplateResult;
    protected hasRenderedOverlay: boolean;
    protected get renderMenu(): TemplateResult;
    private willManageSelection;
    protected shouldScheduleManageSelection(event?: Event): void;
    protected shouldManageSelection(): void;
    protected manageSelection(): Promise<void>;
    private selectionPromise;
    private selectionResolver;
    protected getUpdateComplete(): Promise<boolean>;
    private recentlyConnected;
    private enterKeydownOn;
    protected handleEnterKeydown: (event: KeyboardEvent) => void;
    bindEvents(): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
}
/**
 * @element sp-picker
 *
 * @slot label - The placeholder content for the Picker
 * @slot description - The description content for the Picker
 * @slot tooltip - Tooltip to to be applied to the the Picker Button
 * @slot - menu items to be listed in the Picker
 * @fires change - Announces that the `value` of the element has changed
 * @fires sp-opened - Announces that the overlay has been opened
 * @fires sp-closed - Announces that the overlay has been closed
 */
export declare class Picker extends PickerBase {
    static get styles(): CSSResultArray;
    protected get containerStyles(): StyleInfo;
    protected handleKeydown: (event: KeyboardEvent) => void;
}
export {};
