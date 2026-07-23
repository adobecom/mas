import { expect } from '@esm-bundle/chai';
import { Promotion } from '../../src/aem/promotion.js';

describe('Promotion', () => {
    let mockFragmentData;

    beforeEach(() => {
        // Mock fragment data structure
        mockFragmentData = {
            id: 'promo-123',
            etag: 'etag-123',
            model: { id: 'promotion-model' },
            path: '/content/dam/mas/promotions/test-promotion',
            title: 'Test Promotion',
            description: 'A test promotion',
            status: 'DRAFT',
            created: {
                by: 'test-user',
                fullName: 'Test User',
                at: '2024-01-01T00:00:00.000Z',
            },
            modified: {
                by: 'test-user',
                fullName: 'Test User',
                at: '2024-01-02T00:00:00.000Z',
            },
            fields: [
                { name: 'title', type: 'text', values: ['Test Promotion'] },
                { name: 'promoCode', type: 'text', values: ['SAVE20'] },
                { name: 'startDate', type: 'date-time', values: ['2024-01-01T00:00:00.000Z'] },
                { name: 'endDate', type: 'date-time', values: ['2024-12-31T23:59:59.999Z'] },
                { name: 'tags', type: 'tag', values: [] },
                { name: 'surfaces', type: 'text', values: [] },
            ],
            tags: [],
        };
    });

    describe('timeline getter', () => {
        it('should format timeline correctly', () => {
            const promotion = new Promotion(mockFragmentData);
            const timeline = promotion.timeline;

            // Example: "Jan 01 - Dec 31, 2024"
            // Verify the format is correct with month abbreviations, days, and year
            expect(timeline).to.match(/^[A-Z][a-z]{2} \d{2} - [A-Z][a-z]{2} \d{2}, \d{4}$/);
            expect(timeline).to.equal('Jan 01 - Dec 31, 2024');
        });

        it('should handle different date ranges', () => {
            mockFragmentData.fields[2].values = ['2024-03-15T10:00:00.000Z'];
            mockFragmentData.fields[3].values = ['2024-06-20T18:00:00.000Z'];

            const promotion = new Promotion(mockFragmentData);
            const timeline = promotion.timeline;

            expect(timeline).to.include('Mar');
            expect(timeline).to.include('Jun');
            expect(timeline).to.include('15');
            expect(timeline).to.include('20');
            expect(timeline).to.include('2024');
        });

        it('should pad single-digit days with zeros', () => {
            mockFragmentData.fields[2].values = ['2024-01-05T10:00:00.000Z'];
            mockFragmentData.fields[3].values = ['2024-02-09T18:00:00.000Z'];

            const promotion = new Promotion(mockFragmentData);
            const timeline = promotion.timeline;

            expect(timeline).to.include('05');
            expect(timeline).to.include('09');
        });
    });

    describe('createdBy getter', () => {
        it('should return the full name of the creator', () => {
            const promotion = new Promotion(mockFragmentData);

            expect(promotion.createdBy).to.equal('Test User');
        });

        it('should return "Unknown" when created data is missing', () => {
            const dataWithoutCreated = { ...mockFragmentData };
            delete dataWithoutCreated.created;

            const promotion = new Promotion(dataWithoutCreated);

            expect(promotion.createdBy).to.equal('Unknown');
        });

        it('should return "Unknown" when fullName is missing', () => {
            const dataWithoutFullName = {
                ...mockFragmentData,
                created: { by: 'test-user' },
            };

            const promotion = new Promotion(dataWithoutFullName);

            expect(promotion.createdBy).to.equal('Unknown');
        });
    });

    describe('promotionStatus getter', () => {
        let now;

        beforeEach(() => {
            now = new Date();
            mockFragmentData.status = 'DRAFT';
        });

        it('returns modified when published with unpublished AEM changes', () => {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);

            mockFragmentData.fields[2].values = [yesterday.toISOString()];
            mockFragmentData.fields[3].values = [tomorrow.toISOString()];
            mockFragmentData.status = 'MODIFIED';

            const promotion = new Promotion(mockFragmentData);

            expect(promotion.promotionStatus).to.equal('modified');
            expect(promotion.isPromotionPublished).to.be.true;
        });

        it('returns active when in date range and published', () => {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);

            mockFragmentData.fields[2].values = [yesterday.toISOString()];
            mockFragmentData.fields[3].values = [tomorrow.toISOString()];
            mockFragmentData.status = 'PUBLISHED';

            const promotion = new Promotion(mockFragmentData);

            expect(promotion.promotionStatus).to.equal('active');
        });

        it('returns draft when in date range but not published', () => {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);

            mockFragmentData.fields[2].values = [yesterday.toISOString()];
            mockFragmentData.fields[3].values = [tomorrow.toISOString()];

            const promotion = new Promotion(mockFragmentData);

            expect(promotion.promotionStatus).to.equal('draft');
        });

        it('returns expired when promotion end date is in the past', () => {
            const lastWeek = new Date(now);
            lastWeek.setDate(lastWeek.getDate() - 7);
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);

            mockFragmentData.fields[2].values = [lastWeek.toISOString()];
            mockFragmentData.fields[3].values = [yesterday.toISOString()];

            const promotion = new Promotion(mockFragmentData);

            expect(promotion.promotionStatus).to.equal('expired');
        });

        it('returns scheduled when published and start is in the future', () => {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextWeek = new Date(now);
            nextWeek.setDate(nextWeek.getDate() + 7);

            mockFragmentData.fields[2].values = [tomorrow.toISOString()];
            mockFragmentData.fields[3].values = [nextWeek.toISOString()];
            mockFragmentData.status = 'PUBLISHED';

            const promotion = new Promotion(mockFragmentData);

            expect(promotion.promotionStatus).to.equal('scheduled');
        });

        it('returns draft when dates are in the future but not published', () => {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextWeek = new Date(now);
            nextWeek.setDate(nextWeek.getDate() + 7);

            mockFragmentData.fields[2].values = [tomorrow.toISOString()];
            mockFragmentData.fields[3].values = [nextWeek.toISOString()];

            const promotion = new Promotion(mockFragmentData);

            expect(promotion.promotionStatus).to.equal('draft');
        });

        it('should return "unknown" when startDate is missing', () => {
            mockFragmentData.fields[2].values = [''];

            const promotion = new Promotion(mockFragmentData);

            expect(promotion.promotionStatus).to.equal('unknown');
        });

        it('returns draft for unpublished promotion with empty endDate (evergreen)', () => {
            mockFragmentData.fields[3].values = [''];

            const promotion = new Promotion(mockFragmentData);

            expect(promotion.promotionStatus).to.equal('draft');
        });

        it('should return "unknown" when dates are invalid', () => {
            mockFragmentData.fields[2].values = ['invalid-date'];
            mockFragmentData.fields[3].values = ['invalid-date'];

            const promotion = new Promotion(mockFragmentData);

            expect(promotion.promotionStatus).to.equal('unknown');
        });

        it('returns draft when current time equals start date and not published', () => {
            const nowISO = now.toISOString();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);

            mockFragmentData.fields[2].values = [nowISO];
            mockFragmentData.fields[3].values = [tomorrow.toISOString()];

            const promotion = new Promotion(mockFragmentData);

            expect(promotion.promotionStatus).to.equal('draft');
        });
    });

    describe('isPromotionPublished getter', () => {
        it('returns false when only published tag is set', () => {
            const tagsField = mockFragmentData.fields.find((f) => f.name === 'tags');
            tagsField.values = ['mas:status/published'];
            const promotion = new Promotion(mockFragmentData);
            expect(promotion.isPromotionPublished).to.be.false;
        });

        it('returns true when fragment status is PUBLISHED', () => {
            mockFragmentData.status = 'PUBLISHED';
            const promotion = new Promotion(mockFragmentData);
            expect(promotion.isPromotionPublished).to.be.true;
        });

        it('returns true when fragment status is MODIFIED', () => {
            mockFragmentData.status = 'MODIFIED';
            const promotion = new Promotion(mockFragmentData);
            expect(promotion.isPromotionPublished).to.be.true;
        });
    });

    describe('promotionListFilterKey getter', () => {
        let now;

        beforeEach(() => {
            now = new Date();
        });

        it('returns active for modified promotion within active date range', () => {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);

            mockFragmentData.fields[2].values = [yesterday.toISOString()];
            mockFragmentData.fields[3].values = [tomorrow.toISOString()];
            mockFragmentData.status = 'MODIFIED';

            const promotion = new Promotion(mockFragmentData);

            expect(promotion.promotionStatus).to.equal('modified');
            expect(promotion.promotionListFilterKey).to.equal('active');
        });

        it('returns scheduled for modified promotion before start date', () => {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const nextWeek = new Date(now);
            nextWeek.setDate(nextWeek.getDate() + 7);

            mockFragmentData.fields[2].values = [tomorrow.toISOString()];
            mockFragmentData.fields[3].values = [nextWeek.toISOString()];
            mockFragmentData.status = 'MODIFIED';

            const promotion = new Promotion(mockFragmentData);

            expect(promotion.promotionStatus).to.equal('modified');
            expect(promotion.promotionListFilterKey).to.equal('scheduled');
        });

        it('matches promotionStatus when not modified', () => {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);

            mockFragmentData.fields[2].values = [yesterday.toISOString()];
            mockFragmentData.fields[3].values = [tomorrow.toISOString()];
            mockFragmentData.status = 'PUBLISHED';

            const promotion = new Promotion(mockFragmentData);

            expect(promotion.promotionListFilterKey).to.equal(promotion.promotionStatus);
        });
    });

    describe('isEvergreen getter', () => {
        it('returns true when endDate is empty string', () => {
            mockFragmentData.fields[3].values = [''];
            const promotion = new Promotion(mockFragmentData);
            expect(promotion.isEvergreen).to.be.true;
        });

        it('returns false when endDate has a value', () => {
            const promotion = new Promotion(mockFragmentData);
            expect(promotion.isEvergreen).to.be.false;
        });
    });

    describe('timeline getter — evergreen', () => {
        it('shows "Always on" instead of end date when endDate is empty', () => {
            mockFragmentData.fields[2].values = ['2025-06-01T00:00:00.000Z'];
            mockFragmentData.fields[3].values = [''];
            const promotion = new Promotion(mockFragmentData);
            expect(promotion.timeline).to.equal('Jun 01 - Always on');
        });
    });

    describe('promotionStatus getter — evergreen', () => {
        let now;

        beforeEach(() => {
            now = new Date();
        });

        it('returns draft for unpublished evergreen with past start date', () => {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            mockFragmentData.fields[2].values = [yesterday.toISOString()];
            mockFragmentData.fields[3].values = [''];
            const promotion = new Promotion(mockFragmentData);
            expect(promotion.promotionStatus).to.equal('draft');
        });

        it('returns active for published evergreen with past start date', () => {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            mockFragmentData.fields[2].values = [yesterday.toISOString()];
            mockFragmentData.fields[3].values = [''];
            mockFragmentData.status = 'PUBLISHED';
            const promotion = new Promotion(mockFragmentData);
            expect(promotion.promotionStatus).to.equal('active');
        });

        it('returns scheduled for published evergreen with future start date', () => {
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            mockFragmentData.fields[2].values = [tomorrow.toISOString()];
            mockFragmentData.fields[3].values = [''];
            mockFragmentData.status = 'PUBLISHED';
            const promotion = new Promotion(mockFragmentData);
            expect(promotion.promotionStatus).to.equal('scheduled');
        });

        it('never returns expired for evergreen', () => {
            const lastYear = new Date(now);
            lastYear.setFullYear(lastYear.getFullYear() - 1);
            mockFragmentData.fields[2].values = [lastYear.toISOString()];
            mockFragmentData.fields[3].values = [''];
            mockFragmentData.status = 'PUBLISHED';
            const promotion = new Promotion(mockFragmentData);
            expect(promotion.promotionStatus).to.equal('active');
        });

        it('returns modified for published evergreen with unsaved changes', () => {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            mockFragmentData.fields[2].values = [yesterday.toISOString()];
            mockFragmentData.fields[3].values = [''];
            mockFragmentData.status = 'MODIFIED';
            const promotion = new Promotion(mockFragmentData);
            expect(promotion.promotionStatus).to.equal('modified');
        });
    });

    describe('isPromotionModified', () => {
        it('returns true when fragment status is MODIFIED', () => {
            mockFragmentData.status = 'MODIFIED';
            const promotion = new Promotion(mockFragmentData);
            expect(promotion.isPromotionModified).to.be.true;
        });

        it('returns false when fragment status is PUBLISHED', () => {
            mockFragmentData.status = 'PUBLISHED';
            const promotion = new Promotion(mockFragmentData);
            expect(promotion.isPromotionModified).to.be.false;
        });
    });

    describe('inherited Fragment methods', () => {
        it('should be able to get field values', () => {
            const promotion = new Promotion(mockFragmentData);

            expect(promotion.getFieldValue('title')).to.equal('Test Promotion');
            expect(promotion.getFieldValue('promoCode')).to.equal('SAVE20');
            expect(promotion.getFieldValue('startDate')).to.equal('2024-01-01T00:00:00.000Z');
        });

        it('should be able to update fields', () => {
            const promotion = new Promotion(mockFragmentData);

            promotion.updateField('promoCode', ['SAVE30']);

            expect(promotion.getFieldValue('promoCode')).to.equal('SAVE30');
            expect(promotion.hasChanges).to.be.true;
        });

        it('should track changes correctly', () => {
            const promotion = new Promotion(mockFragmentData);

            expect(promotion.hasChanges).to.be.false;

            promotion.updateField('title', ['Updated Title']);

            expect(promotion.hasChanges).to.be.true;
        });
    });
});
