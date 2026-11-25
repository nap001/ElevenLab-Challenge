/**
 * Entry point for the DEEP-SYNC backend server.
 *
 * Responsibilities:
 *  - Bootstrap environment variables
 *  - Write the service-account file in production (if env var is set)
 *  - Start the HTTP server (the Express app itself lives in app.js)
 */

'use strict';

require('dotenv').config();

const fs = require('fs');

// In production environments (e.g. Render, Railway) the service-account JSON
// is stored as a secret env var to avoid committing it to the repo.
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  console.log('[Boot] Writing service-account.json from environment variable...');
  fs.writeFileSync('./service-account.json', process.env.GOOGLE_CREDENTIALS_JSON, { mode: 0o600 });
}

// Required only after the env + credentials file are in place, because the
// route/config modules read them at import time.
const app = require('./app');

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 3001;
const server = app.listen(PORT, () => {
  console.log(`[Server] Backend running on port ${PORT}`);
});

// Graceful shutdown so `docker stop` doesn't have to SIGKILL the process.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`[Server] ${signal} received, shutting down...`);
    server.close(() => process.exit(0));
  });
}
