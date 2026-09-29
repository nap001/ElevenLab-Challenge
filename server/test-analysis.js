/**
 * test-analysis.js
 * Run with: node test-analysis.js
 *
 * Directly tests:
 *  1. Gemini 2.0 Flash (VertexAI) — journal analysis
 *  2. Firestore — saving the entry under a test user
 *  3. Firestore — reading it back
 *
 * No HTTP server or auth token needed.
 */

require('dotenv').config();

// ── Firebase Admin ─────────────────────────────────────────────────────────
const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ── Gemini (Google AI Studio) ─────────────────────────────────────────────
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });

// ── Test Data ──────────────────────────────────────────────────────────────
const TEST_USER_ID = 'test-user-script';
const SAMPLE_TRANSCRIPT = `
  I've been feeling really overwhelmed lately with work deadlines piling up.
  I haven't been sleeping well and I've been snapping at people I care about.
  On the bright side, I went for a run this morning and it helped a bit.
  I want to find better ways to manage my stress before it gets worse.
`;

// ── Main Test ──────────────────────────────────────────────────────────────
async function runTest() {
  console.log('\n🧪 DEEP-SYNC Backend Test\n' + '-'.repeat(40));

  // ── Step 1: Gemini Analysis ──────────────────────────────────────────────
  console.log('\n[1/3] Sending transcript to Gemini 2.0 Flash...');
  let analysis;
  try {
    const prompt = `Analyze this journal: "${SAMPLE_TRANSCRIPT}". Return JSON with mood, summary, advice.`;

    // Retry up to 3 times on 503 overload errors
    let text;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        text = result.response.text();
        break; // success — exit retry loop
      } catch (err) {
        if (err.message.includes('503') && attempt < 3) {
          const wait = attempt * 5000;
          console.log(`     [Attempt ${attempt}/3] Model overloaded, retrying in ${wait / 1000}s...`);
          await new Promise(r => setTimeout(r, wait));
        } else {
          throw err; // give up
        }
      }
    }

    analysis = JSON.parse(text.replace(/```json|```/g, '').trim());

    console.log('     Gemini response:');
    console.log('        mood    :', analysis.mood);
    console.log('        summary :', analysis.summary?.slice(0, 80) + '...');
    console.log('        advice  :', analysis.advice?.slice(0, 80) + '...');
    console.log('     PASS: Gemini analysis OK');
  } catch (err) {
    console.error('     FAIL: Gemini failed:', err.message);
    process.exit(1);
  }

  // ── Step 2: Save to Firestore ────────────────────────────────────────────
  console.log('\n[2/3] Saving entry to Firestore (users/' + TEST_USER_ID + '/journal_entries)...');
  const entry = {
    timestamp: new Date().toISOString(),
    transcript: SAMPLE_TRANSCRIPT.trim(),
    ...analysis,
  };
  let docRef;
  try {
    docRef = await db
      .collection('users')
      .doc(TEST_USER_ID)
      .collection('journal_entries')
      .add(entry);
    console.log('     PASS: Saved with doc ID:', docRef.id);
  } catch (err) {
    console.error('     FAIL: Firestore write failed:', err.message);
    process.exit(1);
  }

  // ── Step 3: Read it back ─────────────────────────────────────────────────
  console.log('\n[3/3] Reading entry back from Firestore...');
  try {
    const snapshot = await db
      .collection('users')
      .doc(TEST_USER_ID)
      .collection('journal_entries')
      .orderBy('timestamp', 'desc')
      .limit(3)
      .get();

    console.log('     Found', snapshot.size, 'entry(s) for test user:');
    snapshot.docs.forEach((doc, i) => {
      const d = doc.data();
      console.log('       [' + (i + 1) + '] ' + d.timestamp + ' -- mood: ' + d.mood);
    });
    console.log('     PASS: Firestore read OK');
  } catch (err) {
    console.error('     FAIL: Firestore read failed:', err.message);
    process.exit(1);
  }

  console.log('\n' + '-'.repeat(40));
  console.log('ALL TESTS PASSED. Backend is working correctly.\n');
  process.exit(0);
}

runTest().catch(err => {
  console.error('\nUnexpected error:', err);
  process.exit(1);
});
