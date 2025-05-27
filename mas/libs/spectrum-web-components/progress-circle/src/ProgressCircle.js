"use strict";var p=Object.defineProperty;var c=Object.getOwnPropertyDescriptor;var i=(o,s,e,r)=>{for(var t=r>1?void 0:r?c(s,e):s,l=o.length-1,n;l>=0;l--)(n=o[l])&&(t=(r?n(s,e,t):n(t))||t);return r&&t&&p(s,e,t),t};import{html as d,SizedMixin as u,SpectrumElement as h}from"@spectrum-web-components/base";import{property as a,query as b}from"@spectrum-web-components/base/src/decorators.js";import{getLabelFromSlot as m}from"@spectrum-web-components/shared/src/get-label-from-slot.js";import{ifDefined as v}from"@spectrum-web-components/base/src/directives.js";import f from"./progress-circle.css.js";export class ProgressCircle extends u(h,{validSizes:["s","m","l"]}){constructor(){super(...arguments);this.indeterminate=!1;this.label="";this.overBackground=!1;this.progress=0}static get styles(){return[f]}makeRotation(e){return this.indeterminate?void 0:`transform: rotate(${e}deg);`}willUpdate(e){e.has("overBackground")&&(this.static=this.overBackground?"white":this.static||void 0)}render(){const e=[this.makeRotation(-180+3.6*Math.min(this.progress,50)),this.makeRotation(-180+3.6*Math.max(this.progress-50,0))],r=["Mask1","Mask2"];return d`
            <slot @slotchange=${this.handleSlotchange}></slot>
            <div class="track"></div>
            <div class="fills">
                ${r.map((t,l)=>d`
                        <div class="fill${t}">
                            <div
                                class="fillSub${t}"
                                style=${v(e[l])}
                            >
                                <div class="fill"></div>
                            </div>
                        </div>
                    `)}
            </div>
        `}handleSlotchange(){const e=m(this.label,this.slotEl);e&&(this.label=e)}firstUpdated(e){super.firstUpdated(e),this.hasAttribute("role")||this.setAttribute("role","progressbar")}updated(e){super.updated(e),!this.indeterminate&&e.has("progress")?this.setAttribute("aria-valuenow",""+this.progress):this.hasAttribute("aria-valuenow")&&this.removeAttribute("aria-valuenow"),e.has("label")&&(this.label.length?this.setAttribute("aria-label",this.label):e.get("label")===this.getAttribute("aria-label")&&this.removeAttribute("aria-label"))}}i([a({type:Boolean,reflect:!0})],ProgressCircle.prototype,"indeterminate",2),i([a({type:String})],ProgressCircle.prototype,"label",2),i([a({type:Boolean,reflect:!0,attribute:"over-background"})],ProgressCircle.prototype,"overBackground",2),i([a({reflect:!0})],ProgressCircle.prototype,"static",2),i([a({type:Number})],ProgressCircle.prototype,"progress",2),i([b("slot")],ProgressCircle.prototype,"slotEl",2);
//# sourceMappingURL=ProgressCircle.js.map
