var st=Object.defineProperty;var K=o=>{throw TypeError(o)};var at=(o,r,t)=>r in o?st(o,r,{enumerable:!0,configurable:!0,writable:!0,value:t}):o[r]=t;var q=(o,r,t)=>at(o,typeof r!="symbol"?r+"":r,t),D=(o,r,t)=>r.has(o)||K("Cannot "+t);var E=(o,r,t)=>(D(o,r,"read from private field"),t?t.call(o):r.get(o)),_=(o,r,t)=>r.has(o)?K("Cannot add the same private member more than once"):r instanceof WeakSet?r.add(o):r.set(o,t),R=(o,r,t,n)=>(D(o,r,"write to private field"),n?n.call(o,t):r.set(o,t),t),l=(o,r,t)=>(D(o,r,"access private method"),t);var St=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),Rt=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var ct='span[is="inline-price"][data-wcs-osi]',lt='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var dt='a[is="upt-link"]',gt=`${ct},${lt},${dt}`;var M="aem:load";var j="mas:ready";var Lt=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var xt=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var z="legal",X="mas-ff-defaults";var pt="mas-commerce-service";function Z(){return document.getElementsByTagName(pt)?.[0]}function Q(o){let r=o.nextElementSibling?.nodeName==="BR"?o.nextElementSibling.nextElementSibling:o.nextElementSibling;return o.dataset.template==="strikethrough"&&(o.nextSibling?.nodeName!=="#text"||o.nextSibling.textContent.trim().length<2)&&r?.isInlinePrice&&r?.dataset?.template==="price"}var B="mas-field",mt=/(accent|primary|secondary)(-(outline|link))?/;function W(o){return o.compatVersion>=1||o.hasAttribute("data-promotion-project")?o.getAttribute("data-promotion-code"):null}function J(o,r){let t=o?.closest?.(B);if(!t)return r;if(r[X]=!0,Q(o)&&(r.displayPerUnit=!1,r.displayTax=!1),o.dataset.template===z&&(r.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!r.promotionCode){let n=W(t);n&&(r.promotionCode=n)}}function ut(o,r){let t=o?.closest?.(B);if(!t)return r;if(!r.promotionCode){let n=W(t);n&&(r.promotionCode=n)}}function ft(o){!o?.providers||o.providers.has(J)||(o.providers.price(J),o.providers.checkout(ut))}var ht=`
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
`;if(!document.querySelector("style[data-mas-field]")){let o=document.createElement("style");o.setAttribute("data-mas-field",""),o.textContent=ht,document.head.append(o)}var T,x,A,S,C,i,O,U,tt,et,Y,V,F,ot,G,nt,rt,k,y=class extends HTMLElement{constructor(){super(...arguments);_(this,i);_(this,T,null);_(this,x,!1);_(this,A,null);_(this,S,null);q(this,"compatVersion");_(this,C,t=>{t.target===this.aemFragment&&(R(this,A,t.detail?.fields||null),R(this,x,!0),l(this,i,V).call(this),this.dispatchEvent(new CustomEvent(j,{bubbles:!0,composed:!0,detail:t.detail})))})}static get observedAttributes(){return["field"]}attributeChangedCallback(t,n,e){t==="field"&&(R(this,T,e),l(this,i,V).call(this))}connectedCallback(){this.addEventListener(M,E(this,C)),l(this,i,O).call(this),this.aemFragment?.setAttribute("hidden",""),ft(Z())}disconnectedCallback(){this.removeEventListener(M,E(this,C))}checkReady(){return E(this,x)?Promise.resolve(!0):new Promise(t=>{this.addEventListener(M,()=>t(!0),{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}};T=new WeakMap,x=new WeakMap,A=new WeakMap,S=new WeakMap,C=new WeakMap,i=new WeakSet,O=function(){if(E(this,S)?.isConnected)return E(this,S);let t=this.querySelector(':scope > span[data-role="mas-field-content"]');if(t)return R(this,S,t),t;let n=document.createElement("span");return n.setAttribute("data-role","mas-field-content"),this.append(n),R(this,S,n),n},U=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},tt=function(t){let n=t?.match(/^(.+)\[(\d+)\]$/);if(n)return{fieldName:n[1],index:parseInt(n[2],10)};let e=t?.match(/^(.+)\[(.+)\]$/);return e?{fieldName:e[1],index:e[2]}:{fieldName:t,index:null}},et=function(t,n){if(typeof t!="string")return null;let e=document.createElement("template");e.innerHTML=t;let s;if(!isNaN(n)){let a=parseInt(n,10);s=[...e.content.querySelectorAll("a")][a-1]}return s||(s=e.content.querySelector(`a[data-key="${n}"]`)),s?(s.removeAttribute("class"),s.outerHTML):null},Y=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},V=function(){if(!E(this,A)||!E(this,T))return;let{fieldName:t,index:n}=l(this,i,tt).call(this,E(this,T));if(n!==null&&isNaN(n)){let d=`${t.replace(/s$/,"")}Labels`,c=E(this,A)[d];if(c!==void 0){let m=(Array.isArray(c)?c:[c]).indexOf(n);if(m===-1)return;let f=E(this,A)[t],u=Array.isArray(f)?f:f?[f]:[],g=l(this,i,U).call(this,u[m]);if(!g)return;l(this,i,Y).call(this);let P=l(this,i,O).call(this);P.innerHTML=l(this,i,k).call(this,g)??"",l(this,i,F).call(this,P);return}}let e=l(this,i,U).call(this,E(this,A)[t]);if(e===void 0)return;l(this,i,Y).call(this);let s=l(this,i,O).call(this),a;if(n!==null){if(a=l(this,i,et).call(this,e,n),a===null)return}else a=l(this,i,k).call(this,e);if(typeof a=="string"){if(E(this,T)==="ctas"){let d=l(this,i,rt).call(this,a);if(d){s.replaceChildren(d),l(this,i,G).call(this,s,t);return}}s.innerHTML=a,l(this,i,F).call(this,s),l(this,i,G).call(this,s,t);return}s.textContent=a==null?"":String(a)},F=function(t){let n=t.querySelectorAll(".icon-button[data-tooltip]");for(let e of n){if(e.dataset.tooltipWired)continue;e.dataset.tooltipWired="1",e.querySelector("svg")||e.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),e.hasAttribute("tabindex")||e.setAttribute("tabindex","0"),e.hasAttribute("role")||e.setAttribute("role","button"),e.hasAttribute("aria-label")||e.setAttribute("aria-label",e.dataset.tooltip);let s=["top","bottom","left","right"],a=[...e.classList].find(m=>s.includes(m)),d=a||"top";a||e.classList.add(d),e.dataset.originalPosition=d,e.classList.add("hide-tooltip");let c=()=>{e.classList.remove("hide-tooltip"),l(this,i,ot).call(this,e)},p=()=>e.classList.add("hide-tooltip");e.addEventListener("mouseenter",c),e.addEventListener("focus",c),e.addEventListener("mouseleave",p),e.addEventListener("blur",p),e.addEventListener("keydown",m=>{m.key==="Escape"&&p()})}},ot=function(t){let n=["top","bottom","right","left"],e=window.innerWidth,s=12,a=document.querySelector("header")?.getBoundingClientRect().height||0,d=window.getComputedStyle(t,"::before"),c=v=>parseFloat(v)||0,p=c(d.width)+c(d.paddingLeft)+c(d.paddingRight),m=c(d.height)+c(d.paddingTop)+c(d.paddingBottom),f=t.getBoundingClientRect(),u=t.dataset.originalPosition||"top",g=n.find(v=>t.classList.contains(v)),$=u==="top"||u==="bottom"?p/2:p,it=u==="top"?m+(u==="top"?s:0):m/2,b=f.top-it<a,w=f.bottom+(u==="bottom"?m+s:0)>window.innerHeight,L=f.right+$+s>e,N=f.left-$-s<0,I=f.left+p/2+s>e,H=f.left-p/2-s<0;if(u!==g&&!(L||N||b||w||I||H)){t.classList.remove(...n),t.classList.add(u);return}let h=u;L&&I?h="left":N&&H?h="right":L&&b||N&&b?h=I&&"left"||H&&"right"||"bottom":L!==N&&!w?h=L?"left":"right":b&&["top","left","right"].includes(u)?h="bottom":w&&["bottom","left","right"].includes(u)&&(h="top"),g!==h&&(t.classList.remove(...n),t.classList.add(h))},G=function(t,n){if(n!=="ctas")return;let e=W(this);if(!e)return;let s=t.querySelectorAll("a[data-wcs-osi]:not([data-promotion-code])");for(let a of s)a.setAttribute("data-promotion-code",e)},nt=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let e=mt.exec(t.className??"")?.[0]??"accent",s=e.startsWith("accent"),a=e.includes("-link"),c=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let p=document.createElement("a",{is:"checkout-link"});return p.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,p})();for(let{name:p,value:m}of t.attributes)["class","is","href"].includes(p)||c.setAttribute(p,m);return c.firstElementChild?.classList.add("spectrum-Button-label"),a||(c.classList.add("button","con-button"),s?c.classList.add("blue"):e.startsWith("primary")&&!e.includes("-outline")&&c.classList.add("fill")),c},rt=function(t){let e=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!e.length)return null;let s=document.createElement("div");return s.setAttribute("slot","footer"),s.append(...e.map(a=>l(this,i,nt).call(this,a))),s},k=function(t){if(typeof t!="string")return t;let n=t.trim();if(!(n.startsWith("<p>")&&n.endsWith("</p>")))return t;let s=n.slice(3,-4);return s.includes("<p>")?t:s};customElements.define(B,y);export{ut as checkoutOptionsProvider,J as priceOptionsProvider};
