import { expect, fixture, html } from '@open-wc/testing';
import '../src/swc.js';
import { tableCellBaseStyles, tableColumnIconStyles } from '../src/common/styles/table-styles.css.js';

describe('Table icon cell sizing', () => {
    for (const modifier of ['chevron', 'checkbox']) {
        for (const width of [240, 640]) {
            it(`preserves ${modifier} content width in a ${width}px row`, async () => {
                const element = await fixture(html`
                    <div>
                        <style>
                            ${tableColumnIconStyles.cssText} ${tableCellBaseStyles.cssText} .icon-sizing-row {
                                width: 640px;
                            }
                            .icon-sizing-row.narrow {
                                width: 240px;
                            }
                            .icon-sizing-content {
                                display: block;
                                flex: 0 0 18px;
                                width: 18px;
                                height: 18px;
                            }
                        </style>
                        <sp-table-row class="item-table icon-sizing-row ${width === 240 ? 'narrow' : ''}">
                            <sp-table-cell class="table-icon-cell table-icon-cell--${modifier}">
                                <span class="icon-sizing-content"></span>
                            </sp-table-cell>
                            <sp-table-cell class="title">
                                ALongUnbrokenTitleThatMustWrapWithoutCollapsingTheIconColumn
                            </sp-table-cell>
                        </sp-table-row>
                    </div>
                `);
                const cell = element.querySelector('.table-icon-cell');
                const content = element.querySelector('.icon-sizing-content');
                const styles = getComputedStyle(cell);
                const contentWidth =
                    cell.getBoundingClientRect().width - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight);

                expect(contentWidth).to.be.at.least(content.getBoundingClientRect().width);
                const title = element.querySelector('.title');
                expect(getComputedStyle(title).minWidth).to.equal('0px');
                expect(title.getBoundingClientRect().right).to.be.at.most(
                    element.querySelector('sp-table-row').getBoundingClientRect().right + 1,
                );
            });
        }
    }
});
