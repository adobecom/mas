var lt=Object.defineProperty;var q=e=>{throw TypeError(e)};var dt=(e,n,t)=>n in e?lt(e,n,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[n]=t;var y=(e,n,t)=>dt(e,typeof n!="symbol"?n+"":n,t),U=(e,n,t)=>n.has(e)||q("Cannot "+t);var u=(e,n,t)=>(U(e,n,"read from private field"),t?t.call(e):n.get(e)),T=(e,n,t)=>n.has(e)?q("Cannot add the same private member more than once"):n instanceof WeakSet?n.add(e):n.set(e,t),R=(e,n,t,r)=>(U(e,n,"write to private field"),r?r.call(e,t):n.set(e,t),t),c=(e,n,t)=>(U(e,n,"access private method"),t);var Ct=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),xt=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var pt='span[is="inline-price"][data-wcs-osi]',ut='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Et='a[is="upt-link"]',bt=`${pt},${ut},${Et}`,j=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var M="aem:load";var z="mas:ready";var Nt=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var Ot=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var X="legal",Z="mas-ff-defaults";var mt="mas-commerce-service";function Q(){return document.getElementsByTagName(mt)?.[0]}function J(e){let n=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&n?.isInlinePrice&&n?.dataset?.template==="price"}var W="mas-field",ot=/(accent|primary|secondary)(-(outline|link))?/,ht=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function At(e){let n=ot.exec(e??"")?.[0];return!n||n.includes("-link")?null:`con-button ${n.startsWith("secondary")||n.includes("-outline")?"outline":"blue"}`}function $(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")?e.getAttribute("data-promotion-code"):null}function tt(e,n){let t=document.createElement("template");t.innerHTML=e;let r=[...t.content.querySelectorAll("a")],o=r.filter(i=>j.has(i.dataset.analyticsId));return o.length===0?e:o.length===r.length?n?null:e:(o.forEach(i=>i.remove()),t.innerHTML)}function et(e,n){if(!e)return n;let t=e.closest(W);if(!(t||e.hasAttribute("fragment-id")))return n;if(n[Z]=!0,n.wrapClauses=!0,J(e)&&(n.displayPerUnit=!1,n.displayTax=!1),t&&e.dataset.template===X&&(n.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!n.promotionCode){let o=e.dataset.promotionCode??(t?$(t):null);o&&(n.promotionCode=o)}n.displayAnnual===void 0&&typeof t?.settings?.displayAnnual=="boolean"&&(n.displayAnnual=t.settings.displayAnnual)}function _t(e,n){if(n.promotionCode||!e)return;let t=e.closest(W),r=e.dataset.promotionCode??(t?$(t):null);r&&(n.promotionCode=r)}function Tt(e){!e?.providers||e.providers.has(et)||(e.providers.price(et),e.providers.checkout(_t))}var St=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=St,document.head.append(e)}var S,C,_,g,x,s,P,V,nt,rt,F,k,G,it,w,st,at,B,Y=class extends HTMLElement{constructor(){super(...arguments);T(this,s);T(this,S,null);T(this,C,!1);T(this,_,null);y(this,"settings",null);T(this,g,null);y(this,"compatVersion");T(this,x,t=>{t.target===this.aemFragment&&(R(this,_,t.detail?.fields||null),this.settings=t.detail?.settings??null,R(this,C,!0),c(this,s,k).call(this),this.dispatchEvent(new CustomEvent(z,{bubbles:!0,composed:!0,detail:t.detail})))})}static get observedAttributes(){return["field"]}attributeChangedCallback(t,r,o){t==="field"&&(R(this,S,o),c(this,s,k).call(this))}connectedCallback(){this.addEventListener(M,u(this,x)),c(this,s,P).call(this),this.aemFragment?.setAttribute("hidden",""),Tt(Q())}disconnectedCallback(){this.removeEventListener(M,u(this,x))}checkReady(){return u(this,C)?Promise.resolve(!0):new Promise(t=>{this.addEventListener(M,()=>t(!0),{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}};S=new WeakMap,C=new WeakMap,_=new WeakMap,g=new WeakMap,x=new WeakMap,s=new WeakSet,P=function(){if(u(this,g)?.isConnected)return u(this,g);let t=this.querySelector(':scope > span[data-role="mas-field-content"]');if(t)return R(this,g,t),t;let r=document.createElement("span");return r.setAttribute("data-role","mas-field-content"),this.append(r),R(this,g,r),r},V=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},nt=function(t){let r=t?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let o=t?.match(/^(.+)\[(.+)\]$/);return o?{fieldName:o[1],index:o[2]}:{fieldName:t,index:null}},rt=function(t,r){if(typeof t!="string")return null;let o=document.createElement("template");o.innerHTML=t;let i;if(!isNaN(r)){let d=parseInt(r,10);i=[...o.content.querySelectorAll("a")][d-1]}if(i||(i=o.content.querySelector(`a[data-key="${r}"]`)),!i)return null;let a=At(i.className);return a?i.className=a:i.removeAttribute("class"),i.outerHTML},F=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},k=function(){if(!u(this,_)||!u(this,S))return;let{fieldName:t,index:r}=c(this,s,nt).call(this,u(this,S));if(r!==null&&isNaN(r)){let d=`${t.replace(/s$/,"")}Labels`,l=u(this,_)[d];if(l!==void 0){let E=(Array.isArray(l)?l:[l]).indexOf(r);if(E===-1)return;let f=u(this,_)[t],m=Array.isArray(f)?f:f?[f]:[],h=c(this,s,V).call(this,m[E]);if(!h||t==="ctas"&&this.settings?.hideTrialCTAs&&(h=tt(h,!0),h===null))return;c(this,s,F).call(this);let b=c(this,s,P).call(this);b.innerHTML=c(this,s,B).call(this,h)??"",c(this,s,G).call(this,b),c(this,s,w).call(this,b);return}}let o=c(this,s,V).call(this,u(this,_)[t]);if(o===void 0)return;c(this,s,F).call(this);let i=c(this,s,P).call(this),a;if(r!==null){if(a=c(this,s,rt).call(this,o,r),a===null)return}else a=c(this,s,B).call(this,o);if(typeof a=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs&&(a=tt(a,r!==null),a===null))return;if(u(this,S)==="ctas"){let d=c(this,s,at).call(this,a);if(d){i.replaceChildren(d),c(this,s,w).call(this,i);return}}i.innerHTML=a,c(this,s,G).call(this,i),c(this,s,w).call(this,i);return}i.textContent=a==null?"":String(a)},G=function(t){let r=t.querySelectorAll(".icon-button[data-tooltip]");for(let o of r){if(o.dataset.tooltipWired)continue;o.dataset.tooltipWired="1",o.querySelector("svg")||o.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),o.hasAttribute("tabindex")||o.setAttribute("tabindex","0"),o.hasAttribute("role")||o.setAttribute("role","button"),o.hasAttribute("aria-label")||o.setAttribute("aria-label",o.dataset.tooltip);let i=["top","bottom","left","right"],a=[...o.classList].find(E=>i.includes(E)),d=a||"top";a||o.classList.add(d),o.dataset.originalPosition=d,o.classList.add("hide-tooltip");let l=()=>{o.classList.remove("hide-tooltip"),c(this,s,it).call(this,o)},p=()=>o.classList.add("hide-tooltip");o.addEventListener("mouseenter",l),o.addEventListener("focus",l),o.addEventListener("mouseleave",p),o.addEventListener("blur",p),o.addEventListener("keydown",E=>{E.key==="Escape"&&p()})}},it=function(t){let r=["top","bottom","right","left"],o=window.innerWidth,i=12,a=document.querySelector("header")?.getBoundingClientRect().height||0,d=window.getComputedStyle(t,"::before"),l=D=>parseFloat(D)||0,p=l(d.width)+l(d.paddingLeft)+l(d.paddingRight),E=l(d.height)+l(d.paddingTop)+l(d.paddingBottom),f=t.getBoundingClientRect(),m=t.dataset.originalPosition||"top",h=r.find(D=>t.classList.contains(D)),K=m==="top"||m==="bottom"?p/2:p,ct=m==="top"?E+(m==="top"?i:0):E/2,N=f.top-ct<a,I=f.bottom+(m==="bottom"?E+i:0)>window.innerHeight,L=f.right+K+i>o,O=f.left-K-i<0,H=f.left+p/2+i>o,v=f.left-p/2-i<0;if(m!==h&&!(L||O||N||I||H||v)){t.classList.remove(...r),t.classList.add(m);return}let A=m;L&&H?A="left":O&&v?A="right":L&&N||O&&N?A=H&&"left"||v&&"right"||"bottom":L!==O&&!I?A=L?"left":"right":N&&["top","left","right"].includes(m)?A="bottom":I&&["bottom","left","right"].includes(m)&&(A="top"),h!==A&&(t.classList.remove(...r),t.classList.add(A))},w=function(t){let r=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let o=(i,a)=>{if(a!=null)for(let d of r)d.hasAttribute(i)||d.setAttribute(i,a)};for(let i of ht)o(i,this.getAttribute(i));o("data-promotion-code",$(this))},st=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let o=ot.exec(t.className??"")?.[0]??"accent",i=o.startsWith("accent"),a=o.includes("-link"),l=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let p=document.createElement("a",{is:"checkout-link"});return p.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,p})();for(let{name:p,value:E}of t.attributes)["class","is","href"].includes(p)||l.setAttribute(p,E);return l.firstElementChild?.classList.add("spectrum-Button-label"),a||(l.classList.add("button","con-button"),i?l.classList.add("blue"):o.startsWith("primary")&&!o.includes("-outline")&&l.classList.add("fill")),l},at=function(t){let o=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!o.length)return null;let i=document.createElement("div");return i.setAttribute("slot","footer"),i.append(...o.map(a=>c(this,s,st).call(this,a))),i},B=function(t){if(typeof t!="string")return t;let r=t.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return t;let i=r.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(W,Y);export{_t as checkoutOptionsProvider,et as priceOptionsProvider};
