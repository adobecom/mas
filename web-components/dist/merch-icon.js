var S=Object.defineProperty;var O=(n,e,t)=>e in n?S(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var z=(n,e)=>()=>(n&&(e=n(n=0)),e);var E=(n,e)=>{for(var t in e)S(n,t,{get:e[t],enumerable:!0})};var g=(n,e,t)=>O(n,typeof e!="symbol"?e+"":e,t);var C={};E(C,{default:()=>v});import{LitElement as L,html as w,css as q}from"./lit-all.min.js";import{unsafeHTML as $}from"./lit-all.min.js";function M(){return customElements.get("sp-tooltip")!==void 0&&customElements.get("overlay-trigger")!==void 0&&document.querySelector("sp-theme")!==null}var s,v,P=z(()=>{s=class s extends L{constructor(){super(),this.content="",this.placement="top",this.variant="info",this.size="xs",this.tooltipVisible=!1,this.lastPointerType=null,this.handleClickOutside=this.handleClickOutside.bind(this),this._tooltipTop=0,this._tooltipLeft=0,this._arrowOffset=0,this._computedPlacement="top"}connectedCallback(){super.connectedCallback(),window.addEventListener("mousedown",this.handleClickOutside)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("mousedown",this.handleClickOutside)}handleClickOutside(e){let t=e.composedPath();s.activeTooltip===this&&!t.includes(this)&&this.hideTooltip()}_computeTooltipPosition(){let e=this.shadowRoot?.querySelector(".css-tooltip");if(!e)return;let t=e.getBoundingClientRect(),p=window.innerWidth,a=window.innerHeight,i=14,h=200,m=60,f=this.shadowRoot?.querySelector(".css-tooltip-body"),o=f?f.offsetWidth:h,c=f?f.offsetHeight:m,l=this.effectivePlacement;l==="top"&&t.top-c-i<0?l="bottom":l==="bottom"&&t.bottom+c+i>a?l="top":l==="left"&&t.left-o-i<0?l="right":l==="right"&&t.right+o+i>p&&(l="left");let x=t.left+t.width/2,T=t.top+t.height/2,r=6,d,u,b;l==="top"?(d=t.top-c-i,u=Math.max(0,Math.min(p-o,x-o/2)),b=Math.max(r,Math.min(o-r*2,x-u-r))):l==="bottom"?(d=t.bottom+i,u=Math.max(0,Math.min(p-o,x-o/2)),b=Math.max(r,Math.min(o-r*2,x-u-r))):l==="left"?(u=t.left-o-i,d=Math.max(0,Math.min(a-c,T-c/2)),b=Math.max(r,Math.min(c-r*2,T-d-r))):(u=t.right+i,d=Math.max(0,Math.min(a-c,T-c/2)),b=Math.max(r,Math.min(c-r*2,T-d-r))),this._tooltipTop=d,this._tooltipLeft=u,this._arrowOffset=b,this._computedPlacement=l,this._anchorRect=t}showTooltip(){s.activeTooltip&&s.activeTooltip!==this&&(s.activeTooltip.closeOverlay(),s.activeTooltip.tooltipVisible=!1,s.activeTooltip.requestUpdate()),s.activeTooltip=this,this._computeTooltipPosition(),this.tooltipVisible=!0,this.updateComplete.then(()=>this._computeTooltipPosition())}hideTooltip(){s.activeTooltip===this&&(s.activeTooltip=null),this.tooltipVisible=!1}handleTap(e){e.preventDefault(),this.tooltipVisible?this.hideTooltip():this.showTooltip()}closeOverlay(){let e=this.shadowRoot?.querySelector("overlay-trigger");e?.open!==void 0&&(e.open=!1)}get effectiveContent(){return this.tooltipText||this.mnemonicText||this.content||""}get effectivePlacement(){return this.tooltipPlacement||this.mnemonicPlacement||this.placement||"top"}renderIcon(){return this.src?w`<merch-icon
            src="${this.src}"
            size="${this.size}"
        ></merch-icon>`:w`<slot></slot>`}render(){let e=this.effectiveContent,t=this.effectivePlacement;if(!e)return this.renderIcon();if(M())return w`
                <overlay-trigger
                    placement="${t}"
                    @sp-opened=${()=>this.showTooltip()}
                >
                    <span slot="trigger">${this.renderIcon()}</span>
                    <sp-tooltip
                        placement="${t}"
                        variant="${this.variant}"
                    >
                        ${$(e)}
                    </sp-tooltip>
                </overlay-trigger>
            `;{let a=e.replace(/<[^>]*>/g,""),i=this._computedPlacement,h=i==="top"||i==="bottom",m=`top:${this._tooltipTop}px;left:${this._tooltipLeft}px;`,f=h?`left:${this._arrowOffset}px`:`top:${this._arrowOffset}px`;return w`
                <span
                    class="css-tooltip ${this.tooltipVisible?"tooltip-visible":""}"
                    tabindex="0"
                    role="img"
                    aria-label="${a}"
                    @pointerdown=${o=>{this.lastPointerType=o.pointerType}}
                    @pointerenter=${o=>o.pointerType!=="touch"&&this.showTooltip()}
                    @pointerleave=${o=>o.pointerType!=="touch"&&this.hideTooltip()}
                    @click=${o=>{this.lastPointerType==="touch"&&this.handleTap(o),this.lastPointerType=null}}
                >
                    ${this.renderIcon()}
                    <span class="css-tooltip-body" style="${m}">
                        ${$(e)}
                        <span
                            aria-hidden="true"
                            role="presentation"
                            class="css-tooltip-tip ${i}"
                            style="${f}"
                        ></span>
                    </span>
                </span>
            `}}};g(s,"activeTooltip",null),g(s,"properties",{content:{type:String},placement:{type:String},variant:{type:String},src:{type:String},size:{type:String},tooltipText:{type:String,attribute:"tooltip-text"},tooltipPlacement:{type:String,attribute:"tooltip-placement"},mnemonicText:{type:String,attribute:"mnemonic-text"},mnemonicPlacement:{type:String,attribute:"mnemonic-placement"},tooltipVisible:{type:Boolean,state:!0},_tooltipTop:{type:Number,state:!0},_tooltipLeft:{type:Number,state:!0},_arrowOffset:{type:Number,state:!0},_computedPlacement:{type:String,state:!0}}),g(s,"styles",q`
        :host {
            display: contents;
            overflow: visible;
        }

        /* CSS tooltip styles - these are local fallbacks, main styles in global.css.js */
        .css-tooltip {
            position: relative;
            display: inline-block;
            cursor: pointer;
        }

        .css-tooltip .css-tooltip-body {
            position: fixed;
            z-index: 100000;
            background: var(--spectrum-gray-800, #323232);
            color: #fff;
            padding: var(--mas-mnemonic-tooltip-padding, 8px 12px);
            border-radius: 4px;
            white-space: normal;
            width: max-content;
            max-width: 200px;
            overflow: visible;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition:
                opacity 0.2s ease,
                visibility 0.2s ease;
            font-size: 12px;
            line-height: 1.4;
            text-align: center;
        }

        .css-tooltip-tip {
            position: absolute;
            width: 0;
            height: 0;
            border: 6px solid transparent;
            pointer-events: none;
        }

        .css-tooltip.tooltip-visible .css-tooltip-body,
        .css-tooltip:focus-visible .css-tooltip-body {
            opacity: 1;
            visibility: visible;
        }

        /* Arrow: child of body, positioned on the side facing the icon */
        .css-tooltip-tip.top {
            top: 100%;
            border-top-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip-tip.bottom {
            top: -6px;
            border-bottom-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip-tip.left {
            left: 100%;
            border-left-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip-tip.right {
            left: -6px;
            border-right-color: var(--spectrum-gray-800, #323232);
        }
    `);v=s;customElements.define("mas-mnemonic",v)});import{LitElement as _,html as k,css as A}from"./lit-all.min.js";function R(){return customElements.get("sp-tooltip")!==void 0||document.querySelector("sp-theme")!==null}var y=class extends _{constructor(){super(),this.size="m",this.alt="",this.loading="lazy"}connectedCallback(){super.connectedCallback(),setTimeout(()=>this.handleTooltips(),0)}handleTooltips(){if(R())return;this.querySelectorAll("sp-tooltip, overlay-trigger").forEach(t=>{let p="",a="top";if(t.tagName==="SP-TOOLTIP")p=t.textContent,a=t.getAttribute("placement")||"top";else if(t.tagName==="OVERLAY-TRIGGER"){let i=t.querySelector("sp-tooltip");i&&(p=i.textContent,a=i.getAttribute("placement")||t.getAttribute("placement")||"top")}if(p){let i=document.createElement("mas-mnemonic");i.setAttribute("content",p),i.setAttribute("placement",a);let h=this.querySelector("img"),m=this.querySelector("a");m&&m.contains(h)?i.appendChild(m):h&&i.appendChild(h),this.innerHTML="",this.appendChild(i),Promise.resolve().then(()=>P())}t.remove()})}render(){let{href:e}=this;return e?k`<a href="${e}">
                  <img
                      src="${this.src}"
                      alt="${this.alt}"
                      loading="${this.loading}"
                  />
              </a>`:k` <img
                  src="${this.src}"
                  alt="${this.alt}"
                  loading="${this.loading}"
              />`}};g(y,"properties",{size:{type:String,attribute:!0},src:{type:String,attribute:!0},alt:{type:String,attribute:!0},href:{type:String,attribute:!0},loading:{type:String,attribute:!0}}),g(y,"styles",A`
        :host {
            --img-width: 32px;
            --img-height: 32px;
            display: block;
            width: var(--mod-img-width, var(--img-width));
            height: var(--mod-img-height, var(--img-height));
        }

        :host([size='xxs']) {
            --img-width: 13px;
            --img-height: 13px;
        }

        :host([size='xs']) {
            --img-width: 20px;
            --img-height: 20px;
        }

        :host([size='s']) {
            --img-width: 24px;
            --img-height: 24px;
        }

        :host([size='m']) {
            --img-width: 30px;
            --img-height: 30px;
        }

        :host([size='l']) {
            --img-width: 40px;
            --img-height: 40px;
        }

        img {
            width: var(--mod-img-width, var(--img-width));
            height: var(--mod-img-height, var(--img-height));
        }
    `);customElements.define("merch-icon",y);export{y as default};
