var Et=Object.defineProperty;var z=e=>{throw TypeError(e)};var mt=(e,n,t)=>n in e?Et(e,n,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[n]=t;var D=(e,n,t)=>mt(e,typeof n!="symbol"?n+"":n,t),Y=(e,n,t)=>n.has(e)||z("Cannot "+t);var p=(e,n,t)=>(Y(e,n,"read from private field"),t?t.call(e):n.get(e)),_=(e,n,t)=>n.has(e)?z("Cannot add the same private member more than once"):n instanceof WeakSet?n.add(e):n.set(e,t),R=(e,n,t,r)=>(Y(e,n,"write to private field"),r?r.call(e,t):n.set(e,t),t),c=(e,n,t)=>(Y(e,n,"access private method"),t);var vt=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),yt=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var ht='span[is="inline-price"][data-wcs-osi]',ft='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var At='a[is="upt-link"]',Ht=`${ht},${ft},${At}`,Z=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var M="aem:load";var Q="mas:ready";var Dt=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var Yt=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var J="legal",tt="plan-type-text",et="mas-ff-defaults";var Tt="mas-commerce-service";function ot(){return document.getElementsByTagName(Tt)?.[0]}function nt(e){let n=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&n?.isInlinePrice&&n?.dataset?.template==="price"}var _t=[".","!","?"],St=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=St,document.head.append(e)}var gt="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function Rt(e){let n=e.closest(gt)??e.parentNode,t=document.createRange();return t.setStart(n,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function rt(e){let n=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(r=>!r.closest("merch-addon"));return(n.find(r=>r.dataset.promotionCode&&r.dataset.promotionCode!=="cancel-context")??n[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function Lt(e){let n=Rt(e);return!n||_t.includes(n)?"upper":"lower"}function U(e,n){if(e.dataset.placeholder!==tt)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(n.wcsOsi=t,n.planTypeCase=Lt(e))}var q="mas-field",Ct=/(accent|primary|secondary)(-(outline|link))?/,bt=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function j(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")?e.getAttribute("data-promotion-code"):null}function it(e,n){let t=document.createElement("template");t.innerHTML=e;let r=[...t.content.querySelectorAll("a")],o=r.filter(i=>Z.has(i.dataset.analyticsId));return o.length===0?e:o.length===r.length?n?null:e:(o.forEach(i=>i.remove()),t.innerHTML)}function st(e,n){if(!e)return n;let t=e.closest(q);if(!(t||e.hasAttribute("fragment-id")))return n;n[et]=!0,n.wrapClauses=!0;let o=t?.aemFragment?.data?.priceLiterals;if(o&&(n.literals??(n.literals={}),Object.assign(n.literals,o)),nt(e)&&(n.displayPerUnit=!1,n.displayTax=!1),t&&e.dataset.template===J&&(n.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!n.promotionCode){let i=e.dataset.promotionCode??(t?j(t):null);i&&(n.promotionCode=i)}n.displayAnnual===void 0&&typeof t?.settings?.displayAnnual=="boolean"&&(n.displayAnnual=t.settings.displayAnnual)}function Nt(e,n){if(n.promotionCode||!e)return;let t=e.closest(q),r=e.dataset.promotionCode??(t?j(t):null);r&&(n.promotionCode=r)}function Ot(e){!e?.providers||e.providers.has(st)||(e.providers.price(st),e.providers.checkout(Nt),e.providers.has(U)||e.providers.price(U))}var Mt=`
mas-field {
    display: inline;
}

mas-field div[slot="footer"] {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    align-items: center;
}

mas-field span.placeholder-resolved[data-template='priceStrikethrough'],
mas-field span.placeholder-resolved[data-template='strikethrough'],
mas-field span.price.price-strikethrough,
mas-field span.price.price-promo-strikethrough {
    text-decoration: line-through;
    color: var(--merch-color-inline-price-strikethrough);
}

/* Render the RTE tooltip node (serialized as a bare .icon-button span) as an info
   glyph with a tooltip when a placeholder is consumed through mas-field outside a
   merch-card (e.g. a headless DA page). Ports Milo's tooltip model (libs/features/
   icons/icons.css) so it looks/behaves like production: a placement class
   (top|bottom|left|right) drives the popover side and #decorateTooltips re-picks the
   side on hover/focus so it never clips. Kept self-contained because mas-field is a
   bundled component and Milo does not decorate mas-field content. */
mas-field .icon-button {
    position: relative;
    text-decoration: none;
    border-bottom: none;
    margin-inline-start: 7px;
}

mas-field .icon-button svg {
    height: 1em;
    width: auto;
    position: relative;
    top: 0.1em;
}

/* Default (right) popover. */
mas-field .icon-button::before {
    content: attr(data-tooltip);
    position: absolute;
    top: 50%;
    left: 100%;
    transform: translateY(-50%);
    margin-left: 7px;
    width: max-content;
    max-width: 140px;
    padding: 10px;
    border-radius: 5px;
    background: #0469E3;
    color: #fff;
    text-align: left;
    font-size: 12px;
    font-weight: 400;
    line-height: 16px;
    z-index: 10;
    display: none;
}

mas-field .icon-button::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 100%;
    margin-left: -8px;
    transform: translateY(-50%);
    border: 8px solid transparent;
    border-right-color: #0469E3;
    z-index: 10;
    display: none;
}

mas-field .icon-button.left::before {
    left: initial;
    margin: initial;
    right: 100%;
    margin-right: 8px;
}

mas-field .icon-button.left::after {
    left: initial;
    right: 100%;
    margin-left: 0;
    margin-right: -8px;
    border-right-color: transparent;
    border-left-color: #0469E3;
}

mas-field .icon-button.top::before {
    left: calc(50% - 11px);
    right: initial;
    top: -6px;
    margin: 0 0 15px 7px;
    transform: translateX(-50%) translateY(-100%);
}

mas-field .icon-button.top::after {
    left: 50%;
    right: initial;
    top: 2px;
    margin-left: -8px;
    transform: translateY(-50%);
    border-right-color: transparent;
    border-top-color: #0469E3;
}

mas-field .icon-button.bottom::before {
    left: calc(50% - 11px);
    right: initial;
    top: 100%;
    margin: 9px 0 0 7px;
    transform: translateX(-50%);
}

mas-field .icon-button.bottom::after {
    left: 50%;
    right: initial;
    top: calc(100% + 1px);
    margin-left: -8px;
    transform: translateY(-50%);
    border-right-color: transparent;
    border-bottom-color: #0469E3;
}

mas-field .icon-button:hover::before,
mas-field .icon-button:focus::before,
mas-field .icon-button:active::before,
mas-field .icon-button:hover::after,
mas-field .icon-button:focus::after,
mas-field .icon-button:active::after {
    display: block;
}

mas-field .icon-button.hide-tooltip::before,
mas-field .icon-button.hide-tooltip::after {
    display: none;
}

@media (max-width: 600px) {
    mas-field .icon-button::before {
        max-width: 180px;
    }
}
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=Mt,document.head.append(e)}var S,C,T,g,b,s,P,F,at,ct,k,G,B,W,$,lt,w,dt,pt,K,V=class extends HTMLElement{constructor(){super(...arguments);_(this,s);_(this,S,null);_(this,C,!1);_(this,T,null);D(this,"settings",null);_(this,g,null);D(this,"compatVersion");_(this,b,t=>{t.target===this.aemFragment&&(R(this,T,t.detail?.fields||null),this.settings=t.detail?.settings??null,R(this,C,!0),c(this,s,G).call(this),this.dispatchEvent(new CustomEvent(Q,{bubbles:!0,composed:!0,detail:t.detail})))})}static get observedAttributes(){return["field"]}attributeChangedCallback(t,r,o){t==="field"&&(R(this,S,o),c(this,s,G).call(this))}connectedCallback(){this.addEventListener(M,p(this,b)),c(this,s,P).call(this),this.aemFragment?.setAttribute("hidden",""),Ot(ot())}disconnectedCallback(){this.removeEventListener(M,p(this,b))}checkReady(){return p(this,C)?Promise.resolve(!0):new Promise(t=>{this.addEventListener(M,()=>t(!0),{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return rt(this)}};S=new WeakMap,C=new WeakMap,T=new WeakMap,g=new WeakMap,b=new WeakMap,s=new WeakSet,P=function(){if(p(this,g)?.isConnected)return p(this,g);let t=this.querySelector(':scope > span[data-role="mas-field-content"]');if(t)return R(this,g,t),t;let r=document.createElement("span");return r.setAttribute("data-role","mas-field-content"),this.append(r),R(this,g,r),r},F=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},at=function(t){let r=t?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let o=t?.match(/^(.+)\[(.+)\]$/);return o?{fieldName:o[1],index:o[2]}:{fieldName:t,index:null}},ct=function(t,r){if(typeof t!="string")return null;let o=document.createElement("template");o.innerHTML=t;let i;if(!isNaN(r)){let a=parseInt(r,10);i=[...o.content.querySelectorAll("a")][a-1]}return i||(i=o.content.querySelector(`a[data-key="${r}"]`)),i?(i.removeAttribute("class"),i.outerHTML):null},k=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},G=function(){if(!p(this,T)||!p(this,S))return;let{fieldName:t,index:r}=c(this,s,at).call(this,p(this,S));if(r!==null&&isNaN(r)){let l=`${t.replace(/s$/,"")}Labels`,d=p(this,T)[l];if(d!==void 0){let h=(Array.isArray(d)?d:[d]).indexOf(r);if(h===-1)return;let m=p(this,T)[t],u=Array.isArray(m)?m:m?[m]:[],f=c(this,s,F).call(this,u[h]);if(!f||t==="ctas"&&this.settings?.hideTrialCTAs&&(f=it(f,!0),f===null))return;c(this,s,k).call(this);let L=c(this,s,P).call(this);L.innerHTML=c(this,s,K).call(this,f)??"",c(this,s,W).call(this,L),c(this,s,$).call(this,L),c(this,s,w).call(this,L);return}}let o=c(this,s,F).call(this,p(this,T)[t]);if(o===void 0)return;c(this,s,k).call(this);let i=c(this,s,P).call(this),a;if(r!==null){if(a=c(this,s,ct).call(this,o,r),a===null)return}else a=c(this,s,K).call(this,o);if(typeof a=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs&&(a=it(a,r!==null),a===null))return;if(p(this,S)==="ctas"){let l=c(this,s,pt).call(this,a);if(l){i.replaceChildren(l),c(this,s,w).call(this,i);return}}i.innerHTML=a,c(this,s,W).call(this,i),c(this,s,$).call(this,i),c(this,s,w).call(this,i);return}i.textContent=a==null?"":String(a)},B=function(t,r){return customElements.get("checkout-link")?.createCheckoutLink(t,r)??(()=>{let i=document.createElement("a",{is:"checkout-link"});return i.setAttribute("is","checkout-link"),i.innerHTML=`<span style="pointer-events: none;">${r}</span>`,i})()},W=function(t){for(let r of t.querySelectorAll("a[data-wcs-osi]:not([is])")){let o=c(this,s,B).call(this,r.dataset,r.innerHTML);for(let{name:i,value:a}of r.attributes)["is","href"].includes(i)||o.setAttribute(i,a);r.replaceWith(o)}},$=function(t){let r=t.querySelectorAll(".icon-button[data-tooltip]");for(let o of r){if(o.dataset.tooltipWired)continue;o.dataset.tooltipWired="1",o.querySelector("svg")||o.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),o.hasAttribute("tabindex")||o.setAttribute("tabindex","0"),o.hasAttribute("role")||o.setAttribute("role","button"),o.hasAttribute("aria-label")||o.setAttribute("aria-label",o.dataset.tooltip);let i=["top","bottom","left","right"],a=[...o.classList].find(h=>i.includes(h)),l=a||"top";a||o.classList.add(l),o.dataset.originalPosition=l,o.classList.add("hide-tooltip");let d=()=>{o.classList.remove("hide-tooltip"),c(this,s,lt).call(this,o)},E=()=>o.classList.add("hide-tooltip");o.addEventListener("mouseenter",d),o.addEventListener("focus",d),o.addEventListener("mouseleave",E),o.addEventListener("blur",E),o.addEventListener("keydown",h=>{h.key==="Escape"&&E()})}},lt=function(t){let r=["top","bottom","right","left"],o=window.innerWidth,i=12,a=document.querySelector("header")?.getBoundingClientRect().height||0,l=window.getComputedStyle(t,"::before"),d=H=>parseFloat(H)||0,E=d(l.width)+d(l.paddingLeft)+d(l.paddingRight),h=d(l.height)+d(l.paddingTop)+d(l.paddingBottom),m=t.getBoundingClientRect(),u=t.dataset.originalPosition||"top",f=r.find(H=>t.classList.contains(H)),X=u==="top"||u==="bottom"?E/2:E,ut=u==="top"?h+(u==="top"?i:0):h/2,N=m.top-ut<a,I=m.bottom+(u==="bottom"?h+i:0)>window.innerHeight,x=m.right+X+i>o,O=m.left-X-i<0,v=m.left+E/2+i>o,y=m.left-E/2-i<0;if(u!==f&&!(x||O||N||I||v||y)){t.classList.remove(...r),t.classList.add(u);return}let A=u;x&&v?A="left":O&&y?A="right":x&&N||O&&N?A=v&&"left"||y&&"right"||"bottom":x!==O&&!I?A=x?"left":"right":N&&["top","left","right"].includes(u)?A="bottom":I&&["bottom","left","right"].includes(u)&&(A="top"),f!==A&&(t.classList.remove(...r),t.classList.add(A))},w=function(t){let r=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let o=(i,a)=>{if(a!=null)for(let l of r)l.hasAttribute(i)||l.setAttribute(i,a)};for(let i of bt)o(i,this.getAttribute(i));o("data-promotion-code",j(this))},dt=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let o=Ct.exec(t.className??"")?.[0]??"accent",i=o.startsWith("accent"),a=o.includes("-link"),l=c(this,s,B).call(this,t.dataset,t.textContent);for(let{name:d,value:E}of t.attributes)["class","is","href"].includes(d)||l.setAttribute(d,E);return l.firstElementChild?.classList.add("spectrum-Button-label"),a||(l.classList.add("button","con-button"),i?l.classList.add("blue"):o.startsWith("primary")&&!o.includes("-outline")&&l.classList.add("fill")),l},pt=function(t){let o=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!o.length)return null;let i=document.createElement("div");return i.setAttribute("slot","footer"),i.append(...o.map(a=>c(this,s,dt).call(this,a))),i},K=function(t){if(typeof t!="string")return t;let r=t.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return t;let i=r.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(q,V);export{Nt as checkoutOptionsProvider,st as priceOptionsProvider};
