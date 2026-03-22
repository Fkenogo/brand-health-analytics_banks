import { describe, expect, it } from 'vitest';
import { canBootstrapAdminClaims, isCanonicalAdminProfile } from './adminClaims';

describe('admin claims recovery guards', () => {
  it('qualifies only active canonical admin profiles', () => {
    expect(isCanonicalAdminProfile({ role: 'admin', status: 'active' })).toBe(true);
    expect(isCanonicalAdminProfile({ role: 'admin', status: 'suspended' })).toBe(false);
    expect(isCanonicalAdminProfile({ role: 'subscriber', status: 'active' })).toBe(false);
  });

  it('allows bootstrap repair only for bootstrap owner identity', () => {
    expect(canBootstrapAdminClaims({
      auth: { uid: 'admin-1', token: { email: 'owner@example.com' } },
      userData: { role: 'admin', status: 'active' },
      bootstrapData: { adminId: 'admin-1', email: 'owner@example.com' },
    })).toBe(true);

    expect(canBootstrapAdminClaims({
      auth: { uid: 'someone-else', token: { email: 'other@example.com' } },
      userData: { role: 'admin', status: 'active' },
      bootstrapData: { adminId: 'admin-1', email: 'owner@example.com' },
    })).toBe(false);
  });

  it('does not allow non-admin canonical profiles to bootstrap claims', () => {
    expect(canBootstrapAdminClaims({
      auth: { uid: 'admin-1', token: { email: 'owner@example.com' } },
      userData: { role: 'subscriber', status: 'active' },
      bootstrapData: { adminId: 'admin-1', email: 'owner@example.com' },
    })).toBe(false);
  });
});
