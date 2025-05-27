"use strict";var u=Object.defineProperty;var h=Object.getOwnPropertyDescriptor;var l=(r,i,e,o)=>{for(var t=o>1?void 0:o?h(i,e):i,n=r.length-1,a;n>=0;n--)(a=r[n])&&(t=(o?a(i,e,t):a(t))||t);return o&&t&&u(i,e,t),t};import{html as s}from"@spectrum-web-components/base";import{state as b}from"@spectrum-web-components/base/src/decorators.js";import{ifDefined as d}from"@spectrum-web-components/base/src/directives.js";import{property as p}from"@spectrum-web-components/base/src/decorators.js";import{DESCRIPTION_ID as c,PickerBase as m}from"@spectrum-web-components/picker";import"@spectrum-web-components/action-button/sp-action-button.js";import{ObserveSlotPresence as f}from"@spectrum-web-components/shared/src/observe-slot-presence.js";import{ObserveSlotText as $}from"@spectrum-web-components/shared/src/observe-slot-text.js";import"@spectrum-web-components/icons-workflow/icons/sp-icon-more.js";import v from"./action-menu.css.js";import{SlottableRequestEvent as y}from"@spectrum-web-components/overlay/src/slottable-request-event.js";export class ActionMenu extends f($(m,"label"),'[slot="label-only"]'){constructor(){super(...arguments);this.selects=void 0;this.static=void 0;this.listRole="menu";this.itemRole="menuitem";this.handleSlottableRequest=e=>{this.dispatchEvent(new y(e.name,e.data))}}static get styles(){return[v]}get hasLabel(){return this.slotHasContent}get labelOnly(){return this.slotContentIsPresent}get buttonContent(){return[s`
                ${this.labelOnly?s``:s`
                          <slot
                              name="icon"
                              slot="icon"
                              ?icon-only=${!this.hasLabel}
                              ?hidden=${this.labelOnly}
                          >
                              <sp-icon-more class="icon"></sp-icon-more>
                          </slot>
                      `}
                <slot name="label" ?hidden=${!this.hasLabel}></slot>
                <slot name="label-only"></slot>
                <slot
                    name="tooltip"
                    @slotchange=${this.handleTooltipSlotchange}
                ></slot>
            `]}render(){return this.tooltipEl&&(this.tooltipEl.disabled=this.open),s`
            <sp-action-button
                aria-describedby=${c}
                ?quiet=${this.quiet}
                ?selected=${this.open}
                static=${d(this.static)}
                aria-haspopup="true"
                aria-controls=${d(this.open?"menu":void 0)}
                aria-expanded=${this.open?"true":"false"}
                aria-label=${d(this.label||void 0)}
                id="button"
                class="button"
                size=${this.size}
                @blur=${this.handleButtonBlur}
                @focus=${this.handleButtonFocus}
                @keydown=${{handleEvent:this.handleEnterKeydown,capture:!0}}
                ?disabled=${this.disabled}
            >
                ${this.buttonContent}
            </sp-action-button>
            ${this.renderMenu} ${this.renderDescriptionSlot}
        `}update(e){e.has("invalid")&&(this.invalid=!1),super.update(e)}}l([p({type:String})],ActionMenu.prototype,"selects",2),l([p({type:String,reflect:!0})],ActionMenu.prototype,"static",2),l([b()],ActionMenu.prototype,"labelOnly",1);
//# sourceMappingURL=ActionMenu.js.map
