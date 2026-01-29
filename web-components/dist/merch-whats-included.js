var n=Object.defineProperty;var r=(t,e,s)=>e in t?n(t,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[e]=s;var o=(t,e,s)=>r(t,typeof e!="symbol"?e+"":e,s);import{html as l,css as h,LitElement as a}from"./lit-all.min.js";var i=class extends a{updated(){this.hideSeeMoreEls()}hideSeeMoreEls(){this.isMobile&&this.rows.forEach((e,s)=>{s>=5&&(e.style.display=this.showAll?"flex":"none")})}constructor(){super(),this.showAll=!1,this.mobileRows=this.mobileRows===void 0?5:this.mobileRows}toggle(){this.showAll=!this.showAll,this.dispatchEvent(new CustomEvent("hide-see-more-elements",{bubbles:!0,composed:!0})),this.requestUpdate()}render(){return l`<slot name="heading"></slot>
            <slot name="contentBullets"></slot>
            <slot name="content"></slot>
            ${this.isMobile&&this.rows.length>this.mobileRows?l`<div @click=${this.toggle} class="see-more">
                      ${this.showAll?"- See less":"+ See more"}
                  </div>`:l``}`}get isMobile(){return window.matchMedia("(max-width: 767px)").matches}get rows(){return this.querySelectorAll("merch-mnemonic-list")}};o(i,"styles",h`
        :host {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            overflow: hidden;
            box-sizing: border-box;
            row-gap: 10px;
        }

        :host([has-bullets]) {
            flex-direction: column;
            align-items: start;
        }

        ::slotted([slot='heading']) {
            font-size: 14px;
            font-weight: 700;
            margin-right: 16px;
        }

        ::slotted([slot='content']) {
            display: contents;
        }

        ::slotted([slot='contentBullets']) {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin: 5px 0;
        }

        .hidden {
            display: none;
        }

        .see-more {
            font-size: 14px;
            text-decoration: underline;
            color: var(--link-color-dark);
        }
    `),o(i,"properties",{heading:{type:String,attribute:!0},mobileRows:{type:Number,attribute:!0}});customElements.define("merch-whats-included",i);export{i as MerchWhatsIncluded};
