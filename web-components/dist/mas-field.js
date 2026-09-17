var At=Object.defineProperty;var z=e=>{throw TypeError(e)};var Tt=(e,n,t)=>n in e?At(e,n,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[n]=t;var U=(e,n,t)=>Tt(e,typeof n!="symbol"?n+"":n,t),k=(e,n,t)=>n.has(e)||z("Cannot "+t);var u=(e,n,t)=>(k(e,n,"read from private field"),t?t.call(e):n.get(e)),_=(e,n,t)=>n.has(e)?z("Cannot add the same private member more than once"):n instanceof WeakSet?n.add(e):n.set(e,t),S=(e,n,t,r)=>(k(e,n,"write to private field"),r?r.call(e,t):n.set(e,t),t),c=(e,n,t)=>(k(e,n,"access private method"),t);var Vt=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),Gt=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var gt='span[is="inline-price"][data-wcs-osi]',_t='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var St='a[is="upt-link"]',Bt=`${gt},${_t},${St}`,Z=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var P="aem:load";var Q="mas:ready";var $t=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var Wt=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var J="legal",tt="plan-type-text",et="mas-ff-defaults";var bt="mas-commerce-service";function ot(){return document.getElementsByTagName(bt)?.[0]}function nt(e){let n=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&n?.isInlinePrice&&n?.dataset?.template==="price"}var Lt=[".","!","?"],xt=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=xt,document.head.append(e)}var Rt="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function Ct(e){let n=e.closest(Rt)??e.parentNode,t=document.createRange();return t.setStart(n,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function rt(e){let n=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(r=>!r.closest("merch-addon"));return(n.find(r=>r.dataset.promotionCode&&r.dataset.promotionCode!=="cancel-context")??n[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function Nt(e){let n=Ct(e);return!n||Lt.includes(n)?"upper":"lower"}function Y(e,n){if(e.dataset.placeholder!==tt)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(n.wcsOsi=t,n.planTypeCase=Nt(e))}function Ot(e,n){if(typeof e!="string"||!e)return null;let t;try{t=new URL(e,n)}catch{return null}return t.hostname.endsWith(".aem.page")?`${n}${t.pathname}${t.search}`:null}function Mt(e){return e?.hostname==="www.adobe.com"||e?.hostname==="adobe.com"}function it(e,n=globalThis.location){if(typeof e!="string"||!e||!Mt(n))return e;let t=document.createElement("template");return t.innerHTML=`<picture>${e}</picture>`,t.content.querySelectorAll("source[srcset], img[src]").forEach(r=>{let o=r.tagName==="IMG"?"src":"srcset",i=Ot(r.getAttribute(o),n.origin);i&&r.setAttribute(o,i)}),t.content.querySelector("picture").innerHTML}var wt="(min-width: 1200px)",Pt="(min-width: 600px)";function st(e,n){if(!e)return"";let t=new DOMParser().parseFromString(`<picture>${e}</picture>`,"text/html");return n==="desktop"?t.querySelector(`source[media="${wt}"]`)?.getAttribute("srcset")??"":n==="tablet"?t.querySelector(`source[media="${Pt}"]`)?.getAttribute("srcset")??"":n==="mobile"?t.querySelector("img")?.getAttribute("src")??"":""}var K="mas-field",It=/(accent|primary|secondary)(-(outline|link))?/,vt=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function j(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")?e.getAttribute("data-promotion-code"):null}function at(e,n){let t=document.createElement("template");t.innerHTML=e;let r=[...t.content.querySelectorAll("a")],o=r.filter(i=>Z.has(i.dataset.analyticsId));return o.length===0?e:o.length===r.length?n?null:e:(o.forEach(i=>i.remove()),t.innerHTML)}function ct(e,n){if(!e)return n;let t=e.closest(K);if(!(t||e.hasAttribute("fragment-id")))return n;n[et]=!0,n.wrapClauses=!0;let o=t?.aemFragment?.data?.priceLiterals;if(o&&(n.literals??(n.literals={}),Object.assign(n.literals,o)),nt(e)&&(n.displayPerUnit=!1,n.displayTax=!1),t&&e.dataset.template===J&&(n.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!n.promotionCode){let i=e.dataset.promotionCode??(t?j(t):null);i&&(n.promotionCode=i)}n.displayAnnual===void 0&&typeof t?.settings?.displayAnnual=="boolean"&&(n.displayAnnual=t.settings.displayAnnual)}function Ht(e,n){if(n.promotionCode||!e)return;let t=e.closest(K),r=e.dataset.promotionCode??(t?j(t):null);r&&(n.promotionCode=r)}function Dt(e){!e?.providers||e.providers.has(ct)||(e.providers.price(ct),e.providers.checkout(Ht),e.providers.has(Y)||e.providers.price(Y))}var Ut=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=Ut,document.head.append(e)}function lt(e,n=globalThis.location){return typeof e!="string"||!e?"":`<picture>${it(e,n)}</picture>`}var b,N,g,E,O,s,y,V,G,dt,ut,B,$,pt,W,q,mt,R,ht,ft,C,F=class extends HTMLElement{constructor(){super(...arguments);_(this,s);_(this,b,null);_(this,N,!1);_(this,g,null);U(this,"settings",null);_(this,E,null);U(this,"compatVersion");_(this,O,t=>{t.target===this.aemFragment&&(S(this,g,t.detail?.fields||null),this.settings=t.detail?.settings??null,S(this,N,!0),c(this,s,$).call(this),this.dispatchEvent(new CustomEvent(Q,{bubbles:!0,composed:!0,detail:t.detail})))})}static get observedAttributes(){return["field"]}attributeChangedCallback(t,r,o){t==="field"&&(S(this,b,o),c(this,s,$).call(this))}connectedCallback(){this.addEventListener(P,u(this,O)),c(this,s,y).call(this),this.aemFragment?.setAttribute("hidden",""),Dt(ot())}disconnectedCallback(){this.removeEventListener(P,u(this,O))}checkReady(){return u(this,N)?Promise.resolve(!0):new Promise(t=>{this.addEventListener(P,()=>t(!0),{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return rt(this)}};b=new WeakMap,N=new WeakMap,g=new WeakMap,E=new WeakMap,O=new WeakMap,s=new WeakSet,y=function(){if(u(this,E)?.isConnected&&u(this,E).matches('[data-role="mas-field-content"]'))return u(this,E);let t=this.querySelector(':scope > [data-role="mas-field-content"]');if(t)return S(this,E,t),t;let r=document.createElement("span");return r.setAttribute("data-role","mas-field-content"),this.append(r),S(this,E,r),r},V=function(t){let r=document.createElement("template");r.innerHTML=t;let o=r.content.querySelector("picture");if(!o)return;o.setAttribute("data-role","mas-field-content");let i=this.querySelector(':scope > [data-role="mas-field-content"]');i?i.replaceWith(o):this.append(o),S(this,E,o),c(this,s,R).call(this,o)},G=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},dt=function(t){let r=t?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let o=t?.match(/^(.+)\[(.+)\]$/);return o?{fieldName:o[1],index:o[2]}:{fieldName:t,index:null}},ut=function(t,r){if(typeof t!="string")return null;let o=document.createElement("template");o.innerHTML=t;let i;if(!isNaN(r)){let l=parseInt(r,10);i=[...o.content.querySelectorAll("a")][l-1]}return i||(i=o.content.querySelector(`a[data-key="${r}"]`)),i?(i.removeAttribute("class"),i.outerHTML):null},B=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},$=function(){if(!u(this,g)||!u(this,b))return;this.hidden=!1;let{fieldName:t,index:r}=c(this,s,dt).call(this,u(this,b));if(r!==null&&isNaN(r)){let a=`${t.replace(/s$/,"")}Labels`,d=u(this,g)[a];if(d!==void 0){let h=(Array.isArray(d)?d:[d]).indexOf(r);if(h===-1){this.hidden=!0;return}let m=u(this,g)[t],p=Array.isArray(m)?m:m?[m]:[],A=c(this,s,G).call(this,p[h]);if(!A){this.hidden=!0;return}if(t==="ctas"&&this.settings?.hideTrialCTAs&&(A=at(A,!0),A===null)){this.hidden=!0;return}c(this,s,B).call(this);let L=c(this,s,y).call(this);L.innerHTML=c(this,s,C).call(this,A)??"",c(this,s,W).call(this,L),c(this,s,q).call(this,L),c(this,s,R).call(this,L);return}}let o=c(this,s,G).call(this,u(this,g)[t]);if(o===void 0){this.hidden=!0;return}if(c(this,s,B).call(this),r===null&&(t==="image"||t==="backgroundImage"||t==="backgrounds")){let a=c(this,s,C).call(this,o);if(typeof a=="string"&&a){let d=t==="image"||t==="backgrounds"?a:`<img loading="lazy" alt="" src="${a}">`;c(this,s,V).call(this,lt(d))}return}if(t==="backgrounds"&&r!==null){let a=c(this,s,C).call(this,st(o,r));typeof a=="string"&&a&&c(this,s,V).call(this,lt(`<img loading="lazy" alt="" src="${a}">`));return}let i=c(this,s,y).call(this),l;if(r!==null){if(l=c(this,s,ut).call(this,o,r),l===null){this.hidden=!0;return}}else l=c(this,s,C).call(this,o);if(typeof l=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs&&(l=at(l,r!==null),l===null)){this.hidden=!0;return}if(u(this,b)==="ctas"){let a=c(this,s,ft).call(this,l);if(a){i.replaceChildren(a),c(this,s,R).call(this,i);return}}i.innerHTML=l,c(this,s,W).call(this,i),c(this,s,q).call(this,i),c(this,s,R).call(this,i);return}if(l==null){this.hidden=!0;return}i.textContent=String(l)},pt=function(t,r){return customElements.get("checkout-link")?.createCheckoutLink(t,r)??(()=>{let i=document.createElement("a",{is:"checkout-link"});return i.setAttribute("is","checkout-link"),i.innerHTML=`<span style="pointer-events: none;">${r}</span>`,i})()},W=function(t){for(let r of t.querySelectorAll("a[data-wcs-osi]:not([is])")){let o=c(this,s,pt).call(this,r.dataset,r.innerHTML);for(let{name:i,value:l}of r.attributes)["is","href"].includes(i)||o.setAttribute(i,l);r.replaceWith(o)}},q=function(t){let r=t.querySelectorAll(".icon-button[data-tooltip]");for(let o of r){if(o.dataset.tooltipWired)continue;o.dataset.tooltipWired="1",o.querySelector("svg")||o.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),o.hasAttribute("tabindex")||o.setAttribute("tabindex","0"),o.hasAttribute("role")||o.setAttribute("role","button"),o.hasAttribute("aria-label")||o.setAttribute("aria-label",o.dataset.tooltip);let i=["top","bottom","left","right"],l=[...o.classList].find(h=>i.includes(h)),a=l||"top";l||o.classList.add(a),o.dataset.originalPosition=a,o.classList.add("hide-tooltip");let d=()=>{o.classList.remove("hide-tooltip"),c(this,s,mt).call(this,o)},f=()=>o.classList.add("hide-tooltip");o.addEventListener("mouseenter",d),o.addEventListener("focus",d),o.addEventListener("mouseleave",f),o.addEventListener("blur",f),o.addEventListener("keydown",h=>{h.key==="Escape"&&f()})}},mt=function(t){let r=["top","bottom","right","left"],o=window.innerWidth,i=12,l=document.querySelector("header")?.getBoundingClientRect().height||0,a=window.getComputedStyle(t,"::before"),d=D=>parseFloat(D)||0,f=d(a.width)+d(a.paddingLeft)+d(a.paddingRight),h=d(a.height)+d(a.paddingTop)+d(a.paddingBottom),m=t.getBoundingClientRect(),p=t.dataset.originalPosition||"top",A=r.find(D=>t.classList.contains(D)),X=p==="top"||p==="bottom"?f/2:f,Et=p==="top"?h+(p==="top"?i:0):h/2,M=m.top-Et<l,I=m.bottom+(p==="bottom"?h+i:0)>window.innerHeight,x=m.right+X+i>o,w=m.left-X-i<0,v=m.left+f/2+i>o,H=m.left-f/2-i<0;if(p!==A&&!(x||w||M||I||v||H)){t.classList.remove(...r),t.classList.add(p);return}let T=p;x&&v?T="left":w&&H?T="right":x&&M||w&&M?T=v&&"left"||H&&"right"||"bottom":x!==w&&!I?T=x?"left":"right":M&&["top","left","right"].includes(p)?T="bottom":I&&["bottom","left","right"].includes(p)&&(T="top"),A!==T&&(t.classList.remove(...r),t.classList.add(T))},R=function(t){let r=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let o=(i,l)=>{if(l!=null)for(let a of r)a.hasAttribute(i)||a.setAttribute(i,l)};for(let i of vt)o(i,this.getAttribute(i));o("data-promotion-code",j(this))},ht=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let i=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let a=document.createElement("a",{is:"checkout-link"});return a.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,a})();for(let{name:a,value:d}of t.attributes)["class","is","href"].includes(a)||i.setAttribute(a,d);if(i.firstElementChild?.classList.add("spectrum-Button-label"),t.className){let a=It.exec(t.className)?.[0]??"accent",d=a.startsWith("accent");return a.includes("-link")||(i.classList.add("button","con-button"),d?i.classList.add("blue"):a.startsWith("primary")&&!a.includes("-outline")&&i.classList.add("fill")),i}let l=t.parentElement?.tagName;if(l==="STRONG"||l==="EM"){let a=document.createElement(l.toLowerCase());return a.append(i),a}return i},ft=function(t){let o=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!o.length)return null;let i=document.createElement("div");return i.setAttribute("slot","footer"),i.append(...o.map(l=>c(this,s,ht).call(this,l))),i},C=function(t){if(typeof t!="string")return t;let r=t.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return t;let i=r.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(K,F);export{Ht as checkoutOptionsProvider,ct as priceOptionsProvider,lt as renderImageMarkup};
