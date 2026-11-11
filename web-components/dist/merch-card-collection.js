var Le=Object.defineProperty;var te=s=>{throw TypeError(s)};var ye=(s,t,e)=>t in s?Le(s,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):s[t]=e;var v=(s,t,e)=>ye(s,typeof t!="symbol"?t+"":t,e),Y=(s,t,e)=>t.has(s)||te("Cannot "+e);var l=(s,t,e)=>(Y(s,t,"read from private field"),e?e.call(s):t.get(s)),O=(s,t,e)=>t.has(s)?te("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(s):t.set(s,e),P=(s,t,e,r)=>(Y(s,t,"write to private field"),r?r.call(s,e):t.set(s,e),e),W=(s,t,e)=>(Y(s,t,"access private method"),e);import{html as w,LitElement as xe,css as Se,unsafeCSS as Ae,nothing as b}from"./lit-all.min.js";var Ne="(max-width: 767px)";var j="(min-width: 768px)",H="(min-width: 1200px)",re="(min-width: 1600px)";var Ze={matchMobile:window.matchMedia(Ne),matchDesktop:window.matchMedia(`${H} and (not ${re})`),matchDesktopOrUp:window.matchMedia(H),matchLargeDesktop:window.matchMedia(re),get isMobile(){return this.matchMobile.matches},get isDesktop(){return this.matchDesktop.matches},get isDesktopOrUp(){return this.matchDesktopOrUp.matches}};var k=class{constructor(t,e){this.key=Symbol("match-media-key"),this.matches=!1,this.host=t,this.host.addController(this),this.media=window.matchMedia(e),this.matches=this.media.matches,this.onChange=this.onChange.bind(this),t.addController(this)}hostConnected(){var t;(t=this.media)==null||t.addEventListener("change",this.onChange)}hostDisconnected(){var t;(t=this.media)==null||t.removeEventListener("change",this.onChange)}onChange(t){this.matches!==t.matches&&(this.matches=t.matches,this.host.requestUpdate(this.key,!this.matches))}};var se="hashchange";function X(s=window.location.hash){let t=[],e=s.replace(/^#/,"").split("&");for(let r of e){let[i,o=""]=r.split("=");i&&t.push([i,decodeURIComponent(o.replace(/\+/g," "))])}return Object.fromEntries(t)}function U(s){let t=new URLSearchParams(window.location.hash.slice(1));Object.entries(s).forEach(([i,o])=>{o?t.set(i,o):t.delete(i)}),t.sort();let e=t.toString();if(e===window.location.hash)return;let r=window.scrollY||document.documentElement.scrollTop;window.location.hash=e,window.scrollTo(0,r)}function Z(s){let t=()=>{if(window.location.hash&&!window.location.hash.includes("="))return;let e=X(window.location.hash);s(e)};return t(),window.addEventListener(se,t),()=>{window.removeEventListener(se,t)}}var Me=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var ve='span[is="inline-price"][data-wcs-osi]',Oe='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var De='a[is="upt-link"]',ot=`${ve},${Oe},${De}`;var ie="merch-card-collection:sort",B="merch-card-collection:literals-changed",q="merch-card-collection:sidenav-attached",oe="merch-card-collection:showmore",ne="merch-sidenav:select",ae="aem:load",ce="aem:error";var le="mas:error";var nt=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var R={alphabetical:"alphabetical",authored:"authored"};var Ie="mas-commerce-service";function he(s,t){let e;return function(){let r=this,i=arguments;clearTimeout(e),e=setTimeout(()=>s.apply(r,i),t)}}var V=(s,t)=>s?.querySelector(`[slot="${t}"]`)?.textContent?.trim();var Q=new Map,Pe=0;function de(s,t){let e=++Pe,r=t,i=performance.now(),o,a=()=>{J(e),s()},E=()=>{i=performance.now(),o=setTimeout(a,r)},S=()=>{document.visibilityState==="hidden"?(clearTimeout(o),r-=performance.now()-i):E()};return Q.set(e,()=>{clearTimeout(o),document.removeEventListener("visibilitychange",S)}),document.addEventListener("visibilitychange",S),document.visibilityState!=="hidden"&&E(),e}function J(s){let t=Q.get(s);t&&(t(),Q.delete(s))}function ue(){return document.getElementsByTagName(Ie)?.[0]}function pe(s){return s&&(s==="bizpro"&&(s="pro"),s==="pro"||s.startsWith("plans")?"plans":s)}var fe=s=>{let t=s.replace(/^mas:/,"").split("/");return t.length<2?[null,null]:[t[0],t[t.length-1]]},me=(s,t)=>{let e=t?.tagLabels?.[s]||s;return e.startsWith("coll-tag-filter")?s.charAt(0).toUpperCase()+s.slice(1):e},Ee=(s,t,e)=>{let r=new Map;for(let o of s){let[a,E]=fe(o);!a||!E||(r.has(a)||r.set(a,[]),r.get(a).push({name:E,label:me(E,e)}))}let i=r.size===1;return[...r.entries()].map(([o,a])=>({title:i&&t?t:me(o,e),label:o,deeplink:o,checkboxes:a}))},Te=(s,t)=>(s??[]).map(fe).filter(([e,r])=>e&&r&&t.has(e)).map(([e,r])=>`${e}:${r}`),ge=(s,t,e)=>t.every(r=>{let i=(e[r.deeplink]||"").split(",").filter(Boolean);return i.length?i.some(o=>s.includes(`${r.deeplink}:${o}`)):!0}),_e=(s,t,e)=>(t?.[e]??[]).some(r=>s.includes(r));var Ce="merch-card-collection",He=3e4,ke={catalog:["four-merch-cards"],plans:["four-merch-cards"],plansTwoColumns:["two-merch-cards"],plansThreeColumns:["three-merch-cards"],product:["four-merch-cards"],productTwoColumns:["two-merch-cards"],productThreeColumns:["three-merch-cards"],segment:["four-merch-cards"],segmentTwoColumns:["two-merch-cards"],segmentThreeColumns:["three-merch-cards"],"special-offers":["three-merch-cards"],image:["three-merch-cards"],"mini-compare-chart":["three-merch-cards"],"mini-compare-chartTwoColumns":["two-merch-cards"],"mini-compare-chart-mweb":["three-merch-cards"],"mini-compare-chart-mwebTwoColumns":["two-merch-cards"]},Ue={plans:!0},Ve=["excludeTags","filter","limit","page","search","singleApp","sort","types"],$e=(s,{filter:t})=>s.filter(e=>e?.filters&&e?.filters.hasOwnProperty(t)),Fe=(s,{types:t})=>t?(t=t.split(","),s.filter(e=>t.some(r=>e.types.includes(r)))):s,ze=(s,t)=>{let e=t.tagGroups;if(!e?.length)return s;let r=X();return s.filter(i=>{let o=(i.getAttribute("filter-tags")||"").split(",").filter(Boolean);return ge(o,e,r)&&!_e(o,t.excludeTags,t.filter)})},Ge=s=>s.sort((t,e)=>(t.title??"").localeCompare(e.title??"","en",{sensitivity:"base"})),Be=(s,{filter:t})=>s.sort((e,r)=>r.filters[t]?.order==null||isNaN(r.filters[t]?.order)?-1:e.filters[t]?.order==null||isNaN(e.filters[t]?.order)?1:e.filters[t].order-r.filters[t].order),qe=(s,{search:t})=>t?.length?(t=t.toLowerCase(),s.filter(e=>(e.title??"").toLowerCase().includes(t))):s,L,F,f,K,ee,be,Re,D=class extends xe{constructor(){super();O(this,f);O(this,L,{});O(this,F);this.id=null,this.filter="all",this.hasMore=!1,this.resultCount=void 0,this.displayResult=!1,this.data=null,this.variant=null,this.hydrating=!1,this.hydrationReady=null,this.literalsHandlerAttached=!1,this.onUnmount=[],this.resizeHandlerDebounced=he(this.resizeHandler.bind(this),300)}resizeHandler(){this.firstChild?.variantLayout?.resizeHandler?.()}requestUpdate(e,...r){e===void 0&&(this.arrangeRequested=!0),super.requestUpdate(e,...r)}render(){return w` <slot></slot>
            ${this.footer}`}checkReady(){if(!this.querySelector("aem-fragment"))return Promise.resolve(!0);let r,i=new Promise(a=>{r=de(()=>a(!1),He)}),o=Promise.race([this.hydrationReady,i]);return o.finally(()=>J(r)),o}updated(e){let r=this.arrangeRequested;if(this.arrangeRequested=!1,!this.querySelector("merch-card"))return;let i=r||Ve.some(a=>e.has(a));if(!i&&!e.has("sidenav"))return;let o=[...this.children].filter(a=>a.tagName==="MERCH-CARD"&&!a.failed);o.length!==0&&(i&&W(this,f,be).call(this,o,e),this.updateComplete.then(()=>{this.dispatchLiteralsChanged(),this.sidenav&&!this.literalsHandlerAttached&&(this.sidenav.addEventListener(ne,()=>{this.dispatchLiteralsChanged()}),this.literalsHandlerAttached=!0)}))}dispatchLiteralsChanged(){this.dispatchEvent(new CustomEvent(B,{detail:{resultCount:this.resultCount,searchTerm:this.search,filter:this.sidenav?.filters?.selectedText}}))}buildOverrideMap(){P(this,L,{}),this.overrides?.split(",").forEach(e=>{let[r,i]=e?.split(":");r&&i&&(l(this,L)[r]=i)})}connectedCallback(){super.connectedCallback(),this.buildOverrideMap(),this.init(),window.addEventListener("resize",this.resizeHandlerDebounced)}async init(){await this.hydrate(),this.sidenav=this.parentElement.querySelector("merch-sidenav"),this.filtered?(this.filter=this.filtered,this.page=1):this.startDeeplink(),this.tagGroups?.length&&(this.stopFilterDeeplink=Z(()=>this.requestUpdate())),this.initializePlaceholders()}disconnectedCallback(){super.disconnectedCallback(),this.stopDeeplink?.(),this.stopFilterDeeplink?.();for(let e of this.onUnmount)e();window.removeEventListener("resize",this.resizeHandlerDebounced)}initializeHeader(){let e=document.createElement("merch-card-collection-header");e.collection=this,e.classList.add(this.variant),this.parentElement.insertBefore(e,this),this.header=e,this.querySelectorAll("[placeholder]").forEach(i=>{let o=i.getAttribute("slot");this.header.placeholderKeys.includes(o)&&this.header.append(i)})}initializePlaceholders(){let e=this.data?.placeholders||{};!e.searchText&&this.data?.sidenavSettings?.searchText&&(e.searchText=this.data.sidenavSettings.searchText);for(let r of Object.keys(e)){let i=e[r],o=i.includes("<p>")?"div":"p",a=document.createElement(o);a.setAttribute("slot",r),a.setAttribute("placeholder",""),a.innerHTML=i,this.append(a)}}attachSidenav(e,r=!0){if(!e)return;r&&this.parentElement.prepend(e),this.sidenav=e,this.sidenav.variant=this.variant,this.sidenav.classList.add(this.variant),Ue[this.variant]&&this.sidenav.setAttribute("autoclose",""),this.initializeHeader(),this.dispatchEvent(new CustomEvent(q));let i=l(this,f,ee)?.getCollectionOptions(this.variant)?.onSidenavAttached;i&&i(this)}async hydrate(){if(this.hydrating)return!1;let e=this.querySelector("aem-fragment");if(!e)return;this.id=e.getAttribute("fragment");let r=e.getAttribute("mask"),i=e.getAttribute("pzn");this.hydrating=!0;let o;this.hydrationReady=new Promise(c=>{o=c});let a=this;function E(c){let h;return c.fields?.tagFilters?.length&&(h=Ee(c.fields.tagFilters,c.fields.tagFiltersTitle,c.settings)),{searchText:c.fields?.searchText,tagFilters:h,linksTitle:c.fields?.linksTitle,link:c.fields?.link,linkText:c.fields?.linkText,linkIcon:c.fields?.linkIcon}}function S(c,h){let C={cards:[],hierarchy:[],placeholders:c.placeholders,sidenavSettings:E(c)};function n(T,N){for(let u of N){if(u.fieldName==="variations")continue;if(u.fieldName==="cards"){if(C.cards.findIndex(A=>A.id===u.identifier)!==-1)continue;if(!c.references[u.identifier]?.value){l(a,f,K)?.error(`Reference not found for card: ${u.identifier}`);continue}C.cards.push(c.references[u.identifier].value);continue}let d=c.references[u.identifier]?.value,p=u.referencesTree,g=h[u.identifier];if(g){let A=document.querySelector(`aem-fragment[fragment="${g}"]`)?.rawData;if(A?.fields)d=A,p=A.referencesTree,c.references={...c.references,...A.references};else{l(a,f,K)?.error(`Override fragment ${g} not found or invalid:`);continue}}if(!d?.fields)continue;let{fields:_}=d,z={label:_.label||"",icon:_.icon,iconLight:_.iconLight,queryLabel:_.queryLabel,cards:_.cards?_.cards.map(A=>h[A]||A):[],collections:[]};_.defaultchild&&(z.defaultchild=h[_.defaultchild]||_.defaultchild),T.push(z),n(z.collections,p)}}return n(C.hierarchy,c.referencesTree),C.hierarchy.length===0&&(a.filtered="all"),C}e.addEventListener(ce,c=>{W(this,f,Re).call(this,"Error loading AEM fragment",c.detail),this.hydrating=!1,e.remove()}),e.addEventListener(ae,async c=>{this.limit=27,this.data=S(c.detail,l(this,L)),this.tagGroups=this.data.sidenavSettings?.tagFilters??null,c.detail.variationId&&this.setAttribute("variation-id",c.detail.variationId);let{cards:h,hierarchy:C}=this.data,n=C.length===0&&c.detail.fields?.defaultchild?l(this,L)[c.detail.fields.defaultchild]||c.detail.fields.defaultchild:null,T=(d,p)=>{for(let g of d)if(g.defaultchild===p||g.collections&&T(g.collections,p))return!0;return!1};for(let d of h){let A=function(x){for(let y of x){let G=y.cards.indexOf(g);if(G===-1)continue;let we=y.queryLabel??y?.label?.toLowerCase()??"";p.filters[we]={order:G+1,size:d.fields.size},A(y.collections)}},p=document.createElement("merch-card"),g=l(this,L)[d.id]||d.id;p.setAttribute("consonant",""),p.setAttribute("style","");let _=d.fields.tags?.filter(x=>x.startsWith("mas:types/")).map(x=>x.split("/")[1]).join(",");if(_&&p.setAttribute("types",_),this.tagGroups){let x=new Set(this.tagGroups.map(G=>G.deeplink)),y=Te(d.fields.tags,x);y.length&&p.setAttribute("filter-tags",y.join(","))}l(this,f,ee)?.getFragmentMapping(d.fields.variant)?.supportsDefaultChild&&(n?g===n:T(C,g))&&p.setAttribute("data-default-card","true"),A(C);let M=document.createElement("aem-fragment");M.setAttribute("fragment",d.id),r&&M.setAttribute("mask",r),i&&M.setAttribute("pzn",i);for(let x of["settings","placeholders","dictionary","priceLiterals"])d[x]={...c.detail[x],...d[x]};r||i?e.cache.set(M.cacheKey(),d):e.cache.add(d),M.setAttribute("fragment",g),p.append(M),Object.keys(p.filters).length===0&&(p.filters={all:{order:h.indexOf(d)+1,size:d.fields.size}}),this.append(p)}let N="",u=pe(h[0]?.fields?.variant);this.variant=u,u==="plans"&&(h.length===2||h.length===3)&&!h.some(d=>d.fields?.size?.includes("wide"))||(u==="segment"||u==="product")&&(h.length===2||h.length===3)?N=h.length===2?"TwoColumns":"ThreeColumns":(u==="mini-compare-chart"||u==="mini-compare-chart-mweb")&&h.length<=2&&(N=h.length===1?"":"TwoColumns"),u&&this.classList.add("merch-card-collection",u,...ke[`${u}${N}`]||[]),this.displayResult=!0,this.hydrating=!1,e.remove(),o(!0)}),await this.hydrationReady}get footer(){if(!this.filtered)return w`<div id="footer">
            <sp-theme color="light" scale="medium">
                ${this.showMoreButton}
            </sp-theme>
        </div>`}get showMoreButton(){if(this.hasMore)return this.classList.contains("product-pricing")?w`<button
                type="button"
                class="show-more"
                @click="${this.showMore}"
            >
                <slot name="showMoreText"></slot>
            </button>`:w`<sp-button
            variant="secondary"
            treatment="outline"
            style="order: 1000;"
            @click="${this.showMore}"
        >
            <slot name="showMoreText"></slot>
        </sp-button>`}sortChanged(e){e.target.value===R.authored?U({sort:void 0}):U({sort:e.target.value}),this.dispatchEvent(new CustomEvent(ie,{bubbles:!0,composed:!0,detail:{value:e.target.value}}))}async showMore(){this.dispatchEvent(new CustomEvent(oe,{bubbles:!0,composed:!0}));let e=this.page+1;U({page:e}),this.page=e,await this.updateComplete}startDeeplink(){this.stopDeeplink=Z(({category:e,filter:r,types:i,sort:o,search:a,single_app:E,page:S})=>{r=r||e,!this.filtered&&r&&r!==this.filter&&setTimeout(()=>{U({page:void 0}),this.page=1},1),this.filtered||(this.filter=r??this.filter),this.types=i??"",this.search=a??"",this.singleApp=E,this.sort=o,this.page=Number(S)||1})}openFilters(e){this.sidenav?.showModal(e)}};L=new WeakMap,F=new WeakMap,f=new WeakSet,K=function(){return l(this,F)??P(this,F,ue()?.Log?.module(Ce)),l(this,F)},ee=function(){return customElements.get("merch-card")},be=function(e,r){r.has("singleApp")&&this.singleApp&&e.forEach(n=>{n.updateFilters(n.name===this.singleApp)});let i=this.sort===R.alphabetical?Ge:Be,a=[$e,Fe,ze,qe,i].reduce((n,T)=>T(n,this),e).map((n,T)=>[n,T]);if(this.resultCount=a.length,this.page&&this.limit){let n=this.page*this.limit;this.hasMore=a.length>n,a=a.filter(([,T])=>T<n)}let E=a.map(([n])=>n),S=new Map(a.reverse()),c=E.some((n,T)=>this.children[T]!==n),h=e.some(n=>S.has(n)?n.style.display!=="":n.style.display!=="none"||n.size!==void 0);if(!c&&!h){for(let n of S.keys())n.size=n.filters[this.filter]?.size;return}let C=window.scrollY||document.documentElement.scrollTop;if(c)for(let n of S.keys())this.prepend(n);e.forEach(n=>{S.has(n)?(n.size=n.filters[this.filter]?.size,n.style.removeProperty("display"),n.requestUpdate()):(n.style.display="none",n.size=void 0)}),window.scrollTo(0,C)},Re=function(e,r={},i=!0){l(this,f,K)?.error(`merch-card-collection: ${e}`,r),this.failed=!0,i&&this.dispatchEvent(new CustomEvent(le,{detail:{...r,message:e},bubbles:!0,composed:!0}))},v(D,"properties",{id:{type:String,attribute:"id",reflect:!0},displayResult:{type:Boolean,attribute:"display-result"},excludeTags:{type:Object,attribute:!1},filter:{type:String,attribute:"filter",reflect:!0},filtered:{type:String,attribute:"filtered",reflect:!0},hasMore:{type:Boolean},limit:{type:Number,attribute:"limit"},overrides:{type:String},page:{type:Number,attribute:"page",reflect:!0},resultCount:{type:Number},search:{type:String,attribute:"search",reflect:!0},sidenav:{type:Object},singleApp:{type:String,attribute:"single-app",reflect:!0},sort:{type:String,attribute:"sort",default:R.authored,reflect:!0},types:{type:String,attribute:"types",reflect:!0}}),v(D,"styles",Se`
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
    `);D.SortOrder=R;customElements.define(Ce,D);var Ke={filters:["noResultText","resultText","resultsText"],filtersMobile:["noResultText","resultMobileText","resultsMobileText"],search:["noSearchResultsText","searchResultText","searchResultsText"],searchMobile:["noSearchResultsMobileText","searchResultMobileText","searchResultsMobileText"]},Ye=(s,t,e)=>{s.querySelectorAll(`[data-placeholder="${t}"]`).forEach(i=>{i.innerText=e||""})},We={search:["mobile","tablet"],filter:["mobile","tablet"],sort:!0,result:!0,custom:!1},je={catalog:"l"},m,I,$=class extends xe{constructor(){super();O(this,m);O(this,I);v(this,"tablet",new k(this,j));v(this,"desktop",new k(this,H));this.collection=null,P(this,m,{search:!1,filter:!1,sort:!1,result:!1,custom:!1}),this.updateLiterals=this.updateLiterals.bind(this),this.handleSidenavAttached=this.handleSidenavAttached.bind(this)}connectedCallback(){super.connectedCallback(),this.collection?.addEventListener(B,this.updateLiterals),this.collection?.addEventListener(q,this.handleSidenavAttached),P(this,I,customElements.get("merch-card"))}disconnectedCallback(){super.disconnectedCallback(),this.collection?.removeEventListener(B,this.updateLiterals),this.collection?.removeEventListener(q,this.handleSidenavAttached)}willUpdate(){l(this,m).search=this.getVisibility("search"),l(this,m).filter=this.getVisibility("filter"),l(this,m).sort=this.getVisibility("sort"),l(this,m).result=this.getVisibility("result"),l(this,m).custom=this.getVisibility("custom")}parseVisibilityOptions(e,r){if(!e||!Object.hasOwn(e,r))return null;let i=e[r];return i===!1?!1:i===!0?!0:i.includes(this.currentMedia)}getVisibility(e){let r=l(this,I)?.getCollectionOptions(this.collection?.variant)?.headerVisibility,i=this.parseVisibilityOptions(r,e);return i!==null?i:this.parseVisibilityOptions(We,e)}get sidenav(){return this.collection?.sidenav}get search(){return this.collection?.search}get resultCount(){return this.collection?.resultCount}get variant(){return this.collection?.variant}get isMobile(){return!this.isTablet&&!this.isDesktop}get isTablet(){return this.tablet.matches&&!this.desktop.matches}get isDesktop(){return this.desktop.matches}get currentMedia(){return this.isDesktop?"desktop":this.isTablet?"tablet":"mobile"}get searchAction(){if(!l(this,m).search)return b;let e=V(this,"searchText");return e?w`
            <merch-search deeplink="search" id="search">
                <sp-search
                    id="search-bar"
                    placeholder="${e}"
                    .size=${je[this.variant]}
                    aria-label="${e}"
                ></sp-search>
            </merch-search>
        `:b}get filterAction(){return l(this,m).filter?this.sidenav?w`
            <sp-action-button
                id="filter"
                variant="secondary"
                treatment="outline"
                @click="${this.openFilters}"
                ><slot name="filtersText"></slot
            ></sp-action-button>
        `:b:b}get sortAction(){if(!l(this,m).sort)return b;let e=V(this,"sortText");if(!e)return;let r=V(this,"popularityText"),i=V(this,"alphabeticallyText");if(!(r&&i))return;let o=this.collection?.sort===R.alphabetical;return w`
            <sp-action-menu
                id="sort"
                size="m"
                @change="${this.collection?.sortChanged}"
                selects="single"
                value="${o?R.alphabetical:R.authored}"
            >
                <span slot="label-only"
                    >${e}:
                    ${o?i:r}</span
                >
                <sp-menu-item value="${R.authored}"
                    >${r}</sp-menu-item
                >
                <sp-menu-item value="${R.alphabetical}"
                    >${i}</sp-menu-item
                >
            </sp-action-menu>
        `}get resultSlotName(){let e=`${this.search?"search":"filters"}${this.isMobile||this.isTablet?"Mobile":""}`;return Ke[e][Math.min(this.resultCount,2)]}get resultLabel(){if(!l(this,m).result)return b;if(!this.sidenav)return b;let e=this.search?"search":"filter",r=this.resultCount?this.resultCount===1?"single":"multiple":"none";return w` <div id="result" type=${e} quantity=${r}>
                <slot name="${this.resultSlotName}"></slot>
            </div>
            <div
                id="result-status"
                role="status"
                aria-live="polite"
                aria-atomic="true"
            ></div>`}updated(){let e=this.shadowRoot.querySelector("#result slot"),r=this.shadowRoot.querySelector("#result-status");if(!e||!r)return;let i=e.assignedNodes({flatten:!0}).map(o=>o.textContent).join(" ").replace(/\s+/g," ").trim();r.textContent!==i&&(r.textContent=i)}get customArea(){if(!l(this,m).custom)return b;let e=l(this,I)?.getCollectionOptions(this.collection?.variant)?.customHeaderArea;if(!e)return b;let r=e(this.collection);return!r||r===b?b:w`<div id="custom" role="heading" aria-level="2">
            ${r}
        </div>`}openFilters(e){this.sidenav.showModal(e)}updateLiterals(e){Object.keys(e.detail).forEach(r=>{Ye(this,r,e.detail[r])}),this.requestUpdate()}handleSidenavAttached(){this.requestUpdate()}render(){return w`
            <sp-theme color="light" scale="medium">
                <div id="header">
                    ${this.searchAction}${this.filterAction}${this.sortAction}${this.resultLabel}${this.customArea}
                </div>
            </sp-theme>
        `}get placeholderKeys(){return["searchText","filtersText","sortText","popularityText","alphabeticallyText","noResultText","resultText","resultsText","resultMobileText","resultsMobileText","noSearchResultsText","searchResultText","searchResultsText","noSearchResultsMobileText","searchResultMobileText","searchResultsMobileText"]}};m=new WeakMap,I=new WeakMap,v($,"styles",Se`
        #result-status {
            position: absolute;
            width: 1px;
            height: 1px;
            overflow: hidden;
            clip-path: inset(50%);
            white-space: nowrap;
        }

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
        @media screen and ${Ae(j)} {
            :host {
                --merch-card-collection-header-max-width: auto;
                --merch-card-collection-header-columns: 1fr fit-content(100%)
                    fit-content(100%);
                --merch-card-collection-header-areas: 'search filter sort'
                    'result result result';
            }
        }

        /* Laptop */
        @media screen and ${Ae(H)} {
            :host {
                --merch-card-collection-header-columns: 1fr fit-content(100%);
                --merch-card-collection-header-areas: 'result sort';
                --merch-card-collection-header-result-font-size: inherit;
            }
        }
    `);customElements.define("merch-card-collection-header",$);export{D as MerchCardCollection,$ as default};
