import MasEvent from './reactivity/mas-event.js';

const Events = {
    toast: new MasEvent(),
    fragmentAdded: new MasEvent(),
    placeholderAdded: new MasEvent(),
    placeholderUpdated: new MasEvent(),
    placeholderDeleted: new MasEvent(),
    placeholderPublished: new MasEvent(),
};

export default Events;
