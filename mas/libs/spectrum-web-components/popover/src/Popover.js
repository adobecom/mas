"use strict";var c=Object.defineProperty;var d=Object.getOwnPropertyDescriptor;var t=(o,r,l,p)=>{for(var e=p>1?void 0:p?d(r,l):r,i=o.length-1,a;i>=0;i--)(a=o[i])&&(e=(p?a(r,l,e):a(e))||e);return p&&e&&c(r,l,e),e};import{html as n,nothing as u,SpectrumElement as m}from"@spectrum-web-components/base";import{property as s,query as h}from"@spectrum-web-components/base/src/decorators.js";import g from"./popover.css.js";export class Popover extends m{constructor(){super(...arguments);this.dialog=!1;this.open=!1;this.tip=!1}static get styles(){return[g]}renderTip(){return n`
            <div id="tip" aria-hidden="true">
                <svg class="tip block" viewBox="0 -0.5 16 9">
                    <path class="triangle" d="M-1,-1 8,8 17,-1"></path>
                </svg>
                <svg class="tip inline" viewBox="0 -0.5 9 16">
                    <path class="triangle" d="M-1,-1 8,8 -1,17"></path>
                </svg>
            </div>
        `}update(l){super.update(l)}render(){return n`
            <slot></slot>
            ${this.tip?this.renderTip():u}
        `}}t([s({type:Boolean,reflect:!0})],Popover.prototype,"dialog",2),t([s({type:Boolean,reflect:!0})],Popover.prototype,"open",2),t([s({reflect:!0})],Popover.prototype,"placement",2),t([s({type:Boolean,reflect:!0})],Popover.prototype,"tip",2),t([h("#tip")],Popover.prototype,"tipElement",2);
//# sourceMappingURL=Popover.js.map
