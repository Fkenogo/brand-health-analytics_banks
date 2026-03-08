import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const PROJECT_ID = 'brand-health-analytics';

const validPublicResponse = {
  response_id: 'resp_001',
  device_id: 'device_001',
  country: 'rwanda',
  selected_country: 'rwanda',
  timestamp: '2026-03-08T12:00:00.000Z',
  duration_seconds: 120,
  question_timings: { c1_top_of_mind: 12 },
  language_at_submission: 'en',
  _status: 'completed',
  c1_top_of_mind: 'BK',
};

const parseEmulatorHost = () => {
  const hostFromEnv = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
  const [host, portRaw] = hostFromEnv.split(':');
  const port = Number(portRaw || '8080');
  return { host, port };
};

describe('firestore.rules hardening', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    const rules = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf8');
    const { host, port } = parseEmulatorHost();

    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules,
        host,
        port,
      },
    });
  }, 120000);

  beforeEach(async () => {
    await testEnv.clearFirestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      await setDoc(doc(db, 'users', 'admin-1'), {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'admin',
        status: 'active',
      });

      await setDoc(doc(db, 'users', 'sub-1'), {
        id: 'sub-1',
        email: 'sub1@example.com',
        role: 'subscriber',
        status: 'active',
        assignedCountries: ['rwanda'],
      });

      await setDoc(doc(db, 'users', 'sub-2'), {
        id: 'sub-2',
        email: 'sub2@example.com',
        role: 'subscriber',
        status: 'active',
        assignedCountries: ['uganda'],
      });

      await setDoc(doc(db, 'responses', 'resp-rw-1'), {
        ...validPublicResponse,
        response_id: 'resp-rw-1',
        selected_country: 'rwanda',
        country: 'rwanda',
      });

      await setDoc(doc(db, 'responses', 'resp-ug-1'), {
        ...validPublicResponse,
        response_id: 'resp-ug-1',
        selected_country: 'uganda',
        country: 'uganda',
      });

      await setDoc(doc(db, 'invites', 'invite-1'), {
        id: 'invite-1',
        token: 'token-1',
        userId: 'sub-1',
        email: 'sub1@example.com',
      });
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  it('allows admin writes to admin collections', async () => {
    const admin = testEnv.authenticatedContext('admin-1', {
      role: 'admin',
      subscriber_state: 'active',
    });
    const db = admin.firestore();

    await assertSucceeds(
      setDoc(doc(db, 'invites', 'invite-admin-created'), {
        id: 'invite-admin-created',
        token: 'token-admin',
        userId: 'sub-1',
        email: 'sub1@example.com',
      }),
    );
  });

  it('allows active subscriber to read responses in assigned countries', async () => {
    const subscriber = testEnv.authenticatedContext('sub-1', {
      role: 'subscriber',
      subscriber_state: 'active',
    });
    const db = subscriber.firestore();

    await assertSucceeds(getDoc(doc(db, 'responses', 'resp-rw-1')));
  });

  it('denies subscriber read outside assigned scope', async () => {
    const subscriber = testEnv.authenticatedContext('sub-1', {
      role: 'subscriber',
      subscriber_state: 'active',
    });
    const db = subscriber.firestore();

    await assertFails(getDoc(doc(db, 'responses', 'resp-ug-1')));
  });

  it('allows public anonymous valid response create', async () => {
    const anon = testEnv.unauthenticatedContext();
    const db = anon.firestore();

    await assertSucceeds(setDoc(doc(db, 'responses', 'resp-public-ok'), validPublicResponse));
  });

  it('denies public invalid response create with forbidden field', async () => {
    const anon = testEnv.unauthenticatedContext();
    const db = anon.firestore();

    await assertFails(
      setDoc(doc(db, 'responses', 'resp-public-bad'), {
        ...validPublicResponse,
        role: 'admin',
      }),
    );
  });

  it('denies public invite reads', async () => {
    const anon = testEnv.unauthenticatedContext();
    const db = anon.firestore();

    await assertFails(getDoc(doc(db, 'invites', 'invite-1')));
  });

  it('denies authenticated non-admin writes to admin collections', async () => {
    const subscriber = testEnv.authenticatedContext('sub-1', {
      role: 'subscriber',
      subscriber_state: 'active',
    });
    const db = subscriber.firestore();

    await assertFails(
      setDoc(doc(db, 'questionnaires', 'q-1'), {
        id: 'q-1',
        name: 'Wave 1',
        status: 'draft',
      }),
    );
  });

  it('denies client access to temporarily locked non-core collections', async () => {
    const admin = testEnv.authenticatedContext('admin-1', {
      role: 'admin',
      subscriber_state: 'active',
    });
    const db = admin.firestore();

    await assertFails(getDoc(doc(db, 'panelists', 'p-1')));
    await assertFails(getDoc(doc(db, 'raffleEntries', 'r-1')));
    await assertFails(getDoc(doc(db, 'aiStrategyUsage', 'u-1')));
  });

  it('ensures bootstrap config is publicly readable but not writable', async () => {
    const anon = testEnv.unauthenticatedContext();
    const db = anon.firestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'config', 'bootstrap'), {
        createdAt: '2026-03-08T12:00:00.000Z',
        adminId: 'admin-1',
        email: 'admin@example.com',
      });
    });

    await assertSucceeds(getDoc(doc(db, 'config', 'bootstrap')));
    await assertFails(
      setDoc(doc(db, 'config', 'bootstrap'), {
        createdAt: '2026-03-08T12:00:00.000Z',
        adminId: 'attacker',
        email: 'attacker@example.com',
      }),
    );

    await expect(getDoc(doc(db, 'config', 'bootstrap'))).resolves.toBeDefined();
  });
});
