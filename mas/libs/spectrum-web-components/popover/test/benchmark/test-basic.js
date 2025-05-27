"use strict";
import "@spectrum-web-components/popover/sp-popover.js";
import { html } from "lit";
import { measureFixtureCreation } from "../../../../test/benchmark/helpers.js";
measureFixtureCreation(html`
    <sp-popover variant="dialog" direction="top" open>
        <div id="title">Popover Title</div>
        <div id="content">
            Cupcake ipsum dolor sit amet jelly beans. Chocolate jelly caramels.
            Icing soufflé chupa chups donut cheesecake. Jelly-o chocolate cake
            sweet roll cake danish candy biscuit halvah
        </div>
    </sp-popover>
`);
//# sourceMappingURL=test-basic.js.map
