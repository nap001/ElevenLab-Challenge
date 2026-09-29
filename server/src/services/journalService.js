const { db } = require('../config/firebase');

const JOURNAL_ENTRIES = 'journal_entries';
const USERS = 'users';

/**
 * Returns a Firestore reference to a user's journal entries subcollection.
 * @param {string} uid
 */
function journalRef(uid) {
  return db.collection(USERS).doc(uid).collection(JOURNAL_ENTRIES);
}

/**
 * Saves a journal entry for the given user.
 * @param {string} uid
 * @param {{ transcript: string, mood: string, summary: string, advice: string }} analysis
 * @returns {Promise<object>} The saved entry including its generated timestamp.
 */
async function saveJournalEntry(uid, analysis) {
  const entry = {
    timestamp: new Date().toISOString(),
    ...analysis,
  };
  await journalRef(uid).add(entry);
  return entry;
}

/**
 * Retrieves all journal entries for a user, newest first.
 * @param {string} uid
 * @returns {Promise<Array<object>>}
 */
async function getJournalEntries(uid) {
  const snapshot = await journalRef(uid).orderBy('timestamp', 'desc').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

module.exports = { saveJournalEntry, getJournalEntries };
