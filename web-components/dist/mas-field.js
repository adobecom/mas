var Nt=Object.defineProperty;var tt=e=>{throw TypeError(e)};var wt=(e,o,t)=>o in e?Nt(e,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[o]=t;var F=(e,o,t)=>wt(e,typeof o!="symbol"?o+"":o,t),V=(e,o,t)=>o.has(e)||tt("Cannot "+t);var p=(e,o,t)=>(V(e,o,"read from private field"),t?t.call(e):o.get(e)),x=(e,o,t)=>o.has(e)?tt("Cannot add the same private member more than once"):o instanceof WeakSet?o.add(e):o.set(e,t),T=(e,o,t,n)=>(V(e,o,"write to private field"),n?n.call(e,t):o.set(e,t),t),c=(e,o,t)=>(V(e,o,"access private method"),t);var ne=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),ie=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var yt='span[is="inline-price"][data-wcs-osi]',Pt='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Ot='a[is="upt-link"]',ae=`${yt},${Pt},${Ot}`,et=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var O="aem:load";var ot="mas:ready";var se=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var ce=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var rt="legal",nt="plan-type-text",it="mas-ff-defaults";var Mt="mas-commerce-service";function at(){return document.getElementsByTagName(Mt)?.[0]}function st(e){let o=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&o?.isInlinePrice&&o?.dataset?.template==="price"}var It=[".","!","?"],vt=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=vt,document.head.append(e)}var Dt="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function Ht(e){let o=e.closest(Dt)??e.parentNode,t=document.createRange();return t.setStart(o,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function ct(e){let o=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(n=>!n.closest("merch-addon"));return(o.find(n=>n.dataset.promotionCode&&n.dataset.promotionCode!=="cancel-context")??o[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function Ut(e){let o=Ht(e);return!o||It.includes(o)?"upper":"lower"}function G(e,o){if(e.dataset.placeholder!==nt)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(o.wcsOsi=t,o.planTypeCase=Ut(e))}function Yt(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")}function M(e){return Yt(e)?e.contextPromotionCode:null}function lt(e,o){e&&(o.literals??(o.literals={}),Object.assign(o.literals,e))}function dt(e,o){st(e)&&(o.displayPerUnit=!1,o.displayTax=!1)}function pt(e,o){o.displayAnnual===void 0&&typeof e?.settings?.displayAnnual=="boolean"&&(o.displayAnnual=e.settings.displayAnnual,e.settings.displayAnnual&&e.setAttribute("annualized",""))}function ut(e,o,t){!e?.providers||e.providers.has(o)||(e.providers.price(o),e.providers.checkout(t),e.providers.has(G)||e.providers.price(G))}function Ft(e,o){if(typeof e!="string"||!e)return null;let t;try{t=new URL(e,o)}catch{return null}return t.hostname.endsWith(".aem.page")?`${o}${t.pathname}${t.search}`:null}function $(e){if(typeof e!="string"||!e)return"";try{return new URL(e).href}catch{return""}}function Vt(e){if(typeof e!="string"||!e)return!1;try{return new URL(e).hostname.endsWith(".aem.page")}catch{return!1}}var Gt={png:{type:"image/png",format:"png"},jpg:{type:"image/jpeg",format:"jpg"},jpeg:{type:"image/jpeg",format:"jpg"},webp:{type:"image/webp",format:"webp"},gif:{type:"image/gif",format:"gif"}},I={width:2e3,media:"(min-width: 600px)"},mt=750;function v(e,o,t){let n=new URL(e);return n.searchParams.set("width",o),n.searchParams.set("format",t),n.searchParams.set("optimize","medium"),n.href}function $t(e){let o=new URL(e).pathname.split(".").pop().toLowerCase();return Gt[o]??null}function ft(e){if(!Vt(e))return"";let o=$(e),t=$t(o);if(!t)return`<img loading="lazy" alt="" src="${o}">`;let{type:n,format:r}=t;return[`<source type="image/webp" srcset="${v(o,I.width,"webply")}" media="${I.media}">`,`<source type="image/webp" srcset="${v(o,mt,"webply")}">`,`<source type="${n}" srcset="${v(o,I.width,r)}" media="${I.media}">`,`<img loading="lazy" alt="" src="${v(o,mt,r)}">`].join("")}function Bt(e){return e?.hostname==="www.adobe.com"||e?.hostname==="adobe.com"}function ht(e,o=globalThis.location){if(typeof e!="string"||!e||!Bt(o))return e;let t=document.createElement("template");return t.innerHTML=`<picture>${e}</picture>`,t.content.querySelectorAll("source[srcset], img[src]").forEach(n=>{let r=n.tagName==="IMG"?"src":"srcset",i=Ft(n.getAttribute(r),o.origin);i&&n.setAttribute(r,i)}),t.content.querySelector("picture").innerHTML}var Wt=new Set(["SOURCE","IMG"]),qt=new Set(["src","srcset","media","type","alt","loading","data-mobile-set"]);function Et(e){if(typeof e!="string"||!e)return"";let o=document.createElement("template"),t=/^\s*<picture[\s>]/i.test(e);o.innerHTML=t?e:`<picture>${e}</picture>`;let n=o.content.querySelector("picture");return n?(n.querySelectorAll("*").forEach(r=>{if(!Wt.has(r.tagName)){r.remove();return}[...r.attributes].forEach(i=>{qt.has(i.name.toLowerCase())||r.removeAttribute(i.name)})}),n.innerHTML):""}var Kt="(min-width: 1200px)",zt="(min-width: 600px)";function gt(e,o){if(!e)return"";let t=new DOMParser().parseFromString(`<picture>${e}</picture>`,"text/html");if(o==="desktop")return t.querySelector(`source[media="${Kt}"]`)?.getAttribute("srcset")??"";if(o==="tablet")return t.querySelector(`source[media="${zt}"]`)?.getAttribute("srcset")??"";if(o==="mobile"){let n=t.querySelector("img");return n?.hasAttribute("data-mobile-set")?n.getAttribute("src")??"":""}return""}var Q="mas-field",jt=/(accent|primary|secondary)(-(outline|link))?/,Xt=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function At(e,o){let t=document.createElement("template");t.innerHTML=e;let n=[...t.content.querySelectorAll("a")],r=n.filter(i=>et.has(i.dataset.analyticsId));return r.length===0?e:r.length===n.length?o?null:e:(r.forEach(i=>i.remove()),t.innerHTML)}function Zt(e,o){if(!e)return o;let t=e.closest(Q);if(!(t||e.hasAttribute("fragment-id")))return o;if(o[it]=!0,o.wrapClauses=!0,lt(t?.aemFragment?.data?.priceLiterals,o),dt(e,o),t&&e.dataset.template===rt&&(o.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!o.promotionCode){let r=e.dataset.promotionCode??(t?M(t):null);r&&(o.promotionCode=r)}pt(t,o)}function Qt(e,o){if(o.promotionCode||!e)return;let t=e.closest(Q),n=e.dataset.promotionCode??(t?M(t):null);n&&(o.promotionCode=n)}function Jt(e){ut(e,Zt,Qt)}var te=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=te,document.head.append(e)}function Tt(e,o=globalThis.location){return typeof e!="string"||!e?"":`<picture>${ht(e,o)}</picture>`}var S,N,_,f,w,a,D,W,q,K,_t,xt,z,j,St,X,Z,bt,C,Lt,Ct,R,B=class extends HTMLElement{constructor(){super(...arguments);x(this,a);x(this,S,null);x(this,N,!1);x(this,_,null);F(this,"settings",null);x(this,f,null);F(this,"compatVersion");x(this,w,t=>{t.target===this.aemFragment&&(T(this,_,t.detail?.fields||null),this.settings=t.detail?.settings??null,T(this,N,!0),c(this,a,j).call(this),this.dispatchEvent(new CustomEvent(ot,{bubbles:!0,composed:!0,detail:t.detail})))})}get contextPromotionCode(){return this.getAttribute("data-promotion-code")}static get observedAttributes(){return["field"]}attributeChangedCallback(t,n,r){t==="field"&&(T(this,S,r),c(this,a,j).call(this))}connectedCallback(){this.addEventListener(O,p(this,w)),c(this,a,D).call(this),this.aemFragment?.setAttribute("hidden",""),Jt(at())}disconnectedCallback(){this.removeEventListener(O,p(this,w))}checkReady(){return p(this,N)?Promise.resolve(!0):new Promise(t=>{this.addEventListener(O,()=>t(!0),{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return ct(this)}};S=new WeakMap,N=new WeakMap,_=new WeakMap,f=new WeakMap,w=new WeakMap,a=new WeakSet,D=function(t=!1){if(p(this,f)?.isConnected&&p(this,f).matches('[data-role="mas-field-content"]')&&(!t||p(this,f).tagName==="SPAN"))return p(this,f);let n=this.querySelector(':scope > [data-role="mas-field-content"]');if(n&&(!t||n.tagName==="SPAN"))return T(this,f,n),n;t&&n?.remove();let r=document.createElement("span");return r.setAttribute("data-role","mas-field-content"),this.append(r),T(this,f,r),r},W=function(){this.querySelector(':scope > [data-role="mas-field-content"]')?.remove(),T(this,f,null)},q=function(t){let n=document.createElement("template");n.innerHTML=t;let r=n.content.querySelector("picture");if(!r)return;r.innerHTML=Et(r.innerHTML),r.setAttribute("data-role","mas-field-content");let i=this.querySelector(':scope > [data-role="mas-field-content"]');i?i.replaceWith(r):this.append(r),T(this,f,r),c(this,a,C).call(this,r)},K=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},_t=function(t){let n=t?.match(/^(.+)\[(\d+)\]$/);if(n)return{fieldName:n[1],index:parseInt(n[2],10)};let r=t?.match(/^(.+)\[(.+)\]$/);return r?{fieldName:r[1],index:r[2]}:{fieldName:t,index:null}},xt=function(t,n){if(typeof t!="string")return null;let r=document.createElement("template");r.innerHTML=t;let i;if(!isNaN(n)){let l=parseInt(n,10);i=[...r.content.querySelectorAll("a")][l-1]}return i||(i=r.content.querySelector(`a[data-key="${n}"]`)),i?(i.removeAttribute("class"),i.outerHTML):null},z=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},j=function(){if(!p(this,_)||!p(this,S))return;this.hidden=!1;let{fieldName:t,index:n}=c(this,a,_t).call(this,p(this,S));if(n!==null&&isNaN(n)){let s=`${t.replace(/s$/,"")}Labels`,d=p(this,_)[s];if(d!==void 0){let h=(Array.isArray(d)?d:[d]).indexOf(n);if(h===-1){this.hidden=!0;return}let m=p(this,_)[t],u=Array.isArray(m)?m:m?[m]:[],g=c(this,a,K).call(this,u[h]);if(!g){this.hidden=!0;return}if(t==="ctas"&&this.settings?.hideTrialCTAs&&(g=At(g,!0),g===null)){this.hidden=!0;return}c(this,a,z).call(this);let b=c(this,a,D).call(this,!0);b.innerHTML=c(this,a,R).call(this,g)??"",c(this,a,X).call(this,b),c(this,a,Z).call(this,b),c(this,a,C).call(this,b);return}}let r=c(this,a,K).call(this,p(this,_)[t]);if(r===void 0){this.hidden=!0;return}if(c(this,a,z).call(this),n===null&&(t==="image"||t==="backgroundImage"||t==="backgrounds")){let s=c(this,a,R).call(this,r);if(typeof s=="string"&&s){let d=t==="image"||t==="backgrounds"?s:`<img loading="lazy" alt="" src="${$(s)}">`;c(this,a,q).call(this,Tt(d))}else c(this,a,W).call(this),this.hidden=!0;return}if(t==="backgrounds"&&n!==null){let s=c(this,a,R).call(this,gt(r,n)),d=typeof s=="string"&&s?ft(s):"";d?c(this,a,q).call(this,Tt(d)):(c(this,a,W).call(this),this.hidden=!0);return}let i=c(this,a,D).call(this,!0),l;if(n!==null){if(l=c(this,a,xt).call(this,r,n),l===null){this.hidden=!0;return}}else l=c(this,a,R).call(this,r);if(typeof l=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs&&(l=At(l,n!==null),l===null)){this.hidden=!0;return}if(p(this,S)==="ctas"){let s=c(this,a,Ct).call(this,l);if(s){i.replaceChildren(s),c(this,a,C).call(this,i);return}}i.innerHTML=l,c(this,a,X).call(this,i),c(this,a,Z).call(this,i),c(this,a,C).call(this,i);return}if(l==null){this.hidden=!0;return}i.textContent=String(l)},St=function(t,n){return customElements.get("checkout-link")?.createCheckoutLink(t,n)??(()=>{let i=document.createElement("a",{is:"checkout-link"});return i.setAttribute("is","checkout-link"),i.innerHTML=`<span style="pointer-events: none;">${n}</span>`,i})()},X=function(t){for(let n of t.querySelectorAll("a[data-wcs-osi]:not([is])")){let r=c(this,a,St).call(this,n.dataset,n.innerHTML);for(let{name:i,value:l}of n.attributes)["is","href"].includes(i)||r.setAttribute(i,l);n.replaceWith(r)}},Z=function(t){let n=t.querySelectorAll(".icon-button[data-tooltip]");for(let r of n){if(r.dataset.tooltipWired)continue;r.dataset.tooltipWired="1",r.querySelector("svg")||r.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),r.hasAttribute("tabindex")||r.setAttribute("tabindex","0"),r.hasAttribute("role")||r.setAttribute("role","button"),r.hasAttribute("aria-label")||r.setAttribute("aria-label",r.dataset.tooltip);let i=["top","bottom","left","right"],l=[...r.classList].find(h=>i.includes(h)),s=l||"top";l||r.classList.add(s),r.dataset.originalPosition=s,r.classList.add("hide-tooltip");let d=()=>{r.classList.remove("hide-tooltip"),c(this,a,bt).call(this,r)},E=()=>r.classList.add("hide-tooltip");r.addEventListener("mouseenter",d),r.addEventListener("focus",d),r.addEventListener("mouseleave",E),r.addEventListener("blur",E),r.addEventListener("keydown",h=>{h.key==="Escape"&&E()})}},bt=function(t){let n=["top","bottom","right","left"],r=window.innerWidth,i=12,l=document.querySelector("header")?.getBoundingClientRect().height||0,s=window.getComputedStyle(t,"::before"),d=Y=>parseFloat(Y)||0,E=d(s.width)+d(s.paddingLeft)+d(s.paddingRight),h=d(s.height)+d(s.paddingTop)+d(s.paddingBottom),m=t.getBoundingClientRect(),u=t.dataset.originalPosition||"top",g=n.find(Y=>t.classList.contains(Y)),J=u==="top"||u==="bottom"?E/2:E,Rt=u==="top"?h+(u==="top"?i:0):h/2,y=m.top-Rt<l,H=m.bottom+(u==="bottom"?h+i:0)>window.innerHeight,L=m.right+J+i>r,P=m.left-J-i<0,U=m.left+E/2+i>r,k=m.left-E/2-i<0;if(u!==g&&!(L||P||y||H||U||k)){t.classList.remove(...n),t.classList.add(u);return}let A=u;L&&U?A="left":P&&k?A="right":L&&y||P&&y?A=U&&"left"||k&&"right"||"bottom":L!==P&&!H?A=L?"left":"right":y&&["top","left","right"].includes(u)?A="bottom":H&&["bottom","left","right"].includes(u)&&(A="top"),g!==A&&(t.classList.remove(...n),t.classList.add(A))},C=function(t){let n=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!n.length)return;let r=(i,l)=>{if(l!=null)for(let s of n)s.hasAttribute(i)||s.setAttribute(i,l)};for(let i of Xt)r(i,this.getAttribute(i));r("data-promotion-code",M(this))},Lt=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let i=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let s=document.createElement("a",{is:"checkout-link"});return s.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,s})();for(let{name:s,value:d}of t.attributes)["class","is","href"].includes(s)||i.setAttribute(s,d);if(i.firstElementChild?.classList.add("spectrum-Button-label"),t.className){let s=jt.exec(t.className)?.[0]??"accent",d=s.startsWith("accent");return s.includes("-link")||(i.classList.add("button","con-button"),d?i.classList.add("blue"):s.startsWith("primary")&&!s.includes("-outline")&&i.classList.add("fill")),i}let l=t.parentElement?.tagName;if(l==="STRONG"||l==="EM"){let s=document.createElement(l.toLowerCase());return s.append(i),s}return i},Ct=function(t){let r=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!r.length)return null;let i=document.createElement("div");return i.setAttribute("slot","footer"),i.append(...r.map(l=>c(this,a,Lt).call(this,l))),i},R=function(t){if(typeof t!="string")return t;let n=t.trim();if(!(n.startsWith("<p>")&&n.endsWith("</p>")))return t;let i=n.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(Q,B);export{Qt as checkoutOptionsProvider,Zt as priceOptionsProvider,Tt as renderImageMarkup};
