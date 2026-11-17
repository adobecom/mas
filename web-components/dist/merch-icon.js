var Z=Object.defineProperty;var J=o=>{throw TypeError(o)};var Rt=(o,e,t)=>e in o?Z(o,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):o[e]=t;var wt=(o,e,t)=>()=>{if(t)throw t[0];try{return o&&(e=o(o=0)),e}catch(r){throw t=[r],r}};var Lt=(o,e)=>{for(var t in e)Z(o,t,{get:e[t],enumerable:!0})};var a=(o,e,t)=>Rt(o,typeof e!="symbol"?e+"":e,t),tt=(o,e,t)=>e.has(o)||J("Cannot "+t);var R=(o,e,t)=>(tt(o,e,"read from private field"),t?t.call(o):e.get(o)),I=(o,e,t)=>e.has(o)?J("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(o):e.set(o,t),w=(o,e,t,r)=>(tt(o,e,"write to private field"),r?r.call(o,t):e.set(o,t),t);var At={};Lt(At,{default:()=>N});import{LitElement as Wt,html as x,css as Xt,nothing as Qt}from"./lit-all.min.js";import{unsafeHTML as _t}from"./lit-all.min.js";import{ifDefined as Zt}from"./lit-all.min.js";function Jt(){return customElements.get("sp-tooltip")!==void 0&&customElements.get("overlay-trigger")!==void 0&&document.querySelector("sp-theme")!==null}var m,N,St=wt(()=>{m=class m extends Wt{constructor(){super(),this.content="",this.placement="top",this.variant="",this.size="xs",this.smartPlacement=!1,this.tooltipVisible=!1,this.lastPointerType=null,this.handleClickOutside=this.handleClickOutside.bind(this),this._tooltipTop=0,this._tooltipLeft=0,this._arrowOffset=0,this._computedPlacement="top"}connectedCallback(){super.connectedCallback(),window.addEventListener("mousedown",this.handleClickOutside),!this.smartPlacement&&this.closest('merch-card[variant="fries"]')&&(this.smartPlacement=!0)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("mousedown",this.handleClickOutside)}handleClickOutside(e){let t=e.composedPath();m.activeTooltip===this&&!t.includes(this)&&this.hideTooltip()}_computeTooltipPosition(){let e=this.shadowRoot?.querySelector(".css-tooltip");if(!e)return;let t=e.getBoundingClientRect(),r=window.innerWidth,i=window.innerHeight,n=14,s=200,c=60,l=this.shadowRoot?.querySelector(".css-tooltip-body"),p=l?l.offsetWidth:s,h=l?l.offsetHeight:c,u=this.effectivePlacement;u==="top"&&t.top-h-n<0?u="bottom":u==="bottom"&&t.bottom+h+n>i?u="top":u==="left"&&t.left-p-n<0?u="right":u==="right"&&t.right+p+n>r&&(u="left");let X=t.left+t.width/2,Q=t.top+t.height/2,b=6,O=(Ct,xt,yt)=>Math.max(Ct,Math.min(xt,yt)),P,M,F;u==="top"||u==="bottom"?(P=u==="top"?t.top-h-n:t.bottom+n,M=O(0,r-p,X-p/2),F=O(b,p-b*2,X-M-b)):(M=u==="left"?t.left-p-n:t.right+n,P=O(0,i-h,Q-h/2),F=O(b,h-b*2,Q-P-b)),this._tooltipTop=P,this._tooltipLeft=M,this._arrowOffset=F,this._computedPlacement=u}showTooltip(){m.activeTooltip&&m.activeTooltip!==this&&(m.activeTooltip.closeOverlay(),m.activeTooltip.tooltipVisible=!1,m.activeTooltip.requestUpdate()),m.activeTooltip=this,this.smartPlacement&&this._computeTooltipPosition(),this.tooltipVisible=!0,this.smartPlacement&&this.updateComplete.then(()=>this._computeTooltipPosition())}hideTooltip(){m.activeTooltip===this&&(m.activeTooltip=null),this.tooltipVisible=!1}handleTap(e){e.preventDefault(),this.tooltipVisible?this.hideTooltip():this.showTooltip()}closeOverlay(){let e=this.shadowRoot?.querySelector("overlay-trigger");e?.open!==void 0&&(e.open=!1)}get effectiveContent(){return this.tooltipText||this.mnemonicText||this.content||this.textContent?.trim()||""}get effectivePlacement(){return this.tooltipPlacement||this.mnemonicPlacement||this.placement||"top"}renderIcon(){return this.src?x`<merch-icon
            src="${this.src}"
            size="${this.size}"
        ></merch-icon>`:x`<slot></slot>`}render(){let e=this.effectiveContent,t=this.effectivePlacement;if(!e)return x`<span class="icon-only">${this.renderIcon()}</span>`;if(Jt())return x`
                <overlay-trigger
                    placement="${t}"
                    @sp-opened=${()=>this.showTooltip()}
                >
                    <span slot="trigger">${this.renderIcon()}</span>
                    <sp-tooltip
                        slot="hover-content"
                        placement="${t}"
                        variant="${this.variant}"
                    >
                        ${_t(e)}
                    </sp-tooltip>
                </overlay-trigger>
            `;let i=e.replace(/<[^>]*>/g,""),n=this.tooltipVisible?"tooltip-visible":"",s={pointerdown:f=>{this.lastPointerType=f.pointerType},pointerenter:f=>f.pointerType!=="touch"&&this.showTooltip(),pointerleave:f=>f.pointerType!=="touch"&&this.hideTooltip(),click:f=>{this.lastPointerType==="touch"&&this.handleTap(f),this.lastPointerType=null}},c=this._computedPlacement,l=c==="top"||c==="bottom",p=this.smartPlacement?`top:${this._tooltipTop}px;left:${this._tooltipLeft}px;`:void 0,h=l?`left:${this._arrowOffset}px`:`top:${this._arrowOffset}px`;return x`
            <span
                class="css-tooltip ${this.smartPlacement?"smart":t} ${n}"
                tabindex="0"
                role="img"
                aria-label="${i}"
                @pointerdown=${s.pointerdown}
                @pointerenter=${s.pointerenter}
                @pointerleave=${s.pointerleave}
                @click=${s.click}
            >
                ${this.renderIcon()}
                <span class="css-tooltip-body" style=${Zt(p)}>
                    ${_t(e)}
                    ${this.smartPlacement?x`<span
                              aria-hidden="true"
                              role="presentation"
                              class="css-tooltip-tip ${c}"
                              style="${h}"
                          ></span>`:Qt}
                </span>
            </span>
        `}};a(m,"activeTooltip",null),a(m,"properties",{content:{type:String},placement:{type:String},variant:{type:String},src:{type:String},size:{type:String},tooltipText:{type:String,attribute:"tooltip-text"},tooltipPlacement:{type:String,attribute:"tooltip-placement"},mnemonicText:{type:String,attribute:"mnemonic-text"},mnemonicPlacement:{type:String,attribute:"mnemonic-placement"},alt:{type:String},smartPlacement:{type:Boolean,attribute:"smart-placement"},tooltipVisible:{type:Boolean,state:!0},_tooltipTop:{type:Number,state:!0},_tooltipLeft:{type:Number,state:!0},_arrowOffset:{type:Number,state:!0},_computedPlacement:{type:String,state:!0}}),a(m,"styles",Xt`
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

        /* Placement variants (CSS-only mode) */
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

        /* Smart-placement mode: JS-computed fixed positioning + inner arrow span */
        .css-tooltip.smart .css-tooltip-body {
            position: fixed;
            z-index: 100000;
            max-width: 200px;
            overflow: visible;
            /* Cancel CSS-only placement transforms/margins from above */
            transform: none;
            margin: 0;
            bottom: auto;
            right: auto;
        }

        /* Hide the ::after arrow in smart mode; inner span is used instead */
        .css-tooltip.smart::after {
            content: none;
        }

        .css-tooltip-tip {
            position: absolute;
            width: 0;
            height: 0;
            border: 6px solid transparent;
            pointer-events: none;
        }

        /* Inner arrow span: positioned on the side facing the icon */
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

        .css-tooltip-body p {
            margin: 0;
        }

        /* Icon-only (no tooltip): keep inline so icons don't block-stack in <p> */
        .icon-only {
            display: inline-block;
        }
    `);N=m;customElements.define("mas-mnemonic",N)});import{LitElement as te,html as bt,css as ee}from"./lit-all.min.js";var Nt=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var et='span[is="inline-price"][data-wcs-osi]',ot='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Ot='a[is="upt-link"]',Pt=`${et},${ot},${Ot}`;var rt="placeholder-failed",it="placeholder-pending",nt="placeholder-resolved";var st="mas:failed",k="mas:resolved",at="mas/commerce";var E="failed",T="pending",g="resolved",G="X-Request-Id";var ce=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var Mt="mas-commerce-service";function D(){return document.getElementsByTagName(Mt)?.[0]}var It=["www.adobe.com","www.stage.adobe.com"];function Y(o,e=window.location.hostname){if(!o||!It.includes(e))return o;try{let t=new URL(o,`https://${e}`);return/\.aem\.(live|page)$/.test(t.hostname)?`${t.pathname}${t.search}${t.hash}`:o}catch{return o}}function ct(o,e={},{metadata:t=!0,search:r=!0,storage:i=!0}={}){let n;if(r&&n==null){let s=new URLSearchParams(window.location.search),c=B(r)?r:o;n=s.get(c)}if(i&&n==null){let s=B(i)?i:o;n=window.sessionStorage.getItem(s)??window.localStorage.getItem(s)}if(t&&n==null){let s=vt(B(t)?t:o);n=document.documentElement.querySelector(`meta[name="${s}"]`)?.content}return n??e[o]}var Dt=o=>typeof o=="boolean",v=o=>typeof o=="function";var B=o=>typeof o=="string";function lt(o,e){if(Dt(o))return o;let t=String(o);return t==="1"||t==="true"?!0:t==="0"||t==="false"?!1:e}function vt(o=""){return String(o).replace(/(\p{Lowercase_Letter})(\p{Uppercase_Letter})/gu,(e,t,r)=>`${t}-${r}`).replace(/\W+/gu,"-").toLowerCase()}var d={clientId:"merch-at-scale",delimiter:"\xB6",ignoredProperties:["analytics","literals","element"],serializableTypes:["Array","Object"],sampleRate:1,severity:"e",tags:"acom",isProdDomain:!1,country:""},pt=1e3,mt="mas-commerce-service:country";function $t(o){return o instanceof Error||typeof o?.originatingRequest=="string"}function ut(o){if(o==null)return;let e=typeof o;if(e==="function")return o.name?`function ${o.name}`:"function";if(e==="object"){if(o instanceof Error)return o.message;if(typeof o.originatingRequest=="string"){let{message:r,originatingRequest:i,status:n}=o;return[r,n,i].filter(Boolean).join(" ")}let t=o[Symbol.toStringTag]??Object.getPrototypeOf(o).constructor.name;if(!d.serializableTypes.includes(t))return t}return o}function Ht(o,e){if(!d.ignoredProperties.includes(o))return ut(e)}function Ut(o){let[e,...t]=o;return e?.constructor===Object?[{...e,[mt]:d.country},...t]:[{[mt]:d.country},...o]}var q={append(o){if(o.level!=="error")return;let{message:e,params:t}=o,r=[],i=[],n=e;t.forEach(p=>{p!=null&&($t(p)?r:i).push(p)}),r.length&&(n+=` ${r.map(ut).join(" ")}`);let{pathname:s,search:c}=window.location,l=`${d.delimiter}page=${s}${c}`;l.length>pt&&(l=`${l.slice(0,pt)}<trunc>`),n+=l,n+=`${d.delimiter}facts=`,n+=JSON.stringify(Ut(i),Ht),window.lana?.log(n,d)}};function dt(o){Object.assign(d,Object.fromEntries(Object.entries(o).filter(([e,t])=>e in d&&t!==""&&t!==null&&t!==void 0&&!Number.isNaN(t))))}var ht={LOCAL:"local",PROD:"prod",STAGE:"stage"},z={DEBUG:"debug",ERROR:"error",INFO:"info",WARN:"warn"},j=new Set,K=new Set,ft=new Map,Et={append({level:o,message:e,params:t,timestamp:r,source:i}){console[o](`${r}ms [${i}] %c${e}`,"font-weight: bold;",...t)}},gt={filter:({level:o})=>o!==z.DEBUG},Vt={filter:()=>!1};function Ft(o,e,t,r,i){return{level:o,message:e,namespace:t,get params(){return r.length===1&&v(r[0])&&(r=r[0](),Array.isArray(r)||(r=[r])),r},source:i,timestamp:performance.now().toFixed(3)}}function kt(o){[...K].every(e=>e(o))&&j.forEach(e=>e(o))}function Tt(o){let e=(ft.get(o)??0)+1;ft.set(o,e);let t=`${o} #${e}`,r={id:t,namespace:o,module:i=>Tt(`${r.namespace}/${i}`),updateConfig:dt};return Object.values(z).forEach(i=>{r[i]=(n,...s)=>kt(Ft(i,n,o,s,t))}),Object.seal(r)}function $(...o){o.forEach(e=>{let{append:t,filter:r}=e;v(r)&&K.add(r),v(t)&&j.add(t)})}function Gt(o={}){let{name:e}=o,t=lt(ct("commerce.debug",{search:!0,storage:!0}),e===ht.LOCAL);return $(t?Et:gt),e===ht.PROD&&$(q),C}function Yt(){j.clear(),K.clear()}var C={...Tt(at),Level:z,Plugins:{consoleAppender:Et,debugFilter:gt,quietFilter:Vt,lanaAppender:q},init:Gt,reset:Yt,use:$};var Bt="mas-commerce-service",be=C.module("utilities");var H=o=>window.setTimeout(o);function W(){return typeof document>"u"?null:document.getElementsByTagName(Bt)?.[0]}var U=class o extends Error{constructor(e,t,r){if(super(e,{cause:r}),this.name="MasError",t.response){let i=t.response.headers?.get(G);i&&(t.requestId=i),t.response.status&&(t.status=t.response.status,t.statusText=t.response.statusText),t.response.url&&(t.url=t.response.url)}delete t.response,this.context=t,Error.captureStackTrace&&Error.captureStackTrace(this,o)}toString(){let e=Object.entries(this.context||{}).map(([r,i])=>`${r}: ${JSON.stringify(i)}`).join(", "),t=`${this.name}: ${this.message}`;return e&&(t+=` (${e})`),this.cause&&(t+=`
Caused by: ${this.cause}`),t}};var qt={[E]:rt,[T]:it,[g]:nt},zt={[E]:st,[g]:k},L,V=class{constructor(e){I(this,L);a(this,"changes",new Map);a(this,"connected",!1);a(this,"error");a(this,"log");a(this,"options");a(this,"promises",[]);a(this,"state",T);a(this,"timer",null);a(this,"value");a(this,"version",0);a(this,"wrapperElement");this.wrapperElement=e,this.log=C.module("mas-element")}update(){[E,T,g].forEach(e=>{this.wrapperElement.classList.toggle(qt[e],e===this.state)})}notify(){(this.state===g||this.state===E)&&(this.state===g?this.promises.forEach(({resolve:t})=>t(this.wrapperElement)):this.state===E&&this.promises.forEach(({reject:t})=>t(this.error)),this.promises=[]);let e=this.error;this.error instanceof U&&(e={message:this.error.message,...this.error.context}),this.wrapperElement.dispatchEvent(new CustomEvent(zt[this.state],{bubbles:!0,composed:!0,detail:e}))}attributeChangedCallback(e,t,r){this.changes.set(e,r),this.requestUpdate()}connectedCallback(){w(this,L,W()),this.requestUpdate(!0)}disconnectedCallback(){this.connected&&(this.connected=!1,this.log?.debug("Disconnected:",{element:this.wrapperElement}))}onceSettled(){let{error:e,promises:t,state:r}=this;return g===r?Promise.resolve(this.wrapperElement):E===r?Promise.reject(e):new Promise((i,n)=>{t.push({resolve:i,reject:n})})}toggleResolved(e,t,r){return e!==this.version?!1:(r!==void 0&&(this.options=r),this.state=g,this.value=t,this.update(),this.log?.debug("Resolved:",{element:this.wrapperElement,value:t}),H(()=>this.notify()),!0)}toggleFailed(e,t,r){if(e!==this.version)return!1;r!==void 0&&(this.options=r),this.error=t,this.state=E,this.update();let i=this.wrapperElement.getAttribute("is");return this.log?.error(`${i}: Failed to render: ${t.message}`,{element:this.wrapperElement,...t.context,...R(this,L)?.duration}),H(()=>this.notify()),!0}togglePending(e){return this.version++,e&&(this.options=e),this.state=T,this.update(),this.log?.debug("Pending:",{osi:this.wrapperElement?.options?.wcsOsi}),this.version}requestUpdate(e=!1){if(!this.wrapperElement.isConnected||!W()||this.timer)return;let{error:t,options:r,state:i,value:n,version:s}=this;this.state=T,this.timer=H(async()=>{this.timer=null;let c=null;if(this.changes.size&&(c=Object.fromEntries(this.changes.entries()),this.changes.clear()),this.connected?this.log?.debug("Updated:",{element:this.wrapperElement,changes:c}):(this.connected=!0,this.log?.debug("Connected:",{element:this.wrapperElement,changes:c})),c||e)try{await this.wrapperElement.render?.()===!1&&this.state===T&&this.version===s&&(this.state=i,this.error=t,this.value=n,this.update(),this.notify())}catch(l){this.toggleFailed(this.version,l,r)}})}};L=new WeakMap;function jt({env:o,language:e,country:t,offerId:r,promotionCode:i}){let n=o==="PRODUCTION"?"www.adobe.com":"www.stage.adobe.com",s=`locale=${e}_${t}&country=${t}&offer_id=${r}`;return i&&(s+=`&promotion_code=${encodeURIComponent(i)}`),`https://${n}/offers/promo-terms.html?${s}`}var S,_=class _ extends(globalThis.HTMLAnchorElement??class{}){constructor(){super();a(this,"masElement",new V(this));I(this,S);this.setAttribute("is",_.is)}get isUptLink(){return!0}initializeWcsData(t,r){this.setAttribute("data-wcs-osi",t),r&&this.setAttribute("data-promotion-code",r)}attributeChangedCallback(t,r,i){this.masElement.attributeChangedCallback(t,r,i)}connectedCallback(){this.masElement.connectedCallback(),w(this,S,D()),R(this,S)&&(this.log=R(this,S).log.module("upt-link"))}disconnectedCallback(){this.masElement.disconnectedCallback(),w(this,S,void 0)}requestUpdate(t=!1){this.masElement.requestUpdate(t)}onceSettled(){return this.masElement.onceSettled()}async render(){let t=D();if(!t)return!1;this.dataset.imsCountry||t.imsCountryPromise.then(s=>{s&&(this.dataset.imsCountry=s)});let r=t.collectCheckoutOptions({},this);if(!r.wcsOsi)return this.log.error("Missing 'data-wcs-osi' attribute on upt-link."),!1;let i=this.masElement.togglePending(r),n=t.resolveOfferSelectors(r);try{let[[s]]=await Promise.all(n),{country:c,language:l,env:p}=r;this.href=jt({env:p,language:l,country:c,offerId:s.offerId,promotionCode:this.getAttribute("data-promotion-code")}),this.masElement.toggleResolved(i,s,r)}catch(s){let c=new Error(`Could not resolve offer selectors for id: ${r.wcsOsi}.`,s.message);return this.masElement.toggleFailed(i,c,r),!1}}static createFrom(t){let r=new _;for(let i of t.attributes)i.name!=="is"&&(i.name==="class"&&i.value.includes("upt-link")?r.setAttribute("class",i.value.replace("upt-link","").trim()):r.setAttribute(i.name,i.value));return r.innerHTML=t.innerHTML,r.setAttribute("tabindex",0),r}};S=new WeakMap,a(_,"is","upt-link"),a(_,"tag","a"),a(_,"observedAttributes",["data-wcs-osi","data-promotion-code","data-ims-country"]);var A=_;globalThis.customElements&&!globalThis.customElements.get(A.is)&&globalThis.customElements.define(A.is,A,{extends:A.tag});var Kt=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let o=document.createElement("style");o.setAttribute("data-plan-type-text",""),o.textContent=Kt,document.head.append(o)}function oe(){return customElements.get("sp-tooltip")!==void 0||document.querySelector("sp-theme")!==null}var y=class extends te{constructor(){super(),this.size="m",this.alt="",this.loading="lazy"}connectedCallback(){super.connectedCallback(),setTimeout(()=>this.handleTooltips(),0)}handleTooltips(){if(oe())return;this.querySelectorAll("sp-tooltip, overlay-trigger").forEach(t=>{let r="",i="top";if(t.tagName==="SP-TOOLTIP")r=t.textContent,i=t.getAttribute("placement")||"top";else if(t.tagName==="OVERLAY-TRIGGER"){let n=t.querySelector("sp-tooltip");n&&(r=n.textContent,i=n.getAttribute("placement")||t.getAttribute("placement")||"top")}if(r){let n=document.createElement("mas-mnemonic");n.setAttribute("content",r),n.setAttribute("placement",i);let s=this.querySelector("img"),c=this.querySelector("a");c&&c.contains(s)?n.appendChild(c):s&&n.appendChild(s),this.innerHTML="",this.appendChild(n),Promise.resolve().then(()=>St())}t.remove()})}render(){let{href:e}=this,t=Y(this.src);return e?bt`<a href="${e}">
                  <img
                      src="${t}"
                      alt="${this.alt}"
                      loading="${this.loading}"
                  />
              </a>`:bt` <img
                  src="${t}"
                  alt="${this.alt}"
                  loading="${this.loading}"
              />`}};a(y,"properties",{size:{type:String,attribute:!0},src:{type:String,attribute:!0},alt:{type:String,attribute:!0},href:{type:String,attribute:!0},loading:{type:String,attribute:!0}}),a(y,"styles",ee`
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
