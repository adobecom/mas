import MasEvent from './reactivity/mas-event.js';

const Events = {
    toast: new MasEvent(),
    fragmentAdded: new MasEvent(),
    changesDiscarded: new MasEvent(),
};

export default Events;
