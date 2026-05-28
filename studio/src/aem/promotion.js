import { FRAGMENT_STATUS } from '../constants.js';
import { Fragment } from './fragment.js';

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
        return this.status === FRAGMENT_STATUS.PUBLISHED || this.status === FRAGMENT_STATUS.MODIFIED;
    }

    get isPromotionModified() {
        return this.status === FRAGMENT_STATUS.MODIFIED;
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

        if (this.status === FRAGMENT_STATUS.MODIFIED) {
            return 'modified';
        }

        if (!this.isPromotionPublished) {
            return 'draft';
        }

        if (now < startDate) {
            return 'scheduled';
        }

        return 'active';
    }

    get promotionListFilterKey() {
        const displayStatus = this.promotionStatus;
        if (displayStatus !== 'modified') {
            return displayStatus;
        }
        const startDate = new Date(this.startDateValue);
        const now = new Date();
        if (!isNaN(startDate.getTime()) && now < startDate) {
            return 'scheduled';
        }
        return 'active';
    }
}
