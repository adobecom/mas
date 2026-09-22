var Lt=Object.defineProperty;var tt=e=>{throw TypeError(e)};var Rt=(e,o,t)=>o in e?Lt(e,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[o]=t;var Y=(e,o,t)=>Rt(e,typeof o!="symbol"?o+"":o,t),F=(e,o,t)=>o.has(e)||tt("Cannot "+t);var p=(e,o,t)=>(F(e,o,"read from private field"),t?t.call(e):o.get(e)),S=(e,o,t)=>o.has(e)?tt("Cannot add the same private member more than once"):o instanceof WeakSet?o.add(e):o.set(e,t),T=(e,o,t,n)=>(F(e,o,"write to private field"),n?n.call(e,t):o.set(e,t),t),c=(e,o,t)=>(F(e,o,"access private method"),t);var Jt=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),te=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var Ct='span[is="inline-price"][data-wcs-osi]',Nt='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var wt='a[is="upt-link"]',ee=`${Ct},${Nt},${wt}`,et=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var y="aem:load";var rt="mas:ready";var re=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var oe=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var ot="legal",nt="plan-type-text",it="mas-ff-defaults";var Ot="mas-commerce-service";function at(){return document.getElementsByTagName(Ot)?.[0]}function st(e){let o=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&o?.isInlinePrice&&o?.dataset?.template==="price"}var Mt=[".","!","?"],yt=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=yt,document.head.append(e)}var Pt="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function It(e){let o=e.closest(Pt)??e.parentNode,t=document.createRange();return t.setStart(o,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function ct(e){let o=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(n=>!n.closest("merch-addon"));return(o.find(n=>n.dataset.promotionCode&&n.dataset.promotionCode!=="cancel-context")??o[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function vt(e){let o=It(e);return!o||Mt.includes(o)?"upper":"lower"}function V(e,o){if(e.dataset.placeholder!==nt)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(o.wcsOsi=t,o.planTypeCase=vt(e))}function Ht(e,o){if(typeof e!="string"||!e)return null;let t;try{t=new URL(e,o)}catch{return null}return t.hostname.endsWith(".aem.page")?`${o}${t.pathname}${t.search}`:null}function $(e){if(typeof e!="string"||!e)return"";try{return new URL(e).href}catch{return""}}function Dt(e){if(typeof e!="string"||!e)return!1;try{return new URL(e).hostname.endsWith(".aem.page")}catch{return!1}}var Ut={png:{type:"image/png",format:"png"},jpg:{type:"image/jpeg",format:"jpg"},jpeg:{type:"image/jpeg",format:"jpg"},webp:{type:"image/webp",format:"webp"},gif:{type:"image/gif",format:"gif"}},P={width:2e3,media:"(min-width: 600px)"},lt=750;function I(e,o,t){let n=new URL(e);return n.searchParams.set("width",o),n.searchParams.set("format",t),n.searchParams.set("optimize","medium"),n.href}function kt(e){let o=new URL(e).pathname.split(".").pop().toLowerCase();return Ut[o]??null}function dt(e){if(!Dt(e))return"";let o=$(e),t=kt(o);if(!t)return`<img loading="lazy" alt="" src="${o}">`;let{type:n,format:r}=t;return[`<source type="image/webp" srcset="${I(o,P.width,"webply")}" media="${P.media}">`,`<source type="image/webp" srcset="${I(o,lt,"webply")}">`,`<source type="${n}" srcset="${I(o,P.width,r)}" media="${P.media}">`,`<img loading="lazy" alt="" src="${I(o,lt,r)}">`].join("")}function Yt(e){return e?.hostname==="www.adobe.com"||e?.hostname==="adobe.com"}function pt(e,o=globalThis.location){if(typeof e!="string"||!e||!Yt(o))return e;let t=document.createElement("template");return t.innerHTML=`<picture>${e}</picture>`,t.content.querySelectorAll("source[srcset], img[src]").forEach(n=>{let r=n.tagName==="IMG"?"src":"srcset",i=Ht(n.getAttribute(r),o.origin);i&&n.setAttribute(r,i)}),t.content.querySelector("picture").innerHTML}var Ft=new Set(["SOURCE","IMG"]),Vt=new Set(["src","srcset","media","type","alt","loading","data-mobile-set"]);function ut(e){if(typeof e!="string"||!e)return"";let o=document.createElement("template"),t=/^\s*<picture[\s>]/i.test(e);o.innerHTML=t?e:`<picture>${e}</picture>`;let n=o.content.querySelector("picture");return n?(n.querySelectorAll("*").forEach(r=>{if(!Ft.has(r.tagName)){r.remove();return}[...r.attributes].forEach(i=>{Vt.has(i.name.toLowerCase())||r.removeAttribute(i.name)})}),n.innerHTML):""}var $t="(min-width: 1200px)",Gt="(min-width: 600px)";function mt(e,o){if(!e)return"";let t=new DOMParser().parseFromString(`<picture>${e}</picture>`,"text/html");if(o==="desktop")return t.querySelector(`source[media="${$t}"]`)?.getAttribute("srcset")??"";if(o==="tablet")return t.querySelector(`source[media="${Gt}"]`)?.getAttribute("srcset")??"";if(o==="mobile"){let n=t.querySelector("img");return n?.hasAttribute("data-mobile-set")?n.getAttribute("src")??"":""}return""}var Z="mas-field",Wt=/(accent|primary|secondary)(-(outline|link))?/,qt=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function Q(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")?e.getAttribute("data-promotion-code"):null}function ht(e,o){let t=document.createElement("template");t.innerHTML=e;let n=[...t.content.querySelectorAll("a")],r=n.filter(i=>et.has(i.dataset.analyticsId));return r.length===0?e:r.length===n.length?o?null:e:(r.forEach(i=>i.remove()),t.innerHTML)}function ft(e,o){if(!e)return o;let t=e.closest(Z);if(!(t||e.hasAttribute("fragment-id")))return o;o[it]=!0,o.wrapClauses=!0;let r=t?.aemFragment?.data?.priceLiterals;if(r&&(o.literals??(o.literals={}),Object.assign(o.literals,r)),st(e)&&(o.displayPerUnit=!1,o.displayTax=!1),t&&e.dataset.template===ot&&(o.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!o.promotionCode){let i=e.dataset.promotionCode??(t?Q(t):null);i&&(o.promotionCode=i)}o.displayAnnual===void 0&&typeof t?.settings?.displayAnnual=="boolean"&&(o.displayAnnual=t.settings.displayAnnual)}function Kt(e,o){if(o.promotionCode||!e)return;let t=e.closest(Z),n=e.dataset.promotionCode??(t?Q(t):null);n&&(o.promotionCode=n)}function zt(e){!e?.providers||e.providers.has(ft)||(e.providers.price(ft),e.providers.checkout(Kt),e.providers.has(V)||e.providers.price(V))}var jt=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=jt,document.head.append(e)}function Et(e,o=globalThis.location){return typeof e!="string"||!e?"":`<picture>${pt(e,o)}</picture>`}var x,N,_,h,w,a,v,B,W,q,At,gt,K,z,Tt,j,X,_t,R,St,xt,C,G=class extends HTMLElement{constructor(){super(...arguments);S(this,a);S(this,x,null);S(this,N,!1);S(this,_,null);Y(this,"settings",null);S(this,h,null);Y(this,"compatVersion");S(this,w,t=>{t.target===this.aemFragment&&(T(this,_,t.detail?.fields||null),this.settings=t.detail?.settings??null,T(this,N,!0),c(this,a,z).call(this),this.dispatchEvent(new CustomEvent(rt,{bubbles:!0,composed:!0,detail:t.detail})))})}static get observedAttributes(){return["field"]}attributeChangedCallback(t,n,r){t==="field"&&(T(this,x,r),c(this,a,z).call(this))}connectedCallback(){this.addEventListener(y,p(this,w)),c(this,a,v).call(this),this.aemFragment?.setAttribute("hidden",""),zt(at())}disconnectedCallback(){this.removeEventListener(y,p(this,w))}checkReady(){return p(this,N)?Promise.resolve(!0):new Promise(t=>{this.addEventListener(y,()=>t(!0),{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return ct(this)}};x=new WeakMap,N=new WeakMap,_=new WeakMap,h=new WeakMap,w=new WeakMap,a=new WeakSet,v=function(t=!1){if(p(this,h)?.isConnected&&p(this,h).matches('[data-role="mas-field-content"]')&&(!t||p(this,h).tagName==="SPAN"))return p(this,h);let n=this.querySelector(':scope > [data-role="mas-field-content"]');if(n&&(!t||n.tagName==="SPAN"))return T(this,h,n),n;t&&n?.remove();let r=document.createElement("span");return r.setAttribute("data-role","mas-field-content"),this.append(r),T(this,h,r),r},B=function(){this.querySelector(':scope > [data-role="mas-field-content"]')?.remove(),T(this,h,null)},W=function(t){let n=document.createElement("template");n.innerHTML=t;let r=n.content.querySelector("picture");if(!r)return;r.innerHTML=ut(r.innerHTML),r.setAttribute("data-role","mas-field-content");let i=this.querySelector(':scope > [data-role="mas-field-content"]');i?i.replaceWith(r):this.append(r),T(this,h,r),c(this,a,R).call(this,r)},q=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},At=function(t){let n=t?.match(/^(.+)\[(\d+)\]$/);if(n)return{fieldName:n[1],index:parseInt(n[2],10)};let r=t?.match(/^(.+)\[(.+)\]$/);return r?{fieldName:r[1],index:r[2]}:{fieldName:t,index:null}},gt=function(t,n){if(typeof t!="string")return null;let r=document.createElement("template");r.innerHTML=t;let i;if(!isNaN(n)){let l=parseInt(n,10);i=[...r.content.querySelectorAll("a")][l-1]}return i||(i=r.content.querySelector(`a[data-key="${n}"]`)),i?(i.removeAttribute("class"),i.outerHTML):null},K=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},z=function(){if(!p(this,_)||!p(this,x))return;this.hidden=!1;let{fieldName:t,index:n}=c(this,a,At).call(this,p(this,x));if(n!==null&&isNaN(n)){let s=`${t.replace(/s$/,"")}Labels`,d=p(this,_)[s];if(d!==void 0){let f=(Array.isArray(d)?d:[d]).indexOf(n);if(f===-1){this.hidden=!0;return}let m=p(this,_)[t],u=Array.isArray(m)?m:m?[m]:[],A=c(this,a,q).call(this,u[f]);if(!A){this.hidden=!0;return}if(t==="ctas"&&this.settings?.hideTrialCTAs&&(A=ht(A,!0),A===null)){this.hidden=!0;return}c(this,a,K).call(this);let b=c(this,a,v).call(this,!0);b.innerHTML=c(this,a,C).call(this,A)??"",c(this,a,j).call(this,b),c(this,a,X).call(this,b),c(this,a,R).call(this,b);return}}let r=c(this,a,q).call(this,p(this,_)[t]);if(r===void 0){this.hidden=!0;return}if(c(this,a,K).call(this),n===null&&(t==="image"||t==="backgroundImage"||t==="backgrounds")){let s=c(this,a,C).call(this,r);if(typeof s=="string"&&s){let d=t==="image"||t==="backgrounds"?s:`<img loading="lazy" alt="" src="${$(s)}">`;c(this,a,W).call(this,Et(d))}else c(this,a,B).call(this),this.hidden=!0;return}if(t==="backgrounds"&&n!==null){let s=c(this,a,C).call(this,mt(r,n)),d=typeof s=="string"&&s?dt(s):"";d?c(this,a,W).call(this,Et(d)):(c(this,a,B).call(this),this.hidden=!0);return}let i=c(this,a,v).call(this,!0),l;if(n!==null){if(l=c(this,a,gt).call(this,r,n),l===null){this.hidden=!0;return}}else l=c(this,a,C).call(this,r);if(typeof l=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs&&(l=ht(l,n!==null),l===null)){this.hidden=!0;return}if(p(this,x)==="ctas"){let s=c(this,a,xt).call(this,l);if(s){i.replaceChildren(s),c(this,a,R).call(this,i);return}}i.innerHTML=l,c(this,a,j).call(this,i),c(this,a,X).call(this,i),c(this,a,R).call(this,i);return}if(l==null){this.hidden=!0;return}i.textContent=String(l)},Tt=function(t,n){return customElements.get("checkout-link")?.createCheckoutLink(t,n)??(()=>{let i=document.createElement("a",{is:"checkout-link"});return i.setAttribute("is","checkout-link"),i.innerHTML=`<span style="pointer-events: none;">${n}</span>`,i})()},j=function(t){for(let n of t.querySelectorAll("a[data-wcs-osi]:not([is])")){let r=c(this,a,Tt).call(this,n.dataset,n.innerHTML);for(let{name:i,value:l}of n.attributes)["is","href"].includes(i)||r.setAttribute(i,l);n.replaceWith(r)}},X=function(t){let n=t.querySelectorAll(".icon-button[data-tooltip]");for(let r of n){if(r.dataset.tooltipWired)continue;r.dataset.tooltipWired="1",r.querySelector("svg")||r.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),r.hasAttribute("tabindex")||r.setAttribute("tabindex","0"),r.hasAttribute("role")||r.setAttribute("role","button"),r.hasAttribute("aria-label")||r.setAttribute("aria-label",r.dataset.tooltip);let i=["top","bottom","left","right"],l=[...r.classList].find(f=>i.includes(f)),s=l||"top";l||r.classList.add(s),r.dataset.originalPosition=s,r.classList.add("hide-tooltip");let d=()=>{r.classList.remove("hide-tooltip"),c(this,a,_t).call(this,r)},E=()=>r.classList.add("hide-tooltip");r.addEventListener("mouseenter",d),r.addEventListener("focus",d),r.addEventListener("mouseleave",E),r.addEventListener("blur",E),r.addEventListener("keydown",f=>{f.key==="Escape"&&E()})}},_t=function(t){let n=["top","bottom","right","left"],r=window.innerWidth,i=12,l=document.querySelector("header")?.getBoundingClientRect().height||0,s=window.getComputedStyle(t,"::before"),d=k=>parseFloat(k)||0,E=d(s.width)+d(s.paddingLeft)+d(s.paddingRight),f=d(s.height)+d(s.paddingTop)+d(s.paddingBottom),m=t.getBoundingClientRect(),u=t.dataset.originalPosition||"top",A=n.find(k=>t.classList.contains(k)),J=u==="top"||u==="bottom"?E/2:E,bt=u==="top"?f+(u==="top"?i:0):f/2,O=m.top-bt<l,H=m.bottom+(u==="bottom"?f+i:0)>window.innerHeight,L=m.right+J+i>r,M=m.left-J-i<0,D=m.left+E/2+i>r,U=m.left-E/2-i<0;if(u!==A&&!(L||M||O||H||D||U)){t.classList.remove(...n),t.classList.add(u);return}let g=u;L&&D?g="left":M&&U?g="right":L&&O||M&&O?g=D&&"left"||U&&"right"||"bottom":L!==M&&!H?g=L?"left":"right":O&&["top","left","right"].includes(u)?g="bottom":H&&["bottom","left","right"].includes(u)&&(g="top"),A!==g&&(t.classList.remove(...n),t.classList.add(g))},R=function(t){let n=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!n.length)return;let r=(i,l)=>{if(l!=null)for(let s of n)s.hasAttribute(i)||s.setAttribute(i,l)};for(let i of qt)r(i,this.getAttribute(i));r("data-promotion-code",Q(this))},St=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let i=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let s=document.createElement("a",{is:"checkout-link"});return s.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,s})();for(let{name:s,value:d}of t.attributes)["class","is","href"].includes(s)||i.setAttribute(s,d);if(i.firstElementChild?.classList.add("spectrum-Button-label"),t.className){let s=Wt.exec(t.className)?.[0]??"accent",d=s.startsWith("accent");return s.includes("-link")||(i.classList.add("button","con-button"),d?i.classList.add("blue"):s.startsWith("primary")&&!s.includes("-outline")&&i.classList.add("fill")),i}let l=t.parentElement?.tagName;if(l==="STRONG"||l==="EM"){let s=document.createElement(l.toLowerCase());return s.append(i),s}return i},xt=function(t){let r=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!r.length)return null;let i=document.createElement("div");return i.setAttribute("slot","footer"),i.append(...r.map(l=>c(this,a,St).call(this,l))),i},C=function(t){if(typeof t!="string")return t;let n=t.trim();if(!(n.startsWith("<p>")&&n.endsWith("</p>")))return t;let i=n.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(Z,G);export{Kt as checkoutOptionsProvider,ft as priceOptionsProvider,Et as renderImageMarkup};
