"use strict";
import "@spectrum-web-components/split-button/sp-split-button.js";
import { html } from "@spectrum-web-components/base";
import { runSplitButtonTests } from "./index.js";
function wrapInDiv(storyArgument) {
  return html`
        <div>${storyArgument}</div>
    `;
}
const deprecatedMenu = () => html`
    <sp-menu>
        <sp-menu-item>Option 1</sp-menu-item>
        <sp-menu-item>Option Extended</sp-menu-item>
        <sp-menu-item>Short</sp-menu-item>
    </sp-menu>
`;
describe("Splitbutton", () => {
  runSplitButtonTests(wrapInDiv, deprecatedMenu);
});
//# sourceMappingURL=split-button.test.js.map
