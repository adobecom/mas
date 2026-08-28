var lt=Object.defineProperty;var q=e=>{throw TypeError(e)};var dt=(e,i,t)=>i in e?lt(e,i,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[i]=t;var j=(e,i,t)=>dt(e,typeof i!="symbol"?i+"":i,t),U=(e,i,t)=>i.has(e)||q("Cannot "+t);var E=(e,i,t)=>(U(e,i,"read from private field"),t?t.call(e):i.get(e)),_=(e,i,t)=>i.has(e)?q("Cannot add the same private member more than once"):i instanceof WeakSet?i.add(e):i.set(e,t),S=(e,i,t,n)=>(U(e,i,"write to private field"),n?n.call(e,t):i.set(e,t),t),c=(e,i,t)=>(U(e,i,"access private method"),t);var Ct=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),xt=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var pt='span[is="inline-price"][data-wcs-osi]',Et='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var ut='a[is="upt-link"]',bt=`${pt},${Et},${ut}`,z=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var P="aem:load";var X="mas:ready";var Nt=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var Mt=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var Z="legal",Q="mas-ff-defaults";var mt="mas-commerce-service";function J(){return document.getElementsByTagName(mt)?.[0]}function tt(e){let i=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&i?.isInlinePrice&&i?.dataset?.template==="price"}var W="mas-field",ht=/(accent|primary|secondary)(-(outline|link))?/,At=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function $(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")?e.getAttribute("data-promotion-code"):null}function et(e,i){let t=document.createElement("template");t.innerHTML=e;let n=[...t.content.querySelectorAll("a")],o=n.filter(r=>z.has(r.dataset.analyticsId));return o.length===0?e:o.length===n.length?i?null:e:(o.forEach(r=>r.remove()),t.innerHTML)}function ot(e,i){if(!e)return i;let t=e.closest(W);if(!(t||e.hasAttribute("fragment-id")))return i;if(i[Q]=!0,tt(e)&&(i.displayPerUnit=!1,i.displayTax=!1),t&&e.dataset.template===Z&&(i.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!i.promotionCode){let o=e.dataset.promotionCode??(t?$(t):null);o&&(i.promotionCode=o)}}function _t(e,i){if(i.promotionCode||!e)return;let t=e.closest(W),n=e.dataset.promotionCode??(t?$(t):null);n&&(i.promotionCode=n)}function Tt(e){!e?.providers||e.providers.has(ot)||(e.providers.price(ot),e.providers.checkout(_t))}var St=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=St,document.head.append(e)}var g,x,T,L,R,b,s,w,V,nt,rt,F,k,G,it,I,st,at,B,Y=class extends HTMLElement{constructor(){super(...arguments);_(this,s);_(this,g,null);_(this,x,!1);_(this,T,null);_(this,L,null);_(this,R,null);j(this,"compatVersion");_(this,b,t=>{t.target===this.aemFragment&&(S(this,T,t.detail?.fields||null),S(this,L,t.detail?.settings??null),S(this,x,!0),c(this,s,k).call(this),this.dispatchEvent(new CustomEvent(X,{bubbles:!0,composed:!0,detail:t.detail})))})}static get observedAttributes(){return["field"]}attributeChangedCallback(t,n,o){t==="field"&&(S(this,g,o),c(this,s,k).call(this))}connectedCallback(){this.addEventListener(P,E(this,b)),c(this,s,w).call(this),this.aemFragment?.setAttribute("hidden",""),Tt(J())}disconnectedCallback(){this.removeEventListener(P,E(this,b))}checkReady(){return E(this,x)?Promise.resolve(!0):new Promise(t=>{this.addEventListener(P,()=>t(!0),{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}};g=new WeakMap,x=new WeakMap,T=new WeakMap,L=new WeakMap,R=new WeakMap,b=new WeakMap,s=new WeakSet,w=function(){if(E(this,R)?.isConnected)return E(this,R);let t=this.querySelector(':scope > span[data-role="mas-field-content"]');if(t)return S(this,R,t),t;let n=document.createElement("span");return n.setAttribute("data-role","mas-field-content"),this.append(n),S(this,R,n),n},V=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},nt=function(t){let n=t?.match(/^(.+)\[(\d+)\]$/);if(n)return{fieldName:n[1],index:parseInt(n[2],10)};let o=t?.match(/^(.+)\[(.+)\]$/);return o?{fieldName:o[1],index:o[2]}:{fieldName:t,index:null}},rt=function(t,n){if(typeof t!="string")return null;let o=document.createElement("template");o.innerHTML=t;let r;if(!isNaN(n)){let a=parseInt(n,10);r=[...o.content.querySelectorAll("a")][a-1]}return r||(r=o.content.querySelector(`a[data-key="${n}"]`)),r?(r.removeAttribute("class"),r.outerHTML):null},F=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},k=function(){if(!E(this,T)||!E(this,g))return;let{fieldName:t,index:n}=c(this,s,nt).call(this,E(this,g));if(n!==null&&isNaN(n)){let d=`${t.replace(/s$/,"")}Labels`,l=E(this,T)[d];if(l!==void 0){let u=(Array.isArray(l)?l:[l]).indexOf(n);if(u===-1)return;let f=E(this,T)[t],m=Array.isArray(f)?f:f?[f]:[],h=c(this,s,V).call(this,m[u]);if(!h||t==="ctas"&&E(this,L)?.hideTrialCTAs&&(h=et(h,!0),h===null))return;c(this,s,F).call(this);let N=c(this,s,w).call(this);N.innerHTML=c(this,s,B).call(this,h)??"",c(this,s,G).call(this,N),c(this,s,I).call(this,N);return}}let o=c(this,s,V).call(this,E(this,T)[t]);if(o===void 0)return;c(this,s,F).call(this);let r=c(this,s,w).call(this),a;if(n!==null){if(a=c(this,s,rt).call(this,o,n),a===null)return}else a=c(this,s,B).call(this,o);if(typeof a=="string"){if(t==="ctas"&&E(this,L)?.hideTrialCTAs&&(a=et(a,n!==null),a===null))return;if(E(this,g)==="ctas"){let d=c(this,s,at).call(this,a);if(d){r.replaceChildren(d),c(this,s,I).call(this,r);return}}r.innerHTML=a,c(this,s,G).call(this,r),c(this,s,I).call(this,r);return}r.textContent=a==null?"":String(a)},G=function(t){let n=t.querySelectorAll(".icon-button[data-tooltip]");for(let o of n){if(o.dataset.tooltipWired)continue;o.dataset.tooltipWired="1",o.querySelector("svg")||o.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),o.hasAttribute("tabindex")||o.setAttribute("tabindex","0"),o.hasAttribute("role")||o.setAttribute("role","button"),o.hasAttribute("aria-label")||o.setAttribute("aria-label",o.dataset.tooltip);let r=["top","bottom","left","right"],a=[...o.classList].find(u=>r.includes(u)),d=a||"top";a||o.classList.add(d),o.dataset.originalPosition=d,o.classList.add("hide-tooltip");let l=()=>{o.classList.remove("hide-tooltip"),c(this,s,it).call(this,o)},p=()=>o.classList.add("hide-tooltip");o.addEventListener("mouseenter",l),o.addEventListener("focus",l),o.addEventListener("mouseleave",p),o.addEventListener("blur",p),o.addEventListener("keydown",u=>{u.key==="Escape"&&p()})}},it=function(t){let n=["top","bottom","right","left"],o=window.innerWidth,r=12,a=document.querySelector("header")?.getBoundingClientRect().height||0,d=window.getComputedStyle(t,"::before"),l=y=>parseFloat(y)||0,p=l(d.width)+l(d.paddingLeft)+l(d.paddingRight),u=l(d.height)+l(d.paddingTop)+l(d.paddingBottom),f=t.getBoundingClientRect(),m=t.dataset.originalPosition||"top",h=n.find(y=>t.classList.contains(y)),K=m==="top"||m==="bottom"?p/2:p,ct=m==="top"?u+(m==="top"?r:0):u/2,M=f.top-ct<a,H=f.bottom+(m==="bottom"?u+r:0)>window.innerHeight,C=f.right+K+r>o,O=f.left-K-r<0,v=f.left+p/2+r>o,D=f.left-p/2-r<0;if(m!==h&&!(C||O||M||H||v||D)){t.classList.remove(...n),t.classList.add(m);return}let A=m;C&&v?A="left":O&&D?A="right":C&&M||O&&M?A=v&&"left"||D&&"right"||"bottom":C!==O&&!H?A=C?"left":"right":M&&["top","left","right"].includes(m)?A="bottom":H&&["bottom","left","right"].includes(m)&&(A="top"),h!==A&&(t.classList.remove(...n),t.classList.add(A))},I=function(t){let n=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!n.length)return;let o=(r,a)=>{if(a!=null)for(let d of n)d.hasAttribute(r)||d.setAttribute(r,a)};for(let r of At)o(r,this.getAttribute(r));o("data-promotion-code",$(this))},st=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let o=ht.exec(t.className??"")?.[0]??"accent",r=o.startsWith("accent"),a=o.includes("-link"),l=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let p=document.createElement("a",{is:"checkout-link"});return p.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,p})();for(let{name:p,value:u}of t.attributes)["class","is","href"].includes(p)||l.setAttribute(p,u);return l.firstElementChild?.classList.add("spectrum-Button-label"),a||(l.classList.add("button","con-button"),r?l.classList.add("blue"):o.startsWith("primary")&&!o.includes("-outline")&&l.classList.add("fill")),l},at=function(t){let o=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!o.length)return null;let r=document.createElement("div");return r.setAttribute("slot","footer"),r.append(...o.map(a=>c(this,s,st).call(this,a))),r},B=function(t){if(typeof t!="string")return t;let n=t.trim();if(!(n.startsWith("<p>")&&n.endsWith("</p>")))return t;let r=n.slice(3,-4);return r.includes("<p>")?t:r};customElements.define(W,Y);export{_t as checkoutOptionsProvider,ot as priceOptionsProvider};
