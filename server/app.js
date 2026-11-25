/**
 * Express application definition for the DEEP-SYNC backend.
 *
 * This module only *builds* the app (middleware + routes) and exports it, so
 * it can be imported by Supertest without binding a network port.
 * The HTTP listener lives in index.js.
 *
 * NOTE: process.env must already be populated (dotenv) and, in production,
 * service-account.json already written before this module is required.
 */

'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const apiRouter = require('./src/routes/api');

const app = express();

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ── Health check ─────────────────────────────────────────────────────────────
// Lightweight liveness probe for Docker / orchestrators. Intentionally defined
// before CORS and outside the /api rate limiter so probes are never throttled.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

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

module.exports = app;
