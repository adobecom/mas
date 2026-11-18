var p=Object.defineProperty;var c=(e,t,o)=>t in e?p(e,t,{enumerable:!0,configurable:!0,writable:!0,value:o}):e[t]=o;var l=(e,t,o)=>c(e,typeof t!="symbol"?t+"":t,o);import{LitElement as d,html as a,unsafeCSS as b}from"./lit-all.min.js";var r='#label{align-items:center;cursor:pointer;display:inline-flex;gap:var(--consonant-merch-spacing-xxxs);white-space:nowrap;font-size:12px;line-height:15px}#label.icon::before{background-position:center;background-size:contain;background:var(--secure-icon) no-repeat;content:"";display:inline-block;height:1em;width:1em}';var g="merch-secure-transaction",i=class extends d{constructor(){super(),this.labelText="",this.showIcon=!0,this.tooltipText=""}render(){let{labelText:t,showIcon:o,tooltipText:n}=this,s=a`
            <div class="${o?"icon":""}" id="label" slot="trigger">
                ${t}
            </div>
        `;return n?a`
            <overlay-trigger placement="top-start" offset="4">
                ${s}
                <sp-tooltip id="tooltip" slot="hover-content" delayed
                    >${n}</sp-tooltip
                >
            </overlay-trigger>
        `:s}};l(i,"properties",{labelText:{attribute:"label",type:String},showIcon:{attribute:"icon",type:Boolean},tooltipText:{attribute:"tooltip",type:String}}),l(i,"styles",[b(r)]);window.customElements.define(g,i);export{i as default};
