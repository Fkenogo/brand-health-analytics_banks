import { normalizeResponse, determineLoyaltySegment, calculateMetrics } from './DataProcessor';
import { SurveyResponse } from '../../types';
import { LoyaltySegment } from './types';

describe('DataProcessor', () => {
    
    describe('normalizeResponse', () => {
        it('should correctly normalize a raw survey response', () => {
             const raw: SurveyResponse = {
                response_id: 'res-1',
                device_id: 'dev-1',
                country: 'rwanda',
                timestamp: '2023-01-01',
                duration_seconds: 100,
                question_timings: {},
                language_at_submission: 'en',
                b2_age: '25-34',
                gender: 'Female',
                c1_recognized_bank_id: 'bank-a',
                c2_recognized_bank_ids: ['bank-b'],
                c3_aware_banks: ['bank-a', 'bank-b', 'bank-c'],
                c4_ever_used: ['bank-a', 'bank-b'],
                c5_currently_using: ['bank-a'],
                c6_main_bank: 'bank-a',
                c9_favourites: ['bank-a'],
                c9_would_consider: ['bank-a', 'bank-b'],
                c10_nps: 9,
                d2_future_intent: { 'bank-a': 10 },
                d3_relevance: ['bank-a'],
                d4_popularity: 'bank-a',
                d5_committed: 'bank-a'
            };

            const normalized = normalizeResponse(raw);

            expect(normalized.id).toBe('res-1');
            expect(normalized.top_of_mind_brand).toBe('bank-a');
            expect(normalized.spontaneous_brands).toContain('bank-b');
            expect(normalized.aided_brands).toHaveLength(3);
            expect(normalized.ever_used_brands).toContain('bank-a');
            expect(normalized.currently_using_brands).toContain('bank-a');
            expect(normalized.preferred_bank).toBe('bank-a');
            expect(normalized.nps_score).toBe(9);
            expect(normalized.future_intent).toBe(10);
        });

        it('should handle missing optional fields gracefully', () => {
             const raw: SurveyResponse = {
                response_id: 'res-2',
                device_id: 'dev-1',
                country: 'rwanda',
                timestamp: '2023-01-01',
                duration_seconds: 100,
                question_timings: {},
                language_at_submission: 'en'
            };

            const normalized = normalizeResponse(raw);
            expect(normalized.top_of_mind_brand).toBeNull();
            expect(normalized.nps_score).toBe(0);
        });
    });

    describe('determineLoyaltySegment', () => {
        // 1. Committed: High NPS + High Intent + Preferred + User
        it('should identify Committed segment', () => {
            expect(determineLoyaltySegment(9, 9, true, true)).toBe('Committed');
            expect(determineLoyaltySegment(10, 10, true, true)).toBe('Committed');
        });

        // 2. Favors: High NPS + High Intent + NOT Preferred + User
        it('should identify Favors segment', () => {
            expect(determineLoyaltySegment(9, 9, false, true)).toBe('Favors');
            expect(determineLoyaltySegment(10, 10, false, true)).toBe('Favors');
        });

        // 3. Potential: Non-User + High Intent/Consideration (>= 7)
        it('should identify Potential segment', () => {
            expect(determineLoyaltySegment(0, 7, false, false)).toBe('Potential');
            expect(determineLoyaltySegment(5, 8, false, false)).toBe('Potential');
            expect(determineLoyaltySegment(0, 10, false, false)).toBe('Potential');
        });

        // 4. Rejectors: Low NPS (<=6) OR Low Intent (<=6)
        it('should identify Rejectors segment', () => {
            // Low NPS, High Intent (User)
            expect(determineLoyaltySegment(6, 9, false, true)).toBe('Rejectors');
            expect(determineLoyaltySegment(0, 9, false, true)).toBe('Rejectors');
            
            // High NPS, Low Intent (User)
            expect(determineLoyaltySegment(9, 6, false, true)).toBe('Rejectors');
            expect(determineLoyaltySegment(9, 0, false, true)).toBe('Rejectors');

            // Low NPS, Low Intent (User)
            expect(determineLoyaltySegment(5, 5, false, true)).toBe('Rejectors');

            // Non-User with Low Intent
             expect(determineLoyaltySegment(0, 5, false, false)).toBe('Rejectors');
        });

        // 5. Accessibles: The rest (Mid NPS/Intent users, or mid-intent non-users)
        it('should identify Accessibles segment', () => {
             // User with Mid scores (7, 8)
             expect(determineLoyaltySegment(8, 8, false, true)).toBe('Accessibles');
             expect(determineLoyaltySegment(7, 7, false, true)).toBe('Accessibles');
             expect(determineLoyaltySegment(8, 7, false, true)).toBe('Accessibles');
        });
    });

    describe('calculateMetrics', () => {
        const mockData = [
            // User 1: Committed to Bank A
            {
                id: '1', response_id: '1', country: 'rwanda' as const, date: '2023', weight: 1, b2_age: '25-34', gender: 'F',
                top_of_mind_brand: 'bank-a', spontaneous_brands: [], aided_brands: ['bank-a'],
                ever_used_brands: ['bank-a'], currently_using_brands: ['bank-a'], preferred_bank: 'bank-a', main_bank: 'bank-a',
                consideration_set: ['bank-a'], nps_score: 10, future_intent: 10, satisfaction_drivers: {}, relevance_brands: [], popularity_brand: null, commitment_brand: null
            },
            // User 2: Favors Bank A (User, High NPS/Intent, but prefers Bank B)
            {
                id: '2', response_id: '2', country: 'rwanda' as const, date: '2023', weight: 1, b2_age: '25-34', gender: 'M',
                top_of_mind_brand: 'bank-b', spontaneous_brands: ['bank-a'], aided_brands: ['bank-a', 'bank-b'],
                ever_used_brands: ['bank-a', 'bank-b'], currently_using_brands: ['bank-a', 'bank-b'], preferred_bank: 'bank-b', main_bank: 'bank-b',
                consideration_set: ['bank-a', 'bank-b'], nps_score: 9, future_intent: 9, satisfaction_drivers: {}, relevance_brands: [], popularity_brand: null, commitment_brand: null
            },
             // User 3: Rejector of Bank A (User, Low NPS)
             {
                id: '3', response_id: '3', country: 'rwanda' as const, date: '2023', weight: 1, b2_age: '25-34', gender: 'M',
                top_of_mind_brand: 'bank-c', spontaneous_brands: [], aided_brands: ['bank-a', 'bank-c'],
                ever_used_brands: ['bank-a'], currently_using_brands: ['bank-a'], preferred_bank: 'bank-c', main_bank: 'bank-c',
                consideration_set: [], nps_score: 4, future_intent: 5, satisfaction_drivers: {}, relevance_brands: [], popularity_brand: null, commitment_brand: null
            },
            // User 4: Potential for Bank A (Non-User, High Intent)
             {
                id: '4', response_id: '4', country: 'rwanda' as const, date: '2023', weight: 1, b2_age: '25-34', gender: 'F',
                top_of_mind_brand: 'bank-b', spontaneous_brands: [], aided_brands: ['bank-a', 'bank-b'],
                ever_used_brands: ['bank-b'], currently_using_brands: ['bank-b'], preferred_bank: 'bank-b', main_bank: 'bank-b',
                consideration_set: ['bank-a'], nps_score: 0, future_intent: 8, satisfaction_drivers: {}, relevance_brands: [], popularity_brand: null, commitment_brand: null
            }
        ];

        it('should calculate awareness metrics correctly', () => {
            const metrics = calculateMetrics(mockData, 'bank-a');
            // TOM: 1/4 = 25%
            expect(metrics.awareness.topOfMind).toBe(25);
            // Spontaneous: User 1 (TOM) + User 2 (Spont) = 2/4 = 50%
            expect(metrics.awareness.spontaneousRecall).toBe(50);
            // Total Aware: All 4 know Bank A = 100%
            expect(metrics.awareness.totalAwareness).toBe(100);
        });

        it('should calculate funnel metrics correctly', () => {
            const metrics = calculateMetrics(mockData, 'bank-a');
            // Ever Used: Users 1, 2, 3 = 3/4 = 75%
            expect(metrics.midFunnel.everUsed).toBe(75);
            // Currently Using: Users 1, 2, 3 = 3/4 = 75%
            expect(metrics.midFunnel.currentlyUsing).toBe(75);
            // Preferred: User 1 only = 1/4 = 25%
            expect(metrics.midFunnel.preferred).toBe(25);
        });

        it('should calculate NPS correctly', () => {
            const metrics = calculateMetrics(mockData, 'bank-a');
            // Promoters: User 1 (10), User 2 (9) = 2
            // Detractors: User 3 (4) = 1
            // Total Responses with NPS (Users 1,2,3): 3
            // Score: ((2 - 1) / 3) * 100 = 33.333...
            expect(Math.round(metrics.nps.score)).toBe(33);
            expect(metrics.nps.breakdown.promoters).toBe(2);
            expect(metrics.nps.breakdown.detractors).toBe(1);
        });

        it('should calculate loyalty segmentation distribution', () => {
            const metrics = calculateMetrics(mockData, 'bank-a');
            // User 1: Committed
            // User 2: Favors (High NPS/Intent, but preferred B)
            // User 3: Rejectors (Low NPS)
            // User 4: Potential (Non-user, Intent 8)
            
            expect(metrics.loyalty.distribution.Committed).toBe(1);
            expect(metrics.loyalty.distribution.Favors).toBe(1);
            expect(metrics.loyalty.distribution.Rejectors).toBe(1);
            expect(metrics.loyalty.distribution.Potential).toBe(1);
        });
    });
});
