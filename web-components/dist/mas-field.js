var ht=Object.defineProperty;var j=e=>{throw TypeError(e)};var ft=(e,o,t)=>o in e?ht(e,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[o]=t;var Y=(e,o,t)=>ft(e,typeof o!="symbol"?o+"":o,t),U=(e,o,t)=>o.has(e)||j("Cannot "+t);var p=(e,o,t)=>(U(e,o,"read from private field"),t?t.call(e):o.get(e)),_=(e,o,t)=>o.has(e)?j("Cannot add the same private member more than once"):o instanceof WeakSet?o.add(e):o.set(e,t),x=(e,o,t,r)=>(U(e,o,"write to private field"),r?r.call(e,t):o.set(e,t),t),l=(e,o,t)=>(U(e,o,"access private method"),t);var Ht=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),Yt=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var Et='span[is="inline-price"][data-wcs-osi]',At='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Tt='a[is="upt-link"]',Ut=`${Et},${At},${Tt}`,X=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var P="aem:load";var z="mas:ready";var Ft=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var Vt=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var Z="legal",Q="plan-type-text",J="mas-ff-defaults";var _t="mas-commerce-service";function tt(){return document.getElementsByTagName(_t)?.[0]}function et(e){let o=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&o?.isInlinePrice&&o?.dataset?.template==="price"}var gt=[".","!","?"],St=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=St,document.head.append(e)}var xt="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function Ct(e){let o=e.closest(xt)??e.parentNode,t=document.createRange();return t.setStart(o,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function ot(e){let o=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(r=>!r.closest("merch-addon"));return(o.find(r=>r.dataset.promotionCode&&r.dataset.promotionCode!=="cancel-context")??o[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function Rt(e){let o=Ct(e);return!o||gt.includes(o)?"upper":"lower"}function F(e,o){if(e.dataset.placeholder!==Q)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(o.wcsOsi=t,o.planTypeCase=Rt(e))}function bt(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")}function M(e){return bt(e)?e.contextPromotionCode:null}function nt(e,o){e&&(o.literals??(o.literals={}),Object.assign(o.literals,e))}function rt(e,o){et(e)&&(o.displayPerUnit=!1,o.displayTax=!1)}function it(e,o){o.displayAnnual===void 0&&typeof e?.settings?.displayAnnual=="boolean"&&(o.displayAnnual=e.settings.displayAnnual)}function st(e,o,t){!e?.providers||e.providers.has(o)||(e.providers.price(o),e.providers.checkout(t),e.providers.has(F)||e.providers.price(F))}var K="mas-field",Nt=/(accent|primary|secondary)(-(outline|link))?/,Ot=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function at(e,o){let t=document.createElement("template");t.innerHTML=e;let r=[...t.content.querySelectorAll("a")],n=r.filter(i=>X.has(i.dataset.analyticsId));return n.length===0?e:n.length===r.length?o?null:e:(n.forEach(i=>i.remove()),t.innerHTML)}function Pt(e,o){if(!e)return o;let t=e.closest(K);if(!(t||e.hasAttribute("fragment-id")))return o;if(o[J]=!0,o.wrapClauses=!0,nt(t?.aemFragment?.data?.priceLiterals,o),rt(e,o),t&&e.dataset.template===Z&&(o.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!o.promotionCode){let n=e.dataset.promotionCode??(t?M(t):null);n&&(o.promotionCode=n)}it(t,o)}function Mt(e,o){if(o.promotionCode||!e)return;let t=e.closest(K),r=e.dataset.promotionCode??(t?M(t):null);r&&(o.promotionCode=r)}function wt(e){st(e,Pt,Mt)}var yt=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=yt,document.head.append(e)}var g,R,T,S,L,s,w,G,ct,lt,k,B,$,dt,y,pt,ut,W,V=class extends HTMLElement{constructor(){super(...arguments);_(this,s);_(this,g,null);_(this,R,!1);_(this,T,null);Y(this,"settings",null);_(this,S,null);Y(this,"compatVersion");_(this,L,t=>{t.target===this.aemFragment&&(x(this,T,t.detail?.fields||null),this.settings=t.detail?.settings??null,x(this,R,!0),l(this,s,B).call(this),this.dispatchEvent(new CustomEvent(z,{bubbles:!0,composed:!0,detail:t.detail})))})}get contextPromotionCode(){return this.getAttribute("data-promotion-code")}static get observedAttributes(){return["field"]}attributeChangedCallback(t,r,n){t==="field"&&(x(this,g,n),l(this,s,B).call(this))}connectedCallback(){this.addEventListener(P,p(this,L)),l(this,s,w).call(this),this.aemFragment?.setAttribute("hidden",""),wt(tt())}disconnectedCallback(){this.removeEventListener(P,p(this,L))}checkReady(){return p(this,R)?Promise.resolve(!0):new Promise(t=>{this.addEventListener(P,()=>t(!0),{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return ot(this)}};g=new WeakMap,R=new WeakMap,T=new WeakMap,S=new WeakMap,L=new WeakMap,s=new WeakSet,w=function(){if(p(this,S)?.isConnected)return p(this,S);let t=this.querySelector(':scope > span[data-role="mas-field-content"]');if(t)return x(this,S,t),t;let r=document.createElement("span");return r.setAttribute("data-role","mas-field-content"),this.append(r),x(this,S,r),r},G=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},ct=function(t){let r=t?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let n=t?.match(/^(.+)\[(.+)\]$/);return n?{fieldName:n[1],index:n[2]}:{fieldName:t,index:null}},lt=function(t,r){if(typeof t!="string")return null;let n=document.createElement("template");n.innerHTML=t;let i;if(!isNaN(r)){let c=parseInt(r,10);i=[...n.content.querySelectorAll("a")][c-1]}return i||(i=n.content.querySelector(`a[data-key="${r}"]`)),i?(i.removeAttribute("class"),i.outerHTML):null},k=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},B=function(){if(!p(this,T)||!p(this,g))return;this.hidden=!1;let{fieldName:t,index:r}=l(this,s,ct).call(this,p(this,g));if(r!==null&&isNaN(r)){let a=`${t.replace(/s$/,"")}Labels`,d=p(this,T)[a];if(d!==void 0){let h=(Array.isArray(d)?d:[d]).indexOf(r);if(h===-1){this.hidden=!0;return}let m=p(this,T)[t],u=Array.isArray(m)?m:m?[m]:[],E=l(this,s,G).call(this,u[h]);if(!E){this.hidden=!0;return}if(t==="ctas"&&this.settings?.hideTrialCTAs&&(E=at(E,!0),E===null)){this.hidden=!0;return}l(this,s,k).call(this);let b=l(this,s,w).call(this);b.innerHTML=l(this,s,W).call(this,E)??"",l(this,s,$).call(this,b),l(this,s,y).call(this,b);return}}let n=l(this,s,G).call(this,p(this,T)[t]);if(n===void 0){this.hidden=!0;return}l(this,s,k).call(this);let i=l(this,s,w).call(this),c;if(r!==null){if(c=l(this,s,lt).call(this,n,r),c===null){this.hidden=!0;return}}else c=l(this,s,W).call(this,n);if(typeof c=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs&&(c=at(c,r!==null),c===null)){this.hidden=!0;return}if(p(this,g)==="ctas"){let a=l(this,s,ut).call(this,c);if(a){i.replaceChildren(a),l(this,s,y).call(this,i);return}}i.innerHTML=c,l(this,s,$).call(this,i),l(this,s,y).call(this,i);return}if(c==null){this.hidden=!0;return}i.textContent=String(c)},$=function(t){let r=t.querySelectorAll(".icon-button[data-tooltip]");for(let n of r){if(n.dataset.tooltipWired)continue;n.dataset.tooltipWired="1",n.querySelector("svg")||n.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),n.hasAttribute("tabindex")||n.setAttribute("tabindex","0"),n.hasAttribute("role")||n.setAttribute("role","button"),n.hasAttribute("aria-label")||n.setAttribute("aria-label",n.dataset.tooltip);let i=["top","bottom","left","right"],c=[...n.classList].find(h=>i.includes(h)),a=c||"top";c||n.classList.add(a),n.dataset.originalPosition=a,n.classList.add("hide-tooltip");let d=()=>{n.classList.remove("hide-tooltip"),l(this,s,dt).call(this,n)},f=()=>n.classList.add("hide-tooltip");n.addEventListener("mouseenter",d),n.addEventListener("focus",d),n.addEventListener("mouseleave",f),n.addEventListener("blur",f),n.addEventListener("keydown",h=>{h.key==="Escape"&&f()})}},dt=function(t){let r=["top","bottom","right","left"],n=window.innerWidth,i=12,c=document.querySelector("header")?.getBoundingClientRect().height||0,a=window.getComputedStyle(t,"::before"),d=H=>parseFloat(H)||0,f=d(a.width)+d(a.paddingLeft)+d(a.paddingRight),h=d(a.height)+d(a.paddingTop)+d(a.paddingBottom),m=t.getBoundingClientRect(),u=t.dataset.originalPosition||"top",E=r.find(H=>t.classList.contains(H)),q=u==="top"||u==="bottom"?f/2:f,mt=u==="top"?h+(u==="top"?i:0):h/2,N=m.top-mt<c,v=m.bottom+(u==="bottom"?h+i:0)>window.innerHeight,C=m.right+q+i>n,O=m.left-q-i<0,I=m.left+f/2+i>n,D=m.left-f/2-i<0;if(u!==E&&!(C||O||N||v||I||D)){t.classList.remove(...r),t.classList.add(u);return}let A=u;C&&I?A="left":O&&D?A="right":C&&N||O&&N?A=I&&"left"||D&&"right"||"bottom":C!==O&&!v?A=C?"left":"right":N&&["top","left","right"].includes(u)?A="bottom":v&&["bottom","left","right"].includes(u)&&(A="top"),E!==A&&(t.classList.remove(...r),t.classList.add(A))},y=function(t){let r=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let n=(i,c)=>{if(c!=null)for(let a of r)a.hasAttribute(i)||a.setAttribute(i,c)};for(let i of Ot)n(i,this.getAttribute(i));n("data-promotion-code",M(this))},pt=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let i=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let a=document.createElement("a",{is:"checkout-link"});return a.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,a})();for(let{name:a,value:d}of t.attributes)["class","is","href"].includes(a)||i.setAttribute(a,d);if(i.firstElementChild?.classList.add("spectrum-Button-label"),t.className){let a=Nt.exec(t.className)?.[0]??"accent",d=a.startsWith("accent");return a.includes("-link")||(i.classList.add("button","con-button"),d?i.classList.add("blue"):a.startsWith("primary")&&!a.includes("-outline")&&i.classList.add("fill")),i}let c=t.parentElement?.tagName;if(c==="STRONG"||c==="EM"){let a=document.createElement(c.toLowerCase());return a.append(i),a}return i},ut=function(t){let n=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!n.length)return null;let i=document.createElement("div");return i.setAttribute("slot","footer"),i.append(...n.map(c=>l(this,s,pt).call(this,c))),i},W=function(t){if(typeof t!="string")return t;let r=t.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return t;let i=r.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(K,V);export{Mt as checkoutOptionsProvider,Pt as priceOptionsProvider};
