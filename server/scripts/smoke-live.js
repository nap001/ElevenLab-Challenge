/**
 * Live end-to-end smoke check against the real Gemini API and Firestore.
 *
 * Run manually or pre-release (NOT part of offline `npm test`):
 *   npm run test:live
 *
 * Catches issues unit mocks cannot see:
 *   - Retired / 404 Gemini models
 *   - Invalid or expired GEMINI_API_KEY
 *   - Broken Firebase service-account credentials or Firestore rules
 */

'use strict';

const fs = require('fs');
const assert = require('assert');

require('dotenv').config();

if (process.env.GOOGLE_CREDENTIALS_JSON && !fs.existsSync('./service-account.json')) {
  fs.writeFileSync('./service-account.json', process.env.GOOGLE_CREDENTIALS_JSON, { mode: 0o600 });
}

const { GEMINI_MODEL } = require('../src/config/gemini');
const { analyzeTranscript } = require('../src/services/geminiService');
const { db } = require('../src/config/firebase');

const PROBE_UID = 'smoke-test-probe';
const SAMPLE_TRANSCRIPT =
  'I felt a bit tired this morning, went for a short walk outside, and feel much calmer now.';

async function main() {
  let failed = false;

  // 1. Live Gemini conversation analysis
  try {
    const analysis = await analyzeTranscript(SAMPLE_TRANSCRIPT);
    for (const field of ['mood', 'summary', 'advice']) {
      assert.strictEqual(typeof analysis[field], 'string', `Missing string field "${field}"`);
      assert.ok(analysis[field].trim().length > 0, `Empty field "${field}"`);
    }
    console.log(`[PASS] Gemini (${GEMINI_MODEL}): mood="${analysis.mood}"`);
  } catch (err) {
    failed = true;
    console.error(`[FAIL] Gemini (${GEMINI_MODEL}): ${err.message}`);
  }

  // 2. Live Firestore write -> read -> delete cleanup
  const ref = db.collection('users').doc(PROBE_UID).collection('journal_entries');
  let docRef;
  try {
    docRef = await ref.add({
      timestamp: new Date().toISOString(),
      transcript: SAMPLE_TRANSCRIPT,
      mood: 'probe',
      summary: 'smoke test',
      advice: 'smoke test',
    });
    const snap = await ref.orderBy('timestamp', 'desc').limit(1).get();
    assert.ok(snap.size >= 1, 'Expected at least 1 document back from Firestore');
    console.log(`[PASS] Firestore: wrote and read doc ${docRef.id}`);
  } catch (err) {
    failed = true;
    console.error(`[FAIL] Firestore: ${err.message}`);
  } finally {
    if (docRef) {
      await docRef.delete().catch((e) => console.error(`[WARN] Cleanup failed: ${e.message}`));
    }
  }

  process.exit(failed ? 1 : 0);
}

main();
