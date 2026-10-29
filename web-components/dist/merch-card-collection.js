var Le=Object.defineProperty;var ee=r=>{throw TypeError(r)};var we=(r,t,e)=>t in r?Le(r,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):r[t]=e;var M=(r,t,e)=>we(r,typeof t!="symbol"?t+"":t,e),q=(r,t,e)=>t.has(r)||ee("Cannot "+e);var c=(r,t,e)=>(q(r,t,"read from private field"),e?e.call(r):t.get(r)),y=(r,t,e)=>t.has(r)?ee("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(r):t.set(r,e),I=(r,t,e,s)=>(q(r,t,"write to private field"),s?s.call(r,e):t.set(r,e),e),te=(r,t,e)=>(q(r,t,"access private method"),e);import{html as S,LitElement as xe,css as Se,unsafeCSS as Ae,nothing as _}from"./lit-all.min.js";var Ne="(max-width: 767px)";var W="(min-width: 768px)",P="(min-width: 1200px)",re="(min-width: 1600px)";var je={matchMobile:window.matchMedia(Ne),matchDesktop:window.matchMedia(`${P} and (not ${re})`),matchDesktopOrUp:window.matchMedia(P),matchLargeDesktop:window.matchMedia(re),get isMobile(){return this.matchMobile.matches},get isDesktop(){return this.matchDesktop.matches},get isDesktopOrUp(){return this.matchDesktopOrUp.matches}};var H=class{constructor(t,e){this.key=Symbol("match-media-key"),this.matches=!1,this.host=t,this.host.addController(this),this.media=window.matchMedia(e),this.matches=this.media.matches,this.onChange=this.onChange.bind(this),t.addController(this)}hostConnected(){var t;(t=this.media)==null||t.addEventListener("change",this.onChange)}hostDisconnected(){var t;(t=this.media)==null||t.removeEventListener("change",this.onChange)}onChange(t){this.matches!==t.matches&&(this.matches=t.matches,this.host.requestUpdate(this.key,!this.matches))}};var se="hashchange";function j(r=window.location.hash){let t=[],e=r.replace(/^#/,"").split("&");for(let s of e){let[i,n=""]=s.split("=");i&&t.push([i,decodeURIComponent(n.replace(/\+/g," "))])}return Object.fromEntries(t)}function k(r){let t=new URLSearchParams(window.location.hash.slice(1));Object.entries(r).forEach(([i,n])=>{n?t.set(i,n):t.delete(i)}),t.sort();let e=t.toString();if(e===window.location.hash)return;let s=window.scrollY||document.documentElement.scrollTop;window.location.hash=e,window.scrollTo(0,s)}function X(r){let t=()=>{if(window.location.hash&&!window.location.hash.includes("="))return;let e=j(window.location.hash);r(e)};return t(),window.addEventListener(se,t),()=>{window.removeEventListener(se,t)}}var Me=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var ye='span[is="inline-price"][data-wcs-osi]',ve='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Oe='a[is="upt-link"]',st=`${ye},${ve},${Oe}`;var ie="merch-card-collection:sort",B="merch-card-collection:literals-changed",K="merch-card-collection:sidenav-attached",oe="merch-card-collection:showmore",ne="merch-sidenav:select",ae="aem:load",ce="aem:error";var le="mas:error";var it=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var x={alphabetical:"alphabetical",authored:"authored"};var De="mas-commerce-service";function he(r,t){let e;return function(){let s=this,i=arguments;clearTimeout(e),e=setTimeout(()=>r.apply(s,i),t)}}var U=(r,t)=>r?.querySelector(`[slot="${t}"]`)?.textContent?.trim();var Z=new Map,Ie=0;function de(r,t){let e=++Ie,s=t,i=performance.now(),n,l=()=>{Q(e),r()},u=()=>{i=performance.now(),n=setTimeout(l,s)},C=()=>{document.visibilityState==="hidden"?(clearTimeout(n),s-=performance.now()-i):u()};return Z.set(e,()=>{clearTimeout(n),document.removeEventListener("visibilitychange",C)}),document.addEventListener("visibilitychange",C),document.visibilityState!=="hidden"&&u(),e}function Q(r){let t=Z.get(r);t&&(t(),Z.delete(r))}function ue(){return document.getElementsByTagName(De)?.[0]}function pe(r){return r&&(r==="bizpro"&&(r="pro"),r==="pro"||r.startsWith("plans")?"plans":r)}var fe=r=>{let t=r.replace(/^mas:/,"").split("/");return t.length<2?[null,null]:[t[0],t[t.length-1]]},me=(r,t)=>{let e=t?.tagLabels?.[r]||r;return e.startsWith("coll-tag-filter")?r.charAt(0).toUpperCase()+r.slice(1):e},Ee=(r,t,e)=>{let s=new Map;for(let n of r){let[l,u]=fe(n);!l||!u||(s.has(l)||s.set(l,[]),s.get(l).push({name:u,label:me(u,e)}))}let i=s.size===1;return[...s.entries()].map(([n,l])=>({title:i&&t?t:me(n,e),label:n,deeplink:n,checkboxes:l}))},Te=(r,t)=>(r??[]).map(fe).filter(([e,s])=>e&&s&&t.has(e)).map(([e,s])=>`${e}:${s}`),ge=(r,t,e)=>t.every(s=>{let i=(e[s.deeplink]||"").split(",").filter(Boolean);return i.length?i.some(n=>r.includes(`${s.deeplink}:${n}`)):!0}),_e=(r,t,e)=>(t?.[e]??[]).some(s=>r.includes(s));var Ce="merch-card-collection",Pe=3e4,He={catalog:["four-merch-cards"],plans:["four-merch-cards"],plansTwoColumns:["two-merch-cards"],plansThreeColumns:["three-merch-cards"],product:["four-merch-cards"],productTwoColumns:["two-merch-cards"],productThreeColumns:["three-merch-cards"],segment:["four-merch-cards"],segmentTwoColumns:["two-merch-cards"],segmentThreeColumns:["three-merch-cards"],"special-offers":["three-merch-cards"],image:["three-merch-cards"],"mini-compare-chart":["three-merch-cards"],"mini-compare-chartTwoColumns":["two-merch-cards"],"mini-compare-chart-mweb":["three-merch-cards"],"mini-compare-chart-mwebTwoColumns":["two-merch-cards"]},ke={plans:!0},Ue=(r,{filter:t})=>r.filter(e=>e?.filters&&e?.filters.hasOwnProperty(t)),Ve=(r,{types:t})=>t?(t=t.split(","),r.filter(e=>t.some(s=>e.types.includes(s)))):r,$e=(r,t)=>{let e=t.tagGroups;if(!e?.length)return r;let s=j();return r.filter(i=>{let n=(i.getAttribute("filter-tags")||"").split(",").filter(Boolean);return ge(n,e,s)&&!_e(n,t.excludeTags,t.filter)})},Fe=r=>r.sort((t,e)=>(t.title??"").localeCompare(e.title??"","en",{sensitivity:"base"})),ze=(r,{filter:t})=>r.sort((e,s)=>s.filters[t]?.order==null||isNaN(s.filters[t]?.order)?-1:e.filters[t]?.order==null||isNaN(e.filters[t]?.order)?1:e.filters[t].order-s.filters[t].order),Ge=(r,{search:t})=>t?.length?(t=t.toLowerCase(),r.filter(e=>(e.title??"").toLowerCase().includes(t))):r,R,$,A,Y,J,be,v=class extends xe{constructor(){super();y(this,A);y(this,R,{});y(this,$);this.id=null,this.filter="all",this.hasMore=!1,this.resultCount=void 0,this.displayResult=!1,this.data=null,this.variant=null,this.hydrating=!1,this.hydrationReady=null,this.literalsHandlerAttached=!1,this.onUnmount=[],this.resizeHandlerDebounced=he(this.resizeHandler.bind(this),300)}resizeHandler(){this.firstChild?.variantLayout?.resizeHandler?.()}render(){return S` <slot></slot>
            ${this.footer}`}checkReady(){if(!this.querySelector("aem-fragment"))return Promise.resolve(!0);let s,i=new Promise(l=>{s=de(()=>l(!1),Pe)}),n=Promise.race([this.hydrationReady,i]);return n.finally(()=>Q(s)),n}updated(e){if(!this.querySelector("merch-card"))return;let s=window.scrollY||document.documentElement.scrollTop,i=[...this.children].filter(o=>o.tagName==="MERCH-CARD"&&!o.failed);if(i.length===0)return;e.has("singleApp")&&this.singleApp&&i.forEach(o=>{o.updateFilters(o.name===this.singleApp)});let n=this.sort===x.alphabetical?Fe:ze,u=[Ue,Ve,$e,Ge,n].reduce((o,a)=>a(o,this),i).map((o,a)=>[o,a]);if(this.resultCount=u.length,this.page&&this.limit){let o=this.page*this.limit;this.hasMore=u.length>o,u=u.filter(([,a])=>a<o)}let C=new Map(u.reverse());for(let o of C.keys())this.prepend(o);i.forEach(o=>{C.has(o)?(o.size=o.filters[this.filter]?.size,o.style.removeProperty("display"),o.requestUpdate()):(o.style.display="none",o.size=void 0)}),window.scrollTo(0,s),this.updateComplete.then(()=>{this.dispatchLiteralsChanged(),this.sidenav&&!this.literalsHandlerAttached&&(this.sidenav.addEventListener(ne,()=>{this.dispatchLiteralsChanged()}),this.literalsHandlerAttached=!0)})}dispatchLiteralsChanged(){this.dispatchEvent(new CustomEvent(B,{detail:{resultCount:this.resultCount,searchTerm:this.search,filter:this.sidenav?.filters?.selectedText}}))}buildOverrideMap(){I(this,R,{}),this.overrides?.split(",").forEach(e=>{let[s,i]=e?.split(":");s&&i&&(c(this,R)[s]=i)})}connectedCallback(){super.connectedCallback(),this.buildOverrideMap(),this.init(),window.addEventListener("resize",this.resizeHandlerDebounced)}async init(){await this.hydrate(),this.sidenav=this.parentElement.querySelector("merch-sidenav"),this.filtered?(this.filter=this.filtered,this.page=1):this.startDeeplink(),this.tagGroups?.length&&(this.stopFilterDeeplink=X(()=>this.requestUpdate())),this.initializePlaceholders()}disconnectedCallback(){super.disconnectedCallback(),this.stopDeeplink?.(),this.stopFilterDeeplink?.();for(let e of this.onUnmount)e();window.removeEventListener("resize",this.resizeHandlerDebounced)}initializeHeader(){let e=document.createElement("merch-card-collection-header");e.collection=this,e.classList.add(this.variant),this.parentElement.insertBefore(e,this),this.header=e,this.querySelectorAll("[placeholder]").forEach(i=>{let n=i.getAttribute("slot");this.header.placeholderKeys.includes(n)&&this.header.append(i)})}initializePlaceholders(){let e=this.data?.placeholders||{};!e.searchText&&this.data?.sidenavSettings?.searchText&&(e.searchText=this.data.sidenavSettings.searchText);for(let s of Object.keys(e)){let i=e[s],n=i.includes("<p>")?"div":"p",l=document.createElement(n);l.setAttribute("slot",s),l.setAttribute("placeholder",""),l.innerHTML=i,this.append(l)}}attachSidenav(e,s=!0){if(!e)return;s&&this.parentElement.prepend(e),this.sidenav=e,this.sidenav.variant=this.variant,this.sidenav.classList.add(this.variant),ke[this.variant]&&this.sidenav.setAttribute("autoclose",""),this.initializeHeader(),this.dispatchEvent(new CustomEvent(K));let i=c(this,A,J)?.getCollectionOptions(this.variant)?.onSidenavAttached;i&&i(this)}async hydrate(){if(this.hydrating)return!1;let e=this.querySelector("aem-fragment");if(!e)return;this.id=e.getAttribute("fragment");let s=e.getAttribute("mask"),i=e.getAttribute("pzn");this.hydrating=!0;let n;this.hydrationReady=new Promise(o=>{n=o});let l=this;function u(o){let a;return o.fields?.tagFilters?.length&&(a=Ee(o.fields.tagFilters,o.fields.tagFiltersTitle,o.settings)),{searchText:o.fields?.searchText,tagFilters:a,linksTitle:o.fields?.linksTitle,link:o.fields?.link,linkText:o.fields?.linkText,linkIcon:o.fields?.linkIcon}}function C(o,a){let b={cards:[],hierarchy:[],placeholders:o.placeholders,sidenavSettings:u(o)};function D(F,w){for(let d of w){if(d.fieldName==="variations")continue;if(d.fieldName==="cards"){if(b.cards.findIndex(T=>T.id===d.identifier)!==-1)continue;if(!o.references[d.identifier]?.value){c(l,A,Y)?.error(`Reference not found for card: ${d.identifier}`);continue}b.cards.push(o.references[d.identifier].value);continue}let h=o.references[d.identifier]?.value,p=d.referencesTree,f=a[d.identifier];if(f){let T=document.querySelector(`aem-fragment[fragment="${f}"]`)?.rawData;if(T?.fields)h=T,p=T.referencesTree,o.references={...o.references,...T.references};else{c(l,A,Y)?.error(`Override fragment ${f} not found or invalid:`);continue}}if(!h?.fields)continue;let{fields:E}=h,z={label:E.label||"",icon:E.icon,iconLight:E.iconLight,queryLabel:E.queryLabel,cards:E.cards?E.cards.map(T=>a[T]||T):[],collections:[]};E.defaultchild&&(z.defaultchild=a[E.defaultchild]||E.defaultchild),F.push(z),D(z.collections,p)}}return D(b.hierarchy,o.referencesTree),b.hierarchy.length===0&&(l.filtered="all"),b}e.addEventListener(ce,o=>{te(this,A,be).call(this,"Error loading AEM fragment",o.detail),this.hydrating=!1,e.remove()}),e.addEventListener(ae,async o=>{this.limit=27,this.data=C(o.detail,c(this,R)),this.tagGroups=this.data.sidenavSettings?.tagFilters??null,o.detail.variationId&&this.setAttribute("variation-id",o.detail.variationId);let{cards:a,hierarchy:b}=this.data,D=b.length===0&&o.detail.fields?.defaultchild?c(this,R)[o.detail.fields.defaultchild]||o.detail.fields.defaultchild:null,F=(h,p)=>{for(let f of h)if(f.defaultchild===p||f.collections&&F(f.collections,p))return!0;return!1};for(let h of a){let T=function(g){for(let L of g){let G=L.cards.indexOf(f);if(G===-1)continue;let Re=L.queryLabel??L?.label?.toLowerCase()??"";p.filters[Re]={order:G+1,size:h.fields.size},T(L.collections)}},p=document.createElement("merch-card"),f=c(this,R)[h.id]||h.id;p.setAttribute("consonant",""),p.setAttribute("style","");let E=h.fields.tags?.filter(g=>g.startsWith("mas:types/")).map(g=>g.split("/")[1]).join(",");if(E&&p.setAttribute("types",E),this.tagGroups){let g=new Set(this.tagGroups.map(G=>G.deeplink)),L=Te(h.fields.tags,g);L.length&&p.setAttribute("filter-tags",L.join(","))}c(this,A,J)?.getFragmentMapping(h.fields.variant)?.supportsDefaultChild&&(D?f===D:F(b,f))&&p.setAttribute("data-default-card","true"),T(b);let N=document.createElement("aem-fragment");N.setAttribute("fragment",h.id),s&&N.setAttribute("mask",s),i&&N.setAttribute("pzn",i);for(let g of["settings","placeholders","dictionary","priceLiterals"])h[g]={...o.detail[g],...h[g]};s||i?e.cache.set(N.cacheKey(),h):e.cache.add(h),N.setAttribute("fragment",f),p.append(N),Object.keys(p.filters).length===0&&(p.filters={all:{order:a.indexOf(h)+1,size:h.fields.size}}),this.append(p)}let w="",d=pe(a[0]?.fields?.variant);this.variant=d,d==="plans"&&(a.length===2||a.length===3)&&!a.some(h=>h.fields?.size?.includes("wide"))||(d==="segment"||d==="product")&&(a.length===2||a.length===3)?w=a.length===2?"TwoColumns":"ThreeColumns":(d==="mini-compare-chart"||d==="mini-compare-chart-mweb")&&a.length<=2&&(w=a.length===1?"":"TwoColumns"),d&&this.classList.add("merch-card-collection",d,...He[`${d}${w}`]||[]),this.displayResult=!0,this.hydrating=!1,e.remove(),n(!0)}),await this.hydrationReady}get footer(){if(!this.filtered)return S`<div id="footer">
            <sp-theme color="light" scale="medium">
                ${this.showMoreButton}
            </sp-theme>
        </div>`}get showMoreButton(){if(this.hasMore)return this.classList.contains("product-pricing")?S`<button
                type="button"
                class="show-more"
                @click="${this.showMore}"
            >
                <slot name="showMoreText"></slot>
            </button>`:S`<sp-button
            variant="secondary"
            treatment="outline"
            style="order: 1000;"
            @click="${this.showMore}"
        >
            <slot name="showMoreText"></slot>
        </sp-button>`}sortChanged(e){e.target.value===x.authored?k({sort:void 0}):k({sort:e.target.value}),this.dispatchEvent(new CustomEvent(ie,{bubbles:!0,composed:!0,detail:{value:e.target.value}}))}async showMore(){this.dispatchEvent(new CustomEvent(oe,{bubbles:!0,composed:!0}));let e=this.page+1;k({page:e}),this.page=e,await this.updateComplete}startDeeplink(){this.stopDeeplink=X(({category:e,filter:s,types:i,sort:n,search:l,single_app:u,page:C})=>{s=s||e,!this.filtered&&s&&s!==this.filter&&setTimeout(()=>{k({page:void 0}),this.page=1},1),this.filtered||(this.filter=s??this.filter),this.types=i??"",this.search=l??"",this.singleApp=u,this.sort=n,this.page=Number(C)||1})}openFilters(e){this.sidenav?.showModal(e)}};R=new WeakMap,$=new WeakMap,A=new WeakSet,Y=function(){return c(this,$)??I(this,$,ue()?.Log?.module(Ce)),c(this,$)},J=function(){return customElements.get("merch-card")},be=function(e,s={},i=!0){c(this,A,Y)?.error(`merch-card-collection: ${e}`,s),this.failed=!0,i&&this.dispatchEvent(new CustomEvent(le,{detail:{...s,message:e},bubbles:!0,composed:!0}))},M(v,"properties",{id:{type:String,attribute:"id",reflect:!0},displayResult:{type:Boolean,attribute:"display-result"},excludeTags:{type:Object,attribute:!1},filter:{type:String,attribute:"filter",reflect:!0},filtered:{type:String,attribute:"filtered",reflect:!0},hasMore:{type:Boolean},limit:{type:Number,attribute:"limit"},overrides:{type:String},page:{type:Number,attribute:"page",reflect:!0},resultCount:{type:Number},search:{type:String,attribute:"search",reflect:!0},sidenav:{type:Object},singleApp:{type:String,attribute:"single-app",reflect:!0},sort:{type:String,attribute:"sort",default:x.authored,reflect:!0},types:{type:String,attribute:"types",reflect:!0}}),M(v,"styles",Se`
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
    `);v.SortOrder=x;customElements.define(Ce,v);var Be={filters:["noResultText","resultText","resultsText"],filtersMobile:["noResultText","resultMobileText","resultsMobileText"],search:["noSearchResultsText","searchResultText","searchResultsText"],searchMobile:["noSearchResultsMobileText","searchResultMobileText","searchResultsMobileText"]},Ke=(r,t,e)=>{r.querySelectorAll(`[data-placeholder="${t}"]`).forEach(i=>{i.innerText=e||""})},Ye={search:["mobile","tablet"],filter:["mobile","tablet"],sort:!0,result:!0,custom:!1},qe={catalog:"l"},m,O,V=class extends xe{constructor(){super();y(this,m);y(this,O);M(this,"tablet",new H(this,W));M(this,"desktop",new H(this,P));this.collection=null,I(this,m,{search:!1,filter:!1,sort:!1,result:!1,custom:!1}),this.updateLiterals=this.updateLiterals.bind(this),this.handleSidenavAttached=this.handleSidenavAttached.bind(this)}connectedCallback(){super.connectedCallback(),this.collection?.addEventListener(B,this.updateLiterals),this.collection?.addEventListener(K,this.handleSidenavAttached),I(this,O,customElements.get("merch-card"))}disconnectedCallback(){super.disconnectedCallback(),this.collection?.removeEventListener(B,this.updateLiterals),this.collection?.removeEventListener(K,this.handleSidenavAttached)}willUpdate(){c(this,m).search=this.getVisibility("search"),c(this,m).filter=this.getVisibility("filter"),c(this,m).sort=this.getVisibility("sort"),c(this,m).result=this.getVisibility("result"),c(this,m).custom=this.getVisibility("custom")}parseVisibilityOptions(e,s){if(!e||!Object.hasOwn(e,s))return null;let i=e[s];return i===!1?!1:i===!0?!0:i.includes(this.currentMedia)}getVisibility(e){let s=c(this,O)?.getCollectionOptions(this.collection?.variant)?.headerVisibility,i=this.parseVisibilityOptions(s,e);return i!==null?i:this.parseVisibilityOptions(Ye,e)}get sidenav(){return this.collection?.sidenav}get search(){return this.collection?.search}get resultCount(){return this.collection?.resultCount}get variant(){return this.collection?.variant}get isMobile(){return!this.isTablet&&!this.isDesktop}get isTablet(){return this.tablet.matches&&!this.desktop.matches}get isDesktop(){return this.desktop.matches}get currentMedia(){return this.isDesktop?"desktop":this.isTablet?"tablet":"mobile"}get searchAction(){if(!c(this,m).search)return _;let e=U(this,"searchText");return e?S`
            <merch-search deeplink="search" id="search">
                <sp-search
                    id="search-bar"
                    placeholder="${e}"
                    .size=${qe[this.variant]}
                    aria-label="${e}"
                ></sp-search>
            </merch-search>
        `:_}get filterAction(){return c(this,m).filter?this.sidenav?S`
            <sp-action-button
                id="filter"
                variant="secondary"
                treatment="outline"
                @click="${this.openFilters}"
                ><slot name="filtersText"></slot
            ></sp-action-button>
        `:_:_}get sortAction(){if(!c(this,m).sort)return _;let e=U(this,"sortText");if(!e)return;let s=U(this,"popularityText"),i=U(this,"alphabeticallyText");if(!(s&&i))return;let n=this.collection?.sort===x.alphabetical;return S`
            <sp-action-menu
                id="sort"
                size="m"
                @change="${this.collection?.sortChanged}"
                selects="single"
                value="${n?x.alphabetical:x.authored}"
            >
                <span slot="label-only"
                    >${e}:
                    ${n?i:s}</span
                >
                <sp-menu-item value="${x.authored}"
                    >${s}</sp-menu-item
                >
                <sp-menu-item value="${x.alphabetical}"
                    >${i}</sp-menu-item
                >
            </sp-action-menu>
        `}get resultSlotName(){let e=`${this.search?"search":"filters"}${this.isMobile||this.isTablet?"Mobile":""}`;return Be[e][Math.min(this.resultCount,2)]}get resultLabel(){if(!c(this,m).result)return _;if(!this.sidenav)return _;let e=this.search?"search":"filter",s=this.resultCount?this.resultCount===1?"single":"multiple":"none";return S` <div
            id="result"
            aria-live="polite"
            type=${e}
            quantity=${s}
        >
            <slot name="${this.resultSlotName}"></slot>
        </div>`}get customArea(){if(!c(this,m).custom)return _;let e=c(this,O)?.getCollectionOptions(this.collection?.variant)?.customHeaderArea;if(!e)return _;let s=e(this.collection);return!s||s===_?_:S`<div id="custom" role="heading" aria-level="2">
            ${s}
        </div>`}openFilters(e){this.sidenav.showModal(e)}updateLiterals(e){Object.keys(e.detail).forEach(s=>{Ke(this,s,e.detail[s])}),this.requestUpdate()}handleSidenavAttached(){this.requestUpdate()}render(){return S`
            <sp-theme color="light" scale="medium">
                <div id="header">
                    ${this.searchAction}${this.filterAction}${this.sortAction}${this.resultLabel}${this.customArea}
                </div>
            </sp-theme>
        `}get placeholderKeys(){return["searchText","filtersText","sortText","popularityText","alphabeticallyText","noResultText","resultText","resultsText","resultMobileText","resultsMobileText","noSearchResultsText","searchResultText","searchResultsText","noSearchResultsMobileText","searchResultMobileText","searchResultsMobileText"]}};m=new WeakMap,O=new WeakMap,M(V,"styles",Se`
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
        @media screen and ${Ae(W)} {
            :host {
                --merch-card-collection-header-max-width: auto;
                --merch-card-collection-header-columns: 1fr fit-content(100%)
                    fit-content(100%);
                --merch-card-collection-header-areas: 'search filter sort'
                    'result result result';
            }
        }

        /* Laptop */
        @media screen and ${Ae(P)} {
            :host {
                --merch-card-collection-header-columns: 1fr fit-content(100%);
                --merch-card-collection-header-areas: 'result sort';
                --merch-card-collection-header-result-font-size: inherit;
            }
        }
    `);customElements.define("merch-card-collection-header",V);export{v as MerchCardCollection,V as default};
