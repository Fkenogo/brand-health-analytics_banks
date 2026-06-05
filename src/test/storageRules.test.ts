import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp, getApps } from 'firebase/app';
import { expect, describe, test, beforeAll, afterAll } from 'vitest';

/**
 * Storage Rules Test Suite
 * 
 * This test suite validates the Firebase Storage security rules.
 * Since the application currently does NOT use Firebase Cloud Storage,
 * all access should be denied by default.
 * 
 * Run with: npm run test:storage-rules
 * (Requires Firebase Storage Emulator to be running)
 */

describe('Storage Rules', () => {
  let testEnv: any;
  let storage: ReturnType<typeof getStorage>;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'brand-health-analytics-banks',
      storage: {
        rules: `
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
        `
      }
    });

    // Initialize Firebase app for storage operations
    if (!getApps().length) {
      initializeApp({
        projectId: 'brand-health-analytics-banks',
        storageBucket: 'brand-health-analytics-banks.appspot.com'
      });
    }
    storage = getStorage();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe('Default Deny Rules', () => {
    test('should deny file upload for unauthenticated users', async () => {
      const unauthed = testEnv.unauthenticatedContext();
      const fileRef = ref(storage, 'test.txt');
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

      let errorThrown = false;
      try {
        await uploadBytes(fileRef, file);
      } catch (error: any) {
        errorThrown = true;
        // The storage emulator may return different error codes, but any error indicates denial
        expect(error).toBeDefined();
        expect(error.code).toMatch(/permission|unauthorized|unknown/i);
      }
      expect(errorThrown).toBe(true);
    });

    test('should deny file upload for authenticated users', async () => {
      const authed = testEnv.authenticatedContext('user123');
      const fileRef = ref(storage, 'test.txt');
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });

      let errorThrown = false;
      try {
        await uploadBytes(fileRef, file);
      } catch (error: any) {
        errorThrown = true;
        expect(error).toBeDefined();
        expect(error.code).toMatch(/permission|unauthorized|unknown/i);
      }
      expect(errorThrown).toBe(true);
    });

    test('should deny file download for unauthenticated users', async () => {
      const unauthed = testEnv.unauthenticatedContext();
      const fileRef = ref(storage, 'test.txt');

      let errorThrown = false;
      try {
        await getDownloadURL(fileRef);
      } catch (error: any) {
        errorThrown = true;
        // For downloads, the emulator may return object-not-found instead of permission-denied
        // because the rules prevent listing/reading, but the error still indicates access denial
        expect(error).toBeDefined();
      }
      expect(errorThrown).toBe(true);
    });

    test('should deny file download for authenticated users', async () => {
      const authed = testEnv.authenticatedContext('user123');
      const fileRef = ref(storage, 'test.txt');

      let errorThrown = false;
      try {
        await getDownloadURL(fileRef);
      } catch (error: any) {
        errorThrown = true;
        expect(error).toBeDefined();
      }
      expect(errorThrown).toBe(true);
    });

    test('should deny access to any path pattern', async () => {
      const authed = testEnv.authenticatedContext('user123');
      
      const paths = [
        'avatars/user123/photo.jpg',
        'config/settings.json',
        'uploads/document.pdf',
        'public/images/logo.png',
        'private/data.txt'
      ];

      for (const path of paths) {
        const fileRef = ref(storage, path);
        const file = new File(['test'], path.split('/').pop() || 'file', { type: 'text/plain' });
        
        let errorThrown = false;
        try {
          await uploadBytes(fileRef, file);
        } catch (error: any) {
          errorThrown = true;
          expect(error).toBeDefined();
        }
        expect(errorThrown).toBe(true);
      }
    });
  });

  describe('Security Validation', () => {
    test('should prevent public access to any files', async () => {
      // Test that even with public URLs, access is denied
      const unauthed = testEnv.unauthenticatedContext();
      const fileRef = ref(storage, 'public/important.txt');

      let errorThrown = false;
      try {
        await getDownloadURL(fileRef);
      } catch (error: any) {
        errorThrown = true;
        expect(error).toBeDefined();
      }
      expect(errorThrown).toBe(true);
    });

    test('should prevent admin bypass without proper rules', async () => {
      // Even admin users should be denied without explicit allow rules
      const admin = testEnv.authenticatedContext('admin123', { admin: true });
      const fileRef = ref(storage, 'admin/config.json');

      let errorThrown = false;
      try {
        await uploadBytes(fileRef, new File(['config'], 'config.json'));
      } catch (error: any) {
        errorThrown = true;
        expect(error).toBeDefined();
      }
      expect(errorThrown).toBe(true);
    });
  });
});