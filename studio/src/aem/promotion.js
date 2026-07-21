import { FRAGMENT_STATUS } from '../constants.js';
import { Fragment } from './fragment.js';

export class Promotion extends Fragment {
    get isEvergreen() {
        return !this.getFieldValue('endDate');
    }

    get timeline() {
        const startDate = new Date(this.getFieldValue('startDate'));
        const startMonth = startDate.toLocaleString('en-US', { timeZone: 'UTC', month: 'short' });
        const startDay = String(startDate.getUTCDate()).padStart(2, '0');

        if (this.isEvergreen) {
            return `${startMonth} ${startDay} - Always on`;
        }

        const endDate = new Date(this.getFieldValue('endDate'));
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
        const startDateValue = this.getFieldValue('startDate');
        if (!startDateValue) return 'unknown';

        const now = new Date();
        const startDate = new Date(startDateValue);
        if (isNaN(startDate.getTime())) return 'unknown';

        if (!this.isEvergreen) {
            const endDate = new Date(this.getFieldValue('endDate'));
            if (isNaN(endDate.getTime())) return 'unknown';
            if (now > endDate) return 'expired';
        }

        if (this.status === FRAGMENT_STATUS.MODIFIED) return 'modified';
        if (!this.isPromotionPublished) return 'draft';
        if (now < startDate) return 'scheduled';
        return 'active';
    }

    get promotionListFilterKey() {
        const displayStatus = this.promotionStatus;
        if (displayStatus !== 'modified') {
            return displayStatus;
        }
        const startDate = new Date(this.getFieldValue('startDate'));
        const now = new Date();
        if (!isNaN(startDate.getTime()) && now < startDate) {
            return 'scheduled';
        }
        return 'active';
    }
}
