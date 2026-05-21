import { FRAGMENT_STATUS, STATUS_PUBLISHED, TAG_STATUS_PUBLISHED } from '../constants.js';
import { Fragment } from './fragment.js';
import { normalizeTagId } from './tag-id-utils.js';

export class Promotion extends Fragment {
    constructor(fragmentData) {
        super(fragmentData);
        this.startDateValue = this.getFieldValue('startDate');
        this.endDateValue = this.getFieldValue('endDate');
    }

    get timeline() {
        const startDate = new Date(this.startDateValue);
        const endDate = new Date(this.endDateValue);

        const startMonth = startDate.toLocaleString('en-US', { timeZone: 'UTC', month: 'short' });
        const startDay = String(startDate.getUTCDate()).padStart(2, '0');

        const endMonth = endDate.toLocaleString('en-US', { timeZone: 'UTC', month: 'short' });
        const endDay = String(endDate.getUTCDate()).padStart(2, '0');
        const endYear = endDate.getUTCFullYear();

        return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${endYear}`;
    }

    get createdBy() {
        return this.created?.fullName || 'Unknown';
    }

    get isPromotionPublished() {
        const tagsPublished = this.getFieldValues('tags').some((t) => normalizeTagId(t) === TAG_STATUS_PUBLISHED);
        const statusUpper = typeof this.status === 'string' ? this.status.toUpperCase() : '';
        const statusPublished = statusUpper === STATUS_PUBLISHED || statusUpper === FRAGMENT_STATUS.MODIFIED;
        return tagsPublished || statusPublished;
    }

    get promotionStatus() {
        if (!this.startDateValue || !this.endDateValue) {
            return 'unknown';
        }

        const now = new Date();
        const startDate = new Date(this.startDateValue);
        const endDate = new Date(this.endDateValue);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return 'unknown';
        }

        if (now > endDate) {
            return 'expired';
        }

        if (!this.isPromotionPublished) {
            return 'draft';
        }

        if (now < startDate) {
            return 'scheduled';
        }

        return 'active';
    }
}
