var wt=Object.defineProperty;var tt=e=>{throw TypeError(e)};var yt=(e,o,t)=>o in e?wt(e,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[o]=t;var V=(e,o,t)=>yt(e,typeof o!="symbol"?o+"":o,t),$=(e,o,t)=>o.has(e)||tt("Cannot "+t);var p=(e,o,t)=>($(e,o,"read from private field"),t?t.call(e):o.get(e)),x=(e,o,t)=>o.has(e)?tt("Cannot add the same private member more than once"):o instanceof WeakSet?o.add(e):o.set(e,t),_=(e,o,t,r)=>($(e,o,"write to private field"),r?r.call(e,t):o.set(e,t),t),c=(e,o,t)=>($(e,o,"access private method"),t);var ae=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),se=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var Pt='span[is="inline-price"][data-wcs-osi]',Ot='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Mt='a[is="upt-link"]',ce=`${Pt},${Ot},${Mt}`,et=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var O="aem:load";var ot="mas:ready";var le=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var de=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var rt="legal",nt="plan-type-text",it="mas-ff-defaults";var It="mas-commerce-service";function at(){return document.getElementsByTagName(It)?.[0]}function st(e){let o=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&o?.isInlinePrice&&o?.dataset?.template==="price"}var vt=[".","!","?"],Dt=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=Dt,document.head.append(e)}var Ht="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function Ut(e){let o=e.closest(Ht)??e.parentNode,t=document.createRange();return t.setStart(o,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function ct(e){let o=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(r=>!r.closest("merch-addon"));return(o.find(r=>r.dataset.promotionCode&&r.dataset.promotionCode!=="cancel-context")??o[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function kt(e){let o=Ut(e);return!o||vt.includes(o)?"upper":"lower"}function G(e,o){if(e.dataset.placeholder!==nt)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(o.wcsOsi=t,o.planTypeCase=kt(e))}function Ft(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")}function M(e){return Ft(e)?e.contextPromotionCode:null}function lt(e,o){e&&(o.literals??(o.literals={}),Object.assign(o.literals,e))}function dt(e,o){st(e)&&(o.displayPerUnit=!1,o.displayTax=!1)}function pt(e,o){o.displayAnnual===void 0&&typeof e?.settings?.displayAnnual=="boolean"&&(o.displayAnnual=e.settings.displayAnnual,e.settings.displayAnnual&&e.setAttribute("annualized",""))}function ut(e,o,t){!e?.providers||e.providers.has(o)||(e.providers.price(o),e.providers.checkout(t),e.providers.has(G)||e.providers.price(G))}function Vt(e,o){if(typeof e!="string"||!e)return null;let t;try{t=new URL(e,o)}catch{return null}return t.hostname.endsWith(".aem.page")?`${o}${t.pathname}${t.search}`:null}function B(e){if(typeof e!="string"||!e)return"";try{return new URL(e).href}catch{return""}}function $t(e){if(typeof e!="string"||!e)return!1;try{return new URL(e).hostname.endsWith(".aem.page")}catch{return!1}}var Gt={png:{type:"image/png",format:"png"},jpg:{type:"image/jpeg",format:"jpg"},jpeg:{type:"image/jpeg",format:"jpg"},webp:{type:"image/webp",format:"webp"},gif:{type:"image/gif",format:"gif"}},I={width:2e3,media:"(min-width: 600px)"},mt=750;function v(e,o,t){let r=new URL(e);return r.searchParams.set("width",o),r.searchParams.set("format",t),r.searchParams.set("optimize","medium"),r.href}function Bt(e){let o=new URL(e).pathname.split(".").pop().toLowerCase();return Gt[o]??null}function ft(e){if(!$t(e))return"";let o=B(e),t=Bt(o);if(!t)return`<img loading="lazy" alt="" src="${o}">`;let{type:r,format:n}=t;return[`<source type="image/webp" srcset="${v(o,I.width,"webply")}" media="${I.media}">`,`<source type="image/webp" srcset="${v(o,mt,"webply")}">`,`<source type="${r}" srcset="${v(o,I.width,n)}" media="${I.media}">`,`<img loading="lazy" alt="" src="${v(o,mt,n)}">`].join("")}function Wt(e){return e?.hostname==="www.adobe.com"||e?.hostname==="adobe.com"}function ht(e,o=globalThis.location){if(typeof e!="string"||!e||!Wt(o))return e;let t=document.createElement("template");return t.innerHTML=`<picture>${e}</picture>`,t.content.querySelectorAll("source[srcset], img[src]").forEach(r=>{let n=r.tagName==="IMG"?"src":"srcset",i=Vt(r.getAttribute(n),o.origin);i&&r.setAttribute(n,i)}),t.content.querySelector("picture").innerHTML}var qt=new Set(["SOURCE","IMG"]),Kt=new Set(["src","srcset","media","type","alt","role","loading","data-mobile-set"]);function Et(e){if(typeof e!="string"||!e)return"";let o=document.createElement("template"),t=/^\s*<picture[\s>]/i.test(e);o.innerHTML=t?e:`<picture>${e}</picture>`;let r=o.content.querySelector("picture");return r?(r.querySelectorAll("*").forEach(n=>{if(!qt.has(n.tagName)){n.remove();return}[...n.attributes].forEach(i=>{Kt.has(i.name.toLowerCase())||n.removeAttribute(i.name)})}),r.innerHTML):""}var zt="(min-width: 1200px)",jt="(min-width: 600px)";function gt(e,o){if(!e)return"";let t=new DOMParser().parseFromString(`<picture>${e}</picture>`,"text/html");if(o==="desktop")return t.querySelector(`source[media="${zt}"]`)?.getAttribute("srcset")??"";if(o==="tablet")return t.querySelector(`source[media="${jt}"]`)?.getAttribute("srcset")??"";if(o==="mobile"){let r=t.querySelector("img");return r?.hasAttribute("data-mobile-set")?r.getAttribute("src")??"":""}return""}var Q="mas-field",Xt=/(accent|primary|secondary)(-(outline|link))?/,Zt=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function Qt(e){return e.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}function At(e,o){let t=document.createElement("template");t.innerHTML=e;let r=[...t.content.querySelectorAll("a")],n=r.filter(i=>et.has(i.dataset.analyticsId));return n.length===0?e:n.length===r.length?o?null:e:(n.forEach(i=>i.remove()),t.innerHTML)}function Jt(e,o){if(!e)return o;let t=e.closest(Q);if(!(t||e.hasAttribute("fragment-id")))return o;if(o[it]=!0,o.wrapClauses=!0,lt(t?.aemFragment?.data?.priceLiterals,o),dt(e,o),t&&e.dataset.template===rt&&(o.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!o.promotionCode){let n=e.dataset.promotionCode??(t?M(t):null);n&&(o.promotionCode=n)}pt(t,o)}function te(e,o){if(o.promotionCode||!e)return;let t=e.closest(Q),r=e.dataset.promotionCode??(t?M(t):null);r&&(o.promotionCode=r)}function ee(e){ut(e,Jt,te)}var oe=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=oe,document.head.append(e)}function Tt(e,o=globalThis.location){return typeof e!="string"||!e?"":`<picture>${ht(e,o)}</picture>`}var S,N,g,f,w,a,D,q,K,_t,H,xt,St,z,j,bt,X,Z,Lt,R,Ct,Rt,b,W=class extends HTMLElement{constructor(){super(...arguments);x(this,a);x(this,S,null);x(this,N,!1);x(this,g,null);V(this,"settings",null);x(this,f,null);V(this,"compatVersion");x(this,w,t=>{t.target===this.aemFragment&&(_(this,g,t.detail?.fields||null),this.settings=t.detail?.settings??null,_(this,N,!0),c(this,a,j).call(this),this.dispatchEvent(new CustomEvent(ot,{bubbles:!0,composed:!0,detail:t.detail})))})}get contextPromotionCode(){return this.getAttribute("data-promotion-code")}static get observedAttributes(){return["field"]}attributeChangedCallback(t,r,n){t==="field"&&(_(this,S,n),c(this,a,j).call(this))}connectedCallback(){this.addEventListener(O,p(this,w)),c(this,a,D).call(this),this.aemFragment?.setAttribute("hidden",""),ee(at())}disconnectedCallback(){this.removeEventListener(O,p(this,w))}checkReady(){return p(this,N)?Promise.resolve(!0):new Promise(t=>{this.addEventListener(O,()=>t(!0),{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return ct(this)}};S=new WeakMap,N=new WeakMap,g=new WeakMap,f=new WeakMap,w=new WeakMap,a=new WeakSet,D=function(t=!1){if(p(this,f)?.isConnected&&p(this,f).matches('[data-role="mas-field-content"]')&&(!t||p(this,f).tagName==="SPAN"))return p(this,f);let r=this.querySelector(':scope > [data-role="mas-field-content"]');if(r&&(!t||r.tagName==="SPAN"))return _(this,f,r),r;t&&r?.remove();let n=document.createElement("span");return n.setAttribute("data-role","mas-field-content"),this.append(n),_(this,f,n),n},q=function(){this.querySelector(':scope > [data-role="mas-field-content"]')?.remove(),_(this,f,null)},K=function(t){let r=document.createElement("template");r.innerHTML=t;let n=r.content.querySelector("picture");if(!n)return;n.innerHTML=Et(n.innerHTML),n.setAttribute("data-role","mas-field-content");let i=this.querySelector(':scope > [data-role="mas-field-content"]');i?i.replaceWith(n):this.append(n),_(this,f,n),c(this,a,R).call(this,n)},_t=function(t){let r=c(this,a,b).call(this,c(this,a,H).call(this,p(this,g).backgroundImageAltText));return`<img loading="lazy" ${typeof r=="string"&&r?`alt="${Qt(r)}"`:'role="none"'} src="${B(t)}">`},H=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},xt=function(t){let r=t?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let n=t?.match(/^(.+)\[(.+)\]$/);return n?{fieldName:n[1],index:n[2]}:{fieldName:t,index:null}},St=function(t,r){if(typeof t!="string")return null;let n=document.createElement("template");n.innerHTML=t;let i;if(!isNaN(r)){let l=parseInt(r,10);i=[...n.content.querySelectorAll("a")][l-1]}return i||(i=n.content.querySelector(`a[data-key="${r}"]`)),i?(i.removeAttribute("class"),i.outerHTML):null},z=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},j=function(){if(!p(this,g)||!p(this,S))return;this.hidden=!1;let{fieldName:t,index:r}=c(this,a,xt).call(this,p(this,S));if(r!==null&&isNaN(r)){let s=`${t.replace(/s$/,"")}Labels`,d=p(this,g)[s];if(d!==void 0){let h=(Array.isArray(d)?d:[d]).indexOf(r);if(h===-1){this.hidden=!0;return}let m=p(this,g)[t],u=Array.isArray(m)?m:m?[m]:[],A=c(this,a,H).call(this,u[h]);if(!A){this.hidden=!0;return}if(t==="ctas"&&this.settings?.hideTrialCTAs&&(A=At(A,!0),A===null)){this.hidden=!0;return}c(this,a,z).call(this);let L=c(this,a,D).call(this,!0);L.innerHTML=c(this,a,b).call(this,A)??"",c(this,a,X).call(this,L),c(this,a,Z).call(this,L),c(this,a,R).call(this,L);return}}let n=c(this,a,H).call(this,p(this,g)[t]);if(n===void 0){this.hidden=!0;return}if(c(this,a,z).call(this),r===null&&(t==="image"||t==="backgroundImage"||t==="backgrounds")){let s=c(this,a,b).call(this,n);if(typeof s=="string"&&s){let d=t==="image"||t==="backgrounds"?s:c(this,a,_t).call(this,s);c(this,a,K).call(this,Tt(d))}else c(this,a,q).call(this),this.hidden=!0;return}if(t==="backgrounds"&&r!==null){let s=c(this,a,b).call(this,gt(n,r)),d=typeof s=="string"&&s?ft(s):"";d?c(this,a,K).call(this,Tt(d)):(c(this,a,q).call(this),this.hidden=!0);return}let i=c(this,a,D).call(this,!0),l;if(r!==null){if(l=c(this,a,St).call(this,n,r),l===null){this.hidden=!0;return}}else l=c(this,a,b).call(this,n);if(typeof l=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs&&(l=At(l,r!==null),l===null)){this.hidden=!0;return}if(p(this,S)==="ctas"){let s=c(this,a,Rt).call(this,l);if(s){i.replaceChildren(s),c(this,a,R).call(this,i);return}}i.innerHTML=l,c(this,a,X).call(this,i),c(this,a,Z).call(this,i),c(this,a,R).call(this,i);return}if(l==null){this.hidden=!0;return}i.textContent=String(l)},bt=function(t,r){return customElements.get("checkout-link")?.createCheckoutLink(t,r)??(()=>{let i=document.createElement("a",{is:"checkout-link"});return i.setAttribute("is","checkout-link"),i.innerHTML=`<span style="pointer-events: none;">${r}</span>`,i})()},X=function(t){for(let r of t.querySelectorAll("a[data-wcs-osi]:not([is])")){let n=c(this,a,bt).call(this,r.dataset,r.innerHTML);for(let{name:i,value:l}of r.attributes)["is","href"].includes(i)||n.setAttribute(i,l);r.replaceWith(n)}},Z=function(t){let r=t.querySelectorAll(".icon-button[data-tooltip]");for(let n of r){if(n.dataset.tooltipWired)continue;n.dataset.tooltipWired="1",n.querySelector("svg")||n.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),n.hasAttribute("tabindex")||n.setAttribute("tabindex","0"),n.hasAttribute("role")||n.setAttribute("role","button"),n.hasAttribute("aria-label")||n.setAttribute("aria-label",n.dataset.tooltip);let i=["top","bottom","left","right"],l=[...n.classList].find(h=>i.includes(h)),s=l||"top";l||n.classList.add(s),n.dataset.originalPosition=s,n.classList.add("hide-tooltip");let d=()=>{n.classList.remove("hide-tooltip"),c(this,a,Lt).call(this,n)},E=()=>n.classList.add("hide-tooltip");n.addEventListener("mouseenter",d),n.addEventListener("focus",d),n.addEventListener("mouseleave",E),n.addEventListener("blur",E),n.addEventListener("keydown",h=>{h.key==="Escape"&&E()})}},Lt=function(t){let r=["top","bottom","right","left"],n=window.innerWidth,i=12,l=document.querySelector("header")?.getBoundingClientRect().height||0,s=window.getComputedStyle(t,"::before"),d=F=>parseFloat(F)||0,E=d(s.width)+d(s.paddingLeft)+d(s.paddingRight),h=d(s.height)+d(s.paddingTop)+d(s.paddingBottom),m=t.getBoundingClientRect(),u=t.dataset.originalPosition||"top",A=r.find(F=>t.classList.contains(F)),J=u==="top"||u==="bottom"?E/2:E,Nt=u==="top"?h+(u==="top"?i:0):h/2,y=m.top-Nt<l,U=m.bottom+(u==="bottom"?h+i:0)>window.innerHeight,C=m.right+J+i>n,P=m.left-J-i<0,k=m.left+E/2+i>n,Y=m.left-E/2-i<0;if(u!==A&&!(C||P||y||U||k||Y)){t.classList.remove(...r),t.classList.add(u);return}let T=u;C&&k?T="left":P&&Y?T="right":C&&y||P&&y?T=k&&"left"||Y&&"right"||"bottom":C!==P&&!U?T=C?"left":"right":y&&["top","left","right"].includes(u)?T="bottom":U&&["bottom","left","right"].includes(u)&&(T="top"),A!==T&&(t.classList.remove(...r),t.classList.add(T))},R=function(t){let r=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let n=(i,l)=>{if(l!=null)for(let s of r)s.hasAttribute(i)||s.setAttribute(i,l)};for(let i of Zt)n(i,this.getAttribute(i));n("data-promotion-code",M(this))},Ct=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let i=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let s=document.createElement("a",{is:"checkout-link"});return s.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,s})();for(let{name:s,value:d}of t.attributes)["class","is","href"].includes(s)||i.setAttribute(s,d);if(i.firstElementChild?.classList.add("spectrum-Button-label"),t.className){let s=Xt.exec(t.className)?.[0]??"accent",d=s.startsWith("accent");return s.includes("-link")||(i.classList.add("button","con-button"),d?i.classList.add("blue"):s.startsWith("primary")&&!s.includes("-outline")&&i.classList.add("fill")),i}let l=t.parentElement?.tagName;if(l==="STRONG"||l==="EM"){let s=document.createElement(l.toLowerCase());return s.append(i),s}return i},Rt=function(t){let n=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!n.length)return null;let i=document.createElement("div");return i.setAttribute("slot","footer"),i.append(...n.map(l=>c(this,a,Ct).call(this,l))),i},b=function(t){if(typeof t!="string")return t;let r=t.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return t;let i=r.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(Q,W);export{te as checkoutOptionsProvider,Jt as priceOptionsProvider,Tt as renderImageMarkup};
