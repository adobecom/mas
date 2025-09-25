import MasEvent from './reactivity/mas-event.js';

const Events = {
    toast: new MasEvent(),
    fragmentAdded: new MasEvent(),
    fragmentDeleted: new MasEvent(),
    filtersReset: new MasEvent(),
    scrolledToBottom: new MasEvent(),
};

export default Events;
