// Global mocks for every third-party service the backend talks to.
// Registered via jest `setupFilesAfterEnv`, so no test can reach the network.
// Handles to the mock functions are exposed through `__mocks` on each module.

// ── Firebase Admin (Auth + Firestore) ────────────────────────────────────────
jest.mock('firebase-admin', () => {
  const verifyIdToken = jest.fn();
  const add = jest.fn();
  const get = jest.fn();

  // db.collection('users').doc(uid).collection('journal_entries')[.orderBy()].get()
  const query = { get };
  query.orderBy = jest.fn(() => query);
  const entries = { add, orderBy: query.orderBy };
  const userDoc = { collection: jest.fn(() => entries) };
  const users = { doc: jest.fn(() => userDoc) };
  const firestore = { collection: jest.fn(() => users) };

  return {
    apps: [],
    initializeApp: jest.fn(),
    credential: { cert: jest.fn() },
    auth: () => ({ verifyIdToken }),
    firestore: () => firestore,
    __mocks: { verifyIdToken, add, get, users, userDoc, entries, orderBy: query.orderBy },
  };
});

// src/config/firebase.js requires this file, which is git-ignored (absent in CI).
jest.mock(
  '../service-account.json',
  () => ({ type: 'service_account', project_id: 'test-project' }),
  { virtual: true }
);

// ── Google Gemini ────────────────────────────────────────────────────────────
jest.mock('@google/generative-ai', () => {
  const generateContent = jest.fn();
  return {
    GoogleGenerativeAI: jest.fn(() => ({
      getGenerativeModel: jest.fn(() => ({ generateContent })),
    })),
    __mocks: { generateContent },
  };
});

// ── ElevenLabs (called through axios) ────────────────────────────────────────
jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn() }));

// Keep test output readable; the app logs expected errors on purpose.
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
