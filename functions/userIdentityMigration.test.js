const { buildCanonicalUserPatch, scanLegacyUserRecords } = require('./userIdentityMigration');

describe('legacy user identity migration helpers', () => {
  it('detects email-keyed and authUid mismatch legacy records', () => {
    const result = scanLegacyUserRecords([
      {
        docId: 'admin@example.com',
        data: {
          id: 'admin@example.com',
          email: 'admin@example.com',
          role: 'subscriber',
          status: 'pending',
          authUid: 'uid_123',
        },
      },
      {
        docId: 'uid_123',
        data: {
          id: 'uid_123',
          email: 'admin@example.com',
          role: 'subscriber',
          status: 'active',
        },
      },
    ]);

    expect(result.summary.totalUsers).toBe(2);
    expect(result.summary.legacyRecords).toBe(2);
    expect(result.summary.emailKeyedDocs).toBe(1);
    expect(result.summary.duplicateEmails).toBe(2);
    expect(result.summary.safeMigrationCandidates).toBe(0);
    expect(result.records[0].issueTypes).toContain('email_keyed_doc');
    expect(result.records[0].issueTypes).toContain('auth_uid_doc_mismatch');
  });

  it('builds a canonical target patch for missing canonical uid docs', () => {
    const patch = buildCanonicalUserPatch({
      legacyDocId: 'legacy@example.com',
      legacyData: {
        id: 'legacy@example.com',
        email: 'legacy@example.com',
        role: 'subscriber',
        status: 'pending',
        authUid: 'uid_456',
        companyName: 'Legacy Bank',
      },
      canonicalUid: 'uid_456',
      nowIso: '2026-03-13T10:00:00.000Z',
      existingCanonicalData: null,
    });

    expect(patch.id).toBe('uid_456');
    expect(patch.authUid).toBe('uid_456');
    expect(patch.email).toBe('legacy@example.com');
    expect(patch.companyName).toBe('Legacy Bank');
    expect(patch.legacySourceDocId).toBe('legacy@example.com');
  });

  it('merges only safe non-authoritative fields into an existing canonical uid doc', () => {
    const patch = buildCanonicalUserPatch({
      legacyDocId: 'legacy@example.com',
      legacyData: {
        email: 'legacy@example.com',
        companyName: 'Legacy Bank',
        contactName: 'Grace',
        phone: '+250700000000',
        assignedCountries: ['rwanda'],
        requestedCountries: ['uganda'],
        emailVerified: true,
      },
      canonicalUid: 'uid_456',
      nowIso: '2026-03-13T10:00:00.000Z',
      existingCanonicalData: {
        id: 'uid_456',
        authUid: 'uid_456',
        email: 'legacy@example.com',
        companyName: '',
        contactName: '',
        assignedCountries: ['burundi'],
        requestedCountries: [],
        emailVerified: false,
      },
    });

    expect(patch.companyName).toBe('Legacy Bank');
    expect(patch.contactName).toBe('Grace');
    expect(patch.phone).toBe('+250700000000');
    expect(patch.assignedCountries).toEqual(['burundi', 'rwanda']);
    expect(patch.requestedCountries).toEqual(['uganda']);
    expect(patch.emailVerified).toBe(true);
    expect(patch.id).toBe('uid_456');
  });
});
