export class Fragment {
    path = '';
    type = '';
    model = {
        id: '',
        path: '',
    };

    /**
     * @param {Object} props - common properties of a fragment as a search result
     * @param {string} props.path - cf path
     * @param {string} props.type - merch web component type (e.g: merch-card)
     * @param {Object} props.model - cf model
     * @param {string} props.model.id - cf model id
     * @param {string} props.model.path - cf model path
     */
    constructor(props) {
        Object.assign(this, props);
    }
}
