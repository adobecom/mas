"use strict";var g=Object.defineProperty;var v=Object.getOwnPropertyDescriptor;var n=(p,a,e,o)=>{for(var t=o>1?void 0:o?v(a,e):a,l=p.length-1,i;l>=0;l--)(i=p[l])&&(t=(o?i(a,e,t):i(t))||t);return o&&t&&g(a,e,t),t};import{html as r,SpectrumElement as u}from"@spectrum-web-components/base";import{property as s,query as h,state as c}from"@spectrum-web-components/base/src/decorators.js";import f from"./overlay-trigger.css.js";export class OverlayTrigger extends u{constructor(){super(...arguments);this.content="click hover longpress";this.offset=6;this.disabled=!1;this.receivesFocus="auto";this.clickContent=[];this.longpressContent=[];this.hoverContent=[];this.targetContent=[]}static get styles(){return[f]}getAssignedElementsFromSlot(e){return e.assignedElements({flatten:!0})}handleTriggerContent(e){this.targetContent=this.getAssignedElementsFromSlot(e.target)}handleSlotContent(e){switch(e.target.name){case"click-content":this.clickContent=this.getAssignedElementsFromSlot(e.target);break;case"longpress-content":this.longpressContent=this.getAssignedElementsFromSlot(e.target);break;case"hover-content":this.hoverContent=this.getAssignedElementsFromSlot(e.target);break}}handleBeforetoggle(e){const{target:o}=e;let t;if(o===this.clickOverlayElement)t="click";else if(o===this.longpressOverlayElement)t="longpress";else if(o===this.hoverOverlayElement)t="hover";else return;e.newState==="open"?this.open=t:this.open===t&&(this.open=void 0)}update(e){var o,t,l,i,d,m;e.has("clickContent")&&(this.clickPlacement=((o=this.clickContent[0])==null?void 0:o.getAttribute("placement"))||((t=this.clickContent[0])==null?void 0:t.getAttribute("direction"))||void 0),e.has("hoverContent")&&(this.hoverPlacement=((l=this.hoverContent[0])==null?void 0:l.getAttribute("placement"))||((i=this.hoverContent[0])==null?void 0:i.getAttribute("direction"))||void 0),e.has("longpressContent")&&(this.longpressPlacement=((d=this.longpressContent[0])==null?void 0:d.getAttribute("placement"))||((m=this.longpressContent[0])==null?void 0:m.getAttribute("direction"))||void 0),super.update(e)}renderSlot(e){return r`
            <slot name=${e} @slotchange=${this.handleSlotContent}></slot>
        `}renderClickOverlay(){import("@spectrum-web-components/overlay/sp-overlay.js");const e=this.renderSlot("click-content");return this.clickContent.length?r`
            <sp-overlay
                id="click-overlay"
                ?disabled=${this.disabled||!this.clickContent.length}
                ?open=${this.open==="click"&&!!this.clickContent.length}
                .offset=${this.offset}
                .placement=${this.clickPlacement||this.placement}
                .triggerElement=${this.targetContent[0]}
                .triggerInteraction=${"click"}
                .type=${this.type!=="modal"?"auto":"modal"}
                @beforetoggle=${this.handleBeforetoggle}
                .receivesFocus=${this.receivesFocus}
            >
                ${e}
            </sp-overlay>
        `:e}renderHoverOverlay(){import("@spectrum-web-components/overlay/sp-overlay.js");const e=this.renderSlot("hover-content");return this.hoverContent.length?r`
            <sp-overlay
                id="hover-overlay"
                ?open=${this.open==="hover"&&!!this.hoverContent.length}
                ?disabled=${this.disabled||!this.hoverContent.length||!!this.open&&this.open!=="hover"}
                .offset=${this.offset}
                .placement=${this.hoverPlacement||this.placement}
                .triggerElement=${this.targetContent[0]}
                .triggerInteraction=${"hover"}
                .type=${"hint"}
                @beforetoggle=${this.handleBeforetoggle}
                .receivesFocus=${this.receivesFocus}
            >
                ${e}
            </sp-overlay>
        `:e}renderLongpressOverlay(){import("@spectrum-web-components/overlay/sp-overlay.js");const e=this.renderSlot("longpress-content");return this.longpressContent.length?r`
            <sp-overlay
                id="longpress-overlay"
                ?disabled=${this.disabled||!this.longpressContent.length}
                ?open=${this.open==="longpress"&&!!this.longpressContent.length}
                .offset=${this.offset}
                .placement=${this.longpressPlacement||this.placement}
                .triggerElement=${this.targetContent[0]}
                .triggerInteraction=${"longpress"}
                .type=${"auto"}
                @beforetoggle=${this.handleBeforetoggle}
                .receivesFocus=${this.receivesFocus}
            >
                ${e}
            </sp-overlay>
            <slot name="longpress-describedby-descriptor"></slot>
        `:e}render(){const e=this.content.split(" ");return r`
            <slot
                id="trigger"
                name="trigger"
                @slotchange=${this.handleTriggerContent}
            ></slot>
            ${[e.includes("click")?this.renderClickOverlay():r``,e.includes("hover")?this.renderHoverOverlay():r``,e.includes("longpress")?this.renderLongpressOverlay():r``]}
        `}updated(e){if(super.updated(e),this.disabled&&e.has("disabled")){this.open=void 0;return}}async getUpdateComplete(){return await super.getUpdateComplete()}}n([s()],OverlayTrigger.prototype,"content",2),n([s({reflect:!0})],OverlayTrigger.prototype,"placement",2),n([s()],OverlayTrigger.prototype,"type",2),n([s({type:Number})],OverlayTrigger.prototype,"offset",2),n([s({reflect:!0})],OverlayTrigger.prototype,"open",2),n([s({type:Boolean,reflect:!0})],OverlayTrigger.prototype,"disabled",2),n([s({attribute:"receives-focus"})],OverlayTrigger.prototype,"receivesFocus",2),n([c()],OverlayTrigger.prototype,"clickContent",2),n([c()],OverlayTrigger.prototype,"longpressContent",2),n([c()],OverlayTrigger.prototype,"hoverContent",2),n([c()],OverlayTrigger.prototype,"targetContent",2),n([h("#click-overlay",!0)],OverlayTrigger.prototype,"clickOverlayElement",2),n([h("#longpress-overlay",!0)],OverlayTrigger.prototype,"longpressOverlayElement",2),n([h("#hover-overlay",!0)],OverlayTrigger.prototype,"hoverOverlayElement",2);
//# sourceMappingURL=OverlayTrigger.js.map
