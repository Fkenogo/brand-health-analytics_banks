const isCanonicalAdminProfile = (userData) => (
  String(userData?.role || '') === 'admin' && String(userData?.status || '') === 'active'
);

const getAuthEmail = (auth) => String(auth?.token?.email || '').trim().toLowerCase();

const canBootstrapAdminClaims = ({ auth, userData, bootstrapData }) => {
  if (!auth?.uid || !isCanonicalAdminProfile(userData)) return false;

  const bootstrapAdminId = String(bootstrapData?.adminId || '').trim();
  const bootstrapEmail = String(bootstrapData?.email || '').trim().toLowerCase();
  const callerEmail = getAuthEmail(auth);

  return auth.uid === bootstrapAdminId || (callerEmail.length > 0 && callerEmail === bootstrapEmail);
};

module.exports = {
  isCanonicalAdminProfile,
  canBootstrapAdminClaims,
  getAuthEmail,
};
