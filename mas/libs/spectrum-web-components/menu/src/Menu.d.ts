import { CSSResultArray, PropertyValues, SpectrumElement, TemplateResult } from '@spectrum-web-components/base';
import { MenuItem } from './MenuItem.js';
export interface MenuChildItem {
    menuItem: MenuItem;
    managed: boolean;
    active: boolean;
    focusable: boolean;
    focusRoot: Menu;
}
declare const Menu_base: typeof SpectrumElement & {
    new (...args: any[]): import("@spectrum-web-components/base").SizedElementInterface;
    prototype: import("@spectrum-web-components/base").SizedElementInterface;
};
/**
 * Spectrum Menu Component
 * @element sp-menu
 *
 * @slot - menu items to be listed in the menu
 * @fires change - Announces that the `value` of the element has changed
 * @attr selects - whether the element has a specific selection algorithm that it applies
 *   to its item descendants. `single` allows only one descendent to be selected at a time.
 *   `multiple` allows many descendants to be selected. `inherit` will be applied dynamically
 *   when an ancestor of this element is actively managing the selection of its descendents.
 *   When the `selects` attribute is not present a `value` will not be maintained and the Menu
 *   Item children of this Menu will not have their `selected` state managed.
 */
export declare class Menu extends Menu_base {
    static get styles(): CSSResultArray;
    private get isSubmenu();
    label: string;
    ignore: boolean;
    selects: undefined | 'inherit' | 'single' | 'multiple';
    value: string;
    valueSeparator: string;
    get selected(): string[];
    set selected(selected: string[]);
    protected _selected: string[];
    selectedItems: MenuItem[];
    menuSlot: HTMLSlotElement;
    private childItemSet;
    focusedItemIndex: number;
    focusInItemIndex: number;
    private selectedItemsMap;
    get childItems(): MenuItem[];
    private cachedChildItems;
    private updateCachedMenuItems;
    /**
     * Hide this getter from web-component-analyzer until
     * https://github.com/runem/web-component-analyzer/issues/131
     * has been addressed.
     *
     * @private
     */
    get childRole(): string;
    protected get ownRole(): string;
    private resolvedSelects?;
    private resolvedRole?;
    /**
     * When a descendant `<sp-menu-item>` element is added or updated it will dispatch
     * this event to announce its presence in the DOM. During the CAPTURE phase the first
     * Menu based element that the event encounters will manage the focus state of the
     * dispatching `<sp-menu-item>` element.
     * @param event
     */
    private onFocusableItemAddedOrUpdated;
    /**
     * When a descendant `<sp-menu-item>` element is added or updated it will dispatch
     * this event to announce its presence in the DOM. During the BUBBLE phase the first
     * Menu based element that the event encounters that does not inherit selection will
     * manage the selection state of the dispatching `<sp-menu-item>` element.
     * @param event
     */
    private onSelectableItemAddedOrUpdated;
    private addChildItem;
    private removeChildItem;
    constructor();
    focus({ preventScroll }?: FocusOptions): void;
    private pointerUpTarget;
    private handleClick;
    private handlePointerup;
    private handlePointerBasedSelection;
    handleFocusin(event: FocusEvent): void;
    startListeningToKeyboard(): void;
    handleBlur(event: FocusEvent): void;
    stopListeningToKeyboard(): void;
    private descendentOverlays;
    protected handleDescendentOverlayOpened(event: Event): void;
    protected handleDescendentOverlayClosed(event: Event): void;
    handleSubmenuClosed: (event: Event) => void;
    handleSubmenuOpened: (event: Event) => void;
    selectOrToggleItem(targetItem: MenuItem): Promise<void>;
    protected navigateWithinMenu(event: KeyboardEvent): void;
    protected navigateBetweenRelatedMenus(event: KeyboardEvent): void;
    handleKeydown(event: KeyboardEvent): void;
    focusMenuItemByOffset(offset: number): MenuItem;
    private prepareToCleanUp;
    private _hasUpdatedSelectedItemIndex;
    updateSelectedItemIndex(): void;
    private _willUpdateItems;
    private handleItemsChanged;
    private updateCache;
    private updateItemFocus;
    closeDescendentOverlays(): void;
    private forwardFocusVisibleToItem;
    private handleSlotchange;
    protected renderMenuItemSlot(): TemplateResult;
    render(): TemplateResult;
    protected firstUpdated(changed: PropertyValues): void;
    protected updated(changes: PropertyValues<this>): void;
    protected selectsChanged(): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
    protected childItemsUpdated: Promise<unknown[]>;
    protected cacheUpdated: Promise<void>;
    protected resolveCacheUpdated: () => void;
    protected getUpdateComplete(): Promise<boolean>;
}
export {};
