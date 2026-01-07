var d=Object.defineProperty;var b=(o,t,e)=>t in o?d(o,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):o[t]=e;var v=(o,t)=>()=>(o&&(t=o(o=0)),t);var x=(o,t)=>{for(var e in t)d(o,e,{get:t[e],enumerable:!0})};var r=(o,t,e)=>b(o,typeof t!="symbol"?t+"":t,e);var g={};x(g,{default:()=>n});import{LitElement as y,html as p,css as T}from"./lit-all.min.js";function w(){return customElements.get("sp-tooltip")!==void 0&&customElements.get("overlay-trigger")!==void 0&&document.querySelector("sp-theme")!==null}var i,n,u=v(()=>{i=class i extends y{constructor(){super(),this.content="",this.placement="top",this.variant="info",this.size="xs",this.tooltipVisible=!1,this.handleClickOutside=this.handleClickOutside.bind(this)}connectedCallback(){super.connectedCallback(),window.addEventListener("mousedown",this.handleClickOutside)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("mousedown",this.handleClickOutside)}handleClickOutside(t){let e=t.composedPath();i.activeTooltip===this&&!e.includes(this)&&this.hideTooltip()}showTooltip(){i.activeTooltip&&i.activeTooltip!==this&&(i.activeTooltip.tooltipVisible=!1,i.activeTooltip=null),i.activeTooltip=this,this.tooltipVisible=!0}hideTooltip(){i.activeTooltip===this&&(i.activeTooltip=null),this.tooltipVisible=!1}get effectiveContent(){return this.tooltipText||this.mnemonicText||this.content||""}get effectivePlacement(){return this.tooltipPlacement||this.mnemonicPlacement||this.placement||"top"}renderIcon(){return this.src?p`<merch-icon
            src="${this.src}"
            size="${this.size}"
        ></merch-icon>`:p`<slot></slot>`}render(){let t=this.effectiveContent,e=this.effectivePlacement;return t?w()?p`
                <overlay-trigger placement="${e}">
                    <span slot="trigger">${this.renderIcon()}</span>
                    <sp-tooltip
                        placement="${e}"
                        variant="${this.variant}"
                    >
                        ${t}
                    </sp-tooltip>
                </overlay-trigger>
            `:p`
                <span
                    class="css-tooltip ${e} ${this.tooltipVisible?"tooltip-visible":""}"
                    data-tooltip="${t}"
                    tabindex="0"
                    role="img"
                    aria-label="${t}"
                    @pointerenter=${()=>this.showTooltip()}
                    @pointerleave=${()=>this.hideTooltip()}
                    @focus=${()=>this.showTooltip()}
                    @blur=${()=>this.hideTooltip()}
                >
                    ${this.renderIcon()}
                </span>
            `:this.renderIcon()}};r(i,"activeTooltip",null),r(i,"properties",{content:{type:String},placement:{type:String},variant:{type:String},src:{type:String},size:{type:String},tooltipText:{type:String,attribute:"tooltip-text"},tooltipPlacement:{type:String,attribute:"tooltip-placement"},mnemonicText:{type:String,attribute:"mnemonic-text"},mnemonicPlacement:{type:String,attribute:"mnemonic-placement"},tooltipVisible:{type:Boolean,state:!0}}),r(i,"styles",T`
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

        .css-tooltip[data-tooltip]::before {
            content: attr(data-tooltip);
            position: absolute;
            z-index: 999;
            background: var(--spectrum-gray-800, #323232);
            color: #fff;
            padding: 8px 12px;
            border-radius: 4px;
            white-space: normal;
            width: max-content;
            max-width: 200px;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transition:
                opacity 0.3s ease,
                visibility 0.3s ease;
            font-size: 12px;
            line-height: 1.4;
            text-align: center;
        }

        .css-tooltip[data-tooltip]::after {
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
                opacity 0.3s ease,
                visibility 0.3s ease;
        }

        .css-tooltip.tooltip-visible[data-tooltip]::before,
        .css-tooltip.tooltip-visible[data-tooltip]::after,
        .css-tooltip:focus[data-tooltip]::before,
        .css-tooltip:focus[data-tooltip]::after {
            opacity: 1;
            visibility: visible;
        }

        @media (hover: hover) {
            .css-tooltip:hover[data-tooltip]::before,
            .css-tooltip:hover[data-tooltip]::after {
                opacity: 1;
                visibility: visible;
            }
        }

        /* Position variants */
        .css-tooltip.top[data-tooltip]::before {
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-bottom: 16px;
        }

        .css-tooltip.top[data-tooltip]::after {
            top: -80%;
            left: 50%;
            transform: translateX(-50%);
            border-color: var(--spectrum-gray-800, #323232) transparent
                transparent transparent;
        }

        .css-tooltip.bottom[data-tooltip]::before {
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 10px;
        }

        .css-tooltip.bottom[data-tooltip]::after {
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 5px;
            border-bottom-color: var(--spectrum-gray-800, #323232);
        }

        .css-tooltip.left[data-tooltip]::before {
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-right: 10px;
            left: var(--tooltip-left-offset, auto);
        }

        .css-tooltip.left[data-tooltip]::after {
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-right: 5px;
            border-left-color: var(--spectrum-gray-800, #323232);
        }

        /* Prevent tooltip cutoff on edges */
        .css-tooltip.top[data-tooltip]::before {
            max-width: min(200px, calc(100vw - 32px));
        }

        .css-tooltip.right[data-tooltip]::before {
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-left: 10px;
        }

        .css-tooltip.right[data-tooltip]::after {
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-left: 5px;
            border-right-color: var(--spectrum-gray-800, #323232);
        }
    `);n=i;customElements.define("mas-mnemonic",n)});import{LitElement as S,html as f,css as $}from"./lit-all.min.js";function C(){return customElements.get("sp-tooltip")!==void 0||document.querySelector("sp-theme")!==null}var l=class extends S{constructor(){super(),this.size="m",this.alt="",this.loading="lazy"}connectedCallback(){super.connectedCallback(),setTimeout(()=>this.handleTooltips(),0)}handleTooltips(){if(C())return;this.querySelectorAll("sp-tooltip, overlay-trigger").forEach(e=>{let a="",c="top";if(e.tagName==="SP-TOOLTIP")a=e.textContent,c=e.getAttribute("placement")||"top";else if(e.tagName==="OVERLAY-TRIGGER"){let s=e.querySelector("sp-tooltip");s&&(a=s.textContent,c=s.getAttribute("placement")||e.getAttribute("placement")||"top")}if(a){let s=document.createElement("mas-mnemonic");s.setAttribute("content",a),s.setAttribute("placement",c);let h=this.querySelector("img"),m=this.querySelector("a");m&&m.contains(h)?s.appendChild(m):h&&s.appendChild(h),this.innerHTML="",this.appendChild(s),Promise.resolve().then(()=>u())}e.remove()})}render(){let{href:t}=this;return t?f`<a href="${t}">
                  <img
                      src="${this.src}"
                      alt="${this.alt}"
                      loading="${this.loading}"
                  />
              </a>`:f` <img
                  src="${this.src}"
                  alt="${this.alt}"
                  loading="${this.loading}"
              />`}};r(l,"properties",{size:{type:String,attribute:!0},src:{type:String,attribute:!0},alt:{type:String,attribute:!0},href:{type:String,attribute:!0},loading:{type:String,attribute:!0}}),r(l,"styles",$`
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
    `);customElements.define("merch-icon",l);export{l as default};
