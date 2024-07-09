import { makeAutoObservable } from 'mobx';
import { Fragment } from './Fragment.js';

export class Search {
    /** @type {string|undefined} Search query (the text the user entered) */
    query;

    /** @type {string|undefined} Path of the request (e.g., the URL on a website) */
    path;

    /** @type {string|undefined} Locale */
    locale;

    /** @type {string|undefined} Content Fragment variant, e.g: merch-card */
    variant;

    /** @type {string|undefined} Content Fragment Model ID */
    modelId;

    /** @type {boolean|undefined} Whether the Content Fragment is published */
    published;

    /**
     * @type {Array<Fragment>}
     */
    result = [];

    constructor() {
        makeAutoObservable(this);
    }

    /**
     *
     * @param {Array<Fragment>} result
     */
    setResult(result) {
        this.result = result;
    }

    update(props) {
        Object.assign(this, props);
    }
}
