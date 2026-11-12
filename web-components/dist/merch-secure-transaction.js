import{LitElement as r,html as n,unsafeCSS as a}from"./lit-all.min.js";var i='#label{cursor:pointer;align-items:center;gap:var(--consonant-merch-spacing-xxxs);white-space:nowrap;font-size:12px;line-height:15px;display:inline-flex}#label.icon:before{background-position:50%;background-size:contain;background:var(--secure-icon) no-repeat;content:"";width:1em;height:1em;display:inline-block}';var c="merch-secure-transaction",t=class extends r{static properties={labelText:{attribute:"label",type:String},showIcon:{attribute:"icon",type:Boolean},tooltipText:{attribute:"tooltip",type:String}};static styles=[a(i)];constructor(){super(),this.labelText="",this.showIcon=!0,this.tooltipText=""}render(){let{labelText:s,showIcon:l,tooltipText:e}=this,o=n`
            <div class="${l?"icon":""}" id="label" slot="trigger">
                ${s}
            </div>
        `;return e?n`
            <overlay-trigger placement="top-start" offset="4">
                ${o}
                <sp-tooltip id="tooltip" slot="hover-content" delayed
                    >${e}</sp-tooltip
                >
            </overlay-trigger>
        `:o}};window.customElements.define(c,t);export{t as default};
