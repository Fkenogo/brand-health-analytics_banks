const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
};

const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== '';

const buildScanSnapshot = (docId, data) => {
  const authUid = String(data?.authUid || '').trim();
  const storedId = String(data?.id || '').trim();
  const email = normalizeEmail(data?.email);
  const migratedToUid = String(data?.migratedToUid || '').trim();

  return {
    docId,
    authUid,
    storedId,
    email,
    role: String(data?.role || '').trim(),
    status: String(data?.status || '').trim(),
    migratedToUid,
    data: data || {},
  };
};

const scanLegacyUserRecords = (records) => {
  const snapshots = records.map(({ docId, data }) => buildScanSnapshot(docId, data));
  const docIds = new Set(snapshots.map((snapshot) => snapshot.docId));

  const emailCounts = new Map();
  const authUidCounts = new Map();

  snapshots.forEach((snapshot) => {
    if (snapshot.email) {
      emailCounts.set(snapshot.email, (emailCounts.get(snapshot.email) || 0) + 1);
    }
    if (snapshot.authUid) {
      authUidCounts.set(snapshot.authUid, (authUidCounts.get(snapshot.authUid) || 0) + 1);
    }
  });

  const recordsWithIssues = snapshots
    .map((snapshot) => {
      const issueTypes = [];

      if (snapshot.docId.includes('@')) issueTypes.push('email_keyed_doc');
      if (snapshot.storedId && snapshot.storedId !== snapshot.docId) issueTypes.push('stored_id_doc_mismatch');
      if (snapshot.authUid && snapshot.authUid !== snapshot.docId) issueTypes.push('auth_uid_doc_mismatch');
      if (snapshot.migratedToUid) issueTypes.push('already_migrated');
      if (snapshot.email && (emailCounts.get(snapshot.email) || 0) > 1) issueTypes.push('duplicate_email');
      if (snapshot.authUid && (authUidCounts.get(snapshot.authUid) || 0) > 1) issueTypes.push('duplicate_auth_uid');
      if (snapshot.authUid && docIds.has(snapshot.authUid) && snapshot.authUid !== snapshot.docId) issueTypes.push('canonical_uid_exists');

      const canonicalUid = snapshot.authUid || (snapshot.docId === snapshot.storedId ? snapshot.docId : '');
      const migrationAction = snapshot.authUid && snapshot.authUid !== snapshot.docId
        ? (docIds.has(snapshot.authUid) ? 'link_to_existing_uid' : 'copy_to_uid')
        : null;
      const conflictingTarget = migrationAction === 'link_to_existing_uid'
        && Boolean(issueTypes.includes('duplicate_email') && snapshot.email);

      return {
        docId: snapshot.docId,
        canonicalUid: canonicalUid || null,
        email: snapshot.email || null,
        role: snapshot.role || null,
        status: snapshot.status || null,
        migratedToUid: snapshot.migratedToUid || null,
        issueTypes,
        migrationAction,
        safeToMigrate: Boolean(migrationAction) && !conflictingTarget && !snapshot.migratedToUid,
      };
    })
    .filter((record) => record.issueTypes.length > 0);

  return {
    summary: {
      totalUsers: snapshots.length,
      legacyRecords: recordsWithIssues.length,
      emailKeyedDocs: recordsWithIssues.filter((record) => record.issueTypes.includes('email_keyed_doc')).length,
      idMismatches: recordsWithIssues.filter((record) => (
        record.issueTypes.includes('stored_id_doc_mismatch') || record.issueTypes.includes('auth_uid_doc_mismatch')
      )).length,
      duplicateEmails: recordsWithIssues.filter((record) => record.issueTypes.includes('duplicate_email')).length,
      duplicateAuthUids: recordsWithIssues.filter((record) => record.issueTypes.includes('duplicate_auth_uid')).length,
      alreadyMigrated: recordsWithIssues.filter((record) => record.issueTypes.includes('already_migrated')).length,
      safeMigrationCandidates: recordsWithIssues.filter((record) => record.safeToMigrate).length,
    },
    records: recordsWithIssues,
  };
};

const buildCanonicalUserPatch = ({ legacyDocId, legacyData, canonicalUid, nowIso, existingCanonicalData }) => {
  if (!canonicalUid) {
    throw new Error('missing_canonical_uid');
  }

  const basePatch = {
    id: canonicalUid,
    authUid: canonicalUid,
    email: normalizeEmail(legacyData?.email),
    updatedAt: nowIso,
    legacySourceDocId: legacyDocId,
    legacyMigrationStatus: 'canonical',
    legacyMigratedAt: nowIso,
  };

  if (!existingCanonicalData) {
    return {
      ...legacyData,
      ...basePatch,
      createdAt: legacyData?.createdAt || nowIso,
    };
  }

  const patch = {
    ...basePatch,
  };

  if (!hasValue(existingCanonicalData.companyName) && hasValue(legacyData?.companyName)) {
    patch.companyName = String(legacyData.companyName).trim();
  }
  if (!hasValue(existingCanonicalData.contactName) && hasValue(legacyData?.contactName)) {
    patch.contactName = String(legacyData.contactName).trim();
  }
  if (!hasValue(existingCanonicalData.phone) && hasValue(legacyData?.phone)) {
    patch.phone = String(legacyData.phone).trim();
  }

  const assignedCountries = normalizeStringArray([
    ...(existingCanonicalData.assignedCountries || []),
    ...(legacyData?.assignedCountries || []),
  ]);
  if (assignedCountries.length > 0) {
    patch.assignedCountries = assignedCountries;
  }

  const requestedCountries = normalizeStringArray([
    ...(existingCanonicalData.requestedCountries || []),
    ...(legacyData?.requestedCountries || []),
  ]);
  if (requestedCountries.length > 0) {
    patch.requestedCountries = requestedCountries;
  }

  if (!existingCanonicalData.acceptedInviteId && legacyData?.acceptedInviteId) {
    patch.acceptedInviteId = legacyData.acceptedInviteId;
  }

  if (!existingCanonicalData.subscription_tier && legacyData?.subscription_tier) {
    patch.subscription_tier = legacyData.subscription_tier;
  }

  if (existingCanonicalData.emailVerified !== true && legacyData?.emailVerified === true) {
    patch.emailVerified = true;
  }

  return patch;
};

module.exports = {
  normalizeEmail,
  scanLegacyUserRecords,
  buildCanonicalUserPatch,
};
