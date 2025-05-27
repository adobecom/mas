import { CSSResultArray, PropertyValues, TemplateResult } from '@spectrum-web-components/base';
import '@spectrum-web-components/icons-ui/icons/sp-icon-checkmark100.js';
import { Focusable } from '@spectrum-web-components/shared/src/focusable.js';
import '@spectrum-web-components/icons-ui/icons/sp-icon-chevron100.js';
import type { Menu } from './Menu.js';
import type { Overlay } from '@spectrum-web-components/overlay';
type MenuCascadeItem = {
    hadFocusRoot: boolean;
    ancestorWithSelects?: HTMLElement;
};
export declare class MenuItemAddedOrUpdatedEvent extends Event {
    constructor(item: MenuItem);
    clear(item: MenuItem): void;
    menuCascade: WeakMap<HTMLElement, MenuCascadeItem>;
    get item(): MenuItem;
    private _item;
    currentAncestorWithSelects?: Menu;
}
export type MenuItemChildren = {
    icon: Element[];
    content: Node[];
};
declare const MenuItem_base: typeof Focusable & {
    new (...args: any[]): import("@spectrum-web-components/shared").SlotPresenceObservingInterface;
    prototype: import("@spectrum-web-components/shared").SlotPresenceObservingInterface;
} & {
    new (...args: any[]): import("@spectrum-web-components/shared").SlotTextObservingInterface;
    prototype: import("@spectrum-web-components/shared").SlotTextObservingInterface;
} & {
    new (...args: any[]): import("@spectrum-web-components/shared").LikeAnchorInterface;
    prototype: import("@spectrum-web-components/shared").LikeAnchorInterface;
};
/**
 * @element sp-menu-item
 *
 * @slot - text content to display within the Menu Item
 * @slot description - description to be placed below the label of the Menu Item
 * @slot icon - icon element to be placed at the start of the Menu Item
 * @slot value - content placed at the end of the Menu Item like values, keyboard shortcuts, etc.
 * @slot submenu - content placed in a submenu
 * @fires sp-menu-item-added - announces the item has been added so a parent menu can take ownerships
 */
export declare class MenuItem extends MenuItem_base {
    static get styles(): CSSResultArray;
    abortControllerSubmenu: AbortController;
    active: boolean;
    private dependencyManager;
    focused: boolean;
    selected: boolean;
    get value(): string;
    set value(value: string);
    private _value;
    /**
     * @private
     */
    get itemText(): string;
    hasSubmenu: boolean;
    contentSlot: HTMLSlotElement;
    iconSlot: HTMLSlotElement;
    noWrap: boolean;
    private anchorElement;
    overlayElement: Overlay;
    private submenuElement?;
    get focusElement(): HTMLElement;
    protected get hasIcon(): boolean;
    get itemChildren(): MenuItemChildren;
    private _itemChildren?;
    constructor();
    open: boolean;
    click(): void;
    private handleClickCapture;
    private handleSlottableRequest;
    private proxyFocus;
    private shouldProxyClick;
    protected breakItemChildrenCache(): void;
    protected renderSubmenu(): TemplateResult;
    protected render(): TemplateResult;
    protected manageSubmenu(event: Event & {
        target: HTMLSlotElement;
    }): void;
    private handlePointerdown;
    protected firstUpdated(changes: PropertyValues): void;
    protected closeOverlaysForRoot(): void;
    protected handleSubmenuClick(event: Event): void;
    protected handleSubmenuFocus(): void;
    protected handleBeforetoggle: (event: Event) => void;
    protected handlePointerenter(): void;
    protected leaveTimeout?: ReturnType<typeof setTimeout>;
    protected recentlyLeftChild: boolean;
    protected handlePointerleave(): void;
    /**
     * When there is a `change` event in the submenu for this item
     * then we "click" this item to cascade the selection up the
     * menu tree allowing all submenus between the initial selection
     * and the root of the tree to have their selection changes and
     * be closed.
     */
    protected handleSubmenuChange(event: Event): void;
    protected handleSubmenuPointerenter(): void;
    protected handleSubmenuPointerleave(): Promise<void>;
    protected handleSubmenuOpen(event: Event): void;
    protected cleanup(): void;
    openOverlay(): Promise<void>;
    updateAriaSelected(): void;
    setRole(role: string): void;
    protected updated(changes: PropertyValues<this>): void;
    connectedCallback(): void;
    _parentElement: HTMLElement;
    disconnectedCallback(): void;
    private willDispatchUpdate;
    triggerUpdate(): Promise<void>;
    dispatchUpdate(): void;
    menuData: {
        focusRoot?: Menu;
        parentMenu?: Menu;
        selectionRoot?: Menu;
        cleanupSteps: ((item: MenuItem) => void)[];
    };
}
declare global {
    interface GlobalEventHandlersEventMap {
        'sp-menu-item-added-or-updated': MenuItemAddedOrUpdatedEvent;
    }
}
export {};
