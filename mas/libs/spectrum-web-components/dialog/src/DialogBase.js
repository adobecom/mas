"use strict";var p=Object.defineProperty;var h=Object.getOwnPropertyDescriptor;var o=(n,s,e,i)=>{for(var t=i>1?void 0:i?h(s,e):s,a=n.length-1,l;a>=0;a--)(l=n[a])&&(t=(i?l(s,e,t):l(t))||t);return i&&t&&p(s,e,t),t};import{html as d,nothing as u,SpectrumElement as c}from"@spectrum-web-components/base";import{property as r}from"@spectrum-web-components/base/src/decorators.js";import"@spectrum-web-components/underlay/sp-underlay.js";import"@spectrum-web-components/button/sp-button.js";import"@spectrum-web-components/dialog/sp-dialog.js";import m from"@spectrum-web-components/modal/src/modal-wrapper.css.js";import v from"@spectrum-web-components/modal/src/modal.css.js";import{FocusVisiblePolyfillMixin as f}from"@spectrum-web-components/shared";import{firstFocusableIn as b}from"@spectrum-web-components/shared/src/first-focusable-in.js";export class DialogBase extends f(c){constructor(){super(...arguments);this.dismissable=!1;this.open=!1;this.responsive=!1;this.transitionPromise=Promise.resolve();this.resolveTransitionPromise=()=>{};this.underlay=!1;this.animating=!1}static get styles(){return[m,v]}get dialog(){return this.shadowRoot.querySelector("slot").assignedElements()[0]||this}async focus(){if(this.shadowRoot){const e=b(this.dialog);e?(e.updateComplete&&await e.updateComplete,e.focus()):this.dialog.focus()}else super.focus()}overlayWillCloseCallback(){return this.open?(this.close(),!0):this.animating}dismiss(){this.dismissable&&this.close()}handleClose(e){e.stopPropagation(),this.close()}close(){this.open=!1}dispatchClosed(){this.dispatchEvent(new Event("close",{bubbles:!0}))}handleTransitionEvent(e){this.dispatchEvent(new TransitionEvent(e.type,{bubbles:!0,composed:!0,propertyName:e.propertyName}))}handleUnderlayTransitionend(e){!this.open&&e.propertyName==="visibility"&&this.resolveTransitionPromise(),this.handleTransitionEvent(e)}handleModalTransitionend(e){(this.open||!this.underlay)&&this.resolveTransitionPromise(),this.handleTransitionEvent(e)}update(e){e.has("open")&&e.get("open")!==void 0&&(this.animating=!0,this.transitionPromise=new Promise(i=>{this.resolveTransitionPromise=()=>{this.animating=!1,i()}}),this.open||this.dispatchClosed()),super.update(e)}renderDialog(){return d`
            <slot></slot>
        `}render(){return d`
            ${this.underlay?d`
                      <sp-underlay
                          ?open=${this.open}
                          @close=${this.dismiss}
                          @transitionrun=${this.handleTransitionEvent}
                          @transitionend=${this.handleUnderlayTransitionend}
                          @transitioncancel=${this.handleTransitionEvent}
                      ></sp-underlay>
                  `:u}
            <div
                class="modal ${this.mode}"
                @transitionrun=${this.handleTransitionEvent}
                @transitionend=${this.handleModalTransitionend}
                @transitioncancel=${this.handleTransitionEvent}
                @close=${this.handleClose}
            >
                ${this.renderDialog()}
            </div>
        `}updated(e){e.has("open")&&this.open&&"updateComplete"in this.dialog&&"shouldManageTabOrderForScrolling"in this.dialog&&this.dialog.updateComplete.then(()=>{this.dialog.shouldManageTabOrderForScrolling()})}async getUpdateComplete(){const e=await super.getUpdateComplete();return await this.transitionPromise,e}}o([r({type:Boolean,reflect:!0})],DialogBase.prototype,"dismissable",2),o([r({type:Boolean,reflect:!0})],DialogBase.prototype,"open",2),o([r({type:String,reflect:!0})],DialogBase.prototype,"mode",2),o([r({type:Boolean})],DialogBase.prototype,"responsive",2),o([r({type:Boolean})],DialogBase.prototype,"underlay",2);
//# sourceMappingURL=DialogBase.js.map
