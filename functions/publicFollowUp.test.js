import { describe, expect, it } from 'vitest';
import {
  PANEL_COOLDOWN_DAYS,
  buildNextEligibleAt,
  buildPanelistId,
  buildRaffleEntryId,
  mergeFollowUpOptIns,
  normalizePublicFollowUpInput,
} from './publicFollowUp';

describe('public follow-up helpers', () => {
  it('normalizes a valid follow-up payload', () => {
    const result = normalizePublicFollowUpInput({
      joinPanel: true,
      enterRaffle: true,
      country: 'Rwanda',
      deviceId: 'device-1',
      responseId: 'resp-1',
      contactName: ' Theo ',
      contactEmail: ' THEO@example.com ',
      contactPhone: ' +250 788 000 111 ',
      source: 'external',
      language: 'FR',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.country).toBe('rwanda');
    expect(result.value.contactEmail).toBe('theo@example.com');
    expect(result.value.contactPhone).toBe('+250 788 000 111');
    expect(result.value.language).toBe('fr');
  });

  it('rejects payloads with no selected follow-up option', () => {
    const result = normalizePublicFollowUpInput({
      country: 'rwanda',
      deviceId: 'device-1',
      contactName: 'Theo',
      contactEmail: 'theo@example.com',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('selection_required');
  });

  it('rejects invalid contact channels', () => {
    const invalidEmail = normalizePublicFollowUpInput({
      joinPanel: true,
      country: 'rwanda',
      deviceId: 'device-1',
      contactName: 'Theo',
      contactEmail: 'not-an-email',
    });
    expect(invalidEmail.ok).toBe(false);

    const invalidPhone = normalizePublicFollowUpInput({
      enterRaffle: true,
      country: 'rwanda',
      deviceId: 'device-1',
      contactName: 'Theo',
      contactPhone: '123',
    });
    expect(invalidPhone.ok).toBe(false);
  });

  it('requires a response id so follow-up records link back to a survey response', () => {
    const result = normalizePublicFollowUpInput({
      joinPanel: true,
      country: 'rwanda',
      deviceId: 'device-1',
      contactName: 'Theo',
      contactEmail: 'theo@example.com',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe('missing_response_id');
  });

  it('builds deterministic IDs and next-eligible timestamps', () => {
    expect(buildPanelistId('device-1', 'rwanda')).toBe('device-1_rwanda');
    expect(buildRaffleEntryId({ responseId: 'resp-1', deviceId: 'device-1', country: 'rwanda' })).toBe('rwanda_resp-1');

    const nextEligible = buildNextEligibleAt('2026-03-22T00:00:00.000Z');
    expect(nextEligible).toBe('2026-06-20T00:00:00.000Z');
    expect(PANEL_COOLDOWN_DAYS).toBe(90);
  });

  it('keeps opt-in flags monotonic across repeated saves for the same response', () => {
    expect(mergeFollowUpOptIns(
      { raffleOptIn: true, panelOptIn: false },
      { raffleOptIn: false, panelOptIn: true },
    )).toEqual({
      raffleOptIn: true,
      panelOptIn: true,
    });
  });
});
