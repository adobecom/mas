"use strict";var f=Object.defineProperty;var y=Object.getOwnPropertyDescriptor;var i=(d,a,e,t)=>{for(var s=t>1?void 0:t?y(a,e):a,n=d.length-1,l;n>=0;n--)(l=d[n])&&(s=(t?l(a,e,s):l(s))||s);return t&&s&&f(a,e,s),s};import{html as o,nothing as v,render as g,SizedMixin as w}from"@spectrum-web-components/base";import{classMap as I,ifDefined as p,styleMap as m,when as M}from"@spectrum-web-components/base/src/directives.js";import{property as r,query as u,state as c}from"@spectrum-web-components/base/src/decorators.js";import S from"./picker.css.js";import C from"@spectrum-web-components/icon/src/spectrum-icon-chevron.css.js";import{Focusable as $}from"@spectrum-web-components/shared/src/focusable.js";import"@spectrum-web-components/icons-ui/icons/sp-icon-chevron100.js";import"@spectrum-web-components/icons-workflow/icons/sp-icon-alert.js";import"@spectrum-web-components/menu/sp-menu.js";import{IS_MOBILE as E,MatchMediaController as R}from"@spectrum-web-components/reactive-controllers/src/MatchMedia.js";import{DependencyManagerController as D}from"@spectrum-web-components/reactive-controllers/src/DependencyManger.js";import{strategies as b}from"./strategies.js";const T={s:"spectrum-UIIcon-ChevronDown75",m:"spectrum-UIIcon-ChevronDown100",l:"spectrum-UIIcon-ChevronDown200",xl:"spectrum-UIIcon-ChevronDown300"};export const DESCRIPTION_ID="option-picker";export class PickerBase extends w($,{noDefaultSize:!0}){constructor(){super(...arguments);this.isMobile=new R(this,E);this.dependencyManager=new D(this);this.deprecatedMenu=null;this.disabled=!1;this.focused=!1;this.invalid=!1;this.pending=!1;this.pendingLabel="Pending";this.open=!1;this.readonly=!1;this.selects="single";this._selfManageFocusElement=!1;this.placement="bottom-start";this.quiet=!1;this.value="";this.listRole="listbox";this.itemRole="option";this.handleKeydown=e=>{this.focused=!0,!(e.code!=="ArrowDown"&&e.code!=="ArrowUp")&&(e.stopPropagation(),e.preventDefault(),this.toggle(!0))};this.handleSlottableRequest=e=>{};this.applyFocusElementLabel=(e,t)=>{this.appliedLabel=e,this.labelAlignment=t.sideAligned?"inline":void 0};this.hasRenderedOverlay=!1;this.willManageSelection=!1;this.selectionPromise=Promise.resolve();this.recentlyConnected=!1;this.enterKeydownOn=null;this.handleEnterKeydown=e=>{if(e.code==="Enter"){if(this.enterKeydownOn){e.preventDefault();return}this.enterKeydownOn=e.target,this.addEventListener("keyup",async t=>{t.code==="Enter"&&(this.enterKeydownOn=null)},{once:!0})}}}get menuItems(){return this.optionsMenu.childItems}get selfManageFocusElement(){return this._selfManageFocusElement}get selectedItem(){return this._selectedItem}set selectedItem(e){if(this.selectedItemContent=e?e.itemChildren:void 0,e===this.selectedItem)return;const t=this.selectedItem;this._selectedItem=e,this.requestUpdate("selectedItem",t)}get focusElement(){return this.open?this.optionsMenu:this.button}forceFocusVisible(){this.disabled||(this.focused=!0)}click(){this.disabled||this.toggle()}handleButtonBlur(){this.focused=!1}focus(e){super.focus(e),!this.disabled&&this.focusElement&&(this.focused=this.hasVisibleFocusInTree())}handleHelperFocus(){this.focused=!0,this.button.focus()}handleChange(e){this.strategy&&(this.strategy.preventNextToggle="no");const t=e.target,[s]=t.selectedItems;e.stopPropagation(),e.cancelable?this.setValueFromItem(s,e):(this.open=!1,this.strategy&&(this.strategy.open=!1))}handleButtonFocus(e){var t;(t=this.strategy)==null||t.handleButtonFocus(e)}async setValueFromItem(e,t){var h;this.open=!1,this.strategy&&(this.strategy.open=!1);const s=this.selectedItem,n=this.value;if(this.selectedItem=e,this.value=(h=e==null?void 0:e.value)!=null?h:"",await this.updateComplete,!this.dispatchEvent(new Event("change",{bubbles:!0,cancelable:!0,composed:!0}))&&this.selects){t&&t.preventDefault(),this.setMenuItemSelected(this.selectedItem,!1),s&&this.setMenuItemSelected(s,!0),this.selectedItem=s,this.value=n,this.open=!0,this.strategy&&(this.strategy.open=!0);return}else if(!this.selects){this.selectedItem=s,this.value=n;return}s&&this.setMenuItemSelected(s,!1),this.setMenuItemSelected(e,!!this.selects)}setMenuItemSelected(e,t){this.selects!=null&&(e.selected=t)}toggle(e){this.readonly||this.pending||(this.open=typeof e!="undefined"?e:!this.open,this.strategy&&(this.strategy.open=this.open),this.open?this._selfManageFocusElement=!0:this._selfManageFocusElement=!1)}close(){this.readonly||this.strategy&&(this.open=!1,this.strategy.open=!1)}get containerStyles(){return this.isMobile.matches?{"--swc-menu-width":"100%"}:{}}get selectedItemContent(){return this._selectedItemContent||{icon:[],content:[]}}set selectedItemContent(e){if(e===this.selectedItemContent)return;const t=this.selectedItemContent;this._selectedItemContent=e,this.requestUpdate("selectedItemContent",t)}handleTooltipSlotchange(e){this.tooltipEl=e.target.assignedElements()[0]}renderLabelContent(e){return this.value&&this.selectedItem?e:o`
            <slot name="label" id="label">
                <span
                    aria-hidden=${p(this.appliedLabel?void 0:"true")}
                >
                    ${this.label}
                </span>
            </slot>
        `}get buttonContent(){const e={"visually-hidden":this.icons==="only"&&!!this.value,placeholder:!this.value,label:!0},t=this.appliedLabel||this.label;return[o`
                <span id="icon" ?hidden=${this.icons==="none"}>
                    ${this.selectedItemContent.icon}
                </span>
                <span
                    id=${p(this.value&&this.selectedItem?"label":void 0)}
                    class=${I(e)}
                >
                    ${this.renderLabelContent(this.selectedItemContent.content)}
                </span>
                ${this.value&&this.selectedItem?o`
                          <span
                              aria-hidden="true"
                              class="visually-hidden"
                              id="applied-label"
                          >
                              ${t}
                              <slot name="label"></slot>
                          </span>
                      `:o`
                          <span hidden id="applied-label">${t}</span>
                      `}
                ${this.invalid&&!this.pending?o`
                          <sp-icon-alert
                              class="validation-icon"
                          ></sp-icon-alert>
                      `:v}
                ${M(this.pending,()=>(import("@spectrum-web-components/progress-circle/sp-progress-circle.js"),o`
                        <sp-progress-circle
                            id="loader"
                            size="s"
                            indeterminate
                            aria-valuetext=${this.pendingLabel}
                            class="progress-circle"
                        ></sp-progress-circle>
                    `))}
                <sp-icon-chevron100
                    class="picker ${T[this.size]}"
                ></sp-icon-chevron100>
                <slot
                    aria-hidden="true"
                    name="tooltip"
                    id="tooltip"
                    @slotchange=${this.handleTooltipSlotchange}
                ></slot>
            `]}renderOverlay(e){var s,n,l;if(((s=this.strategy)==null?void 0:s.overlay)===void 0)return e;const t=this.renderContainer(e);return g(t,(n=this.strategy)==null?void 0:n.overlay,{host:this}),(l=this.strategy)==null?void 0:l.overlay}get renderDescriptionSlot(){return o`
            <div id=${DESCRIPTION_ID}>
                <slot name="description"></slot>
            </div>
        `}render(){return this.tooltipEl&&(this.tooltipEl.disabled=this.open),o`
            <span
                id="focus-helper"
                tabindex="${this.focused||this.open?"-1":"0"}"
                @focus=${this.handleHelperFocus}
                aria-describedby=${DESCRIPTION_ID}
            ></span>
            <button
                aria-controls=${p(this.open?"menu":void 0)}
                aria-describedby="tooltip"
                aria-expanded=${this.open?"true":"false"}
                aria-haspopup="true"
                aria-labelledby="loader icon label applied-label"
                id="button"
                class=${p(this.labelAlignment?`label-${this.labelAlignment}`:void 0)}
                @blur=${this.handleButtonBlur}
                @keydown=${{handleEvent:this.handleEnterKeydown,capture:!0}}
                ?disabled=${this.disabled}
                tabindex="-1"
            >
                ${this.buttonContent}
            </button>
            ${this.renderMenu} ${this.renderDescriptionSlot}
        `}update(e){var t,s;this.selects&&(this.selects="single"),e.has("disabled")&&this.disabled&&this.strategy&&(this.open=!1,this.strategy.open=!1),e.has("pending")&&this.pending&&this.strategy&&(this.open=!1,this.strategy.open=!1),e.has("value")&&this.shouldScheduleManageSelection(),this.hasUpdated||(this.deprecatedMenu=this.querySelector(":scope > sp-menu"),(t=this.deprecatedMenu)==null||t.toggleAttribute("ignore",!0),(s=this.deprecatedMenu)==null||s.setAttribute("selects","inherit")),super.update(e)}bindButtonKeydownListener(){this.button.addEventListener("keydown",this.handleKeydown)}updated(e){super.updated(e),e.has("open")&&(this.strategy.open=this.open)}firstUpdated(e){super.firstUpdated(e),this.bindButtonKeydownListener(),this.bindEvents()}get dismissHelper(){return o`
            <div class="visually-hidden">
                <button
                    tabindex="-1"
                    aria-label="Dismiss"
                    @click=${this.close}
                ></button>
            </div>
        `}renderContainer(e){const t=o`
            ${this.dismissHelper} ${e} ${this.dismissHelper}
        `;return this.isMobile.matches?(this.dependencyManager.add("sp-tray"),import("@spectrum-web-components/tray/sp-tray.js"),o`
                <sp-tray
                    id="popover"
                    role="presentation"
                    style=${m(this.containerStyles)}
                >
                    ${t}
                </sp-tray>
            `):(this.dependencyManager.add("sp-popover"),import("@spectrum-web-components/popover/sp-popover.js"),o`
            <sp-popover
                id="popover"
                role="presentation"
                style=${m(this.containerStyles)}
                placement=${this.placement}
            >
                ${t}
            </sp-popover>
        `)}get renderMenu(){const e=o`
            <sp-menu
                aria-labelledby="applied-label"
                @change=${this.handleChange}
                id="menu"
                @keydown=${{handleEvent:this.handleEnterKeydown,capture:!0}}
                role=${this.listRole}
                .selects=${this.selects}
                .selected=${this.value?[this.value]:[]}
                size=${this.size}
                @sp-menu-item-added-or-updated=${this.shouldManageSelection}
            >
                <slot @slotchange=${this.shouldScheduleManageSelection}></slot>
            </sp-menu>
        `;return this.hasRenderedOverlay=this.hasRenderedOverlay||this.focused||this.open||!!this.deprecatedMenu,this.hasRenderedOverlay?(this.dependencyManager.loaded&&this.dependencyManager.add("sp-overlay"),this.renderOverlay(e)):e}shouldScheduleManageSelection(e){!this.willManageSelection&&(!e||e.target.getRootNode().host===this)&&(this.willManageSelection=!0,requestAnimationFrame(()=>{requestAnimationFrame(()=>{this.manageSelection()})}))}shouldManageSelection(){this.willManageSelection||(this.willManageSelection=!0,this.manageSelection())}async manageSelection(){if(this.selects==null)return;this.selectionPromise=new Promise(t=>this.selectionResolver=t);let e;await this.optionsMenu.updateComplete,this.recentlyConnected&&(await new Promise(t=>requestAnimationFrame(()=>t(!0))),this.recentlyConnected=!1),this.menuItems.forEach(t=>{this.value===t.value&&!t.disabled?e=t:t.selected=!1}),e?(e.selected=!!this.selects,this.selectedItem=e):(this.value="",this.selectedItem=void 0),this.open&&(await this.optionsMenu.updateComplete,this.optionsMenu.updateSelectedItemIndex()),this.selectionResolver(),this.willManageSelection=!1}async getUpdateComplete(){const e=await super.getUpdateComplete();return await this.selectionPromise,e}bindEvents(){var e;(e=this.strategy)==null||e.abort(),this.isMobile.matches?this.strategy=new b.mobile(this.button,this):this.strategy=new b.desktop(this.button,this)}connectedCallback(){super.connectedCallback(),this.recentlyConnected=this.hasUpdated}disconnectedCallback(){var e;this.close(),(e=this.strategy)==null||e.releaseDescription(),super.disconnectedCallback()}}i([c()],PickerBase.prototype,"appliedLabel",2),i([u("#button")],PickerBase.prototype,"button",2),i([r({type:Boolean,reflect:!0})],PickerBase.prototype,"disabled",2),i([r({type:Boolean,reflect:!0})],PickerBase.prototype,"focused",2),i([r({type:String,reflect:!0})],PickerBase.prototype,"icons",2),i([r({type:Boolean,reflect:!0})],PickerBase.prototype,"invalid",2),i([r({type:Boolean,reflect:!0})],PickerBase.prototype,"pending",2),i([r({type:String,attribute:"pending-label"})],PickerBase.prototype,"pendingLabel",2),i([r()],PickerBase.prototype,"label",2),i([r({type:Boolean,reflect:!0})],PickerBase.prototype,"open",2),i([r({type:Boolean,reflect:!0})],PickerBase.prototype,"readonly",2),i([c()],PickerBase.prototype,"labelAlignment",2),i([u("sp-menu")],PickerBase.prototype,"optionsMenu",2),i([u("sp-overlay")],PickerBase.prototype,"overlayElement",2),i([r()],PickerBase.prototype,"placement",2),i([r({type:Boolean,reflect:!0})],PickerBase.prototype,"quiet",2),i([r({type:String})],PickerBase.prototype,"value",2),i([r({attribute:!1})],PickerBase.prototype,"selectedItem",1),i([c()],PickerBase.prototype,"selectedItemContent",1);export class Picker extends PickerBase{constructor(){super(...arguments);this.handleKeydown=e=>{const{code:t}=e;if(this.focused=!0,!t.startsWith("Arrow")||this.readonly||this.pending)return;if(t==="ArrowUp"||t==="ArrowDown"){this.toggle(!0),e.preventDefault();return}e.preventDefault();const s=this.selectedItem?this.menuItems.indexOf(this.selectedItem):-1,n=s<0||t==="ArrowRight"?1:-1;let l=s+n;for(;this.menuItems[l]&&this.menuItems[l].disabled;)l+=n;!this.menuItems[l]||this.menuItems[l].disabled||(!this.value||l!==s)&&this.setValueFromItem(this.menuItems[l])}}static get styles(){return[S,C]}get containerStyles(){const e=super.containerStyles;return this.quiet||(e["min-width"]=`${this.offsetWidth}px`),e}}
//# sourceMappingURL=Picker.js.map
