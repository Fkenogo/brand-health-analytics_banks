import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '@/lib/firebase';

const bootstrapAdminClaimsCallable = httpsCallable<
  Record<string, never>,
  { ok: boolean; uid: string; role: 'admin'; token_refresh_required: boolean }
>(functions, 'bootstrapAdminClaims');

const repairMyAdminClaimsCallable = httpsCallable<
  Record<string, never>,
  { ok: boolean; uid: string; role: 'admin'; token_refresh_required: boolean }
>(functions, 'repairMyAdminClaims');

const syncUserClaimsNowCallable = httpsCallable<
  { uid: string },
  { ok: boolean; uid: string; token_refresh_required: boolean }
>(functions, 'syncUserClaimsNow');

export type AdminAccessDiagnosis =
  | { kind: 'missing_admin_claim'; message: string }
  | { kind: 'profile_missing'; message: string }
  | { kind: 'bootstrap_not_allowed'; message: string }
  | { kind: 'callable_unavailable'; message: string }
  | { kind: 'auth_required'; message: string }
  | { kind: 'unknown'; message: string };

export const diagnoseAdminAccessError = (error: unknown): AdminAccessDiagnosis => {
  const code = String((error as { code?: string })?.code || '').toLowerCase();
  const message = String((error as { message?: string })?.message || '');
  const lowerMessage = message.toLowerCase();

  if (code.includes('unauthenticated')) {
    return { kind: 'auth_required', message: 'Authentication is required before admin access can be repaired.' };
  }
  if (code.includes('not-found') || lowerMessage.includes('canonical user profile not found')) {
    return { kind: 'profile_missing', message: 'Canonical admin profile was not found. Verify the users/{uid} record before retrying claim repair.' };
  }
  if (code.includes('permission-denied') && lowerMessage.includes('bootstrap')) {
    return { kind: 'bootstrap_not_allowed', message: 'This account is not allowed to bootstrap admin claims. Use the configured bootstrap owner account.' };
  }
  if (code.includes('permission-denied')) {
    return { kind: 'missing_admin_claim', message: 'Admin claim repair was denied. Verify the canonical profile is active admin and retry the repair action.' };
  }
  if (code.includes('functions/not-found') || code.includes('unavailable') || lowerMessage.includes('status code: 404')) {
    return { kind: 'callable_unavailable', message: 'Admin access backend is not deployed or not reachable. Deploy the latest Cloud Functions before retrying claim repair.' };
  }
  return { kind: 'unknown', message: message || 'Admin access repair failed.' };
};

export const adminAccessService = {
  bootstrapAdminClaims: async (): Promise<void> => {
    await bootstrapAdminClaimsCallable({});
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
    }
  },

  repairMyAdminClaims: async (): Promise<void> => {
    await repairMyAdminClaimsCallable({});
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true);
    }
  },

  syncUserClaimsNow: async (uid: string): Promise<void> => {
    await syncUserClaimsNowCallable({ uid });
  },
};
