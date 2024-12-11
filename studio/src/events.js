import MasEvent from './reactivity/masEvent.js';

const Events = {
    foldersLoaded: new MasEvent(),
    showToast: new MasEvent(),
    fragmentAdded: new MasEvent(),
};

export default Events;
