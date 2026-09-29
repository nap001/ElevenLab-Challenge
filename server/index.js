/**
 * Entry point for the DEEP-SYNC backend server.
 *
 * Responsibilities:
 *  - Bootstrap environment variables
 *  - Write the service-account file in production (if env var is set)
 *  - Configure Express with security middleware
 *  - Mount API routes
 *  - Start the HTTP server
 */

'use strict';

require('dotenv').config();

const fs = require('fs');

// In production environments (e.g. Render, Railway) the service-account JSON
// is stored as a secret env var to avoid committing it to the repo.
if (process.env.GOOGLE_CREDENTIALS_JSON) {
  console.log('[Boot] Writing service-account.json from environment variable...');
  fs.writeFileSync('./service-account.json', process.env.GOOGLE_CREDENTIALS_JSON);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const apiRouter = require('./src/routes/api');

const app = express();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
// Restrict to the known client origins. Adjust ALLOWED_ORIGIN in .env for prod.
const allowedOrigins = (process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server or same-origin requests (no Origin header)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin "${origin}" not allowed`));
      }
    },
  })
);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50kb' })); // reject unreasonably large payloads

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api', limiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`[Server] Backend running on port ${PORT}`);
});