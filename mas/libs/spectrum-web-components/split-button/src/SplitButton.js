"use strict";var m=Object.defineProperty;var p=Object.getOwnPropertyDescriptor;var s=(o,r,e,i)=>{for(var t=i>1?void 0:i?p(r,e):r,a=o.length-1,l;a>=0;a--)(l=o[a])&&(t=(i?l(r,e,t):l(t))||t);return i&&t&&m(r,e,t),t};import{html as n,SizedMixin as h}from"@spectrum-web-components/base";import{property as u,query as d}from"@spectrum-web-components/base/src/decorators.js";import{ifDefined as c}from"@spectrum-web-components/base/src/directives.js";import"@spectrum-web-components/popover/sp-popover.js";import"@spectrum-web-components/menu/sp-menu.js";import"@spectrum-web-components/button/sp-button.js";import{PickerBase as v}from"@spectrum-web-components/picker";import"@spectrum-web-components/icons-ui/icons/sp-icon-chevron100.js";import"@spectrum-web-components/icons-workflow/icons/sp-icon-more.js";import f from"@spectrum-web-components/icon/src/spectrum-icon-chevron.css.js";import b from"./split-button.css.js";const y={s:"spectrum-UIIcon-ChevronDown75",m:"spectrum-UIIcon-ChevronDown100",l:"spectrum-UIIcon-ChevronDown200",xl:"spectrum-UIIcon-ChevronDown300"};export class SplitButton extends h(v){constructor(){super(...arguments);this.left=!1;this.variant="accent";this.type="field";this.listRole="menu";this.itemRole="menuitem"}static get styles(){return[b,f]}get focusElement(){return this.open?this.optionsMenu:this.left?this.trigger:this.button}passClick(){const e=this.type==="more"?this.menuItems[0]:this.selectedItem||this.menuItems[0];e&&e.click()}get buttonContent(){var e;return[n`
                <div
                    id="label"
                    role="presentation"
                    class=${c(this.value?void 0:"placeholder")}
                >
                    ${((e=this.selectedItem)==null?void 0:e.itemText)||""}
                </div>
                <slot name="tooltip"></slot>
            `]}update(e){e.has("type")&&(this.type==="more"?this.selects=void 0:this.selects="single"),super.update(e)}render(){var t;const e=["cta","accent"].includes(this.variant)?"fill":"outline",i=[n`
                <sp-button
                    aria-label=${c(this.label||((t=this.selectedItem)==null?void 0:t.itemText)||void 0)}
                    id="button"
                    class="button ${this.variant}"
                    @click=${this.passClick}
                    ?disabled=${this.disabled}
                    variant=${this.variant}
                    treatment=${e}
                    size=${this.size}
                >
                    ${this.buttonContent}
                </sp-button>
            `,n`
                <sp-button
                    aria-haspopup="true"
                    aria-expanded=${this.open?"true":"false"}
                    aria-controls=${c(this.open?"menu":void 0)}
                    class="button trigger ${this.variant}"
                    @blur=${this.handleButtonBlur}
                    @focus=${this.handleButtonFocus}
                    @keydown=${{handleEvent:this.handleEnterKeydown,capture:!0}}
                    ?disabled=${this.disabled}
                    aria-labelledby="button"
                    variant=${this.variant}
                    treatment=${e}
                    size=${this.size}
                >
                    ${this.type==="field"?n`
                              <sp-icon-chevron100
                                  class="icon ${y[this.size]}"
                                  slot="icon"
                              ></sp-icon-chevron100>
                          `:n`
                              <sp-icon-more
                                  class="icon"
                                  slot="icon"
                              ></sp-icon-more>
                          `}
                </sp-button>
            `];return this.left&&i.reverse(),n`
            ${i} ${this.renderMenu}
        `}bindButtonKeydownListener(){this.trigger.addEventListener("keydown",this.handleKeydown)}async manageSelection(){await this.manageSplitButtonItems(),await super.manageSelection()}async manageSplitButtonItems(){!this.menuItems.length&&(await this.optionsMenu.updateComplete,!this.menuItems.length)||(this.type==="more"?(this.menuItems[0].hidden=!0,this.menuItems.forEach(e=>e.selected=!1),this.selectedItem=this.menuItems[0]):this.selectedItem=this.selectedItem||this.menuItems[0],this.value=this.selectedItem.value)}}s([u({type:Boolean,reflect:!0})],SplitButton.prototype,"left",2),s([u({reflect:!0})],SplitButton.prototype,"variant",2),s([u({type:String})],SplitButton.prototype,"type",2),s([d(".trigger")],SplitButton.prototype,"trigger",2),s([d(".trigger")],SplitButton.prototype,"button",2);
//# sourceMappingURL=SplitButton.js.map
