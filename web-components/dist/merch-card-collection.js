var Ne=Object.defineProperty;var se=s=>{throw TypeError(s)};var ve=(s,t,e)=>t in s?Ne(s,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):s[t]=e;var P=(s,t,e)=>ve(s,typeof t!="symbol"?t+"":t,e),W=(s,t,e)=>t.has(s)||se("Cannot "+e);var l=(s,t,e)=>(W(s,t,"read from private field"),e?e.call(s):t.get(s)),M=(s,t,e)=>t.has(s)?se("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(s):t.set(s,e),N=(s,t,e,r)=>(W(s,t,"write to private field"),r?r.call(s,e):t.set(s,e),e),j=(s,t,e)=>(W(s,t,"access private method"),e);import{html as L,LitElement as be,css as Re,unsafeCSS as Ce,nothing as S}from"./lit-all.min.js";var Oe="(max-width: 767px)";var X="(min-width: 768px)",U="(min-width: 1200px)",ie="(min-width: 1600px)";var et={matchMobile:window.matchMedia(Oe),matchDesktop:window.matchMedia(`${U} and (not ${ie})`),matchDesktopOrUp:window.matchMedia(U),matchLargeDesktop:window.matchMedia(ie),get isMobile(){return this.matchMobile.matches},get isDesktop(){return this.matchDesktop.matches},get isDesktopOrUp(){return this.matchDesktopOrUp.matches}};var V=class{constructor(t,e){this.key=Symbol("match-media-key"),this.matches=!1,this.host=t,this.host.addController(this),this.media=window.matchMedia(e),this.matches=this.media.matches,this.onChange=this.onChange.bind(this),t.addController(this)}hostConnected(){var t;(t=this.media)==null||t.addEventListener("change",this.onChange)}hostDisconnected(){var t;(t=this.media)==null||t.removeEventListener("change",this.onChange)}onChange(t){this.matches!==t.matches&&(this.matches=t.matches,this.host.requestUpdate(this.key,!this.matches))}};var oe="hashchange";function Z(s=window.location.hash){let t=[],e=s.replace(/^#/,"").split("&");for(let r of e){let[i,o=""]=r.split("=");i&&t.push([i,decodeURIComponent(o.replace(/\+/g," "))])}return Object.fromEntries(t)}function $(s){let t=new URLSearchParams(window.location.hash.slice(1));Object.entries(s).forEach(([i,o])=>{o?t.set(i,o):t.delete(i)}),t.sort();let e=t.toString();if(e===window.location.hash)return;let r=window.scrollY||document.documentElement.scrollTop;window.location.hash=e,window.scrollTo(0,r)}function Q(s){let t=()=>{if(window.location.hash&&!window.location.hash.includes("="))return;let e=Z(window.location.hash);s(e)};return t(),window.addEventListener(oe,t),()=>{window.removeEventListener(oe,t)}}var De='span[is="inline-price"][data-wcs-osi]',Ie='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var Pe='a[is="upt-link"]',it=`${De},${Ie},${Pe}`;var ne="merch-card-collection:sort",K="merch-card-collection:literals-changed",Y="merch-card-collection:sidenav-attached",ae="merch-card-collection:showmore",ce="merch-sidenav:select",le="aem:load",he="aem:error";var de="mas:error";var ot=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var nt=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});var R={alphabetical:"alphabetical",authored:"authored"};var He="mas-commerce-service";function ue(s,t){let e;return function(){let r=this,i=arguments;clearTimeout(e),e=setTimeout(()=>s.apply(r,i),t)}}function pe(){return document.visibilityState==="hidden"?Promise.resolve():globalThis.scheduler?.yield?globalThis.scheduler.yield():new Promise(s=>setTimeout(s,0))}var z=(s,t)=>s?.querySelector(`[slot="${t}"]`)?.textContent?.trim();var J=new Map,ke=0;function me(s,t){let e=++ke,r=t,i=performance.now(),o,c=()=>{ee(e),s()},T=()=>{i=performance.now(),o=setTimeout(c,r)},A=()=>{document.visibilityState==="hidden"?(clearTimeout(o),r-=performance.now()-i):T()};return J.set(e,()=>{clearTimeout(o),document.removeEventListener("visibilitychange",A)}),document.addEventListener("visibilitychange",A),document.visibilityState!=="hidden"&&T(),e}function ee(s){let t=J.get(s);t&&(t(),J.delete(s))}function fe(){return document.getElementsByTagName(He)?.[0]}function Ee(s){return s&&(s==="bizpro"&&(s="pro"),s==="pro"||s.startsWith("plans")?"plans":s)}var ge=s=>{let t=s.replace(/^mas:/,"").split("/");return t.length<2?[null,null]:[t[0],t[t.length-1]]},Te=(s,t)=>{let e=t?.tagLabels?.[s]||s;return e.startsWith("coll-tag-filter")?s.charAt(0).toUpperCase()+s.slice(1):e},_e=(s,t,e)=>{let r=new Map;for(let o of s){let[c,T]=ge(o);!c||!T||(r.has(c)||r.set(c,[]),r.get(c).push({name:T,label:Te(T,e)}))}let i=r.size===1;return[...r.entries()].map(([o,c])=>({title:i&&t?t:Te(o,e),label:o,deeplink:o,checkboxes:c}))},Ae=(s,t)=>(s??[]).map(ge).filter(([e,r])=>e&&r&&t.has(e)).map(([e,r])=>`${e}:${r}`),xe=(s,t,e)=>t.every(r=>{let i=(e[r.deeplink]||"").split(",").filter(Boolean);return i.length?i.some(o=>s.includes(`${r.deeplink}:${o}`)):!0}),Se=(s,t,e)=>(t?.[e]??[]).some(r=>s.includes(r));var Le="merch-card-collection",Ue=3e4,Ve=8,$e={catalog:["four-merch-cards"],plans:["four-merch-cards"],plansTwoColumns:["two-merch-cards"],plansThreeColumns:["three-merch-cards"],product:["four-merch-cards"],productTwoColumns:["two-merch-cards"],productThreeColumns:["three-merch-cards"],segment:["four-merch-cards"],segmentTwoColumns:["two-merch-cards"],segmentThreeColumns:["three-merch-cards"],"special-offers":["three-merch-cards"],image:["three-merch-cards"],"mini-compare-chart":["three-merch-cards"],"mini-compare-chartTwoColumns":["two-merch-cards"],"mini-compare-chart-mweb":["three-merch-cards"],"mini-compare-chart-mwebTwoColumns":["two-merch-cards"]},ze={plans:!0},Fe=["excludeTags","filter","limit","page","search","singleApp","sort","types"],Ge=(s,{filter:t})=>s.filter(e=>e?.filters&&e?.filters.hasOwnProperty(t)),Be=(s,{types:t})=>t?(t=t.split(","),s.filter(e=>t.some(r=>e.types.includes(r)))):s,Ke=(s,t)=>{let e=t.tagGroups;if(!e?.length)return s;let r=Z();return s.filter(i=>{let o=(i.getAttribute("filter-tags")||"").split(",").filter(Boolean);return xe(o,e,r)&&!Se(o,t.excludeTags,t.filter)})},Ye=s=>s.sort((t,e)=>(t.title??"").localeCompare(e.title??"","en",{sensitivity:"base"})),qe=(s,{filter:t})=>s.sort((e,r)=>r.filters[t]?.order==null||isNaN(r.filters[t]?.order)?-1:e.filters[t]?.order==null||isNaN(e.filters[t]?.order)?1:e.filters[t].order-r.filters[t].order),We=(s,{search:t})=>t?.length?(t=t.toLowerCase(),s.filter(e=>(e.title??"").toLowerCase().includes(t))):s,w,G,v,E,q,te,we,ye,H=class extends be{constructor(){super();M(this,E);M(this,w,{});M(this,G);M(this,v,!1);this.id=null,this.filter="all",this.hasMore=!1,this.resultCount=void 0,this.displayResult=!1,this.data=null,this.variant=null,this.hydrating=!1,this.hydrationReady=null,this.literalsHandlerAttached=!1,this.onUnmount=[],this.resizeHandlerDebounced=ue(this.resizeHandler.bind(this),300)}resizeHandler(){this.firstChild?.variantLayout?.resizeHandler?.()}render(){return L` <slot></slot>
            ${this.footer}`}checkReady(){if(!this.querySelector("aem-fragment"))return Promise.resolve(!0);let r,i=new Promise(c=>{r=me(()=>c(!1),Ue)}),o=Promise.race([this.hydrationReady,i]);return o.finally(()=>ee(r)),o}updated(e){if(!this.querySelector("merch-card"))return;let r=e.size===0||l(this,v)||Fe.some(o=>e.has(o));if(!r&&!e.has("sidenav"))return;if(r&&this.hydrating){N(this,v,!0);return}r&&N(this,v,!1);let i=[...this.children].filter(o=>o.tagName==="MERCH-CARD"&&!o.failed);i.length!==0&&(r&&j(this,E,we).call(this,i,e),this.updateComplete.then(()=>{this.dispatchLiteralsChanged(),this.sidenav&&!this.literalsHandlerAttached&&(this.sidenav.addEventListener(ce,()=>{this.dispatchLiteralsChanged()}),this.literalsHandlerAttached=!0)}))}dispatchLiteralsChanged(){this.dispatchEvent(new CustomEvent(K,{detail:{resultCount:this.resultCount,searchTerm:this.search,filter:this.sidenav?.filters?.selectedText}}))}buildOverrideMap(){N(this,w,{}),this.overrides?.split(",").forEach(e=>{let[r,i]=e?.split(":");r&&i&&(l(this,w)[r]=i)})}connectedCallback(){super.connectedCallback(),this.buildOverrideMap(),this.init(),window.addEventListener("resize",this.resizeHandlerDebounced)}async init(){await this.hydrate(),this.sidenav=this.parentElement.querySelector("merch-sidenav"),this.filtered?(this.filter=this.filtered,this.page=1):this.startDeeplink(),this.tagGroups?.length&&(this.stopFilterDeeplink=Q(()=>this.requestUpdate())),this.initializePlaceholders()}disconnectedCallback(){super.disconnectedCallback(),this.stopDeeplink?.(),this.stopFilterDeeplink?.();for(let e of this.onUnmount)e();window.removeEventListener("resize",this.resizeHandlerDebounced)}initializeHeader(){let e=document.createElement("merch-card-collection-header");e.collection=this,e.classList.add(this.variant),this.parentElement.insertBefore(e,this),this.header=e,this.querySelectorAll("[placeholder]").forEach(i=>{let o=i.getAttribute("slot");this.header.placeholderKeys.includes(o)&&this.header.append(i)})}initializePlaceholders(){let e=this.data?.placeholders||{};!e.searchText&&this.data?.sidenavSettings?.searchText&&(e.searchText=this.data.sidenavSettings.searchText);for(let r of Object.keys(e)){let i=e[r],o=i.includes("<p>")?"div":"p",c=document.createElement(o);c.setAttribute("slot",r),c.setAttribute("placeholder",""),c.innerHTML=i,this.append(c)}}attachSidenav(e,r=!0){if(!e)return;r&&this.parentElement.prepend(e),this.sidenav=e,this.sidenav.variant=this.variant,this.sidenav.classList.add(this.variant),ze[this.variant]&&this.sidenav.setAttribute("autoclose",""),this.initializeHeader(),this.dispatchEvent(new CustomEvent(Y));let i=l(this,E,te)?.getCollectionOptions(this.variant)?.onSidenavAttached;i&&i(this)}async hydrate(){if(this.hydrating)return!1;let e=this.querySelector("aem-fragment");if(!e)return;this.id=e.getAttribute("fragment");let r=e.getAttribute("mask"),i=e.getAttribute("pzn");this.hydrating=!0;let o;this.hydrationReady=new Promise(a=>{o=a});let c=this;function T(a){let h;return a.fields?.tagFilters?.length&&(h=_e(a.fields.tagFilters,a.fields.tagFiltersTitle,a.settings)),{searchText:a.fields?.searchText,tagFilters:h,linksTitle:a.fields?.linksTitle,link:a.fields?.link,linkText:a.fields?.linkText,linkIcon:a.fields?.linkIcon}}function A(a,h){let x={cards:[],hierarchy:[],placeholders:a.placeholders,sidenavSettings:T(a)};function n(g,O){for(let d of O){if(d.fieldName==="variations")continue;if(d.fieldName==="cards"){if(x.cards.findIndex(b=>b.id===d.identifier)!==-1)continue;if(!a.references[d.identifier]?.value){l(c,E,q)?.error(`Reference not found for card: ${d.identifier}`);continue}x.cards.push(a.references[d.identifier].value);continue}let C=a.references[d.identifier]?.value,u=d.referencesTree,p=h[d.identifier];if(p){let b=document.querySelector(`aem-fragment[fragment="${p}"]`)?.rawData;if(b?.fields)C=b,u=b.referencesTree,a.references={...a.references,...b.references};else{l(c,E,q)?.error(`Override fragment ${p} not found or invalid:`);continue}}if(!C?.fields)continue;let{fields:m}=C,D={label:m.label||"",icon:m.icon,iconLight:m.iconLight,queryLabel:m.queryLabel,cards:m.cards?m.cards.map(b=>h[b]||b):[],collections:[]};m.defaultchild&&(D.defaultchild=h[m.defaultchild]||m.defaultchild),g.push(D),n(D.collections,u)}}return n(x.hierarchy,a.referencesTree),x.hierarchy.length===0&&(c.filtered="all"),x}e.addEventListener(he,a=>{j(this,E,ye).call(this,"Error loading AEM fragment",a.detail),this.hydrating=!1,e.remove()}),e.addEventListener(le,async a=>{this.limit=27,this.data=A(a.detail,l(this,w)),this.tagGroups=this.data.sidenavSettings?.tagFilters??null,a.detail.variationId&&this.setAttribute("variation-id",a.detail.variationId);let{cards:h,hierarchy:x}=this.data,n=x.length===0&&a.detail.fields?.defaultchild?l(this,w)[a.detail.fields.defaultchild]||a.detail.fields.defaultchild:null,g=(C,u)=>{for(let p of C)if(p.defaultchild===u||p.collections&&g(p.collections,u))return!0;return!1},O="",d=Ee(h[0]?.fields?.variant);this.variant=d,d==="plans"&&(h.length===2||h.length===3)&&!h.some(C=>C.fields?.size?.includes("wide"))||(d==="segment"||d==="product")&&(h.length===2||h.length===3)?O=h.length===2?"TwoColumns":"ThreeColumns":(d==="mini-compare-chart"||d==="mini-compare-chart-mweb")&&h.length<=2&&(O=h.length===1?"":"TwoColumns"),d&&this.classList.add("merch-card-collection",d,...$e[`${d}${O}`]||[]);for(let[C,u]of h.entries()){let re=function(_){for(let y of _){let B=y.cards.indexOf(m);if(B===-1)continue;let Me=y.queryLabel??y?.label?.toLowerCase()??"";p.filters[Me]={order:B+1,size:u.fields.size},re(y.collections)}},p=document.createElement("merch-card"),m=l(this,w)[u.id]||u.id;p.setAttribute("consonant",""),p.setAttribute("style","");let D=u.fields.tags?.filter(_=>_.startsWith("mas:types/")).map(_=>_.split("/")[1]).join(",");if(D&&p.setAttribute("types",D),this.tagGroups){let _=new Set(this.tagGroups.map(B=>B.deeplink)),y=Ae(u.fields.tags,_);y.length&&p.setAttribute("filter-tags",y.join(","))}l(this,E,te)?.getFragmentMapping(u.fields.variant)?.supportsDefaultChild&&(n?m===n:g(x,m))&&p.setAttribute("data-default-card","true"),re(x);let I=document.createElement("aem-fragment");I.setAttribute("fragment",u.id),r&&I.setAttribute("mask",r),i&&I.setAttribute("pzn",i);for(let _ of["settings","placeholders","dictionary","priceLiterals"])u[_]={...a.detail[_],...u[_]};r||i?e.cache.set(I.cacheKey(),u):e.cache.add(u),I.setAttribute("fragment",m),p.append(I),Object.keys(p.filters).length===0&&(p.filters={all:{order:h.indexOf(u)+1,size:u.fields.size}}),this.append(p),(C+1)%Ve===0&&C+1<h.length&&await pe()}this.displayResult=!0,this.hydrating=!1,l(this,v)&&this.requestUpdate(),e.remove(),o(!0)}),await this.hydrationReady}get footer(){if(!this.filtered)return L`<div id="footer">
            <sp-theme color="light" scale="medium">
                ${this.showMoreButton}
            </sp-theme>
        </div>`}get showMoreButton(){if(this.hasMore)return this.classList.contains("product-pricing")?L`<button
                type="button"
                class="show-more"
                @click="${this.showMore}"
            >
                <slot name="showMoreText"></slot>
            </button>`:L`<sp-button
            variant="secondary"
            treatment="outline"
            style="order: 1000;"
            @click="${this.showMore}"
        >
            <slot name="showMoreText"></slot>
        </sp-button>`}sortChanged(e){e.target.value===R.authored?$({sort:void 0}):$({sort:e.target.value}),this.dispatchEvent(new CustomEvent(ne,{bubbles:!0,composed:!0,detail:{value:e.target.value}}))}async showMore(){this.dispatchEvent(new CustomEvent(ae,{bubbles:!0,composed:!0}));let e=this.page+1;$({page:e}),this.page=e,await this.updateComplete}startDeeplink(){this.stopDeeplink=Q(({category:e,filter:r,types:i,sort:o,search:c,single_app:T,page:A})=>{r=r||e,!this.filtered&&r&&r!==this.filter&&setTimeout(()=>{$({page:void 0}),this.page=1},1),this.filtered||(this.filter=r??this.filter),this.types=i??"",this.search=c??"",this.singleApp=T,this.sort=o,this.page=Number(A)||1})}openFilters(e){this.sidenav?.showModal(e)}};w=new WeakMap,G=new WeakMap,v=new WeakMap,E=new WeakSet,q=function(){return l(this,G)??N(this,G,fe()?.Log?.module(Le)),l(this,G)},te=function(){return customElements.get("merch-card")},we=function(e,r){r.has("singleApp")&&this.singleApp&&e.forEach(n=>{n.updateFilters(n.name===this.singleApp)});let i=this.sort===R.alphabetical?Ye:qe,c=[Ge,Be,Ke,We,i].reduce((n,g)=>g(n,this),e).map((n,g)=>[n,g]);if(this.resultCount=c.length,this.page&&this.limit){let n=this.page*this.limit;this.hasMore=c.length>n,c=c.filter(([,g])=>g<n)}let T=c.map(([n])=>n),A=new Map(c.reverse()),a=T.some((n,g)=>this.children[g]!==n),h=e.some(n=>A.has(n)?n.style.display!=="":n.style.display!=="none"||n.size!==void 0);if(!a&&!h){for(let n of A.keys())n.size=n.filters[this.filter]?.size;return}let x=window.scrollY||document.documentElement.scrollTop;if(a)for(let n of A.keys())this.prepend(n);e.forEach(n=>{A.has(n)?(n.size=n.filters[this.filter]?.size,n.style.removeProperty("display"),n.requestUpdate()):(n.style.display="none",n.size=void 0)}),window.scrollTo(0,x)},ye=function(e,r={},i=!0){l(this,E,q)?.error(`merch-card-collection: ${e}`,r),this.failed=!0,i&&this.dispatchEvent(new CustomEvent(de,{detail:{...r,message:e},bubbles:!0,composed:!0}))},P(H,"properties",{id:{type:String,attribute:"id",reflect:!0},displayResult:{type:Boolean,attribute:"display-result"},excludeTags:{type:Object,attribute:!1},filter:{type:String,attribute:"filter",reflect:!0},filtered:{type:String,attribute:"filtered",reflect:!0},hasMore:{type:Boolean},limit:{type:Number,attribute:"limit"},overrides:{type:String},page:{type:Number,attribute:"page",reflect:!0},resultCount:{type:Number},search:{type:String,attribute:"search",reflect:!0},sidenav:{type:Object},singleApp:{type:String,attribute:"single-app",reflect:!0},sort:{type:String,attribute:"sort",default:R.authored,reflect:!0},types:{type:String,attribute:"types",reflect:!0}}),P(H,"styles",Re`
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
    `);H.SortOrder=R;customElements.define(Le,H);var je={filters:["noResultText","resultText","resultsText"],filtersMobile:["noResultText","resultMobileText","resultsMobileText"],search:["noSearchResultsText","searchResultText","searchResultsText"],searchMobile:["noSearchResultsMobileText","searchResultMobileText","searchResultsMobileText"]},Xe=(s,t,e)=>{s.querySelectorAll(`[data-placeholder="${t}"]`).forEach(i=>{i.innerText=e||""})},Ze={search:["mobile","tablet"],filter:["mobile","tablet"],sort:!0,result:!0,custom:!1},Qe={catalog:"l"},f,k,F=class extends be{constructor(){super();M(this,f);M(this,k);P(this,"tablet",new V(this,X));P(this,"desktop",new V(this,U));this.collection=null,N(this,f,{search:!1,filter:!1,sort:!1,result:!1,custom:!1}),this.updateLiterals=this.updateLiterals.bind(this),this.handleSidenavAttached=this.handleSidenavAttached.bind(this)}connectedCallback(){super.connectedCallback(),this.collection?.addEventListener(K,this.updateLiterals),this.collection?.addEventListener(Y,this.handleSidenavAttached),N(this,k,customElements.get("merch-card"))}disconnectedCallback(){super.disconnectedCallback(),this.collection?.removeEventListener(K,this.updateLiterals),this.collection?.removeEventListener(Y,this.handleSidenavAttached)}willUpdate(){l(this,f).search=this.getVisibility("search"),l(this,f).filter=this.getVisibility("filter"),l(this,f).sort=this.getVisibility("sort"),l(this,f).result=this.getVisibility("result"),l(this,f).custom=this.getVisibility("custom")}parseVisibilityOptions(e,r){if(!e||!Object.hasOwn(e,r))return null;let i=e[r];return i===!1?!1:i===!0?!0:i.includes(this.currentMedia)}getVisibility(e){let r=l(this,k)?.getCollectionOptions(this.collection?.variant)?.headerVisibility,i=this.parseVisibilityOptions(r,e);return i!==null?i:this.parseVisibilityOptions(Ze,e)}get sidenav(){return this.collection?.sidenav}get search(){return this.collection?.search}get resultCount(){return this.collection?.resultCount}get variant(){return this.collection?.variant}get isMobile(){return!this.isTablet&&!this.isDesktop}get isTablet(){return this.tablet.matches&&!this.desktop.matches}get isDesktop(){return this.desktop.matches}get currentMedia(){return this.isDesktop?"desktop":this.isTablet?"tablet":"mobile"}get searchAction(){if(!l(this,f).search)return S;let e=z(this,"searchText");return e?L`
            <merch-search deeplink="search" id="search">
                <sp-search
                    id="search-bar"
                    placeholder="${e}"
                    .size=${Qe[this.variant]}
                    aria-label="${e}"
                ></sp-search>
            </merch-search>
        `:S}get filterAction(){return l(this,f).filter?this.sidenav?L`
            <sp-action-button
                id="filter"
                variant="secondary"
                treatment="outline"
                @click="${this.openFilters}"
                ><slot name="filtersText"></slot
            ></sp-action-button>
        `:S:S}get sortAction(){if(!l(this,f).sort)return S;let e=z(this,"sortText");if(!e)return;let r=z(this,"popularityText"),i=z(this,"alphabeticallyText");if(!(r&&i))return;let o=this.collection?.sort===R.alphabetical;return L`
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
        `}get resultSlotName(){let e=`${this.search?"search":"filters"}${this.isMobile||this.isTablet?"Mobile":""}`;return je[e][Math.min(this.resultCount,2)]}get resultLabel(){if(!l(this,f).result)return S;if(!this.sidenav)return S;let e=this.search?"search":"filter",r=this.resultCount?this.resultCount===1?"single":"multiple":"none";return L` <div
            id="result"
            aria-live="polite"
            type=${e}
            quantity=${r}
        >
            <slot name="${this.resultSlotName}"></slot>
        </div>`}get customArea(){if(!l(this,f).custom)return S;let e=l(this,k)?.getCollectionOptions(this.collection?.variant)?.customHeaderArea;if(!e)return S;let r=e(this.collection);return!r||r===S?S:L`<div id="custom" role="heading" aria-level="2">
            ${r}
        </div>`}openFilters(e){this.sidenav.showModal(e)}updateLiterals(e){Object.keys(e.detail).forEach(r=>{Xe(this,r,e.detail[r])}),this.requestUpdate()}handleSidenavAttached(){this.requestUpdate()}render(){return L`
            <sp-theme color="light" scale="medium">
                <div id="header">
                    ${this.searchAction}${this.filterAction}${this.sortAction}${this.resultLabel}${this.customArea}
                </div>
            </sp-theme>
        `}get placeholderKeys(){return["searchText","filtersText","sortText","popularityText","alphabeticallyText","noResultText","resultText","resultsText","resultMobileText","resultsMobileText","noSearchResultsText","searchResultText","searchResultsText","noSearchResultsMobileText","searchResultMobileText","searchResultsMobileText"]}};f=new WeakMap,k=new WeakMap,P(F,"styles",Re`
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
        @media screen and ${Ce(X)} {
            :host {
                --merch-card-collection-header-max-width: auto;
                --merch-card-collection-header-columns: 1fr fit-content(100%)
                    fit-content(100%);
                --merch-card-collection-header-areas: 'search filter sort'
                    'result result result';
            }
        }

        /* Laptop */
        @media screen and ${Ce(U)} {
            :host {
                --merch-card-collection-header-columns: 1fr fit-content(100%);
                --merch-card-collection-header-areas: 'result sort';
                --merch-card-collection-header-result-font-size: inherit;
            }
        }
    `);customElements.define("merch-card-collection-header",F);export{H as MerchCardCollection,F as default};
