var pt=Object.defineProperty;var j=e=>{throw TypeError(e)};var ut=(e,o,t)=>o in e?pt(e,o,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[o]=t;var D=(e,o,t)=>ut(e,typeof o!="symbol"?o+"":o,t),Y=(e,o,t)=>o.has(e)||j("Cannot "+t);var m=(e,o,t)=>(Y(e,o,"read from private field"),t?t.call(e):o.get(e)),_=(e,o,t)=>o.has(e)?j("Cannot add the same private member more than once"):o instanceof WeakSet?o.add(e):o.set(e,t),R=(e,o,t,r)=>(Y(e,o,"write to private field"),r?r.call(e,t):o.set(e,t),t),l=(e,o,t)=>(Y(e,o,"access private method"),t);var Pt=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),yt=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var mt='span[is="inline-price"][data-wcs-osi]',ht='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Et='a[is="upt-link"]',vt=`${mt},${ht},${Et}`,X=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var M="aem:load";var z="mas:ready";var It=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var Ht=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var Z="legal",Q="plan-type-text",J="mas-ff-defaults";var ft="mas-commerce-service";function tt(){return document.getElementsByTagName(ft)?.[0]}function et(e){let o=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&o?.isInlinePrice&&o?.dataset?.template==="price"}var At=[".","!","?"],Tt=`
merch-card span[is='inline-price'][data-template='legal'][data-placeholder='plan-type-text'] {
    display: inline;
}
span[is='inline-price'][data-placeholder='plan-type-text'] {
    visibility: visible;
}
`;if(typeof document<"u"&&!document.querySelector("style[data-plan-type-text]")){let e=document.createElement("style");e.setAttribute("data-plan-type-text",""),e.textContent=Tt,document.head.append(e)}var _t="p, div, li, td, th, h1, h2, h3, h4, h5, h6, section, article, blockquote";function gt(e){let o=e.closest(_t)??e.parentNode,t=document.createRange();return t.setStart(o,0),t.setEndBefore(e),t.toString().replace(/\s+$/,"").slice(-1)}function ot(e){let o=[...e.querySelectorAll('[is="inline-price"][data-template="price"]')].filter(r=>!r.closest("merch-addon"));return(o.find(r=>r.dataset.promotionCode&&r.dataset.promotionCode!=="cancel-context")??o[0])?.dataset.wcsOsi??e.aemFragment?.data?.fields?.osi}function St(e){let o=gt(e);return!o||At.includes(o)?"upper":"lower"}function U(e,o){if(e.dataset.placeholder!==Q)return;let t=e.closest("merch-card, mas-field")?.osi;t&&(o.wcsOsi=t,o.planTypeCase=St(e))}var W="mas-field",Ct=/(accent|primary|secondary)(-(outline|link))?/,xt=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function K(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")?e.getAttribute("data-promotion-code"):null}function nt(e,o){let t=document.createElement("template");t.innerHTML=e;let r=[...t.content.querySelectorAll("a")],n=r.filter(i=>X.has(i.dataset.analyticsId));return n.length===0?e:n.length===r.length?o?null:e:(n.forEach(i=>i.remove()),t.innerHTML)}function rt(e,o){if(!e)return o;let t=e.closest(W);if(!(t||e.hasAttribute("fragment-id")))return o;o[J]=!0,o.wrapClauses=!0;let n=t?.aemFragment?.data?.priceLiterals;if(n&&(o.literals??(o.literals={}),Object.assign(o.literals,n)),et(e)&&(o.displayPerUnit=!1,o.displayTax=!1),t&&e.dataset.template===Z&&(o.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!o.promotionCode){let i=e.dataset.promotionCode??(t?K(t):null);i&&(o.promotionCode=i)}o.displayAnnual===void 0&&typeof t?.settings?.displayAnnual=="boolean"&&(o.displayAnnual=t.settings.displayAnnual)}function Lt(e,o){if(o.promotionCode||!e)return;let t=e.closest(W),r=e.dataset.promotionCode??(t?K(t):null);r&&(o.promotionCode=r)}function bt(e){!e?.providers||e.providers.has(rt)||(e.providers.price(rt),e.providers.checkout(Lt),e.providers.has(U)||e.providers.price(U))}var Nt=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=Nt,document.head.append(e)}var g,x,T,S,L,s,w,F,it,st,G,k,B,at,P,ct,lt,$,V=class extends HTMLElement{constructor(){super(...arguments);_(this,s);_(this,g,null);_(this,x,!1);_(this,T,null);D(this,"settings",null);_(this,S,null);D(this,"compatVersion");_(this,L,t=>{t.target===this.aemFragment&&(R(this,T,t.detail?.fields||null),this.settings=t.detail?.settings??null,R(this,x,!0),l(this,s,k).call(this),this.dispatchEvent(new CustomEvent(z,{bubbles:!0,composed:!0,detail:t.detail})))})}static get observedAttributes(){return["field"]}attributeChangedCallback(t,r,n){t==="field"&&(R(this,g,n),l(this,s,k).call(this))}connectedCallback(){this.addEventListener(M,m(this,L)),l(this,s,w).call(this),this.aemFragment?.setAttribute("hidden",""),bt(tt())}disconnectedCallback(){this.removeEventListener(M,m(this,L))}checkReady(){return m(this,x)?Promise.resolve(!0):new Promise(t=>{this.addEventListener(M,()=>t(!0),{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}get osi(){return ot(this)}};g=new WeakMap,x=new WeakMap,T=new WeakMap,S=new WeakMap,L=new WeakMap,s=new WeakSet,w=function(){if(m(this,S)?.isConnected)return m(this,S);let t=this.querySelector(':scope > span[data-role="mas-field-content"]');if(t)return R(this,S,t),t;let r=document.createElement("span");return r.setAttribute("data-role","mas-field-content"),this.append(r),R(this,S,r),r},F=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},it=function(t){let r=t?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let n=t?.match(/^(.+)\[(.+)\]$/);return n?{fieldName:n[1],index:n[2]}:{fieldName:t,index:null}},st=function(t,r){if(typeof t!="string")return null;let n=document.createElement("template");n.innerHTML=t;let i;if(!isNaN(r)){let a=parseInt(r,10);i=[...n.content.querySelectorAll("a")][a-1]}return i||(i=n.content.querySelector(`a[data-key="${r}"]`)),i?(i.removeAttribute("class"),i.outerHTML):null},G=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},k=function(){if(!m(this,T)||!m(this,g))return;this.hidden=!1;let{fieldName:t,index:r}=l(this,s,it).call(this,m(this,g));if(r!==null&&isNaN(r)){let c=`${t.replace(/s$/,"")}Labels`,d=m(this,T)[c];if(d!==void 0){let p=(Array.isArray(d)?d:[d]).indexOf(r);if(p===-1){this.hidden=!0;return}let u=m(this,T)[t],h=Array.isArray(u)?u:u?[u]:[],f=l(this,s,F).call(this,h[p]);if(!f){this.hidden=!0;return}if(t==="ctas"&&this.settings?.hideTrialCTAs&&(f=nt(f,!0),f===null)){this.hidden=!0;return}l(this,s,G).call(this);let b=l(this,s,w).call(this);b.innerHTML=l(this,s,$).call(this,f)??"",l(this,s,B).call(this,b),l(this,s,P).call(this,b);return}}let n=l(this,s,F).call(this,m(this,T)[t]);if(n===void 0){this.hidden=!0;return}l(this,s,G).call(this);let i=l(this,s,w).call(this),a;if(r!==null){if(a=l(this,s,st).call(this,n,r),a===null){this.hidden=!0;return}}else a=l(this,s,$).call(this,n);if(typeof a=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs&&(a=nt(a,r!==null),a===null)){this.hidden=!0;return}if(m(this,g)==="ctas"){let c=l(this,s,lt).call(this,a);if(c){i.replaceChildren(c),l(this,s,P).call(this,i);return}}i.innerHTML=a,l(this,s,B).call(this,i),l(this,s,P).call(this,i);return}if(a==null){this.hidden=!0;return}i.textContent=String(a)},B=function(t){let r=t.querySelectorAll(".icon-button[data-tooltip]");for(let n of r){if(n.dataset.tooltipWired)continue;n.dataset.tooltipWired="1",n.querySelector("svg")||n.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),n.hasAttribute("tabindex")||n.setAttribute("tabindex","0"),n.hasAttribute("role")||n.setAttribute("role","button"),n.hasAttribute("aria-label")||n.setAttribute("aria-label",n.dataset.tooltip);let i=["top","bottom","left","right"],a=[...n.classList].find(p=>i.includes(p)),c=a||"top";a||n.classList.add(c),n.dataset.originalPosition=c,n.classList.add("hide-tooltip");let d=()=>{n.classList.remove("hide-tooltip"),l(this,s,at).call(this,n)},E=()=>n.classList.add("hide-tooltip");n.addEventListener("mouseenter",d),n.addEventListener("focus",d),n.addEventListener("mouseleave",E),n.addEventListener("blur",E),n.addEventListener("keydown",p=>{p.key==="Escape"&&E()})}},at=function(t){let r=["top","bottom","right","left"],n=window.innerWidth,i=12,a=document.querySelector("header")?.getBoundingClientRect().height||0,c=window.getComputedStyle(t,"::before"),d=H=>parseFloat(H)||0,E=d(c.width)+d(c.paddingLeft)+d(c.paddingRight),p=d(c.height)+d(c.paddingTop)+d(c.paddingBottom),u=t.getBoundingClientRect(),h=t.dataset.originalPosition||"top",f=r.find(H=>t.classList.contains(H)),q=h==="top"||h==="bottom"?E/2:E,dt=h==="top"?p+(h==="top"?i:0):p/2,N=u.top-dt<a,y=u.bottom+(h==="bottom"?p+i:0)>window.innerHeight,C=u.right+q+i>n,O=u.left-q-i<0,v=u.left+E/2+i>n,I=u.left-E/2-i<0;if(h!==f&&!(C||O||N||y||v||I)){t.classList.remove(...r),t.classList.add(h);return}let A=h;C&&v?A="left":O&&I?A="right":C&&N||O&&N?A=v&&"left"||I&&"right"||"bottom":C!==O&&!y?A=C?"left":"right":N&&["top","left","right"].includes(h)?A="bottom":y&&["bottom","left","right"].includes(h)&&(A="top"),f!==A&&(t.classList.remove(...r),t.classList.add(A))},P=function(t){let r=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let n=(i,a)=>{if(a!=null)for(let c of r)c.hasAttribute(i)||c.setAttribute(i,a)};for(let i of xt)n(i,this.getAttribute(i));n("data-promotion-code",K(this))},ct=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let i=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let p=document.createElement("a",{is:"checkout-link"});return p.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,p})();for(let{name:p,value:u}of t.attributes)["class","is","href"].includes(p)||i.setAttribute(p,u);i.firstElementChild?.classList.add("spectrum-Button-label");let a=t.parentElement?.tagName,c=t.className;c||(a==="STRONG"?c="primary":a==="EM"?c="secondary":c="secondary-link");let d=Ct.exec(c)?.[0]??"accent",E=d.startsWith("accent");if(d.includes("-link")||(i.classList.add("button","con-button"),E?i.classList.add("blue"):d.startsWith("primary")&&!d.includes("-outline")&&i.classList.add("fill")),!t.className&&(a==="STRONG"||a==="EM")){let p=document.createElement(a.toLowerCase());return p.append(i),p}return i},lt=function(t){let n=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!n.length)return null;let i=document.createElement("div");return i.setAttribute("slot","footer"),i.append(...n.map(a=>l(this,s,ct).call(this,a))),i},$=function(t){if(typeof t!="string")return t;let r=t.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return t;let i=r.slice(3,-4);return i.includes("<p>")?t:i};customElements.define(W,V);export{Lt as checkoutOptionsProvider,rt as priceOptionsProvider};
