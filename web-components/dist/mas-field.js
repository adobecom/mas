var ht=Object.defineProperty;var z=e=>{throw TypeError(e)};var mt=(e,i,t)=>i in e?ht(e,i,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[i]=t;var D=(e,i,t)=>mt(e,typeof i!="symbol"?i+"":i,t),U=(e,i,t)=>i.has(e)||z("Cannot "+t);var p=(e,i,t)=>(U(e,i,"read from private field"),t?t.call(e):i.get(e)),_=(e,i,t)=>i.has(e)?z("Cannot add the same private member more than once"):i instanceof WeakSet?i.add(e):i.set(e,t),x=(e,i,t,r)=>(U(e,i,"write to private field"),r?r.call(e,t):i.set(e,t),t),l=(e,i,t)=>(U(e,i,"access private method"),t);var vt=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),It=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var ft='span[is="inline-price"][data-wcs-osi]',Et='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var At='a[is="upt-link"]',Ht=`${ft},${Et},${At}`,X=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var w="aem:load";var Z="mas:ready";var Dt=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var Ut=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var Q="legal",J="plan-type-text",tt="mas-ff-defaults";var Tt="mas-commerce-service";function et(){return document.getElementsByTagName(Tt)?.[0]}function ot(e){let i=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&i?.isInlinePrice&&i?.dataset?.template==="price"}var _t=[".","!","?"],gt=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=gt,document.head.append(e)}var St="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function xt(e){let i=e.closest(St)??e.parentNode,t=document.createRange();return t.setStart(i,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function nt(e){let i=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(r=>!r.closest("merch-addon"));return(i.find(r=>r.dataset.promotionCode&&r.dataset.promotionCode!=="cancel-context")??i[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function Ct(e){let i=xt(e);return!i||_t.includes(i)?"upper":"lower"}function Y(e,i){if(e.dataset.placeholder!==J)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(i.wcsOsi=t,i.planTypeCase=Ct(e))}var K="mas-field",Rt=/(accent|primary|secondary)(-(outline|link))?/,bt=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function q(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")?e.getAttribute("data-promotion-code"):null}function it(e,i){let t=document.createElement("template");t.innerHTML=e;let r=[...t.content.querySelectorAll("a")],o=r.filter(n=>X.has(n.dataset.analyticsId));return o.length===0?e:o.length===r.length?i?null:e:(o.forEach(n=>n.remove()),t.innerHTML)}function rt(e,i){if(!e)return i;let t=e.closest(K);if(!(t||e.hasAttribute("fragment-id")))return i;i[tt]=!0,i.wrapClauses=!0;let o=t?.aemFragment?.data?.priceLiterals;if(o&&(i.literals??(i.literals={}),Object.assign(i.literals,o)),ot(e)&&(i.displayPerUnit=!1,i.displayTax=!1),t&&e.dataset.template===Q&&(i.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!i.promotionCode){let n=e.dataset.promotionCode??(t?q(t):null);n&&(i.promotionCode=n)}i.displayAnnual===void 0&&typeof t?.settings?.displayAnnual=="boolean"&&(i.displayAnnual=t.settings.displayAnnual)}function Nt(e,i){if(i.promotionCode||!e)return;let t=e.closest(K),r=e.dataset.promotionCode??(t?q(t):null);r&&(i.promotionCode=r)}function Ot(e){!e?.providers||e.providers.has(rt)||(e.providers.price(rt),e.providers.checkout(Nt),e.providers.has(Y)||e.providers.price(Y))}var wt=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=wt,document.head.append(e)}var g,R,T,S,b,s,M,V,st,at,F,G,ct,B,$,lt,P,dt,pt,W,k=class extends HTMLElement{constructor(){super(...arguments);_(this,s);_(this,g,null);_(this,R,!1);_(this,T,null);D(this,"settings",null);_(this,S,null);D(this,"compatVersion");_(this,b,t=>{t.target===this.aemFragment&&(x(this,T,t.detail?.fields||null),this.settings=t.detail?.settings??null,x(this,R,!0),l(this,s,G).call(this),this.dispatchEvent(new CustomEvent(Z,{bubbles:!0,composed:!0,detail:t.detail})))})}static get observedAttributes(){return["field"]}attributeChangedCallback(t,r,o){t==="field"&&(x(this,g,o),l(this,s,G).call(this))}connectedCallback(){this.addEventListener(w,p(this,b)),l(this,s,M).call(this),this.aemFragment?.setAttribute("hidden",""),Ot(et())}disconnectedCallback(){this.removeEventListener(w,p(this,b))}checkReady(){return p(this,R)?Promise.resolve(!0):new Promise(t=>{this.addEventListener(w,()=>t(!0),{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return nt(this)}};g=new WeakMap,R=new WeakMap,T=new WeakMap,S=new WeakMap,b=new WeakMap,s=new WeakSet,M=function(){if(p(this,S)?.isConnected)return p(this,S);let t=this.querySelector(':scope > span[data-role="mas-field-content"]');if(t)return x(this,S,t),t;let r=document.createElement("span");return r.setAttribute("data-role","mas-field-content"),this.append(r),x(this,S,r),r},V=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},st=function(t){let r=t?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let o=t?.match(/^(.+)\[(.+)\]$/);return o?{fieldName:o[1],index:o[2]}:{fieldName:t,index:null}},at=function(t,r){if(typeof t!="string")return null;let o=document.createElement("template");o.innerHTML=t;let n;if(!isNaN(r)){let c=parseInt(r,10);n=[...o.content.querySelectorAll("a")][c-1]}return n||(n=o.content.querySelector(`a[data-key="${r}"]`)),n?(n.removeAttribute("class"),n.outerHTML):null},F=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},G=function(){if(!p(this,T)||!p(this,g))return;this.hidden=!1;let{fieldName:t,index:r}=l(this,s,st).call(this,p(this,g));if(r!==null&&isNaN(r)){let a=`${t.replace(/s$/,"")}Labels`,d=p(this,T)[a];if(d!==void 0){let m=(Array.isArray(d)?d:[d]).indexOf(r);if(m===-1){this.hidden=!0;return}let h=p(this,T)[t],u=Array.isArray(h)?h:h?[h]:[],E=l(this,s,V).call(this,u[m]);if(!E){this.hidden=!0;return}if(t==="ctas"&&this.settings?.hideTrialCTAs&&(E=it(E,!0),E===null)){this.hidden=!0;return}l(this,s,F).call(this);let C=l(this,s,M).call(this);C.innerHTML=l(this,s,W).call(this,E)??"",l(this,s,B).call(this,C),l(this,s,$).call(this,C),l(this,s,P).call(this,C);return}}let o=l(this,s,V).call(this,p(this,T)[t]);if(o===void 0){this.hidden=!0;return}l(this,s,F).call(this);let n=l(this,s,M).call(this),c;if(r!==null){if(c=l(this,s,at).call(this,o,r),c===null){this.hidden=!0;return}}else c=l(this,s,W).call(this,o);if(typeof c=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs&&(c=it(c,r!==null),c===null)){this.hidden=!0;return}if(p(this,g)==="ctas"){let a=l(this,s,pt).call(this,c);if(a){n.replaceChildren(a),l(this,s,P).call(this,n);return}}n.innerHTML=c,l(this,s,B).call(this,n),l(this,s,$).call(this,n),l(this,s,P).call(this,n);return}if(c==null){this.hidden=!0;return}n.textContent=String(c)},ct=function(t,r){return customElements.get("checkout-link")?.createCheckoutLink(t,r)??(()=>{let n=document.createElement("a",{is:"checkout-link"});return n.setAttribute("is","checkout-link"),n.innerHTML=`<span style="pointer-events: none;">${r}</span>`,n})()},B=function(t){for(let r of t.querySelectorAll("a[data-wcs-osi]:not([is])")){let o=l(this,s,ct).call(this,r.dataset,r.innerHTML);for(let{name:n,value:c}of r.attributes)["is","href"].includes(n)||o.setAttribute(n,c);r.replaceWith(o)}},$=function(t){let r=t.querySelectorAll(".icon-button[data-tooltip]");for(let o of r){if(o.dataset.tooltipWired)continue;o.dataset.tooltipWired="1",o.querySelector("svg")||o.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),o.hasAttribute("tabindex")||o.setAttribute("tabindex","0"),o.hasAttribute("role")||o.setAttribute("role","button"),o.hasAttribute("aria-label")||o.setAttribute("aria-label",o.dataset.tooltip);let n=["top","bottom","left","right"],c=[...o.classList].find(m=>n.includes(m)),a=c||"top";c||o.classList.add(a),o.dataset.originalPosition=a,o.classList.add("hide-tooltip");let d=()=>{o.classList.remove("hide-tooltip"),l(this,s,lt).call(this,o)},f=()=>o.classList.add("hide-tooltip");o.addEventListener("mouseenter",d),o.addEventListener("focus",d),o.addEventListener("mouseleave",f),o.addEventListener("blur",f),o.addEventListener("keydown",m=>{m.key==="Escape"&&f()})}},lt=function(t){let r=["top","bottom","right","left"],o=window.innerWidth,n=12,c=document.querySelector("header")?.getBoundingClientRect().height||0,a=window.getComputedStyle(t,"::before"),d=H=>parseFloat(H)||0,f=d(a.width)+d(a.paddingLeft)+d(a.paddingRight),m=d(a.height)+d(a.paddingTop)+d(a.paddingBottom),h=t.getBoundingClientRect(),u=t.dataset.originalPosition||"top",E=r.find(H=>t.classList.contains(H)),j=u==="top"||u==="bottom"?f/2:f,ut=u==="top"?m+(u==="top"?n:0):m/2,N=h.top-ut<c,y=h.bottom+(u==="bottom"?m+n:0)>window.innerHeight,L=h.right+j+n>o,O=h.left-j-n<0,v=h.left+f/2+n>o,I=h.left-f/2-n<0;if(u!==E&&!(L||O||N||y||v||I)){t.classList.remove(...r),t.classList.add(u);return}let A=u;L&&v?A="left":O&&I?A="right":L&&N||O&&N?A=v&&"left"||I&&"right"||"bottom":L!==O&&!y?A=L?"left":"right":N&&["top","left","right"].includes(u)?A="bottom":y&&["bottom","left","right"].includes(u)&&(A="top"),E!==A&&(t.classList.remove(...r),t.classList.add(A))},P=function(t){let r=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let o=(n,c)=>{if(c!=null)for(let a of r)a.hasAttribute(n)||a.setAttribute(n,c)};for(let n of bt)o(n,this.getAttribute(n));o("data-promotion-code",q(this))},dt=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let n=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let a=document.createElement("a",{is:"checkout-link"});return a.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,a})();for(let{name:a,value:d}of t.attributes)["class","is","href"].includes(a)||n.setAttribute(a,d);if(n.firstElementChild?.classList.add("spectrum-Button-label"),t.className){let a=Rt.exec(t.className)?.[0]??"accent",d=a.startsWith("accent");return a.includes("-link")||(n.classList.add("button","con-button"),d?n.classList.add("blue"):a.startsWith("primary")&&!a.includes("-outline")&&n.classList.add("fill")),n}let c=t.parentElement?.tagName;if(c==="STRONG"||c==="EM"){let a=document.createElement(c.toLowerCase());return a.append(n),a}return n},pt=function(t){let o=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!o.length)return null;let n=document.createElement("div");return n.setAttribute("slot","footer"),n.append(...o.map(c=>l(this,s,dt).call(this,c))),n},W=function(t){if(typeof t!="string")return t;let r=t.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return t;let n=r.slice(3,-4);return n.includes("<p>")?t:n};customElements.define(K,k);export{Nt as checkoutOptionsProvider,rt as priceOptionsProvider};
