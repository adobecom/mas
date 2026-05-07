var d=Object.defineProperty;var y=(s,t,e)=>t in s?d(s,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):s[t]=e;var v=(s,t)=>()=>(s&&(t=s(s=0)),t);var x=(s,t)=>{for(var e in t)d(s,e,{get:t[e],enumerable:!0})};var n=(s,t,e)=>y(s,typeof t!="symbol"?t+"":t,e);var u={};x(u,{default:()=>p});import{LitElement as T,html as c,css as w}from"./lit-all.min.js";import{unsafeHTML as g}from"./lit-all.min.js";function S(){return customElements.get("sp-tooltip")!==void 0&&customElements.get("overlay-trigger")!==void 0&&document.querySelector("sp-theme")!==null}var o,p,f=v(()=>{o=class o extends T{constructor(){super(),this.content="",this.placement="top",this.variant="info",this.size="xs",this.tooltipVisible=!1,this.lastPointerType=null,this.handleClickOutside=this.handleClickOutside.bind(this)}connectedCallback(){super.connectedCallback(),window.addEventListener("mousedown",this.handleClickOutside)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("mousedown",this.handleClickOutside)}handleClickOutside(t){let e=t.composedPath();o.activeTooltip===this&&!e.includes(this)&&this.hideTooltip()}showTooltip(){o.activeTooltip&&o.activeTooltip!==this&&(o.activeTooltip.closeOverlay(),o.activeTooltip.tooltipVisible=!1,o.activeTooltip.requestUpdate()),o.activeTooltip=this,this.tooltipVisible=!0}hideTooltip(){o.activeTooltip===this&&(o.activeTooltip=null),this.tooltipVisible=!1}handleTap(t){t.preventDefault(),this.tooltipVisible?this.hideTooltip():this.showTooltip()}closeOverlay(){let t=this.shadowRoot?.querySelector("overlay-trigger");t?.open!==void 0&&(t.open=!1)}get effectiveContent(){return this.tooltipText||this.mnemonicText||this.content||""}get effectivePlacement(){return this.tooltipPlacement||this.mnemonicPlacement||this.placement||"top"}renderIcon(){return this.src?c`<merch-icon
            src="${this.src}"
            size="${this.size}"
        ></merch-icon>`:c`<slot></slot>`}render(){let t=this.effectiveContent,e=this.effectivePlacement;if(!t)return this.renderIcon();if(S())return c`
                <overlay-trigger
                    placement="${e}"
                    @sp-opened=${()=>this.showTooltip()}
                >
                    <span slot="trigger">${this.renderIcon()}</span>
                    <sp-tooltip
                        placement="${e}"
                        variant="${this.variant}"
                    >
                        ${g(t)}
                    </sp-tooltip>
                </overlay-trigger>
            `;{let a=t.replace(/<[^>]*>/g,"");return c`
                <span
                    class="css-tooltip ${e} ${this.tooltipVisible?"tooltip-visible":""}"
                    tabindex="0"
                    role="img"
                    aria-label="${a}"
                    @pointerdown=${i=>{this.lastPointerType=i.pointerType}}
                    @pointerenter=${i=>i.pointerType!=="touch"&&this.showTooltip()}
                    @pointerleave=${i=>i.pointerType!=="touch"&&this.hideTooltip()}
                    @click=${i=>{this.lastPointerType==="touch"&&this.handleTap(i),this.lastPointerType=null}}
                >
                    ${this.renderIcon()}
                    <span class="tooltip-content">${g(t)}</span>
                </span>
            `}}};n(o,"activeTooltip",null),n(o,"properties",{content:{type:String},placement:{type:String},variant:{type:String},src:{type:String},size:{type:String},tooltipText:{type:String,attribute:"tooltip-text"},tooltipPlacement:{type:String,attribute:"tooltip-placement"},mnemonicText:{type:String,attribute:"mnemonic-text"},mnemonicPlacement:{type:String,attribute:"mnemonic-placement"},tooltipVisible:{type:Boolean,state:!0}}),n(o,"styles",w`
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
            position: absolute;
            z-index: 999;
            background: var(--spectrum-gray-800, #323232);
            color: #fff;
            padding: var(--mas-mnemonic-tooltip-padding, 8px 12px);
            border-radius: 4px;
            white-space: normal;
            width: max-content;
            max-width: 60px;
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

        .css-tooltip::after {
            content: '';
            position: absolute;
            z-index: 999;
            width: 0;
            height: 0;
            border: 6px solid transparent;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition:
                opacity 0.1s ease,
                visibility 0.1s ease;
        }

        .css-tooltip.tooltip-visible .css-tooltip-body,
        .css-tooltip.tooltip-visible::after,
        .css-tooltip:focus-visible .css-tooltip-body,
        .css-tooltip:focus-visible::after {
            opacity: 1;
            visibility: visible;
        }

        /* Position variants */
        .css-tooltip.top .css-tooltip-body {
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-bottom: 16px;
        }

        .css-tooltip.top::after {
            top: -80%;
            left: 50%;
            transform: translateX(-50%);
            border-color: var(--spectrum-gray-800, #323232) transparent
                transparent transparent;
        }

        .css-tooltip.bottom .css-tooltip-body {
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 10px;
        }

        .css-tooltip.bottom::after {
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 5px;
            border-bottom-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip.left .css-tooltip-body {
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-right: 10px;
            left: var(--tooltip-left-offset, auto);
        }

        .css-tooltip.left::after {
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-right: 5px;
            border-left-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip.right .css-tooltip-body {
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-left: 10px;
        }

        .css-tooltip.right::after {
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-left: 5px;
            border-right-color: var(--spectrum-gray-800, #323232);
        }
    `);p=o;customElements.define("mas-mnemonic",p)});import{LitElement as $,html as b,css as C}from"./lit-all.min.js";function k(){return customElements.get("sp-tooltip")!==void 0||document.querySelector("sp-theme")!==null}var r=class extends ${constructor(){super(),this.size="m",this.alt="",this.loading="lazy"}connectedCallback(){super.connectedCallback(),setTimeout(()=>this.handleTooltips(),0)}handleTooltips(){if(k())return;this.querySelectorAll("sp-tooltip, overlay-trigger").forEach(e=>{let l="",a="top";if(e.tagName==="SP-TOOLTIP")l=e.textContent,a=e.getAttribute("placement")||"top";else if(e.tagName==="OVERLAY-TRIGGER"){let i=e.querySelector("sp-tooltip");i&&(l=i.textContent,a=i.getAttribute("placement")||e.getAttribute("placement")||"top")}if(l){let i=document.createElement("mas-mnemonic");i.setAttribute("content",l),i.setAttribute("placement",a);let h=this.querySelector("img"),m=this.querySelector("a");m&&m.contains(h)?i.appendChild(m):h&&i.appendChild(h),this.innerHTML="",this.appendChild(i),Promise.resolve().then(()=>f())}e.remove()})}render(){let{href:t}=this;return t?b`<a href="${t}">
                  <img
                      src="${this.src}"
                      alt="${this.alt}"
                      loading="${this.loading}"
                  />
              </a>`:b` <img
                  src="${this.src}"
                  alt="${this.alt}"
                  loading="${this.loading}"
              />`}};n(r,"properties",{size:{type:String,attribute:!0},src:{type:String,attribute:!0},alt:{type:String,attribute:!0},href:{type:String,attribute:!0},loading:{type:String,attribute:!0}}),n(r,"styles",C`
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
    `);customElements.define("merch-icon",r);export{r as default};
