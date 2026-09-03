var dt=Object.defineProperty;var j=e=>{throw TypeError(e)};var pt=(e,o,t)=>o in e?dt(e,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[o]=t;var D=(e,o,t)=>pt(e,typeof o!="symbol"?o+"":o,t),U=(e,o,t)=>o.has(e)||j("Cannot "+t);var u=(e,o,t)=>(U(e,o,"read from private field"),t?t.call(e):o.get(e)),_=(e,o,t)=>o.has(e)?j("Cannot add the same private member more than once"):o instanceof WeakSet?o.add(e):o.set(e,t),R=(e,o,t,r)=>(U(e,o,"write to private field"),r?r.call(e,t):o.set(e,t),t),c=(e,o,t)=>(U(e,o,"access private method"),t);var Mt=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),Pt=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var ut='span[is="inline-price"][data-wcs-osi]',Et='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var mt='a[is="upt-link"]',wt=`${ut},${Et},${mt}`,X=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var M="aem:load";var z="mas:ready";var yt=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var It=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var Z="legal",Q="plan-type-text",J="mas-ff-defaults";var ft="mas-commerce-service";function tt(){return document.getElementsByTagName(ft)?.[0]}function et(e){let o=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&o?.isInlinePrice&&o?.dataset?.template==="price"}var ht=[".","!","?"],At=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=At,document.head.append(e)}function Tt(e){let o=document.createRange();return o.setStart(e.parentNode,0),o.setEndBefore(e),o.toString().replace(/\s+$/,"").slice(-1)}function _t(e){let o=Tt(e);return!o||ht.includes(o)?"upper":"lower"}function Y(e,o){if(e.dataset.placeholder===Q){let t=e.closest("merch-card, mas-field")?.osi;t&&(o.wcsOsi=t,o.displayPlanType=!0,o.displayPerUnit=!1,o.displayTax=!1,o.displayRecurrence=!1,o.displayOldPrice=!1,o.displayAnnual=!1,o.forceTaxExclusive=!1,o.displayDot=!1,o.planTypeCase=_t(e))}}var W="mas-field",gt=/(accent|primary|secondary)(-(outline|link))?/,Rt=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function K(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")?e.getAttribute("data-promotion-code"):null}function ot(e,o){let t=document.createElement("template");t.innerHTML=e;let r=[...t.content.querySelectorAll("a")],n=r.filter(i=>X.has(i.dataset.analyticsId));return n.length===0?e:n.length===r.length?o?null:e:(n.forEach(i=>i.remove()),t.innerHTML)}function nt(e,o){if(!e)return o;let t=e.closest(W);if(!(t||e.hasAttribute("fragment-id")))return o;o[J]=!0,o.wrapClauses=!0;let n=t?.aemFragment?.data?.priceLiterals;if(n&&(o.literals??(o.literals={}),Object.assign(o.literals,n)),et(e)&&(o.displayPerUnit=!1,o.displayTax=!1),t&&e.dataset.template===Z&&(o.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!o.promotionCode){let i=e.dataset.promotionCode??(t?K(t):null);i&&(o.promotionCode=i)}o.displayAnnual===void 0&&typeof t?.settings?.displayAnnual=="boolean"&&(o.displayAnnual=t.settings.displayAnnual)}function xt(e,o){if(o.promotionCode||!e)return;let t=e.closest(W),r=e.dataset.promotionCode??(t?K(t):null);r&&(o.promotionCode=r)}function Lt(e){!e?.providers||e.providers.has(nt)||(e.providers.price(nt),e.providers.checkout(xt),e.providers.has(Y)||e.providers.price(Y))}var Ct=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=Ct,document.head.append(e)}var S,L,T,g,C,a,P,F,rt,it,k,G,B,at,w,st,ct,$,V=class extends HTMLElement{constructor(){super(...arguments);_(this,a);_(this,S,null);_(this,L,!1);_(this,T,null);D(this,"settings",null);_(this,g,null);D(this,"compatVersion");_(this,C,t=>{t.target===this.aemFragment&&(R(this,T,t.detail?.fields||null),this.settings=t.detail?.settings??null,R(this,L,!0),c(this,a,G).call(this),this.dispatchEvent(new CustomEvent(z,{bubbles:!0,composed:!0,detail:t.detail})))})}static get observedAttributes(){return["field"]}attributeChangedCallback(t,r,n){t==="field"&&(R(this,S,n),c(this,a,G).call(this))}connectedCallback(){this.addEventListener(M,u(this,C)),c(this,a,P).call(this),this.aemFragment?.setAttribute("hidden",""),Lt(tt())}disconnectedCallback(){this.removeEventListener(M,u(this,C))}checkReady(){return u(this,L)?Promise.resolve(!0):new Promise(t=>{this.addEventListener(M,()=>t(!0),{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){let t=this.querySelector('[is="inline-price"][data-template="price"][data-promotion-code]'),r=this.querySelector('[is="inline-price"][data-template="price"]');return(t??r)?.dataset.wcsOsi??this.aemFragment?.data?.fields?.osi}};S=new WeakMap,L=new WeakMap,T=new WeakMap,g=new WeakMap,C=new WeakMap,a=new WeakSet,P=function(){if(u(this,g)?.isConnected)return u(this,g);let t=this.querySelector(':scope > span[data-role="mas-field-content"]');if(t)return R(this,g,t),t;let r=document.createElement("span");return r.setAttribute("data-role","mas-field-content"),this.append(r),R(this,g,r),r},F=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},rt=function(t){let r=t?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let n=t?.match(/^(.+)\[(.+)\]$/);return n?{fieldName:n[1],index:n[2]}:{fieldName:t,index:null}},it=function(t,r){if(typeof t!="string")return null;let n=document.createElement("template");n.innerHTML=t;let i;if(!isNaN(r)){let s=parseInt(r,10);i=[...n.content.querySelectorAll("a")][s-1]}return i||(i=n.content.querySelector(`a[data-key="${r}"]`)),i?(i.removeAttribute("class"),i.outerHTML):null},k=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},G=function(){if(!u(this,T)||!u(this,S))return;let{fieldName:t,index:r}=c(this,a,rt).call(this,u(this,S));if(r!==null&&isNaN(r)){let d=`${t.replace(/s$/,"")}Labels`,l=u(this,T)[d];if(l!==void 0){let E=(Array.isArray(l)?l:[l]).indexOf(r);if(E===-1)return;let f=u(this,T)[t],m=Array.isArray(f)?f:f?[f]:[],h=c(this,a,F).call(this,m[E]);if(!h||t==="ctas"&&this.settings?.hideTrialCTAs&&(h=ot(h,!0),h===null))return;c(this,a,k).call(this);let b=c(this,a,P).call(this);b.innerHTML=c(this,a,$).call(this,h)??"",c(this,a,B).call(this,b),c(this,a,w).call(this,b);return}}let n=c(this,a,F).call(this,u(this,T)[t]);if(n===void 0)return;c(this,a,k).call(this);let i=c(this,a,P).call(this),s;if(r!==null){if(s=c(this,a,it).call(this,n,r),s===null)return}else s=c(this,a,$).call(this,n);if(typeof s=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs&&(s=ot(s,r!==null),s===null))return;if(u(this,S)==="ctas"){let d=c(this,a,ct).call(this,s);if(d){i.replaceChildren(d),c(this,a,w).call(this,i);return}}i.innerHTML=s,c(this,a,B).call(this,i),c(this,a,w).call(this,i);return}i.textContent=s==null?"":String(s)},B=function(t){let r=t.querySelectorAll(".icon-button[data-tooltip]");for(let n of r){if(n.dataset.tooltipWired)continue;n.dataset.tooltipWired="1",n.querySelector("svg")||n.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),n.hasAttribute("tabindex")||n.setAttribute("tabindex","0"),n.hasAttribute("role")||n.setAttribute("role","button"),n.hasAttribute("aria-label")||n.setAttribute("aria-label",n.dataset.tooltip);let i=["top","bottom","left","right"],s=[...n.classList].find(E=>i.includes(E)),d=s||"top";s||n.classList.add(d),n.dataset.originalPosition=d,n.classList.add("hide-tooltip");let l=()=>{n.classList.remove("hide-tooltip"),c(this,a,at).call(this,n)},p=()=>n.classList.add("hide-tooltip");n.addEventListener("mouseenter",l),n.addEventListener("focus",l),n.addEventListener("mouseleave",p),n.addEventListener("blur",p),n.addEventListener("keydown",E=>{E.key==="Escape"&&p()})}},at=function(t){let r=["top","bottom","right","left"],n=window.innerWidth,i=12,s=document.querySelector("header")?.getBoundingClientRect().height||0,d=window.getComputedStyle(t,"::before"),l=H=>parseFloat(H)||0,p=l(d.width)+l(d.paddingLeft)+l(d.paddingRight),E=l(d.height)+l(d.paddingTop)+l(d.paddingBottom),f=t.getBoundingClientRect(),m=t.dataset.originalPosition||"top",h=r.find(H=>t.classList.contains(H)),q=m==="top"||m==="bottom"?p/2:p,lt=m==="top"?E+(m==="top"?i:0):E/2,N=f.top-lt<s,y=f.bottom+(m==="bottom"?E+i:0)>window.innerHeight,x=f.right+q+i>n,O=f.left-q-i<0,I=f.left+p/2+i>n,v=f.left-p/2-i<0;if(m!==h&&!(x||O||N||y||I||v)){t.classList.remove(...r),t.classList.add(m);return}let A=m;x&&I?A="left":O&&v?A="right":x&&N||O&&N?A=I&&"left"||v&&"right"||"bottom":x!==O&&!y?A=x?"left":"right":N&&["top","left","right"].includes(m)?A="bottom":y&&["bottom","left","right"].includes(m)&&(A="top"),h!==A&&(t.classList.remove(...r),t.classList.add(A))},w=function(t){let r=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let n=(i,s)=>{if(s!=null)for(let d of r)d.hasAttribute(i)||d.setAttribute(i,s)};for(let i of Rt)n(i,this.getAttribute(i));n("data-promotion-code",K(this))},st=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let n=gt.exec(t.className??"")?.[0]??"accent",i=n.startsWith("accent"),s=n.includes("-link"),l=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let p=document.createElement("a",{is:"checkout-link"});return p.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,p})();for(let{name:p,value:E}of t.attributes)["class","is","href"].includes(p)||l.setAttribute(p,E);return l.firstElementChild?.classList.add("spectrum-Button-label"),s||(l.classList.add("button","con-button"),i?l.classList.add("blue"):n.startsWith("primary")&&!n.includes("-outline")&&l.classList.add("fill")),l},ct=function(t){let n=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!n.length)return null;let i=document.createElement("div");return i.setAttribute("slot","footer"),i.append(...n.map(s=>c(this,a,st).call(this,s))),i},$=function(t){if(typeof t!="string")return t;let r=t.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return t;let i=r.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(W,V);export{xt as checkoutOptionsProvider,nt as priceOptionsProvider};
