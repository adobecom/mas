var Ot=Object.defineProperty;var et=e=>{throw TypeError(e)};var yt=(e,n,t)=>n in e?Ot(e,n,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[n]=t;var Y=(e,n,t)=>yt(e,typeof n!="symbol"?n+"":n,t),$=(e,n,t)=>n.has(e)||et("Cannot "+t);var p=(e,n,t)=>($(e,n,"read from private field"),t?t.call(e):n.get(e)),x=(e,n,t)=>n.has(e)?et("Cannot add the same private member more than once"):n instanceof WeakSet?n.add(e):n.set(e,t),_=(e,n,t,r)=>($(e,n,"write to private field"),r?r.call(e,t):n.set(e,t),t),c=(e,n,t)=>($(e,n,"access private method"),t);var de=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),pe=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var It='span[is="inline-price"][data-wcs-osi]',vt='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Dt='a[is="upt-link"]',ue=`${It},${vt},${Dt}`,rt=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var R="aem:load",V="aem:error",nt="mas:ready";var me=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var he=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var ot="legal",it="plan-type-text",at="mas-ff-defaults";var Ht="mas-commerce-service";function st(){return document.getElementsByTagName(Ht)?.[0]}function ct(e){let n=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&n?.isInlinePrice&&n?.dataset?.template==="price"}var Ut=[".","!","?"],kt=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=kt,document.head.append(e)}var Ft="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function Yt(e){let n=e.closest(Ft)??e.parentNode,t=document.createRange();return t.setStart(n,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function lt(e){let n=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(r=>!r.closest("merch-addon"));return(n.find(r=>r.dataset.promotionCode&&r.dataset.promotionCode!=="cancel-context")??n[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function $t(e){let n=Yt(e);return!n||Ut.includes(n)?"upper":"lower"}function G(e,n){if(e.dataset.placeholder!==it)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(n.wcsOsi=t,n.planTypeCase=$t(e))}function Gt(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")}function y(e){return Gt(e)?e.contextPromotionCode:null}function dt(e,n){e&&(n.literals??(n.literals={}),Object.assign(n.literals,e))}function pt(e,n){ct(e)&&(n.displayPerUnit=!1,n.displayTax=!1)}function ut(e,n){n.displayAnnual===void 0&&typeof e?.settings?.displayAnnual=="boolean"&&(n.displayAnnual=e.settings.displayAnnual,e.settings.displayAnnual&&e.setAttribute("annualized",""))}function mt(e,n,t){!e?.providers||e.providers.has(n)||(e.providers.price(n),e.providers.checkout(t),e.providers.has(G)||e.providers.price(G))}function Bt(e,n){if(typeof e!="string"||!e)return null;let t;try{t=new URL(e,n)}catch{return null}return t.hostname.endsWith(".aem.page")?`${n}${t.pathname}${t.search}`:null}function W(e){if(typeof e!="string"||!e)return"";try{return new URL(e).href}catch{return""}}function Wt(e){if(typeof e!="string"||!e)return!1;try{return new URL(e).hostname.endsWith(".aem.page")}catch{return!1}}var qt={png:{type:"image/png",format:"png"},jpg:{type:"image/jpeg",format:"jpg"},jpeg:{type:"image/jpeg",format:"jpg"},webp:{type:"image/webp",format:"webp"},gif:{type:"image/gif",format:"gif"}},B={width:2e3,media:"(min-width: 600px)"},zt=750;function I(e,n,t){let r=new URL(e);return r.searchParams.set("width",n),r.searchParams.set("format",t),r.searchParams.set("optimize","medium"),r.href}function ht(e,n){return n?.width?Math.min(e,n.width):e}function Kt(e){let n=new URL(e).pathname.split(".").pop().toLowerCase();return qt[n]??null}function ft(e){return String(e??"").replaceAll("&","&amp;").replaceAll('"',"&quot;").replaceAll("<","&lt;").replaceAll(">","&gt;")}function Et(e){return!e?.width||!e?.height?"":` width="${e.width}" height="${e.height}"`}function gt(e,n,t=""){if(!Wt(e))return"";let r=W(e),o=Kt(r);if(!o)return`<img loading="lazy" alt="${ft(t)}"${Et(n)} src="${r}">`;let{type:i,format:l}=o,s=ht(B.width,n),d=ht(zt,n);return[`<source type="image/webp" srcset="${I(r,s,"webply")}" media="${B.media}">`,`<source type="image/webp" srcset="${I(r,d,"webply")}">`,`<source type="${i}" srcset="${I(r,s,l)}" media="${B.media}">`,`<img loading="lazy" alt="${ft(t)}" src="${I(r,d,l)}"${Et(n)}>`].join("")}function jt(e){return e?.hostname==="www.adobe.com"||e?.hostname==="adobe.com"}function At(e,n=globalThis.location){if(typeof e!="string"||!e||!jt(n))return e;let t=document.createElement("template");return t.innerHTML=`<picture>${e}</picture>`,t.content.querySelectorAll("source[srcset], img[src]").forEach(r=>{let o=r.tagName==="IMG"?"src":"srcset",i=Bt(r.getAttribute(o),n.origin);i&&r.setAttribute(o,i)}),t.content.querySelector("picture").innerHTML}var Xt=new Set(["SOURCE","IMG"]),Zt=new Set(["src","srcset","media","type","alt","role","loading","data-mobile-set","width","height"]);function Tt(e){if(typeof e!="string"||!e)return"";let n=document.createElement("template"),t=/^\s*<picture[\s>]/i.test(e);n.innerHTML=t?e:`<picture>${e}</picture>`;let r=n.content.querySelector("picture");return r?(r.querySelectorAll("*").forEach(o=>{if(!Xt.has(o.tagName)){o.remove();return}[...o.attributes].forEach(i=>{Zt.has(i.name.toLowerCase())||o.removeAttribute(i.name)})}),r.innerHTML):""}var Qt="(min-width: 1200px)",Jt="(min-width: 600px)";function _t(e,n){if(!e)return"";let t=new DOMParser().parseFromString(`<picture>${e}</picture>`,"text/html");if(n==="desktop")return t.querySelector(`source[media="${Qt}"]`)?.getAttribute("srcset")??"";if(n==="tablet")return t.querySelector(`source[media="${Jt}"]`)?.getAttribute("srcset")??"";if(n==="mobile"){let r=t.querySelector("img");return r?.hasAttribute("data-mobile-set")?r.getAttribute("src")??"":""}return""}var J="mas-field",te=/(accent|primary|secondary)(-(outline|link))?/,ee=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function re(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}function xt(e,n){let t=document.createElement("template");t.innerHTML=e;let r=[...t.content.querySelectorAll("a")],o=r.filter(i=>rt.has(i.dataset.analyticsId));return o.length===0?e:o.length===r.length?n?null:e:(o.forEach(i=>i.remove()),t.innerHTML)}function ne(e,n){if(!e)return n;let t=e.closest(J);if(!(t||e.hasAttribute("fragment-id")))return n;if(n[at]=!0,n.wrapClauses=!0,dt(t?.aemFragment?.data?.priceLiterals,n),pt(e,n),t&&e.dataset.template===ot&&(n.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!n.promotionCode){let o=e.dataset.promotionCode??(t?y(t):null);o&&(n.promotionCode=o)}ut(t,n)}function oe(e,n){if(n.promotionCode||!e)return;let t=e.closest(J),r=e.dataset.promotionCode??(t?y(t):null);r&&(n.promotionCode=r)}function ie(e){mt(e,ne,oe)}var ae=`
mas-field {
    display: contents;
}

/* An :empty span still counts as a flex gap item under display:contents; hide it. */
mas-field > [data-role="mas-field-content"]:empty {
    display: none;
}

/* A headless mas-field is often authored with CTA classes (e.g. feds-cta) directly
   on the host. Those classes can carry their own display value at the same
   specificity as the rule above, which can beat display:contents and leave an
   empty, still-styled CTA box visible when the field resolves to nothing (e.g. a
   trial CTA stripped by hideTrialCTAs). #renderField sets [hidden] in that case;
   force it to win regardless of what other classes are on the host. */
mas-field[hidden] {
    display: none !important;
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

.table .row-heading .col-heading .pricing:has(.price-annual-prefix) {
  display: flex;
  flex-direction: column;
}

.table .row-heading .col-heading .pricing .price-annual-prefix + .price-annual,
.table .row-heading .col-heading .pricing .price-annual-prefix,
.table .row-heading .col-heading .pricing .price-annual-suffix {
  font-size: var(--type-heading-xxs-size);
  line-height: var(--type-heading-xxs-size);
  font-weight: 400;
  position: relative;
}

.pricing.has-pricing-after .price-annual-prefix {
  display: none;
}

.pricing.has-pricing-after:has(.price-annual-prefix) .price:not(.price-annual) {
  display: block;
}

.pricing.has-pricing-after .price-annual-prefix + .price-annual::before {
  content: '(';
}
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=ae,document.head.append(e)}function St(e,n=globalThis.location){return typeof e!="string"||!e?"":`<picture>${At(e,n)}</picture>`}var S,N,g,h,M,a,v,z,K,bt,D,Lt,Ct,j,X,Rt,Z,Q,wt,w,Nt,Mt,b,q=class extends HTMLElement{constructor(){super(...arguments);x(this,a);x(this,S,null);x(this,N,!1);x(this,g,null);Y(this,"settings",null);x(this,h,null);Y(this,"compatVersion");x(this,M,t=>{t.target===this.aemFragment&&(_(this,g,t.detail?.fields||null),this.settings=t.detail?.settings??null,_(this,N,!0),c(this,a,X).call(this),this.dispatchEvent(new CustomEvent(nt,{bubbles:!0,composed:!0,detail:t.detail})))})}get contextPromotionCode(){return this.getAttribute("data-promotion-code")}static get observedAttributes(){return["field"]}attributeChangedCallback(t,r,o){t==="field"&&(_(this,S,o),c(this,a,X).call(this))}connectedCallback(){this.addEventListener(R,p(this,M)),c(this,a,v).call(this),this.aemFragment?.setAttribute("hidden",""),ie(st())}disconnectedCallback(){this.removeEventListener(R,p(this,M))}checkReady(){return p(this,N)?Promise.resolve(!0):this.aemFragment?.classList.contains("error")?Promise.resolve(!1):new Promise(t=>{let r=()=>{this.removeEventListener(V,o),t(!0)},o=()=>{this.removeEventListener(R,r),t(!1)};this.addEventListener(R,r,{once:!0}),this.addEventListener(V,o,{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return lt(this)}};S=new WeakMap,N=new WeakMap,g=new WeakMap,h=new WeakMap,M=new WeakMap,a=new WeakSet,v=function(t=!1){if(p(this,h)?.isConnected&&p(this,h).matches('[data-role="mas-field-content"]')&&(!t||p(this,h).tagName==="SPAN"))return p(this,h);let r=this.querySelector(':scope > [data-role="mas-field-content"]');if(r&&(!t||r.tagName==="SPAN"))return _(this,h,r),r;t&&r?.remove();let o=document.createElement("span");return o.setAttribute("data-role","mas-field-content"),this.append(o),_(this,h,o),o},z=function(){this.querySelector(':scope > [data-role="mas-field-content"]')?.remove(),_(this,h,null)},K=function(t){let r=document.createElement("template");r.innerHTML=t;let o=r.content.querySelector("picture");if(!o)return;o.innerHTML=Tt(o.innerHTML),o.setAttribute("data-role","mas-field-content");let i=this.querySelector(':scope > [data-role="mas-field-content"]');i?i.replaceWith(o):this.append(o),_(this,h,o),c(this,a,w).call(this,o)},bt=function(t){let r=c(this,a,b).call(this,c(this,a,D).call(this,p(this,g).backgroundImageAltText));return`<img loading="lazy" ${typeof r=="string"&&r?`alt="${re(r)}"`:'role="none"'} src="${W(t)}">`},D=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},Lt=function(t){let r=t?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let o=t?.match(/^(.+)\[(.+)\]$/);return o?{fieldName:o[1],index:o[2]}:{fieldName:t,index:null}},Ct=function(t,r){if(typeof t!="string")return null;let o=document.createElement("template");o.innerHTML=t;let i;if(!isNaN(r)){let l=parseInt(r,10);i=[...o.content.querySelectorAll("a")][l-1]}return i||(i=o.content.querySelector(`a[data-key="${r}"]`)),i?(i.removeAttribute("class"),i.outerHTML):null},j=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},X=function(){if(!p(this,g)||!p(this,S))return;this.hidden=!1;let{fieldName:t,index:r}=c(this,a,Lt).call(this,p(this,S));if(r!==null&&isNaN(r)){let s=`${t.replace(/s$/,"")}Labels`,d=p(this,g)[s];if(d!==void 0){let f=(Array.isArray(d)?d:[d]).indexOf(r);if(f===-1){this.hidden=!0;return}let m=p(this,g)[t],u=Array.isArray(m)?m:m?[m]:[],A=c(this,a,D).call(this,u[f]);if(!A){this.hidden=!0;return}if(t==="ctas"&&this.settings?.hideTrialCTAs&&(A=xt(A,!0),A===null)){this.hidden=!0;return}c(this,a,j).call(this);let L=c(this,a,v).call(this,!0);L.innerHTML=c(this,a,b).call(this,A)??"",c(this,a,Z).call(this,L),c(this,a,Q).call(this,L),c(this,a,w).call(this,L);return}}let o=c(this,a,D).call(this,p(this,g)[t]);if(o===void 0){this.hidden=!0;return}if(c(this,a,j).call(this),r===null&&(t==="image"||t==="backgroundImage"||t==="backgrounds")){let s=c(this,a,b).call(this,o);if(typeof s=="string"&&s){let d=t==="image"||t==="backgrounds"?s:c(this,a,bt).call(this,s);c(this,a,K).call(this,St(d))}else c(this,a,z).call(this),this.hidden=!0;return}if(t==="backgrounds"&&r!==null){let s=c(this,a,b).call(this,_t(o,r)),d=typeof s=="string"&&s?gt(s):"";d?c(this,a,K).call(this,St(d)):(c(this,a,z).call(this),this.hidden=!0);return}let i=c(this,a,v).call(this,!0),l;if(r!==null){if(l=c(this,a,Ct).call(this,o,r),l===null){this.hidden=!0;return}}else l=c(this,a,b).call(this,o);if(typeof l=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs&&(l=xt(l,r!==null),l===null)){this.hidden=!0;return}if(p(this,S)==="ctas"){let s=c(this,a,Mt).call(this,l);if(s){i.replaceChildren(s),c(this,a,w).call(this,i);return}}i.innerHTML=l,c(this,a,Z).call(this,i),c(this,a,Q).call(this,i),c(this,a,w).call(this,i);return}if(l==null){this.hidden=!0;return}i.textContent=String(l)},Rt=function(t,r){return customElements.get("checkout-link")?.createCheckoutLink(t,r)??(()=>{let i=document.createElement("a",{is:"checkout-link"});return i.setAttribute("is","checkout-link"),i.innerHTML=`<span style="pointer-events: none;">${r}</span>`,i})()},Z=function(t){for(let r of t.querySelectorAll("a[data-wcs-osi]:not([is])")){let o=c(this,a,Rt).call(this,r.dataset,r.innerHTML);for(let{name:i,value:l}of r.attributes)["is","href"].includes(i)||o.setAttribute(i,l);r.replaceWith(o)}},Q=function(t){let r=t.querySelectorAll(".icon-button[data-tooltip]");for(let o of r){if(o.dataset.tooltipWired)continue;o.dataset.tooltipWired="1",o.querySelector("svg")||o.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),o.hasAttribute("tabindex")||o.setAttribute("tabindex","0"),o.hasAttribute("role")||o.setAttribute("role","button"),o.hasAttribute("aria-label")||o.setAttribute("aria-label",o.dataset.tooltip);let i=["top","bottom","left","right"],l=[...o.classList].find(f=>i.includes(f)),s=l||"top";l||o.classList.add(s),o.dataset.originalPosition=s,o.classList.add("hide-tooltip");let d=()=>{o.classList.remove("hide-tooltip"),c(this,a,wt).call(this,o)},E=()=>o.classList.add("hide-tooltip");o.addEventListener("mouseenter",d),o.addEventListener("focus",d),o.addEventListener("mouseleave",E),o.addEventListener("blur",E),o.addEventListener("keydown",f=>{f.key==="Escape"&&E()})}},wt=function(t){let r=["top","bottom","right","left"],o=window.innerWidth,i=12,l=document.querySelector("header")?.getBoundingClientRect().height||0,s=window.getComputedStyle(t,"::before"),d=F=>parseFloat(F)||0,E=d(s.width)+d(s.paddingLeft)+d(s.paddingRight),f=d(s.height)+d(s.paddingTop)+d(s.paddingBottom),m=t.getBoundingClientRect(),u=t.dataset.originalPosition||"top",A=r.find(F=>t.classList.contains(F)),tt=u==="top"||u==="bottom"?E/2:E,Pt=u==="top"?f+(u==="top"?i:0):f/2,P=m.top-Pt<l,H=m.bottom+(u==="bottom"?f+i:0)>window.innerHeight,C=m.right+tt+i>o,O=m.left-tt-i<0,U=m.left+E/2+i>o,k=m.left-E/2-i<0;if(u!==A&&!(C||O||P||H||U||k)){t.classList.remove(...r),t.classList.add(u);return}let T=u;C&&U?T="left":O&&k?T="right":C&&P||O&&P?T=U&&"left"||k&&"right"||"bottom":C!==O&&!H?T=C?"left":"right":P&&["top","left","right"].includes(u)?T="bottom":H&&["bottom","left","right"].includes(u)&&(T="top"),A!==T&&(t.classList.remove(...r),t.classList.add(T))},w=function(t){let r=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let o=(i,l)=>{if(l!=null)for(let s of r)s.hasAttribute(i)||s.setAttribute(i,l)};for(let i of ee)o(i,this.getAttribute(i));o("data-promotion-code",y(this))},Nt=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let i=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let s=document.createElement("a",{is:"checkout-link"});return s.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,s})();for(let{name:s,value:d}of t.attributes)["class","is","href"].includes(s)||i.setAttribute(s,d);if(i.firstElementChild?.classList.add("spectrum-Button-label"),t.className){let s=te.exec(t.className)?.[0]??"accent",d=s.startsWith("accent");return s.includes("-link")||(i.classList.add("button","con-button"),d?i.classList.add("blue"):s.startsWith("primary")&&!s.includes("-outline")&&i.classList.add("fill")),i}let l=t.parentElement?.tagName;if(l==="STRONG"||l==="EM"){let s=document.createElement(l.toLowerCase());return s.append(i),s}return i},Mt=function(t){let o=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!o.length)return null;let i=document.createElement("div");return i.setAttribute("slot","footer"),i.append(...o.map(l=>c(this,a,Nt).call(this,l))),i},b=function(t){if(typeof t!="string")return t;let r=t.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return t;let i=r.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(J,q);export{oe as checkoutOptionsProvider,ne as priceOptionsProvider,St as renderImageMarkup};
