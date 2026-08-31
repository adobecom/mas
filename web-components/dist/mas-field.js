var ct=Object.defineProperty;var q=o=>{throw TypeError(o)};var lt=(o,r,t)=>r in o?ct(o,r,{enumerable:!0,configurable:!0,writable:!0,value:t}):o[r]=t;var v=(o,r,t)=>lt(o,typeof r!="symbol"?r+"":r,t),y=(o,r,t)=>r.has(o)||q("Cannot "+t);var E=(o,r,t)=>(y(o,r,"read from private field"),t?t.call(o):r.get(o)),T=(o,r,t)=>r.has(o)?q("Cannot add the same private member more than once"):r instanceof WeakSet?r.add(o):r.set(o,t),R=(o,r,t,n)=>(y(o,r,"write to private field"),n?n.call(o,t):r.set(o,t),t),l=(o,r,t)=>(y(o,r,"access private method"),t);var Rt=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),Lt=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var dt='span[is="inline-price"][data-wcs-osi]',pt='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Et='a[is="upt-link"]',xt=`${dt},${pt},${Et}`,j=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var M="aem:load";var z="mas:ready";var Ct=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var bt=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var X="legal",Z="mas-ff-defaults";var ut="mas-commerce-service";function Q(){return document.getElementsByTagName(ut)?.[0]}function J(o){let r=o.nextElementSibling?.nodeName==="BR"?o.nextElementSibling.nextElementSibling:o.nextElementSibling;return o.dataset.template==="strikethrough"&&(o.nextSibling?.nodeName!=="#text"||o.nextSibling.textContent.trim().length<2)&&r?.isInlinePrice&&r?.dataset?.template==="price"}var W="mas-field",ft=/(accent|primary|secondary)(-(outline|link))?/;function $(o){return o.compatVersion>=1||o.hasAttribute("data-promotion-project")?o.getAttribute("data-promotion-code"):null}function tt(o,r){let t=document.createElement("template");t.innerHTML=o;let n=[...t.content.querySelectorAll("a")],e=n.filter(i=>j.has(i.dataset.analyticsId));return e.length===0?o:e.length===n.length?r?null:o:(e.forEach(i=>i.remove()),t.innerHTML)}function et(o,r){let t=o?.closest?.(W);if(!t)return r;if(r[Z]=!0,J(o)&&(r.displayPerUnit=!1,r.displayTax=!1),o.dataset.template===X&&(r.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!r.promotionCode){let n=$(t);n&&(r.promotionCode=n)}r.displayAnnual===void 0&&typeof t.settings.displayAnnual=="boolean"&&(r.displayAnnual=t.settings.displayAnnual)}function ht(o,r){let t=o?.closest?.(W);if(!t)return r;if(!r.promotionCode){let n=$(t);n&&(r.promotionCode=n)}}function At(o){!o?.providers||o.providers.has(et)||(o.providers.price(et),o.providers.checkout(ht))}var _t=`
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
`;if(!document.querySelector("style[data-mas-field]")){let o=document.createElement("style");o.setAttribute("data-mas-field",""),o.textContent=_t,document.head.append(o)}var S,x,_,g,C,s,O,Y,ot,nt,V,F,G,rt,k,it,st,B,U=class extends HTMLElement{constructor(){super(...arguments);T(this,s);T(this,S,null);T(this,x,!1);T(this,_,null);v(this,"settings",null);T(this,g,null);v(this,"compatVersion");T(this,C,t=>{t.target===this.aemFragment&&(R(this,_,t.detail?.fields||null),this.settings=t.detail?.settings??null,R(this,x,!0),l(this,s,F).call(this),this.dispatchEvent(new CustomEvent(z,{bubbles:!0,composed:!0,detail:t.detail})))})}static get observedAttributes(){return["field"]}attributeChangedCallback(t,n,e){t==="field"&&(R(this,S,e),l(this,s,F).call(this))}connectedCallback(){this.addEventListener(M,E(this,C)),l(this,s,O).call(this),this.aemFragment?.setAttribute("hidden",""),At(Q())}disconnectedCallback(){this.removeEventListener(M,E(this,C))}checkReady(){return E(this,x)?Promise.resolve(!0):new Promise(t=>{this.addEventListener(M,()=>t(!0),{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}};S=new WeakMap,x=new WeakMap,_=new WeakMap,g=new WeakMap,C=new WeakMap,s=new WeakSet,O=function(){if(E(this,g)?.isConnected)return E(this,g);let t=this.querySelector(':scope > span[data-role="mas-field-content"]');if(t)return R(this,g,t),t;let n=document.createElement("span");return n.setAttribute("data-role","mas-field-content"),this.append(n),R(this,g,n),n},Y=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},ot=function(t){let n=t?.match(/^(.+)\[(\d+)\]$/);if(n)return{fieldName:n[1],index:parseInt(n[2],10)};let e=t?.match(/^(.+)\[(.+)\]$/);return e?{fieldName:e[1],index:e[2]}:{fieldName:t,index:null}},nt=function(t,n){if(typeof t!="string")return null;let e=document.createElement("template");e.innerHTML=t;let i;if(!isNaN(n)){let a=parseInt(n,10);i=[...e.content.querySelectorAll("a")][a-1]}return i||(i=e.content.querySelector(`a[data-key="${n}"]`)),i?(i.removeAttribute("class"),i.outerHTML):null},V=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},F=function(){if(!E(this,_)||!E(this,S))return;let{fieldName:t,index:n}=l(this,s,ot).call(this,E(this,S));if(n!==null&&isNaN(n)){let d=`${t.replace(/s$/,"")}Labels`,c=E(this,_)[d];if(c!==void 0){let u=(Array.isArray(c)?c:[c]).indexOf(n);if(u===-1)return;let f=E(this,_)[t],m=Array.isArray(f)?f:f?[f]:[],h=l(this,s,Y).call(this,m[u]);if(!h||t==="ctas"&&this.settings?.hideTrialCTAs&&(h=tt(h,!0),h===null))return;l(this,s,V).call(this);let P=l(this,s,O).call(this);P.innerHTML=l(this,s,B).call(this,h)??"",l(this,s,G).call(this,P);return}}let e=l(this,s,Y).call(this,E(this,_)[t]);if(e===void 0)return;l(this,s,V).call(this);let i=l(this,s,O).call(this),a;if(n!==null){if(a=l(this,s,nt).call(this,e,n),a===null)return}else a=l(this,s,B).call(this,e);if(typeof a=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs&&(a=tt(a,n!==null),a===null))return;if(E(this,S)==="ctas"){let d=l(this,s,st).call(this,a);if(d){i.replaceChildren(d),l(this,s,k).call(this,i,t);return}}i.innerHTML=a,l(this,s,G).call(this,i),l(this,s,k).call(this,i,t);return}i.textContent=a==null?"":String(a)},G=function(t){let n=t.querySelectorAll(".icon-button[data-tooltip]");for(let e of n){if(e.dataset.tooltipWired)continue;e.dataset.tooltipWired="1",e.querySelector("svg")||e.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),e.hasAttribute("tabindex")||e.setAttribute("tabindex","0"),e.hasAttribute("role")||e.setAttribute("role","button"),e.hasAttribute("aria-label")||e.setAttribute("aria-label",e.dataset.tooltip);let i=["top","bottom","left","right"],a=[...e.classList].find(u=>i.includes(u)),d=a||"top";a||e.classList.add(d),e.dataset.originalPosition=d,e.classList.add("hide-tooltip");let c=()=>{e.classList.remove("hide-tooltip"),l(this,s,rt).call(this,e)},p=()=>e.classList.add("hide-tooltip");e.addEventListener("mouseenter",c),e.addEventListener("focus",c),e.addEventListener("mouseleave",p),e.addEventListener("blur",p),e.addEventListener("keydown",u=>{u.key==="Escape"&&p()})}},rt=function(t){let n=["top","bottom","right","left"],e=window.innerWidth,i=12,a=document.querySelector("header")?.getBoundingClientRect().height||0,d=window.getComputedStyle(t,"::before"),c=D=>parseFloat(D)||0,p=c(d.width)+c(d.paddingLeft)+c(d.paddingRight),u=c(d.height)+c(d.paddingTop)+c(d.paddingBottom),f=t.getBoundingClientRect(),m=t.dataset.originalPosition||"top",h=n.find(D=>t.classList.contains(D)),K=m==="top"||m==="bottom"?p/2:p,at=m==="top"?u+(m==="top"?i:0):u/2,b=f.top-at<a,w=f.bottom+(m==="bottom"?u+i:0)>window.innerHeight,L=f.right+K+i>e,N=f.left-K-i<0,I=f.left+p/2+i>e,H=f.left-p/2-i<0;if(m!==h&&!(L||N||b||w||I||H)){t.classList.remove(...n),t.classList.add(m);return}let A=m;L&&I?A="left":N&&H?A="right":L&&b||N&&b?A=I&&"left"||H&&"right"||"bottom":L!==N&&!w?A=L?"left":"right":b&&["top","left","right"].includes(m)?A="bottom":w&&["bottom","left","right"].includes(m)&&(A="top"),h!==A&&(t.classList.remove(...n),t.classList.add(A))},k=function(t,n){if(n!=="ctas")return;let e=$(this);if(!e)return;let i=t.querySelectorAll("a[data-wcs-osi]:not([data-promotion-code])");for(let a of i)a.setAttribute("data-promotion-code",e)},it=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let e=ft.exec(t.className??"")?.[0]??"accent",i=e.startsWith("accent"),a=e.includes("-link"),c=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let p=document.createElement("a",{is:"checkout-link"});return p.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,p})();for(let{name:p,value:u}of t.attributes)["class","is","href"].includes(p)||c.setAttribute(p,u);return c.firstElementChild?.classList.add("spectrum-Button-label"),a||(c.classList.add("button","con-button"),i?c.classList.add("blue"):e.startsWith("primary")&&!e.includes("-outline")&&c.classList.add("fill")),c},st=function(t){let e=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!e.length)return null;let i=document.createElement("div");return i.setAttribute("slot","footer"),i.append(...e.map(a=>l(this,s,it).call(this,a))),i},B=function(t){if(typeof t!="string")return t;let n=t.trim();if(!(n.startsWith("<p>")&&n.endsWith("</p>")))return t;let i=n.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(W,U);export{ht as checkoutOptionsProvider,et as priceOptionsProvider};
