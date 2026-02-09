var w=Object.defineProperty;var D=(o,e,t)=>e in o?w(o,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):o[e]=t;var r=(o,e,t)=>D(o,typeof e!="symbol"?e+"":e,t);import{html as T,css as z,LitElement as K,nothing as k}from"./lit-all.min.js";var d=class{constructor(e,t){this.key=Symbol("match-media-key"),this.matches=!1,this.host=e,this.host.addController(this),this.media=window.matchMedia(t),this.matches=this.media.matches,this.onChange=this.onChange.bind(this),e.addController(this)}hostConnected(){var e;(e=this.media)==null||e.addEventListener("change",this.onChange)}hostDisconnected(){var e;(e=this.media)==null||e.removeEventListener("change",this.onChange)}onChange(e){this.matches!==e.matches&&(this.matches=e.matches,this.host.requestUpdate(this.key,!this.matches))}};import{html as H,LitElement as U}from"./lit-all.min.js";var X=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),J=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var M='span[is="inline-price"][data-wcs-osi]',O='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var I='a[is="upt-link"]',ee=`${M},${O},${I}`;var A="merch-search:change";var h="merch-sidenav:select";var te=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var ie=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});function u(o,e){let t;return function(){let i=this,s=arguments;clearTimeout(t),t=setTimeout(()=>o.apply(i,s),e)}}function _(o,e={},t=null,i=null){let s=i?document.createElement(o,{is:i}):document.createElement(o);t instanceof HTMLElement?s.appendChild(t):s.innerHTML=t;for(let[n,a]of Object.entries(e))s.setAttribute(n,a);return s}function P(o){if(!window.history.pushState)return;let e=new URL(window.location.href);e.search=o,window.history.pushState({path:e.href},"",e.href)}function g(o,e){let t=new URLSearchParams(window.location.hash.slice(1));t.set(o,e),window.location.hash=t.toString()}function S(o=[]){o.forEach(e=>{let t=new URLSearchParams(window.location.search),i=t.get(e);i&&(window.location.hash.includes(`${e}=`)?g(e,i):window.location.hash=window.location.hash?`${window.location.hash}&${e}=${i}`:`${e}=${i}`,t.delete(e),P(t.toString()))})}var f="hashchange";function x(o=window.location.hash){let e=[],t=o.replace(/^#/,"").split("&");for(let i of t){let[s,n=""]=i.split("=");s&&e.push([s,decodeURIComponent(n.replace(/\+/g," "))])}return Object.fromEntries(e)}function c(o,e){if(o.deeplink){let t={};t[o.deeplink]=e,y(t)}}function y(o){let e=new URLSearchParams(window.location.hash.slice(1));Object.entries(o).forEach(([s,n])=>{n?e.set(s,n):e.delete(s)}),e.sort();let t=e.toString();if(t===window.location.hash)return;let i=window.scrollY||document.documentElement.scrollTop;window.location.hash=t,window.scrollTo(0,i)}function l(o){let e=()=>{if(window.location.hash&&!window.location.hash.includes("="))return;let t=x(window.location.hash);o(t)};return e(),window.addEventListener(f,e),()=>{window.removeEventListener(f,e)}}var v=class extends U{get search(){return this.querySelector("sp-search")}constructor(){super(),this.handleInput=()=>{c(this,this.search.value),this.search.value&&this.dispatchEvent(new CustomEvent(A,{bubbles:!0,composed:!0,detail:{type:"search",value:this.search.value}}))},this.handleInputDebounced=u(this.handleInput.bind(this))}connectedCallback(){super.connectedCallback(),this.search&&(this.search.addEventListener("input",this.handleInputDebounced),this.search.addEventListener("submit",this.handleInputSubmit),this.updateComplete.then(()=>{this.setStateFromURL()}),this.startDeeplink())}disconnectedCallback(){super.disconnectedCallback(),this.search.removeEventListener("input",this.handleInputDebounced),this.search.removeEventListener("submit",this.handleInputSubmit),this.stopDeeplink?.()}setStateFromURL(){let t=x()[this.deeplink];t&&(this.search.value=t)}startDeeplink(){this.stopDeeplink=l(({search:e})=>{this.search.value=e??""})}handleInputSubmit(e){e.preventDefault()}render(){return H`<slot></slot>`}};r(v,"properties",{deeplink:{type:String}});customElements.define("merch-search",v);import{html as b,LitElement as V,css as Y,nothing as G}from"./lit-all.min.js";var p=class extends V{constructor(){super(),this.toggleIconColor=!1,this.handleClickDebounced=u(this.handleClick.bind(this))}selectElement(e,t=!0){e.selected=t,e.parentNode.tagName==="SP-SIDENAV-ITEM"&&this.selectElement(e.parentNode,!1);let i=e.querySelector(".selection");i?.setAttribute("selected",t);let s=i?.dataset,n=t&&this.toggleIconColor?s?.light:s?.dark;n&&e.querySelector("img")?.setAttribute("src",n),t&&(this.selectedElement=e,this.selectedText=s?.selectedText||e.label,this.selectedValue=e.value,setTimeout(()=>{e.selected=!0},1),this.dispatchEvent(new CustomEvent(h,{bubbles:!0,composed:!0,detail:{type:"sidenav",value:this.selectedValue,elt:this.selectedElement}})))}markCurrentItem(e){let t=e.closest("sp-sidenav");t&&(t.querySelectorAll("sp-sidenav-item[aria-current]").forEach(i=>{i.removeAttribute("aria-current")}),e.setAttribute("aria-current","true"))}handleClick({target:e},t=!0){let{value:i,parentNode:s}=e;this.selectElement(e),this.markCurrentItem(e),s?.tagName==="SP-SIDENAV"?(s.querySelectorAll("sp-sidenav-item[expanded],sp-sidenav-item[selected]").forEach(n=>{n.value!==i&&(n.expanded=!1,n.removeAttribute("aria-expanded"),this.selectElement(n,!1))}),s.querySelectorAll(".selection[selected=true]").forEach(n=>{let a=n.parentElement;a.value!==i&&this.selectElement(a,!1)})):s?.tagName==="SP-SIDENAV-ITEM"&&([...s.closest("sp-sidenav")?.querySelectorAll(":scope > sp-sidenav-item")].filter(a=>a!==s).forEach(a=>{a.expanded=!1,a.removeAttribute("aria-expanded")}),s.closest("sp-sidenav")?.querySelectorAll("sp-sidenav-item[selected]").forEach(a=>{a.value!==i&&this.selectElement(a,!1)})),t&&c(this,i)}selectionChanged(e){let{target:{value:t,parentNode:i}}=e;this.selectElement(this.querySelector(`sp-sidenav-item[value="${t}"]`)),c(this,t)}startDeeplink(){this.stopDeeplink=l(e=>{let t=e[this.deeplink]??"all",i=this.querySelector(`sp-sidenav-item[value="${t}"]`);i||(i=this.querySelector("sp-sidenav-item:first-child"),g(this.deeplink,i.value)),this.updateComplete.then(()=>{i.firstElementChild?.tagName==="SP-SIDENAV-ITEM"&&(i.expanded=!0,i.setAttribute("aria-expanded","true")),i.parentNode?.tagName==="SP-SIDENAV-ITEM"&&(i.parentNode.expanded=!0,i.parentNode.setAttribute("aria-expanded","true")),this.handleClick({target:i},!!window.location.hash.includes("category"))})})}connectedCallback(){super.connectedCallback(),this.addEventListener("click",this.handleClickDebounced),this.updateComplete.then(()=>{this.deeplink&&(S(["filter","single_app"]),this.startDeeplink())})}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("click",this.handleClickDebounced),this.stopDeeplink?.()}render(){return b`<div
            aria-label="${this.label}"
            @change="${e=>this.selectionChanged(e)}"
        >
            ${this.sidenavListTitle?b`<h2>${this.sidenavListTitle}</h2>`:G}
            <slot></slot>
        </div>`}};r(p,"properties",{sidenavListTitle:{type:String},label:{type:String},deeplink:{type:String,attribute:"deeplink"},selectedText:{type:String,reflect:!0,attribute:"selected-text"},selectedValue:{type:String,reflect:!0,attribute:"selected-value"},toggleIconColor:{type:Boolean,attribute:"toggle-icon-color"}}),r(p,"styles",Y`
        :host {
            display: block;
            contain: content;
            margin-top: var(--merch-sidenav-list-gap);
        }

        :host h2 {
            color: var(--merch-sidenav-list-title-color);
            font-size: var(--merch-sidenav-list-title-font-size);
            font-weight: var(--merch-sidenav-list-title-font-weight);
            padding: var(--merch-sidenav-list-title-padding);
            line-height: var(--merch-sidenav-list-title-line-height);
            margin: 0;
            text-transform: uppercase;
        }

        :host(:dir(rtl)) h2 {
            text-align: right;
        }

        .right {
            position: absolute;
            inset-inline-end: 0;
        }

        :host(:dir(rtl)) .right {
            right: initial;
            left: 0;
        }
    `);customElements.define("merch-sidenav-list",p);import{html as F,LitElement as B,css as $}from"./lit-all.min.js";var m=class extends B{constructor(){super(),this.selectedValues=[]}selectionChanged({target:e}){let t=e.getAttribute("name");if(t){let i=this.selectedValues.indexOf(t);e.checked&&i===-1?this.selectedValues.push(t):!e.checked&&i>=0&&this.selectedValues.splice(i,1)}c(this,this.selectedValues.join(","))}addGroupTitle(){let e="sidenav-checkbox-group-title",t=_("h3",{id:e});t.textContent=this.sidenavCheckboxTitle,this.prepend(t),this.setAttribute("role","group"),this.setAttribute("aria-labelledby",e)}startDeeplink(){this.stopDeeplink=l(({types:e})=>{if(e){let t=e.split(",");[...new Set([...t,...this.selectedValues])].forEach(i=>{let s=this.querySelector(`sp-checkbox[name=${i}]`);s&&(s.checked=t.includes(i))}),this.selectedValues=t}else this.selectedValues.forEach(t=>{let i=this.querySelector(`sp-checkbox[name=${t}]`);i&&(i.checked=!1)}),this.selectedValues=[]})}connectedCallback(){super.connectedCallback(),this.updateComplete.then(async()=>{this.addGroupTitle(),this.startDeeplink()})}disconnectedCallback(){this.stopDeeplink?.()}render(){return F`<div aria-label="${this.label}">
            <div
                @change="${e=>this.selectionChanged(e)}"
                class="checkbox-group"
            >
                <slot></slot>
            </div>
        </div>`}};r(m,"properties",{sidenavCheckboxTitle:{type:String},label:{type:String},deeplink:{type:String},selectedValues:{type:Array,reflect:!0},value:{type:String}}),r(m,"styles",$`
        :host {
            display: block;
            contain: content;
            border-top: 1px solid var(--color-gray-200);
            padding: var(--merch-sidenav-checkbox-group-padding);
            margin-top: var(--merch-sidenav-checkbox-group-gap);
        }

        .checkbox-group {
            display: flex;
            flex-direction: column;
        }
    `);customElements.define("merch-sidenav-checkbox-group",m);var N="(max-width: 700px)",q="(max-width: 767px)",L="(max-width: 1199px)";var C="(min-width: 1200px)",R="(min-width: 1600px)",Ce={matchMobile:window.matchMedia(q),matchDesktop:window.matchMedia(`${C} and (not ${R})`),matchDesktopOrUp:window.matchMedia(C),matchLargeDesktop:window.matchMedia(R),get isMobile(){return this.matchMobile.matches},get isDesktop(){return this.matchDesktop.matches},get isDesktopOrUp(){return this.matchDesktopOrUp.matches}};var W={catalog:"l"},Z={catalog:"xl"},E=class extends K{constructor(){super();r(this,"mobileDevice",new d(this,N));r(this,"mobileAndTablet",new d(this,L));this.open=!1,this.autoclose=!1,this.variant=null,this.dir=document.documentElement.dir||"ltr",this.closeModal=this.closeModal.bind(this),this.handleSelection=this.handleSelection.bind(this)}connectedCallback(){super.connectedCallback(),this.addEventListener(h,this.handleSelection),this.dirObserver=new MutationObserver(()=>{let t=document.documentElement.dir||"ltr";this.dir!==t&&(this.dir=t,this.requestUpdate())}),this.dirObserver.observe(document.documentElement,{attributes:!0,attributeFilter:["dir"]})}disconnectedCallback(){this.dirObserver?.disconnect(),super.disconnectedCallback(),this.removeEventListener(h,this.handleSelection)}firstUpdated(){let t=W[this.variant];if(t){let s=this.querySelector("merch-search sp-search");s&&s?.setAttribute("size",t)}let i=Z[this.variant];i&&this.querySelectorAll("merch-sidenav-checkbox-group sp-checkbox").forEach(n=>{n.setAttribute("size",i)})}updated(){this.mobileAndTablet.matches?(this.modal=!0,this.style.padding=0,this.style.margin=0):(this.modal=!1,this.style.removeProperty("padding"),this.style.removeProperty("margin"),this.open&&this.closeModal())}get filters(){return this.querySelector("merch-sidenav-list")}get search(){return this.querySelector("merch-search")}render(){return this.mobileAndTablet.matches?this.asDialog:this.asAside}get asDialog(){if(!this.open)return k;let t=this.autoclose?k:T`<sp-link @click="${this.closeModal}"
                  >${this.closeText||"Close"}</sp-link
              >`;return T`
            <sp-theme color="light" scale="medium" dir="${this.dir}">
                <sp-overlay type="modal" open @sp-closed=${this.closeModal}>
                    <sp-dialog-base
                        dismissable
                        underlay
                        no-divider
                        @close=${this.closeModal}
                    >
                        <div id="content">
                            <div id="sidenav">
                                <div>
                                    <h2>${this.sidenavTitle}</h2>
                                    <slot></slot>
                                </div>
                                ${t}
                            </div>
                        </div>
                    </sp-dialog-base>
                </sp-overlay>
            </sp-theme>
        `}get asAside(){return T`<sp-theme color="light" scale="medium" dir="${this.dir}"
            ><h2>${this.sidenavTitle}</h2>
            <slot></slot
        ></sp-theme>`}get dialog(){return this.shadowRoot.querySelector("sp-dialog-base")}handleSelection(){this.autoclose&&this.closeModal()}closeModal(){this.open=!1,document.querySelector("body")?.classList.remove("merch-modal")}showModal(){this.open=!0,document.querySelector("body")?.classList.add("merch-modal")}};r(E,"properties",{sidenavTitle:{type:String},closeText:{type:String,attribute:"close-text"},modal:{type:Boolean,reflect:!0},open:{type:Boolean,state:!0,reflect:!0},autoclose:{type:Boolean,attribute:"autoclose",reflect:!0},dir:{type:String,state:!0}}),r(E,"styles",z`
        :host {
            --merch-sidenav-padding: 16px;
            --merch-sidenav-collection-gap: 30px;
            /* Title */
            --merch-sidenav-title-font-size: 12px;
            --merch-sidenav-title-font-weight: 400;
            --merch-sidenav-title-line-height: 16px;
            --merch-sidenav-title-color: var(--spectrum-gray-700, #464646);
            --merch-sidenav-title-padding: 6px 12px 16px;
            /* Search */
            --merch-sidenav-search-gap: 10px;
            /* List */
            --merch-sidenav-list-gap: 0;
            --merch-sidenav-list-title-color: var(--spectrum-gray-700, #464646);
            --merch-sidenav-list-title-font-size: 14px;
            --merch-sidenav-list-title-font-weight: 400;
            --merch-sidenav-list-title-padding: 6px 12px 8px;
            --merch-sidenav-list-title-line-height: 18px;
            --merch-sidenav-item-height: unset;
            --merch-sidenav-item-inline-padding: 12px;
            --merch-sidenav-item-font-weight: 400;
            --merch-sidenav-item-font-size: 14px;
            --merch-sidenav-item-line-height: 18px;
            --merch-sidenav-item-label-top-margin: 6px;
            --merch-sidenav-item-label-bottom-margin: 8px;
            --merch-sidenav-item-icon-top-margin: 7px;
            --merch-sidenav-item-icon-gap: 8px;
            --merch-sidenav-item-selected-color: var(
                --spectrum-gray-800,
                #222222
            );
            --merch-sidenav-item-selected-background: var(
                --spectrum-gray-200,
                #e6e6e6
            );
            --merch-sidenav-list-item-gap: 4px;
            /* Checkbox group */
            --merch-sidenav-checkbox-group-title-font-size: 14px;
            --merch-sidenav-checkbox-group-title-font-weight: 400;
            --merch-sidenav-checkbox-group-title-line-height: 18px;
            --merch-sidenav-checkbox-group-title-color: var(
                --spectrum-gray-700,
                #464646
            );
            --merch-sidenav-checkbox-group-title-padding: 6px 0 8px;
            --merch-sidenav-checkbox-group-gap: 32px;
            --merch-sidenav-checkbox-group-padding: 0 12px;
            --merch-sidenav-checkbox-group-label-font-size: 17px;
            --merch-sidenav-checkbox-group-checkbox-spacing: 22px;
            --merch-sidenav-checkbox-group-label-gap: 13px;
            --merch-sidenav-checkbox-group-label-top-margin: 8px;
            --merch-sidenav-checkbox-group-height: 40px;
            /* Modal */
            --merch-sidenav-modal-close-font-size: 15px;
            --merch-sidenav-modal-close-line-height: 19px;
            --merch-sidenav-modal-close-gap: 10px;
            --merch-sidenav-modal-border-radius: 8px;
            --merch-sidenav-modal-padding: var(--merch-sidenav-padding);

            display: block;
            z-index: 2;
            padding: var(--merch-sidenav-padding);
            margin-inline-end: var(--merch-sidenav-collection-gap);
        }

        ::slotted(merch-sidenav-list) {
            --mod-sidenav-min-height: var(--merch-sidenav-item-height);
            --mod-sidenav-inline-padding: var(
                --merch-sidenav-item-inline-padding
            );
            --mod-sidenav-top-level-font-weight: var(
                --merch-sidenav-item-font-weight
            );
            --mod-sidenav-top-level-font-size: var(
                --merch-sidenav-item-font-size
            );
            --mod-sidenav-top-level-line-height: var(
                --merch-sidenav-item-line-height
            );
            --mod-sidenav-top-to-label: var(
                --merch-sidenav-item-label-top-margin
            );
            --mod-sidenav-bottom-to-label: var(
                --merch-sidenav-item-label-bottom-margin
            );
            --mod-sidenav-top-to-icon: var(
                --merch-sidenav-item-icon-top-margin
            );
            --mod-sidenav-icon-spacing: var(--merch-sidenav-item-icon-gap);
            --mod-sidenav-content-color-default-selected: var(
                --merch-sidenav-item-selected-color
            );
            --mod-sidenav-item-background-default-selected: var(
                --merch-sidenav-item-selected-background
            );
            --mod-sidenav-gap: var(--merch-sidenav-list-item-gap);
        }

        ::slotted(merch-sidenav-checkbox-group) {
            --mod-checkbox-font-size: var(
                --merch-sidenav-checkbox-group-label-font-size
            );
            --mod-checkbox-spacing: var(
                --merch-sidenav-checkbox-group-checkbox-spacing
            );
            --mod-checkbox-text-to-control: var(
                --merch-sidenav-checkbox-group-label-gap
            );
            --mod-checkbox-top-to-text: var(
                --merch-sidenav-checkbox-group-label-top-margin
            );
            --mod-checkbox-height: var(--merch-sidenav-checkbox-group-height);
        }

        :host h2 {
            color: var(--merch-sidenav-title-color);
            font-size: var(--merch-sidenav-title-font-size);
            font-weight: var(--merch-sidenav-title-font-weight);
            padding: var(--merch-sidenav-title-padding);
            line-height: var(--merch-sidenav-title-line-height);
            margin: 0;
            text-align: start;
        }

        :host-context([dir='rtl']) h2 {
            text-align: right;
        }

        :host(:dir(rtl)) h2 {
            text-align: right;
        }

        #content {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: baseline;
        }

        ::slotted(merch-search) {
            display: block;
            margin-bottom: var(--merch-sidenav-search-gap);
        }

        :host([modal]) ::slotted(merch-search) {
            display: none;
        }

        #sidenav {
            display: flex;
            flex-direction: column;
            max-width: 248px;
            overflow-y: auto;
            place-items: center;
            position: relative;
            width: 100%;
            border-radius: var(--merch-sidenav-modal-border-radius);
            padding: var(--merch-sidenav-modal-padding);
        }

        sp-dialog-base {
            --mod-modal-confirm-border-radius: var(
                --merch-sidenav-modal-border-radius
            );
            --mod-modal-max-height: 100dvh;
        }

        sp-dialog-base #sidenav {
            box-sizing: border-box;
            max-width: 300px;
            max-height: 95dvh;
            background: #ffffff 0% 0% no-repeat padding-box;
            box-shadow: 0px 1px 4px #00000026;
        }

        :host(:not([autoclose])) #sidenav h2 {
            margin-top: calc(
                var(--merch-sidenav-modal-close-gap) +
                    var(--merch-sidenav-modal-close-line-height)
            );
        }

        sp-link {
            position: absolute;
            top: 16px;
            inset-inline-end: 16px;
            font-size: var(--merch-sidenav-modal-close-font-size);
            line-height: var(--merch-sidenav-modal-close-line-height);
        }
    `);customElements.define("merch-sidenav",E);export{E as MerchSideNav};
