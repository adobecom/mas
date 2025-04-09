import MasEvent from './reactivity/mas-event.js';

const Events = {
    toast: new MasEvent(),
    fragmentAdded: new MasEvent(),
    filtersReset: new MasEvent(),
};

export default Events;
