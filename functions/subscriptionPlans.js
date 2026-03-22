const {
  buildDefaultSubscriptionPlans,
  normalizeSubscriptionPlan,
  sortSubscriptionPlans,
} = require('./subscriptionPlanDefaults');

const SUBSCRIPTION_PLANS_COLLECTION = 'subscriptionPlans';

const listPlans = async (db) => {
  const snapshot = await db.collection(SUBSCRIPTION_PLANS_COLLECTION).get();
  return sortSubscriptionPlans(snapshot.docs.map((doc) => doc.data()));
};

const initializeDefaultPlans = async (db) => {
  const existingPlans = await listPlans(db);
  if (existingPlans.length > 0) {
    return { plans: existingPlans, initialized: false };
  }

  const defaults = buildDefaultSubscriptionPlans();
  const batch = db.batch();
  defaults.forEach((plan) => {
    batch.set(db.collection(SUBSCRIPTION_PLANS_COLLECTION).doc(plan.id), plan);
  });
  await batch.commit();

  return { plans: defaults, initialized: true };
};

const upsertPlan = async (db, planInput) => {
  const plan = normalizeSubscriptionPlan(planInput);
  await db.collection(SUBSCRIPTION_PLANS_COLLECTION).doc(plan.id).set(plan, { merge: false });
  return plan;
};

const deletePlan = async (db, planId) => {
  await db.collection(SUBSCRIPTION_PLANS_COLLECTION).doc(planId).delete();
};

module.exports = {
  SUBSCRIPTION_PLANS_COLLECTION,
  listPlans,
  initializeDefaultPlans,
  upsertPlan,
  deletePlan,
};
