var ct=Object.defineProperty;var q=e=>{throw TypeError(e)};var lt=(e,i,t)=>i in e?ct(e,i,{enumerable:!0,configurable:!0,writable:!0,value:t}):e[i]=t;var y=(e,i,t)=>lt(e,typeof i!="symbol"?i+"":i,t),U=(e,i,t)=>i.has(e)||q("Cannot "+t);var p=(e,i,t)=>(U(e,i,"read from private field"),t?t.call(e):i.get(e)),T=(e,i,t)=>i.has(e)?q("Cannot add the same private member more than once"):i instanceof WeakSet?i.add(e):i.set(e,t),R=(e,i,t,r)=>(U(e,i,"write to private field"),r?r.call(e,t):i.set(e,t),t),l=(e,i,t)=>(U(e,i,"access private method"),t);var Lt=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),Ct=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var dt='span[is="inline-price"][data-wcs-osi]',pt='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var ut='a[is="upt-link"]',xt=`${dt},${pt},${ut}`,j=new Set(["free-trial","start-free-trial","seven-day-trial","fourteen-day-trial","thirty-day-trial"]);var M="aem:load";var z="mas:ready";var bt=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var Nt=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var X="legal",Z="mas-ff-defaults";var Et="mas-commerce-service";function Q(){return document.getElementsByTagName(Et)?.[0]}function J(e){let i=e.nextElementSibling?.nodeName==="BR"?e.nextElementSibling.nextElementSibling:e.nextElementSibling;return e.dataset.template==="strikethrough"&&(e.nextSibling?.nodeName!=="#text"||e.nextSibling.textContent.trim().length<2)&&i?.isInlinePrice&&i?.dataset?.template==="price"}var W="mas-field",ft=/(accent|primary|secondary)(-(outline|link))?/,ht=["fragment-id","variation-id","mask-id","data-promotion-project","data-promotion-variation-project"];function $(e){return e.compatVersion>=1||e.hasAttribute("data-promotion-project")?e.getAttribute("data-promotion-code"):null}function tt(e,i){let t=document.createElement("template");t.innerHTML=e;let r=[...t.content.querySelectorAll("a")],o=r.filter(n=>j.has(n.dataset.analyticsId));return o.length===0?e:o.length===r.length?i?null:e:(o.forEach(n=>n.remove()),t.innerHTML)}function et(e,i){if(!e)return i;let t=e.closest(W);if(!(t||e.hasAttribute("fragment-id")))return i;if(i[Z]=!0,J(e)&&(i.displayPerUnit=!1,i.displayTax=!1),t&&e.dataset.template===X&&(i.displayPlanType=t.aemFragment?.data?.settings?.displayPlanType??!1),!i.promotionCode){let o=e.dataset.promotionCode??(t?$(t):null);o&&(i.promotionCode=o)}i.displayAnnual===void 0&&typeof t?.settings?.displayAnnual=="boolean"&&(i.displayAnnual=t.settings.displayAnnual)}function At(e,i){if(i.promotionCode||!e)return;let t=e.closest(W),r=e.dataset.promotionCode??(t?$(t):null);r&&(i.promotionCode=r)}function _t(e){!e?.providers||e.providers.has(et)||(e.providers.price(et),e.providers.checkout(At))}var Tt=`
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
`;if(!document.querySelector("style[data-mas-field]")){let e=document.createElement("style");e.setAttribute("data-mas-field",""),e.textContent=Tt,document.head.append(e)}var S,C,_,g,x,s,P,V,ot,nt,F,G,k,rt,w,it,st,B,Y=class extends HTMLElement{constructor(){super(...arguments);T(this,s);T(this,S,null);T(this,C,!1);T(this,_,null);y(this,"settings",null);T(this,g,null);y(this,"compatVersion");T(this,x,t=>{t.target===this.aemFragment&&(R(this,_,t.detail?.fields||null),this.settings=t.detail?.settings??null,R(this,C,!0),l(this,s,G).call(this),this.dispatchEvent(new CustomEvent(z,{bubbles:!0,composed:!0,detail:t.detail})))})}static get observedAttributes(){return["field"]}attributeChangedCallback(t,r,o){t==="field"&&(R(this,S,o),l(this,s,G).call(this))}connectedCallback(){this.addEventListener(M,p(this,x)),l(this,s,P).call(this),this.aemFragment?.setAttribute("hidden",""),_t(Q())}disconnectedCallback(){this.removeEventListener(M,p(this,x))}checkReady(){return p(this,C)?Promise.resolve(!0):new Promise(t=>{this.addEventListener(M,()=>t(!0),{once:!0})})}get aemFragment(){return this.querySelector("aem-fragment")}};S=new WeakMap,C=new WeakMap,_=new WeakMap,g=new WeakMap,x=new WeakMap,s=new WeakSet,P=function(){if(p(this,g)?.isConnected)return p(this,g);let t=this.querySelector(':scope > span[data-role="mas-field-content"]');if(t)return R(this,g,t),t;let r=document.createElement("span");return r.setAttribute("data-role","mas-field-content"),this.append(r),R(this,g,r),r},V=function(t){return t&&typeof t=="object"&&"value"in t?t.value:t},ot=function(t){let r=t?.match(/^(.+)\[(\d+)\]$/);if(r)return{fieldName:r[1],index:parseInt(r[2],10)};let o=t?.match(/^(.+)\[(.+)\]$/);return o?{fieldName:o[1],index:o[2]}:{fieldName:t,index:null}},nt=function(t,r){if(typeof t!="string")return null;let o=document.createElement("template");o.innerHTML=t;let n;if(!isNaN(r)){let c=parseInt(r,10);n=[...o.content.querySelectorAll("a")][c-1]}return n||(n=o.content.querySelector(`a[data-key="${r}"]`)),n?(n.removeAttribute("class"),n.outerHTML):null},F=function(){if(!this.aemFragment)return;this.setAttribute("fragment-id",this.aemFragment.data?.id);let t=this.aemFragment.data;t&&(t.variationId&&this.setAttribute("variation-id",t.variationId),t.maskId&&this.setAttribute("mask-id",t.maskId),t.promoProject&&this.setAttribute("data-promotion-project",t.promoProject),t.promoVariationProject&&this.setAttribute("data-promotion-variation-project",t.promoVariationProject),this.compatVersion=t.fields?.compatVersion,t.fields?.promoCode&&this.setAttribute("data-promotion-code",t.fields.promoCode))},G=function(){if(!p(this,_)||!p(this,S))return;let{fieldName:t,index:r}=l(this,s,ot).call(this,p(this,S));if(r!==null&&isNaN(r)){let a=`${t.replace(/s$/,"")}Labels`,d=p(this,_)[a];if(d!==void 0){let m=(Array.isArray(d)?d:[d]).indexOf(r);if(m===-1)return;let E=p(this,_)[t],u=Array.isArray(E)?E:E?[E]:[],h=l(this,s,V).call(this,u[m]);if(!h||t==="ctas"&&this.settings?.hideTrialCTAs&&(h=tt(h,!0),h===null))return;l(this,s,F).call(this);let b=l(this,s,P).call(this);b.innerHTML=l(this,s,B).call(this,h)??"",l(this,s,k).call(this,b),l(this,s,w).call(this,b);return}}let o=l(this,s,V).call(this,p(this,_)[t]);if(o===void 0)return;l(this,s,F).call(this);let n=l(this,s,P).call(this),c;if(r!==null){if(c=l(this,s,nt).call(this,o,r),c===null)return}else c=l(this,s,B).call(this,o);if(typeof c=="string"){if(t==="ctas"&&this.settings?.hideTrialCTAs&&(c=tt(c,r!==null),c===null))return;if(p(this,S)==="ctas"){let a=l(this,s,st).call(this,c);if(a){n.replaceChildren(a),l(this,s,w).call(this,n);return}}n.innerHTML=c,l(this,s,k).call(this,n),l(this,s,w).call(this,n);return}n.textContent=c==null?"":String(c)},k=function(t){let r=t.querySelectorAll(".icon-button[data-tooltip]");for(let o of r){if(o.dataset.tooltipWired)continue;o.dataset.tooltipWired="1",o.querySelector("svg")||o.insertAdjacentHTML("afterbegin",'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" height="18" width="18" class="icon-milo icon-milo-info" aria-hidden="true"><path fill="currentcolor" d="M10.075,6A1.075,1.075,0,1,1,9,4.925H9A1.075,1.075,0,0,1,10.075,6Zm.09173,6H10V8.2A.20005.20005,0,0,0,9.8,8H7.83324S7.25,8.01612,7.25,8.5c0,.48365.58325.5.58325.5H8v3H7.83325s-.58325.01612-.58325.5c0,.48365.58325.5.58325.5h2.3335s.58325-.01635.58325-.5C10.75,12.01612,10.16673,12,10.16673,12ZM9,.5A8.5,8.5,0,1,0,17.5,9,8.5,8.5,0,0,0,9,.5ZM9,15.6748A6.67481,6.67481,0,1,1,15.67484,9,6.67481,6.67481,0,0,1,9,15.6748Z"></path></svg>'),o.hasAttribute("tabindex")||o.setAttribute("tabindex","0"),o.hasAttribute("role")||o.setAttribute("role","button"),o.hasAttribute("aria-label")||o.setAttribute("aria-label",o.dataset.tooltip);let n=["top","bottom","left","right"],c=[...o.classList].find(m=>n.includes(m)),a=c||"top";c||o.classList.add(a),o.dataset.originalPosition=a,o.classList.add("hide-tooltip");let d=()=>{o.classList.remove("hide-tooltip"),l(this,s,rt).call(this,o)},f=()=>o.classList.add("hide-tooltip");o.addEventListener("mouseenter",d),o.addEventListener("focus",d),o.addEventListener("mouseleave",f),o.addEventListener("blur",f),o.addEventListener("keydown",m=>{m.key==="Escape"&&f()})}},rt=function(t){let r=["top","bottom","right","left"],o=window.innerWidth,n=12,c=document.querySelector("header")?.getBoundingClientRect().height||0,a=window.getComputedStyle(t,"::before"),d=D=>parseFloat(D)||0,f=d(a.width)+d(a.paddingLeft)+d(a.paddingRight),m=d(a.height)+d(a.paddingTop)+d(a.paddingBottom),E=t.getBoundingClientRect(),u=t.dataset.originalPosition||"top",h=r.find(D=>t.classList.contains(D)),K=u==="top"||u==="bottom"?f/2:f,at=u==="top"?m+(u==="top"?n:0):m/2,N=E.top-at<c,I=E.bottom+(u==="bottom"?m+n:0)>window.innerHeight,L=E.right+K+n>o,O=E.left-K-n<0,H=E.left+f/2+n>o,v=E.left-f/2-n<0;if(u!==h&&!(L||O||N||I||H||v)){t.classList.remove(...r),t.classList.add(u);return}let A=u;L&&H?A="left":O&&v?A="right":L&&N||O&&N?A=H&&"left"||v&&"right"||"bottom":L!==O&&!I?A=L?"left":"right":N&&["top","left","right"].includes(u)?A="bottom":I&&["bottom","left","right"].includes(u)&&(A="top"),h!==A&&(t.classList.remove(...r),t.classList.add(A))},w=function(t){let r=t.querySelectorAll('a[data-wcs-osi],button[is="checkout-button"],span[is="inline-price"]');if(!r.length)return;let o=(n,c)=>{if(c!=null)for(let a of r)a.hasAttribute(n)||a.setAttribute(n,c)};for(let n of ht)o(n,this.getAttribute(n));o("data-promotion-code",$(this))},it=function(t){if(!!!t.getAttribute("data-wcs-osi"))return t.cloneNode(!0);let n=customElements.get("checkout-link")?.createCheckoutLink(t.dataset,t.textContent)??(()=>{let a=document.createElement("a",{is:"checkout-link"});return a.innerHTML=`<span style="pointer-events: none;">${t.textContent}</span>`,a})();for(let{name:a,value:d}of t.attributes)["class","is","href"].includes(a)||n.setAttribute(a,d);if(n.firstElementChild?.classList.add("spectrum-Button-label"),t.className){let a=ft.exec(t.className)?.[0]??"accent",d=a.startsWith("accent");return a.includes("-link")||(n.classList.add("button","con-button"),d?n.classList.add("blue"):a.startsWith("primary")&&!a.includes("-outline")&&n.classList.add("fill")),n}let c=t.parentElement?.tagName;if(c==="STRONG"||c==="EM"){let a=document.createElement(c.toLowerCase());return a.append(n),a}return n},st=function(t){let o=[...new DOMParser().parseFromString(t,"text/html").body.querySelectorAll("a")];if(!o.length)return null;let n=document.createElement("div");return n.setAttribute("slot","footer"),n.append(...o.map(c=>l(this,s,it).call(this,c))),n},B=function(t){if(typeof t!="string")return t;let r=t.trim();if(!(r.startsWith("<p>")&&r.endsWith("</p>")))return t;let n=r.slice(3,-4);return n.includes("<p>")?t:n};customElements.define(W,Y);export{At as checkoutOptionsProvider,et as priceOptionsProvider};
