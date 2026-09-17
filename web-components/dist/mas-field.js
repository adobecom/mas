var ht=Object.defineProperty;var X=e=>{throw TypeError(e)};var mt=(e,r,t)=>r in e?ht(e,r,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[r]=t;var D=(e,r,t)=>mt(e,typeof r!="symbol"?r+"":r,t),Y=(e,r,t)=>r.has(e)||X("Cannot "+t);var p=(e,r,t)=>(Y(e,r,"read from private field"),t?t.call(e):r.get(e)),_=(e,r,t)=>r.has(e)?X("Cannot add the same private member more than once"):r instanceof WeakSet?r.add(e):r.set(e,t),L=(e,r,t,i)=>(Y(e,r,"write to private field"),i?i.call(e,t):r.set(e,t),t),l=(e,r,t)=>(Y(e,r,"access private method"),t);var vt=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),It=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var Et='span[is="inline-price"][data-wcs-osi]',ft='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var At='a[is="upt-link"]',Ht=`${Et},${ft},${At}`,z=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var M="aem:load";var Z="mas:ready";var Dt=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var Yt=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var Q="legal",J="plan-type-text",tt="mas-ff-defaults";var Tt="mas-commerce-service";function et(){return document.getElementsByTagName(Tt)?.[0]}function ot(e){let r=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&r?.isInlinePrice&&r?.dataset?.template==="price"}var _t=[".","!","?"],gt=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=gt,document.head.append(e)}var St="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function Lt(e){let r=e.closest(St)??e.parentNode,t=document.createRange();return t.setStart(r,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function nt(e){let r=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(i=>!i.closest("merch-addon"));return(r.find(i=>i.dataset.promotionCode&&i.dataset.promotionCode!=="cancel-context")??r[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function Rt(e){let r=Lt(e);return!r||_t.includes(r)?"upper":"lower"}function U(e,r){if(e.dataset.placeholder!==J)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(r.wcsOsi=t,r.planTypeCase=Rt(e))}var K="mas-field",xt=/(accent|primary|secondary)(-(outline|link))?/,bt=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function q(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")?e.getAttribute("data-promotion-code"):null}function rt(e,r){let t=document.createElement("template");t.innerHTML=e;let i=[...t.content.querySelectorAll("a")],o=i.filter(n=>z.has(n.dataset.analyticsId));return o.length===0?e:o.length===i.length?r?null:e:(o.forEach(n=>n.remove()),t.innerHTML)}function it(e,r){if(!e)return r;let t=e.closest(K);if(!(t||e.hasAttribute("fragment-id")))return r;r[tt]=!0,r.wrapClauses=!0;let o=t?.aemFragment?.data?.priceLiterals;if(o&&(r.literals??(r.literals={}),Object.assign(r.literals,o)),ot(e)&&(r.displayPerUnit=!1,r.displayTax=!1),t&&e.dataset.template===Q&&(r.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!r.promotionCode){let n=e.dataset.promotionCode??(t?q(t):null);n&&(r.promotionCode=n)}r.displayAnnual===void 0&&typeof t?.settings?.displayAnnual=="boolean"&&(r.displayAnnual=t.settings.displayAnnual)}function Nt(e,r){if(r.promotionCode||!e)return;let t=e.closest(K),i=e.dataset.promotionCode??(t?q(t):null);i&&(r.promotionCode=i)}function Ot(e){!e?.providers||e.providers.has(it)||(e.providers.price(it),e.providers.checkout(Nt),e.providers.has(U)||e.providers.price(U))}var Mt=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=Mt,document.head.append(e)}var g,x,T,S,b,s,w,V,st,at,F,G,ct,B,$,lt,P,dt,pt,W,k=class extends HTMLElement{constructor(){super(...arguments);_(this,s);_(this,g,null);_(this,x,!1);_(this,T,null);D(this,"settings",null);_(this,S,null);D(this,"compatVersion");_(this,b,t=>{t.target===this.aemFragment&&(L(this,T,t.detail?.fields||null),this.settings=t.detail?.settings??null,L(this,x,!0),l(this,s,G).call(this),this.dispatchEvent(new CustomEvent(Z,{bubbles:!0,composed:!0,detail:t.detail})))})}static get observedAttributes(){return["field"]}attributeChangedCallback(t,i,o){t==="field"&&(L(this,g,o),l(this,s,G).call(this))}connectedCallback(){this.addEventListener(M,p(this,b)),l(this,s,w).call(this),this.aemFragment?.setAttribute("hidden",""),Ot(et())}disconnectedCallback(){this.removeEventListener(M,p(this,b))}checkReady(){return p(this,x)?Promise.resolve(!0):new Promise(t=>{this.addEventListener(M,()=>t(!0),{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return nt(this)}};g=new WeakMap,x=new WeakMap,T=new WeakMap,S=new WeakMap,b=new WeakMap,s=new WeakSet,w=function(){if(p(this,S)?.isConnected)return p(this,S);let t=this.querySelector(':scope > span[data-role="mas-field-content"]');if(t)return L(this,S,t),t;let i=document.createElement("span");return i.setAttribute("data-role","mas-field-content"),this.append(i),L(this,S,i),i},V=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},st=function(t){let i=t?.match(/^(.+)\[(\d+)\]$/);if(i)return{fieldName:i[1],index:parseInt(i[2],10)};let o=t?.match(/^(.+)\[(.+)\]$/);return o?{fieldName:o[1],index:o[2]}:{fieldName:t,index:null}},at=function(t,i){if(typeof t!="string")return null;let o=document.createElement("template");o.innerHTML=t;let n;if(!isNaN(i)){let c=parseInt(i,10);n=[...o.content.querySelectorAll("a")][c-1]}return n||(n=o.content.querySelector(`a[data-key="${i}"]`)),n?(n.removeAttribute("class"),n.outerHTML):null},F=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},G=function(){if(!p(this,T)||!p(this,g))return;this.hidden=!1;let{fieldName:t,index:i}=l(this,s,st).call(this,p(this,g));if(i!==null&&isNaN(i)){let a=`${t.replace(/s$/,"")}Labels`,d=p(this,T)[a];if(d!==void 0){let m=(Array.isArray(d)?d:[d]).indexOf(i);if(m===-1){this.hidden=!0;return}let h=p(this,T)[t],u=Array.isArray(h)?h:h?[h]:[],f=l(this,s,V).call(this,u[m]);if(!f){this.hidden=!0;return}if(t==="ctas"&&this.settings?.hideTrialCTAs&&(f=rt(f,!0),f===null)){this.hidden=!0;return}l(this,s,F).call(this);let R=l(this,s,w).call(this);R.innerHTML=l(this,s,W).call(this,f)??"",l(this,s,B).call(this,R),l(this,s,$).call(this,R),l(this,s,P).call(this,R);return}}let o=l(this,s,V).call(this,p(this,T)[t]);if(o===void 0){this.hidden=!0;return}l(this,s,F).call(this);let n=l(this,s,w).call(this),c;if(i!==null){if(c=l(this,s,at).call(this,o,i),c===null){this.hidden=!0;return}}else c=l(this,s,W).call(this,o);if(typeof c=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs&&(c=rt(c,i!==null),c===null)){this.hidden=!0;return}if(p(this,g)==="ctas"){let a=l(this,s,pt).call(this,c);if(a){n.replaceChildren(a),l(this,s,P).call(this,n);return}}n.innerHTML=c,l(this,s,B).call(this,n),l(this,s,$).call(this,n),l(this,s,P).call(this,n);return}if(c==null){this.hidden=!0;return}n.textContent=String(c)},ct=function(t,i){return customElements.get("checkout-link")?.createCheckoutLink(t,i)??(()=>{let n=document.createElement("a",{is:"checkout-link"});return n.setAttribute("is","checkout-link"),n.innerHTML=`<span style="pointer-events: none;">${i}</span>`,n})()},B=function(t){for(let i of t.querySelectorAll("a[data-wcs-osi]:not([is])")){let o=l(this,s,ct).call(this,i.dataset,i.innerHTML);for(let{name:n,value:c}of i.attributes)["is","href"].includes(n)||o.setAttribute(n,c);i.replaceWith(o)}},$=function(t){let i=t.querySelectorAll(".icon-button[data-tooltip]");for(let o of i){if(o.dataset.tooltipWired)continue;o.dataset.tooltipWired="1",o.querySelector("svg")||o.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),o.hasAttribute("tabindex")||o.setAttribute("tabindex","0"),o.hasAttribute("role")||o.setAttribute("role","button"),o.hasAttribute("aria-label")||o.setAttribute("aria-label",o.dataset.tooltip);let n=["top","bottom","left","right"],c=[...o.classList].find(m=>n.includes(m)),a=c||"top";c||o.classList.add(a),o.dataset.originalPosition=a,o.classList.add("hide-tooltip");let d=()=>{o.classList.remove("hide-tooltip"),l(this,s,lt).call(this,o)},E=()=>o.classList.add("hide-tooltip");o.addEventListener("mouseenter",d),o.addEventListener("focus",d),o.addEventListener("mouseleave",E),o.addEventListener("blur",E),o.addEventListener("keydown",m=>{m.key==="Escape"&&E()})}},lt=function(t){let i=["top","bottom","right","left"],o=window.innerWidth,n=12,c=document.querySelector("header")?.getBoundingClientRect().height||0,a=window.getComputedStyle(t,"::before"),d=H=>parseFloat(H)||0,E=d(a.width)+d(a.paddingLeft)+d(a.paddingRight),m=d(a.height)+d(a.paddingTop)+d(a.paddingBottom),h=t.getBoundingClientRect(),u=t.dataset.originalPosition||"top",f=i.find(H=>t.classList.contains(H)),j=u==="top"||u==="bottom"?E/2:E,ut=u==="top"?m+(u==="top"?n:0):m/2,N=h.top-ut<c,y=h.bottom+(u==="bottom"?m+n:0)>window.innerHeight,C=h.right+j+n>o,O=h.left-j-n<0,v=h.left+E/2+n>o,I=h.left-E/2-n<0;if(u!==f&&!(C||O||N||y||v||I)){t.classList.remove(...i),t.classList.add(u);return}let A=u;C&&v?A="left":O&&I?A="right":C&&N||O&&N?A=v&&"left"||I&&"right"||"bottom":C!==O&&!y?A=C?"left":"right":N&&["top","left","right"].includes(u)?A="bottom":y&&["bottom","left","right"].includes(u)&&(A="top"),f!==A&&(t.classList.remove(...i),t.classList.add(A))},P=function(t){let i=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!i.length)return;let o=(n,c)=>{if(c!=null)for(let a of i)a.hasAttribute(n)||a.setAttribute(n,c)};for(let n of bt)o(n,this.getAttribute(n));o("data-promotion-code",q(this))},dt=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let n=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let a=document.createElement("a",{is:"checkout-link"});return a.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,a})();for(let{name:a,value:d}of t.attributes)["class","is","href"].includes(a)||n.setAttribute(a,d);if(n.firstElementChild?.classList.add("spectrum-Button-label"),t.className){let a=xt.exec(t.className)?.[0]??"accent",d=a.startsWith("accent");return a.includes("-link")||(n.classList.add("button","con-button"),d?n.classList.add("blue"):a.startsWith("primary")&&!a.includes("-outline")&&n.classList.add("fill")),n}let c=t.parentElement?.tagName;if(c==="STRONG"||c==="EM"){let a=document.createElement(c.toLowerCase());return a.append(n),a}return n},pt=function(t){let o=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!o.length)return null;let n=document.createElement("div");return n.setAttribute("slot","footer"),n.append(...o.map(c=>l(this,s,dt).call(this,c))),n},W=function(t){if(typeof t!="string")return t;let i=t.trim();if(!(i.startsWith("<p>")&&i.endsWith("</p>")))return t;let n=i.slice(3,-4);return n.includes("<p>")?t:n};customElements.define(K,k);export{Nt as checkoutOptionsProvider,it as priceOptionsProvider};
