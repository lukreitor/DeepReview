import { describe, expect, it } from 'vitest';
import { serializeReviewFilters } from '@features/reviews/api';
describe('serializeReviewFilters', () => {
    it('returns undefined when no filters are provided', () => {
        expect(serializeReviewFilters()).toBeUndefined();
        expect(serializeReviewFilters({})).toBeUndefined();
    });
    it('serializes filters with dates and score thresholds', () => {
        const params = serializeReviewFilters({
            language: 'python',
            status: 'completed',
            minScore: 7.5,
            fromDate: '2024-01-10',
            toDate: '2024-01-12',
        });
        expect(params).toBeDefined();
        expect(params).toMatchObject({
            language: 'python',
            status: 'completed',
            min_score: 7.5,
        });
        const expectedFrom = new Date('2024-01-10').toISOString();
        const expectedTo = new Date('2024-01-12');
        expectedTo.setHours(23, 59, 59, 999);
        expect(params?.from).toBe(expectedFrom);
        expect(params?.to).toBe(expectedTo.toISOString());
    });
});
