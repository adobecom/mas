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

    get promotionStatus() {
        if (!this.startDateValue || !this.endDateValue) {
            return 'unknown';
        }

        const now = new Date();
        const startDate = new Date(this.startDateValue);
        const endDate = new Date(this.endDateValue);

        // Check if dates are valid
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return 'unknown';
        }

        // Active: current time is between startDate and endDate
        if (now >= startDate && now <= endDate) {
            return 'active';
        }

        // Expired: endDate is in the past
        if (now > endDate) {
            return 'expired';
        }

        // Scheduled: startDate and endDate are in the future
        return 'scheduled';
    }
}
