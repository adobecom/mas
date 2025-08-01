import{html as r,LitElement as A}from"lit";import{css as u}from"lit";var c=u`
    :host {
        box-sizing: border-box;
        --background-color: var(--qs-background-color, #f6f6f6);
        --text-color: #000;
        --radius: 5px;
        --border-color: var(--qs-border-color, #e8e8e8);
        --border-width: var(--qs-border-width, 1px);
        --label-font-size: var(--qs-label-font-size, 12px);
        --font-size: var(--qs-font-size, 12px);
        --label-color: var(--qs-lable-color, #000);
        --input-height: var(--qs-input-height, 30px);
        --input-width: var(--qs-input-width, 72px);
        --button-width: var(--qs-button-width, 30px);
        --font-size: var(--qs-font-size, 12px);
        --picker-fill-icon: var(
            --chevron-down-icon,
            url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="10" height="6" aria-hidden="true" viewBox="0 0 10 6"><path fill="%23787878" d="M9.99 1.01A1 1 0 0 0 8.283.3L5 3.586 1.717.3A1 1 0 1 0 .3 1.717L4.293 5.7a1 1 0 0 0 1.414 0L9.7 1.717a1 1 0 0 0 .29-.707z"/></svg>')
        );
        --qs-transition: var(--transition);

        display: block;
        position: relative;
        color: var(--text-color);
        line-height: var(--qs-line-height, 2);
    }

    .text-field {
        display: flex;
        align-items: center;
        width: var(--input-width);
        position: relative;
        margin-top: 6px;
    }

    .text-field-input {
        font-family: inherit;
        padding: 0;
        font-size: var(--font-size);
        height: var(--input-height);
        width: calc(var(--input-width) - var(--button-width));
        border: var(--border-width) solid var(--border-color);
        border-top-left-radius: var(--radius);
        border-bottom-left-radius: var(--radius);
        border-right: none;
        padding-inline-start: 12px;
        box-sizing: border-box;
        -moz-appearance: textfield;
    }

    .text-field-input::-webkit-inner-spin-button,
    .text-field-input::-webkit-outer-spin-button {
        margin: 0;
        -webkit-appearance: none;
    }

    .label {
        font-size: var(--label-font-size);
        color: var(--label-color);
    }

    .picker-button {
        width: var(--button-width);
        height: var(--input-height);
        position: absolute;
        inset-inline-end: 0;
        border: var(--border-width) solid var(--border-color);
        border-top-right-radius: var(--radius);
        border-bottom-right-radius: var(--radius);
        background-color: var(--background-color);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
    }

    .picker-button-fill {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-image: var(--picker-fill-icon);
        background-position: center;
        background-repeat: no-repeat;
    }

    .popover {
        position: absolute;
        top: var(--input-height);
        left: 0;
        width: var(--input-width);
        border-radius: var(--radius);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        z-index: 100;
        margin-top: var(--popover-margin-top, 6px);
        transition: var(--qs-transition);
        opacity: 0;
        box-sizing: border-box;
    }

    .popover.open {
        opacity: 1;
        background: #ffffff;
        border: var(--border-width) solid var(--border-color);
    }

    .popover.closed {
        max-height: 0;
        opacity: 0;
    }

    ::slotted(p) {
        margin: 0;
    }

    .item {
        display: flex;
        align-items: center;
        color: var(--text-color);
        font-size: var(--font-size);
        padding-inline-start: 12px;
        box-sizing: border-box;
    }

    .item.highlighted {
        background-color: var(--background-color);
    }
`;var R=Object.freeze({MONTH:"MONTH",YEAR:"YEAR",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",PERPETUAL:"PERPETUAL",TERM_LICENSE:"TERM_LICENSE",ACCESS_PASS:"ACCESS_PASS",THREE_MONTHS:"THREE_MONTHS",SIX_MONTHS:"SIX_MONTHS"}),f=Object.freeze({ANNUAL:"ANNUAL",MONTHLY:"MONTHLY",TWO_YEARS:"TWO_YEARS",THREE_YEARS:"THREE_YEARS",P1D:"P1D",P1Y:"P1Y",P3Y:"P3Y",P10Y:"P10Y",P15Y:"P15Y",P3D:"P3D",P7D:"P7D",P30D:"P30D",HALF_YEARLY:"HALF_YEARLY",QUARTERLY:"QUARTERLY"});var m='span[is="inline-price"][data-wcs-osi]',_='a[is="checkout-link"][data-wcs-osi],button[is="checkout-button"][data-wcs-osi]';var b=`${m},${_}`;var d="merch-quantity-selector:change",i="merch-card-quantity:change";var g=Object.freeze({SEGMENTATION:"segmentation",BUNDLE:"bundle",COMMITMENT:"commitment",RECOMMENDATION:"recommendation",EMAIL:"email",PAYMENT:"payment",CHANGE_PLAN_TEAM_PLANS:"change-plan/team-upgrade/plans",CHANGE_PLAN_TEAM_PAYMENT:"change-plan/team-upgrade/payment"});var v=Object.freeze({STAGE:"STAGE",PRODUCTION:"PRODUCTION",LOCAL:"LOCAL"});function n(a,e){let t;return function(){let o=this,E=arguments;clearTimeout(t),t=setTimeout(()=>a.apply(o,E),e)}}var[M,L,l,h,p,w]=["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Enter","Tab"];var s=class extends A{static get properties(){return{closed:{type:Boolean,reflect:!0},selected:{type:Number},min:{type:Number},max:{type:Number},step:{type:Number},maxInput:{type:Number,attribute:"max-input"},options:{type:Array},highlightedIndex:{type:Number},defaultValue:{type:Number,attribute:"default-value",reflect:!0},title:{type:String}}}static get styles(){return c}constructor(){super(),this.options=[],this.title="",this.closed=!0,this.min=0,this.max=0,this.step=0,this.maxInput=void 0,this.defaultValue=void 0,this.selectedValue=0,this.highlightedIndex=0,this.toggleMenu=this.toggleMenu.bind(this),this.handleClickOutside=this.handleClickOutside.bind(this),this.boundKeydownListener=this.handleKeydown.bind(this),this.handleKeyupDebounced=n(this.handleKeyup.bind(this),500),this.debouncedQuantityUpdate=n(this.handleQuantityUpdate.bind(this),500)}connectedCallback(){super.connectedCallback(),this.addEventListener("keydown",this.boundKeydownListener),window.addEventListener("mousedown",this.handleClickOutside),this.addEventListener(i,this.debouncedQuantityUpdate)}handleKeyup(){this.handleInput(),this.sendEvent()}handleKeydown(e){switch(e.key){case h:this.closed||(e.preventDefault(),this.highlightedIndex=(this.highlightedIndex+1)%this.options.length);break;case l:this.closed||(e.preventDefault(),this.highlightedIndex=(this.highlightedIndex-1+this.options.length)%this.options.length);break;case p:if(this.closed)this.closePopover(),this.blur();else{let t=this.options[this.highlightedIndex];if(!t)break;this.selectedValue=t,this.handleMenuOption(this.selectedValue),this.toggleMenu()}break}e.composedPath().includes(this)&&e.stopPropagation()}adjustInput(e,t){this.selectedValue=t,e.value=t,this.highlightedIndex=this.options.indexOf(t)}handleInput(){let e=this.shadowRoot.querySelector(".text-field-input"),t=parseInt(e.value);if(!isNaN(t))if(t>0&&t!==this.selectedValue){let o=t;this.maxInput&&t>this.maxInput&&(o=this.maxInput),this.min&&o<this.min&&(o=this.min),this.adjustInput(e,o)}else this.adjustInput(e,this.min||1)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("mousedown",this.handleClickOutside),this.removeEventListener("keydown",this.boundKeydownListener),this.removeEventListener(i,this.debouncedQuantityUpdate)}generateOptionsArray(){let e=[];if(this.step>0)for(let t=this.min;t<=this.max;t+=this.step)e.push(t);return e}update(e){(e.has("min")||e.has("max")||e.has("step")||e.has("defaultValue"))&&(this.options=this.generateOptionsArray(),this.highlightedIndex=this.defaultValue?this.options.indexOf(this.defaultValue):0,this.handleMenuOption(this.defaultValue?this.defaultValue:this.options[0])),super.update(e)}handleClickOutside(e){e.composedPath().includes(this)||this.closePopover()}toggleMenu(){this.closed=!this.closed}handleMouseEnter(e){this.highlightedIndex=e}handleMenuOption(e){e===this.max&&this.shadowRoot.querySelector(".text-field-input")?.focus(),this.selectedValue=e,this.sendEvent(),this.closePopover()}sendEvent(){let e=new CustomEvent(d,{detail:{option:this.selectedValue},bubbles:!0});this.dispatchEvent(e)}closePopover(){this.closed||this.toggleMenu()}get offerSelect(){return this.querySelector("merch-offer-select")}get popover(){return r` <div class="popover ${this.closed?"closed":"open"}">
            ${this.options.map((e,t)=>r`
                    <div
                        class="item ${t===this.highlightedIndex?"highlighted":""}"
                        @click="${()=>this.handleMenuOption(e)}"
                        @mouseenter="${()=>this.handleMouseEnter(t)}"
                    >
                        ${e===this.max?`${e}+`:e}
                    </div>
                `)}
        </div>`}handleQuantityUpdate({detail:{quantity:e}}){if(e&&e!==this.selectedValue){this.selectedValue=e;let t=this.shadowRoot.querySelector(".text-field-input");t&&(t.value=e),this.sendEvent()}}render(){return r`
            <div class="label">${this.title}</div>
            <div class="text-field">
                <input
                    class="text-field-input"
                    @focus="${this.closePopover}"
                    .value="${this.selectedValue}"
                    type="number"
                    @keydown="${this.handleKeydown}"
                    @keyup="${this.handleKeyupDebounced}"
                />
                <button class="picker-button" @click="${this.toggleMenu}">
                    <div
                        class="picker-button-fill ${this.closed?"open":"closed"}"
                    ></div>
                </button>
                ${this.popover}
            </div>
        `}};customElements.define("merch-quantity-select",s);export{s as MerchQuantitySelect};
