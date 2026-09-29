const admin = require('firebase-admin');

/**
 * Initialises Firebase Admin SDK once.
 * In production the service-account credentials are written to disk
 * from the GOOGLE_CREDENTIALS_JSON env variable before this module loads.
 */
function initFirebase() {
  if (admin.apps.length > 0) return; // already initialised

  const serviceAccount = require('../../service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

initFirebase();

const db = admin.firestore();

module.exports = { admin, db };
