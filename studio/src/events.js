import MasEvent from './reactivity/masEvent.js';

const Events = {
    showToast: new MasEvent(),
    fragmentAdded: new MasEvent(),
};

export default Events;
