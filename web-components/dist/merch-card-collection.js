var Ce=Object.defineProperty;var Z=r=>{throw TypeError(r)};var be=(r,t,e)=>t in r?Ce(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var w=(r,t,e)=>be(r,typeof t!="symbol"?t+"":t,e),G=(r,t,e)=>t.has(r)||Z("Cannot "+e);var l=(r,t,e)=>(G(r,t,"read from private field"),e?e.call(r):t.get(r)),N=(r,t,e)=>t.has(r)?Z("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(r):t.set(r,e),y=(r,t,e,s)=>(G(r,t,"write to private field"),s?s.call(r,e):t.set(r,e),e),J=(r,t,e)=>(G(r,t,"access private method"),e);import{html as x,LitElement as _e,css as Ae,unsafeCSS as ge,nothing as _}from"./lit-all.min.js";var Le="(max-width: 767px)";var B="(min-width: 768px)",v="(min-width: 1200px)",ee="(min-width: 1600px)";var Ke={matchMobile:window.matchMedia(Le),matchDesktop:window.matchMedia(`${v} and (not ${ee})`),matchDesktopOrUp:window.matchMedia(v),matchLargeDesktop:window.matchMedia(ee),get isMobile(){return this.matchMobile.matches},get isDesktop(){return this.matchDesktop.matches},get isDesktopOrUp(){return this.matchDesktopOrUp.matches}};var D=class{constructor(t,e){this.key=Symbol("match-media-key"),this.matches=!1,this.host=t,this.host.addController(this),this.media=window.matchMedia(e),this.matches=this.media.matches,this.onChange=this.onChange.bind(this),t.addController(this)}hostConnected(){var t;(t=this.media)==null||t.addEventListener("change",this.onChange)}hostDisconnected(){var t;(t=this.media)==null||t.removeEventListener("change",this.onChange)}onChange(t){this.matches!==t.matches&&(this.matches=t.matches,this.host.requestUpdate(this.key,!this.matches))}};var te="hashchange";function K(r=window.location.hash){let t=[],e=r.replace(/^#/,"").split("&");for(let s of e){let[i,n=""]=s.split("=");i&&t.push([i,decodeURIComponent(n.replace(/\+/g," "))])}return Object.fromEntries(t)}function P(r){let t=new URLSearchParams(window.location.hash.slice(1));Object.entries(r).forEach(([i,n])=>{n?t.set(i,n):t.delete(i)}),t.sort();let e=t.toString();if(e===window.location.hash)return;let s=window.scrollY||document.documentElement.scrollTop;window.location.hash=e,window.scrollTo(0,s)}function q(r){let t=()=>{if(window.location.hash&&!window.location.hash.includes("="))return;let e=K(window.location.hash);r(e)};return t(),window.addEventListener(te,t),()=>{window.removeEventListener(te,t)}}var Xe=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),Qe=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var we='span[is="inline-price"][data-wcs-osi]',Ne='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Me='a[is="upt-link"]',Ze=`${we},${Ne},${Me}`;var re="merch-card-collection:sort",F="merch-card-collection:literals-changed",z="merch-card-collection:sidenav-attached",se="merch-card-collection:showmore",ie="merch-sidenav:select",oe="aem:load",ne="aem:error";var ae="mas:error";var Je=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var et=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var S={alphabetical:"alphabetical",authored:"authored"};var Oe="mas-commerce-service";function ce(r,t){let e;return function(){let s=this,i=arguments;clearTimeout(e),e=setTimeout(()=>r.apply(s,i),t)}}var I=(r,t)=>r?.querySelector(`[slot="${t}"]`)?.textContent?.trim();var W=new Map,ye=0;function le(r,t){let e=++ye,s=t,i=performance.now(),n,h=()=>{j(e),r()},o=()=>{i=performance.now(),n=setTimeout(h,s)},c=()=>{document.visibilityState==="hidden"?(clearTimeout(n),s-=performance.now()-i):o()};return W.set(e,()=>{clearTimeout(n),document.removeEventListener("visibilitychange",c)}),document.addEventListener("visibilitychange",c),document.visibilityState!=="hidden"&&o(),e}function j(r){let t=W.get(r);t&&(t(),W.delete(r))}function he(){return document.getElementsByTagName(Oe)?.[0]}function de(r){return r&&(r==="bizpro"&&(r="pro"),r==="pro"||r.startsWith("plans")?"plans":r)}var pe=r=>{let t=r.replace(/^mas:/,"").split("/");return t.length<2?[null,null]:[t[0],t[t.length-1]]},ue=(r,t)=>{let e=t?.tagLabels?.[r]||r;return e.startsWith("coll-tag-filter")?r.charAt(0).toUpperCase()+r.slice(1):e},me=(r,t,e)=>{let s=new Map;for(let n of r){let[h,o]=pe(n);!h||!o||(s.has(h)||s.set(h,[]),s.get(h).push({name:o,label:ue(o,e)}))}let i=s.size===1;return[...s.entries()].map(([n,h])=>({title:i&&t?t:ue(n,e),label:n,deeplink:n,checkboxes:h}))},fe=(r,t)=>(r??[]).map(pe).filter(([e,s])=>e&&s&&t.has(e)).map(([e,s])=>`${e}:${s}`),Ee=(r,t,e)=>t.every(s=>{let i=(e[s.deeplink]||"").split(",").filter(Boolean);return i.length?i.some(n=>r.includes(`${s.deeplink}:${n}`)):!0}),Te=(r,t,e)=>(t?.[e]??[]).some(s=>r.includes(s));var Se="merch-card-collection",ve=3e4,De={catalog:["four-merch-cards"],plans:["four-merch-cards"],plansTwoColumns:["two-merch-cards"],plansThreeColumns:["three-merch-cards"],product:["four-merch-cards"],productTwoColumns:["two-merch-cards"],productThreeColumns:["three-merch-cards"],segment:["four-merch-cards"],segmentTwoColumns:["two-merch-cards"],segmentThreeColumns:["three-merch-cards"],"special-offers":["three-merch-cards"],image:["three-merch-cards"],"mini-compare-chart":["three-merch-cards"],"mini-compare-chartTwoColumns":["two-merch-cards"],"mini-compare-chart-mweb":["three-merch-cards"],"mini-compare-chart-mwebTwoColumns":["two-merch-cards"]},Pe={plans:!0},Ie=(r,{filter:t})=>r.filter(e=>e?.filters&&e?.filters.hasOwnProperty(t)),He=(r,{types:t})=>t?(t=t.split(","),r.filter(e=>t.some(s=>e.types.includes(s)))):r,Ue=(r,t)=>{let e=t.tagGroups;if(!e?.length)return r;let s=K();return r.filter(i=>{let n=(i.getAttribute("filter-tags")||"").split(",").filter(Boolean);return Ee(n,e,s)&&!Te(n,t.excludeTags,t.filter)})},ke=r=>r.sort((t,e)=>(t.title??"").localeCompare(e.title??"","en",{sensitivity:"base"})),Ve=(r,{filter:t})=>r.sort((e,s)=>s.filters[t]?.order==null||isNaN(s.filters[t]?.order)?-1:e.filters[t]?.order==null||isNaN(e.filters[t]?.order)?1:e.filters[t].order-s.filters[t].order),$e=(r,{search:t})=>t?.length?(t=t.toLowerCase(),r.filter(e=>(e.title??"").toLowerCase().includes(t))):r,C,U,A,Y,X,xe,M=class extends _e{constructor(){super();N(this,A);N(this,C,{});N(this,U);this.id=null,this.filter="all",this.hasMore=!1,this.resultCount=void 0,this.displayResult=!1,this.data=null,this.variant=null,this.hydrating=!1,this.hydrationReady=null,this.literalsHandlerAttached=!1,this.onUnmount=[],this.resizeHandlerDebounced=ce(this.resizeHandler.bind(this),300)}resizeHandler(){this.firstChild?.variantLayout?.resizeHandler?.()}render(){return x` <slot></slot>
            ${this.footer}`}checkReady(){if(!this.querySelector("aem-fragment"))return Promise.resolve(!0);let s,i=new Promise(h=>{s=le(()=>h(!1),ve)}),n=Promise.race([this.hydrationReady,i]);return n.finally(()=>j(s)),n}updated(e){if(!this.querySelector("merch-card"))return;let s=window.scrollY||document.documentElement.scrollTop,i=[...this.children].filter(a=>a.tagName==="MERCH-CARD"&&!a.failed);if(i.length===0)return;e.has("singleApp")&&this.singleApp&&i.forEach(a=>{a.updateFilters(a.name===this.singleApp)});let n=this.sort===S.alphabetical?ke:Ve,o=[Ie,He,Ue,$e,n].reduce((a,g)=>g(a,this),i).map((a,g)=>[a,g]);if(this.resultCount=o.length,this.page&&this.limit){let a=this.page*this.limit;this.hasMore=o.length>a,o=o.filter(([,g])=>g<a)}let c=new Map(o.reverse());for(let a of c.keys())this.prepend(a);i.forEach(a=>{c.has(a)?(a.size=a.filters[this.filter]?.size,a.style.removeProperty("display"),a.requestUpdate()):(a.style.display="none",a.size=void 0)}),window.scrollTo(0,s),this.updateComplete.then(()=>{this.dispatchLiteralsChanged(),this.sidenav&&!this.literalsHandlerAttached&&(this.sidenav.addEventListener(ie,()=>{this.dispatchLiteralsChanged()}),this.literalsHandlerAttached=!0)})}dispatchLiteralsChanged(){this.dispatchEvent(new CustomEvent(F,{detail:{resultCount:this.resultCount,searchTerm:this.search,filter:this.sidenav?.filters?.selectedText}}))}buildOverrideMap(){y(this,C,{}),this.overrides?.split(",").forEach(e=>{let[s,i]=e?.split(":");s&&i&&(l(this,C)[s]=i)})}connectedCallback(){super.connectedCallback(),this.buildOverrideMap(),this.init(),window.addEventListener("resize",this.resizeHandlerDebounced)}async init(){await this.hydrate(),this.sidenav=this.parentElement.querySelector("merch-sidenav"),this.filtered?(this.filter=this.filtered,this.page=1):this.startDeeplink(),this.tagGroups?.length&&(this.stopFilterDeeplink=q(()=>this.requestUpdate())),this.initializePlaceholders()}disconnectedCallback(){super.disconnectedCallback(),this.stopDeeplink?.(),this.stopFilterDeeplink?.();for(let e of this.onUnmount)e();window.removeEventListener("resize",this.resizeHandlerDebounced)}initializeHeader(){let e=document.createElement("merch-card-collection-header");e.collection=this,e.classList.add(this.variant),this.parentElement.insertBefore(e,this),this.header=e,this.querySelectorAll("[placeholder]").forEach(i=>{let n=i.getAttribute("slot");this.header.placeholderKeys.includes(n)&&this.header.append(i)})}initializePlaceholders(){let e=this.data?.placeholders||{};!e.searchText&&this.data?.sidenavSettings?.searchText&&(e.searchText=this.data.sidenavSettings.searchText);for(let s of Object.keys(e)){let i=e[s],n=i.includes("<p>")?"div":"p",h=document.createElement(n);h.setAttribute("slot",s),h.setAttribute("placeholder",""),h.innerHTML=i,this.append(h)}}attachSidenav(e,s=!0){if(!e)return;s&&this.parentElement.prepend(e),this.sidenav=e,this.sidenav.variant=this.variant,this.sidenav.classList.add(this.variant),Pe[this.variant]&&this.sidenav.setAttribute("autoclose",""),this.initializeHeader(),this.dispatchEvent(new CustomEvent(z));let i=l(this,A,X)?.getCollectionOptions(this.variant)?.onSidenavAttached;i&&i(this)}async hydrate(){if(this.hydrating)return!1;let e=this.querySelector("aem-fragment");if(!e)return;this.id=e.getAttribute("fragment"),this.hydrating=!0;let s;this.hydrationReady=new Promise(o=>{s=o});let i=this;function n(o){let c;return o.fields?.tagFilters?.length&&(c=me(o.fields.tagFilters,o.fields.tagFiltersTitle,o.settings)),{searchText:o.fields?.searchText,tagFilters:c,linksTitle:o.fields?.linksTitle,link:o.fields?.link,linkText:o.fields?.linkText,linkIcon:o.fields?.linkIcon}}function h(o,c){let a={cards:[],hierarchy:[],placeholders:o.placeholders,sidenavSettings:n(o)};function g(k,L){for(let d of L){if(d.fieldName==="variations")continue;if(d.fieldName==="cards"){if(a.cards.findIndex(T=>T.id===d.identifier)!==-1)continue;if(!o.references[d.identifier]?.value){l(i,A,Y)?.error(`Reference not found for card: ${d.identifier}`);continue}a.cards.push(o.references[d.identifier].value);continue}let u=o.references[d.identifier]?.value,p=d.referencesTree,f=c[d.identifier];if(f){let T=document.querySelector(`aem-fragment[fragment="${f}"]`)?.rawData;if(T?.fields)u=T,p=T.referencesTree,o.references={...o.references,...T.references};else{l(i,A,Y)?.error(`Override fragment ${f} not found or invalid:`);continue}}if(!u?.fields)continue;let{fields:E}=u,V={label:E.label||"",icon:E.icon,iconLight:E.iconLight,queryLabel:E.queryLabel,cards:E.cards?E.cards.map(T=>c[T]||T):[],collections:[]};E.defaultchild&&(V.defaultchild=c[E.defaultchild]||E.defaultchild),k.push(V),g(V.collections,p)}}return g(a.hierarchy,o.referencesTree),a.hierarchy.length===0&&(i.filtered="all"),a}e.addEventListener(ne,o=>{J(this,A,xe).call(this,"Error loading AEM fragment",o.detail),this.hydrating=!1,e.remove()}),e.addEventListener(oe,async o=>{this.limit=27,this.data=h(o.detail,l(this,C)),this.tagGroups=this.data.sidenavSettings?.tagFilters??null,o.detail.variationId&&this.setAttribute("variation-id",o.detail.variationId);let{cards:c,hierarchy:a}=this.data,g=a.length===0&&o.detail.fields?.defaultchild?l(this,C)[o.detail.fields.defaultchild]||o.detail.fields.defaultchild:null;e.cache.add(...c);let k=(u,p)=>{for(let f of u)if(f.defaultchild===p||f.collections&&k(f.collections,p))return!0;return!1};for(let u of c){let T=function(R){for(let b of R){let $=b.cards.indexOf(f);if($===-1)continue;let Re=b.queryLabel??b?.label?.toLowerCase()??"";p.filters[Re]={order:$+1,size:u.fields.size},T(b.collections)}},p=document.createElement("merch-card"),f=l(this,C)[u.id]||u.id;p.setAttribute("consonant",""),p.setAttribute("style","");let E=u.fields.tags?.filter(R=>R.startsWith("mas:types/")).map(R=>R.split("/")[1]).join(",");if(E&&p.setAttribute("types",E),this.tagGroups){let R=new Set(this.tagGroups.map($=>$.deeplink)),b=fe(u.fields.tags,R);b.length&&p.setAttribute("filter-tags",b.join(","))}l(this,A,X)?.getFragmentMapping(u.fields.variant)?.supportsDefaultChild&&(g?f===g:k(a,f))&&p.setAttribute("data-default-card","true"),T(a);let Q=document.createElement("aem-fragment");Q.setAttribute("fragment",f),p.append(Q),Object.keys(p.filters).length===0&&(p.filters={all:{order:c.indexOf(u)+1,size:u.fields.size}}),this.append(p)}let L="",d=de(c[0]?.fields?.variant);this.variant=d,d==="plans"&&(c.length===2||c.length===3)&&!c.some(u=>u.fields?.size?.includes("wide"))||(d==="segment"||d==="product")&&(c.length===2||c.length===3)?L=c.length===2?"TwoColumns":"ThreeColumns":(d==="mini-compare-chart"||d==="mini-compare-chart-mweb")&&c.length<=2&&(L=c.length===1?"":"TwoColumns"),d&&this.classList.add("merch-card-collection",d,...De[`${d}${L}`]||[]),this.displayResult=!0,this.hydrating=!1,e.remove(),s(!0)}),await this.hydrationReady}get footer(){if(!this.filtered)return x`<div id="footer">
            <sp-theme color="light" scale="medium">
                ${this.showMoreButton}
            </sp-theme>
        </div>`}get showMoreButton(){if(this.hasMore)return this.classList.contains("product-pricing")?x`<button
                type="button"
                class="show-more"
                @click="${this.showMore}"
            >
                <slot name="showMoreText"></slot>
            </button>`:x`<sp-button
            variant="secondary"
            treatment="outline"
            style="order: 1000;"
            @click="${this.showMore}"
        >
            <slot name="showMoreText"></slot>
        </sp-button>`}sortChanged(e){e.target.value===S.authored?P({sort:void 0}):P({sort:e.target.value}),this.dispatchEvent(new CustomEvent(re,{bubbles:!0,composed:!0,detail:{value:e.target.value}}))}async showMore(){this.dispatchEvent(new CustomEvent(se,{bubbles:!0,composed:!0}));let e=this.page+1;P({page:e}),this.page=e,await this.updateComplete}startDeeplink(){this.stopDeeplink=q(({category:e,filter:s,types:i,sort:n,search:h,single_app:o,page:c})=>{s=s||e,!this.filtered&&s&&s!==this.filter&&setTimeout(()=>{P({page:void 0}),this.page=1},1),this.filtered||(this.filter=s??this.filter),this.types=i??"",this.search=h??"",this.singleApp=o,this.sort=n,this.page=Number(c)||1})}openFilters(e){this.sidenav?.showModal(e)}};C=new WeakMap,U=new WeakMap,A=new WeakSet,Y=function(){return l(this,U)??y(this,U,he()?.Log?.module(Se)),l(this,U)},X=function(){return customElements.get("merch-card")},xe=function(e,s={},i=!0){l(this,A,Y)?.error(`merch-card-collection: ${e}`,s),this.failed=!0,i&&this.dispatchEvent(new CustomEvent(ae,{detail:{...s,message:e},bubbles:!0,composed:!0}))},w(M,"properties",{id:{type:String,attribute:"id",reflect:!0},displayResult:{type:Boolean,attribute:"display-result"},excludeTags:{type:Object,attribute:!1},filter:{type:String,attribute:"filter",reflect:!0},filtered:{type:String,attribute:"filtered",reflect:!0},hasMore:{type:Boolean},limit:{type:Number,attribute:"limit"},overrides:{type:String},page:{type:Number,attribute:"page",reflect:!0},resultCount:{type:Number},search:{type:String,attribute:"search",reflect:!0},sidenav:{type:Object},singleApp:{type:String,attribute:"single-app",reflect:!0},sort:{type:String,attribute:"sort",default:S.authored,reflect:!0},types:{type:String,attribute:"types",reflect:!0}}),w(M,"styles",Ae`
        #footer {
            grid-column: 1 / -1;
            justify-self: stretch;
            color: var(--merch-color-grey-80);
            order: 1000;
        }

        :host(.product-pricing) #footer {
            display: flex;
            justify-content: center;
            /* 24px below the last row, less the grid gap and the padding. */
            margin-top: calc(24px - 8px - 4px);
            /* Room for the button's focus ring, which an ancestor would clip. */
            padding-block: 4px;
        }

        /* Same look as the outlined product-pricing CTAs. */
        :host(.product-pricing) .show-more {
            box-sizing: border-box;
            min-height: 40px;
            padding: 8px 22px;
            border: 2px solid #000;
            border-radius: 999px;
            background: transparent;
            color: #000;
            font: inherit;
            font-size: 14px;
            font-weight: 700;
            line-height: 18px;
            cursor: pointer;
        }

        :host(.product-pricing) .show-more:focus-visible {
            outline: 2px solid #3b63fb;
            outline-offset: 2px;
        }

        sp-theme {
            display: contents;
        }
    `);M.SortOrder=S;customElements.define(Se,M);var Fe={filters:["noResultText","resultText","resultsText"],filtersMobile:["noResultText","resultMobileText","resultsMobileText"],search:["noSearchResultsText","searchResultText","searchResultsText"],searchMobile:["noSearchResultsMobileText","searchResultMobileText","searchResultsMobileText"]},ze=(r,t,e)=>{r.querySelectorAll(`[data-placeholder="${t}"]`).forEach(i=>{i.innerText=e||""})},Ye={search:["mobile","tablet"],filter:["mobile","tablet"],sort:!0,result:!0,custom:!1},Ge={catalog:"l"},m,O,H=class extends _e{constructor(){super();N(this,m);N(this,O);w(this,"tablet",new D(this,B));w(this,"desktop",new D(this,v));this.collection=null,y(this,m,{search:!1,filter:!1,sort:!1,result:!1,custom:!1}),this.updateLiterals=this.updateLiterals.bind(this),this.handleSidenavAttached=this.handleSidenavAttached.bind(this)}connectedCallback(){super.connectedCallback(),this.collection?.addEventListener(F,this.updateLiterals),this.collection?.addEventListener(z,this.handleSidenavAttached),y(this,O,customElements.get("merch-card"))}disconnectedCallback(){super.disconnectedCallback(),this.collection?.removeEventListener(F,this.updateLiterals),this.collection?.removeEventListener(z,this.handleSidenavAttached)}willUpdate(){l(this,m).search=this.getVisibility("search"),l(this,m).filter=this.getVisibility("filter"),l(this,m).sort=this.getVisibility("sort"),l(this,m).result=this.getVisibility("result"),l(this,m).custom=this.getVisibility("custom")}parseVisibilityOptions(e,s){if(!e||!Object.hasOwn(e,s))return null;let i=e[s];return i===!1?!1:i===!0?!0:i.includes(this.currentMedia)}getVisibility(e){let s=l(this,O)?.getCollectionOptions(this.collection?.variant)?.headerVisibility,i=this.parseVisibilityOptions(s,e);return i!==null?i:this.parseVisibilityOptions(Ye,e)}get sidenav(){return this.collection?.sidenav}get search(){return this.collection?.search}get resultCount(){return this.collection?.resultCount}get variant(){return this.collection?.variant}get isMobile(){return!this.isTablet&&!this.isDesktop}get isTablet(){return this.tablet.matches&&!this.desktop.matches}get isDesktop(){return this.desktop.matches}get currentMedia(){return this.isDesktop?"desktop":this.isTablet?"tablet":"mobile"}get searchAction(){if(!l(this,m).search)return _;let e=I(this,"searchText");return e?x`
            <merch-search deeplink="search" id="search">
                <sp-search
                    id="search-bar"
                    placeholder="${e}"
                    .size=${Ge[this.variant]}
                    aria-label="${e}"
                ></sp-search>
            </merch-search>
        `:_}get filterAction(){return l(this,m).filter?this.sidenav?x`
            <sp-action-button
                id="filter"
                variant="secondary"
                treatment="outline"
                @click="${this.openFilters}"
                ><slot name="filtersText"></slot
            ></sp-action-button>
        `:_:_}get sortAction(){if(!l(this,m).sort)return _;let e=I(this,"sortText");if(!e)return;let s=I(this,"popularityText"),i=I(this,"alphabeticallyText");if(!(s&&i))return;let n=this.collection?.sort===S.alphabetical;return x`
            <sp-action-menu
                id="sort"
                size="m"
                @change="${this.collection?.sortChanged}"
                selects="single"
                value="${n?S.alphabetical:S.authored}"
            >
                <span slot="label-only"
                    >${e}:
                    ${n?i:s}</span
                >
                <sp-menu-item value="${S.authored}"
                    >${s}</sp-menu-item
                >
                <sp-menu-item value="${S.alphabetical}"
                    >${i}</sp-menu-item
                >
            </sp-action-menu>
        `}get resultSlotName(){let e=`${this.search?"search":"filters"}${this.isMobile||this.isTablet?"Mobile":""}`;return Fe[e][Math.min(this.resultCount,2)]}get resultLabel(){if(!l(this,m).result)return _;if(!this.sidenav)return _;let e=this.search?"search":"filter",s=this.resultCount?this.resultCount===1?"single":"multiple":"none";return x` <div
            id="result"
            aria-live="polite"
            type=${e}
            quantity=${s}
        >
            <slot name="${this.resultSlotName}"></slot>
        </div>`}get customArea(){if(!l(this,m).custom)return _;let e=l(this,O)?.getCollectionOptions(this.collection?.variant)?.customHeaderArea;if(!e)return _;let s=e(this.collection);return!s||s===_?_:x`<div id="custom" role="heading" aria-level="2">
            ${s}
        </div>`}openFilters(e){this.sidenav.showModal(e)}updateLiterals(e){Object.keys(e.detail).forEach(s=>{ze(this,s,e.detail[s])}),this.requestUpdate()}handleSidenavAttached(){this.requestUpdate()}render(){return x`
            <sp-theme color="light" scale="medium">
                <div id="header">
                    ${this.searchAction}${this.filterAction}${this.sortAction}${this.resultLabel}${this.customArea}
                </div>
            </sp-theme>
        `}get placeholderKeys(){return["searchText","filtersText","sortText","popularityText","alphabeticallyText","noResultText","resultText","resultsText","resultMobileText","resultsMobileText","noSearchResultsText","searchResultText","searchResultsText","noSearchResultsMobileText","searchResultMobileText","searchResultsMobileText"]}};m=new WeakMap,O=new WeakMap,w(H,"styles",Ae`
        :host {
            --merch-card-collection-header-max-width: var(
                --merch-card-collection-card-width
            );
            --merch-card-collection-header-margin-bottom: 32px;
            --merch-card-collection-header-column-gap: 8px;
            --merch-card-collection-header-row-gap: 16px;
            --merch-card-collection-header-columns: auto auto;
            --merch-card-collection-header-areas: 'search search' 'filter sort'
                'result result';
            --merch-card-collection-header-search-max-width: unset;
            --merch-card-collection-header-search-min-height: 44px;
            --merch-card-collection-header-filter-height: 44px;
            --merch-card-collection-header-filter-font-size: 16px;
            --merch-card-collection-header-filter-padding: 15px;
            --merch-card-collection-header-sort-height: var(
                --merch-card-collection-header-filter-height
            );
            --merch-card-collection-header-sort-font-size: var(
                --merch-card-collection-header-filter-font-size
            );
            --merch-card-collection-header-sort-padding: var(
                --merch-card-collection-header-filter-padding
            );
            --merch-card-collection-header-result-font-size: 14px;
        }

        sp-theme {
            font-size: inherit;
        }

        #header {
            display: grid;
            column-gap: var(--merch-card-collection-header-column-gap);
            row-gap: var(--merch-card-collection-header-row-gap);
            align-items: center;
            grid-template-columns: var(--merch-card-collection-header-columns);
            grid-template-areas: var(--merch-card-collection-header-areas);
            margin-bottom: var(--merch-card-collection-header-margin-bottom);
            max-width: var(--merch-card-collection-header-max-width);
        }

        #header:empty {
            margin-bottom: 0;
        }

        #search {
            grid-area: search;
        }

        #search sp-search {
            max-width: var(--merch-card-collection-header-search-max-width);
            width: 100%;
            min-height: var(--merch-card-collection-header-search-min-height);
        }

        #filter {
            grid-area: filter;
            --mod-actionbutton-edge-to-text: var(
                --merch-card-collection-header-filter-padding
            );
            --mod-actionbutton-height: var(
                --merch-card-collection-header-filter-height
            );
        }

        #filter slot[name='filtersText'] {
            font-size: var(--merch-card-collection-header-filter-font-size);
        }

        #sort {
            grid-area: sort;
            --mod-actionbutton-edge-to-text: var(
                --merch-card-collection-header-sort-padding
            );
            --mod-actionbutton-height: var(
                --merch-card-collection-header-sort-height
            );
        }

        #sort [slot='label-only'] {
            font-size: var(--merch-card-collection-header-sort-font-size);
        }

        #result {
            grid-area: result;
            font-size: var(--merch-card-collection-header-result-font-size);
        }

        #result[type='search'][quantity='none'] {
            font-size: inherit;
        }

        #custom {
            grid-area: custom;
        }

        /* tablets */
        @media screen and ${ge(B)} {
            :host {
                --merch-card-collection-header-max-width: auto;
                --merch-card-collection-header-columns: 1fr fit-content(100%)
                    fit-content(100%);
                --merch-card-collection-header-areas: 'search filter sort'
                    'result result result';
            }
        }

        /* Laptop */
        @media screen and ${ge(v)} {
            :host {
                --merch-card-collection-header-columns: 1fr fit-content(100%);
                --merch-card-collection-header-areas: 'result sort';
                --merch-card-collection-header-result-font-size: inherit;
            }
        }
    `);customElements.define("merch-card-collection-header",H);export{M as MerchCardCollection,H as default};
