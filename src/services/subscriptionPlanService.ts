import { collection, getDocsFromServer, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '@/lib/firebase';
import type { SubscriptionPlan } from '@/types/subscriptionPlans';
import { buildDefaultSubscriptionPlans, getVisibleSubscriptionPlans } from '@/utils/subscriptionPlans';

const SUBSCRIPTION_PLANS_COLLECTION = 'subscriptionPlans';
const PUBLIC_PLAN_FETCH_TIMEOUT_MS = 6500;

const listSubscriptionPlansAdminCallable = httpsCallable<
  Record<string, never>,
  { plans: SubscriptionPlan[] }
>(functions, 'listSubscriptionPlansAdmin');

const initializeDefaultSubscriptionPlansCallable = httpsCallable<
  Record<string, never>,
  { plans: SubscriptionPlan[]; initialized: boolean }
>(functions, 'initializeDefaultSubscriptionPlans');

const saveSubscriptionPlanCallable = httpsCallable<
  { plan: SubscriptionPlan },
  { ok: boolean; plan: SubscriptionPlan }
>(functions, 'saveSubscriptionPlan');

const deleteSubscriptionPlanCallable = httpsCallable<
  { planId: string },
  { ok: boolean; planId: string }
>(functions, 'deleteSubscriptionPlan');

export type AdminPlanAccessDiagnosis =
  | { kind: 'missing_admin_claim'; message: string }
  | { kind: 'permission_denied'; message: string }
  | { kind: 'callable_unavailable'; message: string }
  | { kind: 'validation_failure'; message: string }
  | { kind: 'empty'; message: string }
  | { kind: 'unknown'; message: string };

export interface PublicPlanLoadResult {
  plans: SubscriptionPlan[];
  source: 'firestore' | 'fallback';
  fallbackReason: string | null;
}

const permissionErrorMessages = ['missing or insufficient permissions', 'permission-denied', 'permission denied'];
const missingBackendMessages = [
  'preflight response is not successful',
  'status code: 404',
  'cannot load https://us-central1-',
  'functions/not-found',
  '404',
];

const isPermissionError = (error: unknown): boolean => {
  const message = String((error as { message?: string })?.message || '').toLowerCase();
  const code = String((error as { code?: string })?.code || '').toLowerCase();
  return permissionErrorMessages.some((item) => message.includes(item)) || code.includes('permission-denied');
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = globalThis.setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== null) {
      globalThis.clearTimeout(timer);
    }
  }
};

export const diagnoseAdminPlanAccessError = async (error: unknown): Promise<AdminPlanAccessDiagnosis> => {
  const rawMessage = String((error as { message?: string })?.message || '');
  const lowerMessage = rawMessage.toLowerCase();
  const code = String((error as { code?: string })?.code || '').toLowerCase();

  if (missingBackendMessages.some((item) => lowerMessage.includes(item)) || code.includes('not-found') || code.includes('unavailable')) {
    return {
      kind: 'callable_unavailable',
      message: 'Subscription plan backend not deployed or not reachable. Deploy the latest Cloud Functions before using Subscription Management.',
    };
  }

  if (code.includes('invalid-argument') || lowerMessage.includes('valid subscription plan payload')) {
    return {
      kind: 'validation_failure',
      message: 'Subscription plan payload is invalid. Check internal id, pricing values, and entitlement mapping before saving.',
    };
  }

  if (!isPermissionError(error)) {
    return { kind: 'unknown', message: rawMessage || 'Subscription plan request failed.' };
  }

  const tokenResult = auth.currentUser ? await auth.currentUser.getIdTokenResult(true) : null;
  const tokenRole = String(tokenResult?.claims?.role || '');
  if (tokenRole !== 'admin') {
    return {
      kind: 'missing_admin_claim',
      message: 'Admin profile found, but your current token is missing the admin claim. Use Repair Admin Access to restore runtime claims and refresh your token.',
    };
  }

  return {
    kind: 'permission_denied',
    message: 'Firestore denied this subscription plan action even though your token contains the admin claim. Verify rules deployment and callable availability.',
  };
};

export const subscriptionPlanService = {
  listAllAdmin: async (): Promise<SubscriptionPlan[]> => {
    const result = await listSubscriptionPlansAdminCallable({});
    return result.data.plans;
  },

  listPublicPlans: async (): Promise<SubscriptionPlan[]> => {
    const result = await subscriptionPlanService.listPublicPlansWithFallback();
    return result.plans;
  },

  listPublicPlansWithFallback: async (): Promise<PublicPlanLoadResult> => {
    try {
      const snapshot = await withTimeout(
        getDocsFromServer(query(
          collection(db, SUBSCRIPTION_PLANS_COLLECTION),
          where('isActive', '==', true),
        )),
        PUBLIC_PLAN_FETCH_TIMEOUT_MS,
        'Timed out while loading subscription plans.',
      );

      return {
        plans: getVisibleSubscriptionPlans(snapshot.docs.map((docSnap) => docSnap.data() as SubscriptionPlan)),
        source: 'firestore',
        fallbackReason: null,
      };
    } catch (error) {
      const fallbackReason = error instanceof Error ? error.message : 'Subscription plan request failed.';
      return {
        plans: buildDefaultSubscriptionPlans(),
        source: 'fallback',
        fallbackReason,
      };
    }
  },

  savePlanAdmin: async (plan: SubscriptionPlan): Promise<SubscriptionPlan> => {
    const result = await saveSubscriptionPlanCallable({ plan });
    return result.data.plan;
  },

  deletePlanAdmin: async (planId: string): Promise<void> => {
    await deleteSubscriptionPlanCallable({ planId });
  },

  initializeDefaultsAdmin: async (): Promise<{ plans: SubscriptionPlan[]; initialized: boolean }> => {
    const result = await initializeDefaultSubscriptionPlansCallable({});
    return result.data;
  },
};
