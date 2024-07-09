import { makeObservable, observable } from 'mobx';
import { Search } from './Search.js';

import { AEM } from '@adobe/mas-commons';
import { Fragment } from './Fragment.js';

let merchDataSourceCache;

export class Store {
    /**
     * @type {Search}
     */
    search = new Search();
    /**
     * @type {import('@adobe/mas-commons').AEM}
     */
    aem;

    /**
     * @param {string} bucket
     */
    constructor(bucket) {
        if (!bucket) throw new Error('bucket is required'); // TODO provide better error message.
        makeObservable(this, {
            search: observable,
        });
        this.aem = new AEM(bucket);
        ({ cache: merchDataSourceCache } =
            document.createElement('merch-datasource'));
    }

    async doSearch(props) {
        this.search.update(props);
        const fragments = await this.aem.sites.cf.fragments
            .search(this.search)
            .then((items) => {
                merchDataSourceCache?.add(...items);
                return items.map((item) => new Fragment(item));
            });
        this.search.setResult(fragments);
    }
}
