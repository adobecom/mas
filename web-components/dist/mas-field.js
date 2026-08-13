var q=Object.defineProperty;var w=e=>{throw TypeError(e)};var j=(e,o,t)=>o in e?q(e,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[o]=t;var v=(e,o,t)=>j(e,typeof o!="symbol"?o+"":o,t),x=(e,o,t)=>o.has(e)||w("Cannot "+t);var l=(e,o,t)=>(x(e,o,"read from private field"),t?t.call(e):o.get(e)),p=(e,o,t)=>o.has(e)?w("Cannot add the same private member more than once"):o instanceof WeakSet?o.add(e):o.set(e,t),A=(e,o,t,r)=>(x(e,o,"write to private field"),r?r.call(e,t):o.set(e,t),t),a=(e,o,t)=>(x(e,o,"access private method"),t);var st=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),at=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var X='span[is="inline-price"][data-wcs-osi]',Q='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Z='a[is="upt-link"]',ct=`${X},${Q},${Z}`;var C="aem:load";var y="mas:ready";var lt=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var Et=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var U="legal",V="mas-ff-defaults";var J="mas-commerce-service";function Y(){return document.getElementsByTagName(J)?.[0]}function F(e){let o=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&o?.isInlinePrice&&o?.dataset?.template==="price"}var I="mas-field",et=/(accent|primary|secondary)(-(outline|link))?/;function D(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")?e.getAttribute("data-promotion-code"):null}function G(e,o){let t=e?.closest?.(I);if(!t)return o;if(o[V]=!0,F(e)&&(o.displayPerUnit=!1,o.displayTax=!1),e.dataset.template===U&&(o.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!o.promotionCode){let r=D(t);r&&(o.promotionCode=r)}}function ot(e,o){let t=e?.closest?.(I);if(!t)return o;if(!o.promotionCode){let r=D(t);r&&(o.promotionCode=r)}}function rt(e){!e?.providers||e.providers.has(G)||(e.providers.price(G),e.providers.checkout(ot))}var nt=`
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
   glyph with a hover/focus tooltip when a placeholder is consumed through mas-field
   outside a merch-card (e.g. a headless DA page). Mirrors merch-card's glyph but uses
   pure-CSS :hover/:focus instead of the JS-toggled .tooltip-visible class. */
mas-field .icon-button {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    min-height: 18px;
    vertical-align: middle;
    text-decoration: none;
    border-bottom: none;
    background-repeat: no-repeat;
    background-position: center;
    background-size: 18px;
    background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" height="14" width="14"><path d="M7 .778A6.222 6.222 0 1 0 13.222 7 6.222 6.222 0 0 0 7 .778zM6.883 2.45a1.057 1.057 0 0 1 1.113.998q.003.05.001.1a1.036 1.036 0 0 1-1.114 1.114A1.052 1.052 0 0 1 5.77 3.547 1.057 1.057 0 0 1 6.784 2.45q.05-.002.1.001zm1.673 8.05a.389.389 0 0 1-.39.389H5.834a.389.389 0 0 1-.389-.389v-.778a.389.389 0 0 1 .39-.389h.388V7h-.389a.389.389 0 0 1-.389-.389v-.778a.389.389 0 0 1 .39-.389h1.555a.389.389 0 0 1 .389.39v3.5h.389a.389.389 0 0 1 .389.388z"/></svg>');
}

mas-field .icon-button::before {
    content: attr(data-tooltip);
    position: absolute;
    top: 50%;
    left: 100%;
    transform: translateY(-50%);
    margin-left: 8px;
    width: max-content;
    max-width: 200px;
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
    left: 102%;
    margin-left: -8px;
    transform: translateY(-50%);
    border: 8px solid transparent;
    border-right-color: #0469E3;
    z-index: 10;
    display: none;
}

mas-field .icon-button:hover::before,
mas-field .icon-button:focus::before,
mas-field .icon-button:hover::after,
mas-field .icon-button:focus::after {
    display: block;
}
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=nt,document.head.append(e)}var u,f,d,m,T,n,N,M,k,B,O,g,P,W,$,b,L=class extends HTMLElement{constructor(){super(...arguments);p(this,n);p(this,u,null);p(this,f,!1);p(this,d,null);p(this,m,null);v(this,"compatVersion");p(this,T,t=>{t.target===this.aemFragment&&(A(this,d,t.detail?.fields||null),A(this,f,!0),a(this,n,g).call(this),this.dispatchEvent(new CustomEvent(y,{bubbles:!0,composed:!0,detail:t.detail})))})}static get observedAttributes(){return["field"]}attributeChangedCallback(t,r,i){t==="field"&&(A(this,u,i),a(this,n,g).call(this))}connectedCallback(){this.addEventListener(C,l(this,T)),a(this,n,N).call(this),this.aemFragment?.setAttribute("hidden",""),rt(Y())}disconnectedCallback(){this.removeEventListener(C,l(this,T))}checkReady(){return l(this,f)?Promise.resolve(!0):new Promise(t=>{this.addEventListener(C,()=>t(!0),{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}};u=new WeakMap,f=new WeakMap,d=new WeakMap,m=new WeakMap,T=new WeakMap,n=new WeakSet,N=function(){if(l(this,m)?.isConnected)return l(this,m);let t=this.querySelector(':scope > span[data-role="mas-field-content"]');if(t)return A(this,m,t),t;let r=document.createElement("span");return r.setAttribute("data-role","mas-field-content"),this.append(r),A(this,m,r),r},M=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},k=function(t){let r=t?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let i=t?.match(/^(.+)\[(.+)\]$/);return i?{fieldName:i[1],index:i[2]}:{fieldName:t,index:null}},B=function(t,r){if(typeof t!="string")return null;let i=document.createElement("template");i.innerHTML=t;let s;if(!isNaN(r)){let c=parseInt(r,10);s=[...i.content.querySelectorAll("a")][c-1]}return s||(s=i.content.querySelector(`a[data-key="${r}"]`)),s?(s.removeAttribute("class"),s.outerHTML):null},O=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},g=function(){if(!l(this,d)||!l(this,u))return;let{fieldName:t,index:r}=a(this,n,k).call(this,l(this,u));if(r!==null&&isNaN(r)){let _=`${t.replace(/s$/,"")}Labels`,E=l(this,d)[_];if(E!==void 0){let S=(Array.isArray(E)?E:[E]).indexOf(r);if(S===-1)return;let R=l(this,d)[t],K=Array.isArray(R)?R:R?[R]:[],H=a(this,n,M).call(this,K[S]);if(!H)return;a(this,n,O).call(this);let z=a(this,n,N).call(this);z.innerHTML=a(this,n,b).call(this,H)??"";return}}let i=a(this,n,M).call(this,l(this,d)[t]);if(i===void 0)return;a(this,n,O).call(this);let s=a(this,n,N).call(this),c;if(r!==null){if(c=a(this,n,B).call(this,i,r),c===null)return}else c=a(this,n,b).call(this,i);if(typeof c=="string"){if(l(this,u)==="ctas"){let _=a(this,n,$).call(this,c);if(_){s.replaceChildren(_),a(this,n,P).call(this,s,t);return}}s.innerHTML=c,a(this,n,P).call(this,s,t);return}s.textContent=c==null?"":String(c)},P=function(t,r){if(r!=="ctas")return;let i=D(this);if(!i)return;let s=t.querySelectorAll("a[data-wcs-osi]:not([data-promotion-code])");for(let c of s)c.setAttribute("data-promotion-code",i)},W=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let i=et.exec(t.className??"")?.[0]??"accent",s=i.startsWith("accent"),c=i.includes("-link"),E=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let h=document.createElement("a",{is:"checkout-link"});return h.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,h})();for(let{name:h,value:S}of t.attributes)["class","is","href"].includes(h)||E.setAttribute(h,S);return E.firstElementChild?.classList.add("spectrum-Button-label"),c||(E.classList.add("button","con-button"),s?E.classList.add("blue"):i.startsWith("primary")&&!i.includes("-outline")&&E.classList.add("fill")),E},$=function(t){let i=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!i.length)return null;let s=document.createElement("div");return s.setAttribute("slot","footer"),s.append(...i.map(c=>a(this,n,W).call(this,c))),s},b=function(t){if(typeof t!="string")return t;let r=t.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return t;let s=r.slice(3,-4);return s.includes("<p>")?t:s};customElements.define(I,L);export{ot as checkoutOptionsProvider,G as priceOptionsProvider};
