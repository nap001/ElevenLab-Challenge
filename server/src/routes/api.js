const express = require('express');
const axios = require('axios');
const { verifyToken } = require('../middleware/auth');
const { analyzeTranscript } = require('../services/geminiService');
const { saveJournalEntry, getJournalEntries } = require('../services/journalService');

const router = express.Router();

// ── GET /api/signed-url ────────────────────────────────────────────────────
// Returns a short-lived ElevenLabs signed WebSocket URL so the client can
// start a conversation without exposing the xi-api-key in the browser.
router.get('/signed-url', verifyToken, async (req, res) => {
  const { AGENT_ID, XI_API_KEY } = process.env;

  if (!AGENT_ID || !XI_API_KEY) {
    return res.status(500).json({ error: 'Server misconfiguration: missing ElevenLabs credentials' });
  }

  try {
    const { data } = await axios.get(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`,
      { headers: { 'xi-api-key': XI_API_KEY } }
    );
    res.json({ signedUrl: data.signed_url });
  } catch (error) {
    const detail = error.response?.data ?? error.message;
    console.error('[ElevenLabs] Signed-URL error:', JSON.stringify(detail, null, 2));
    res.status(502).json({ error: 'Failed to fetch signed URL from ElevenLabs', detail });
  }
});

// ── POST /api/journal/analyze ──────────────────────────────────────────────
// Accepts a voice transcript, runs Gemini analysis, and persists the entry.
router.post('/journal/analyze', verifyToken, async (req, res) => {
  const { transcript } = req.body;

  if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
    return res.status(400).json({ error: 'Request body must include a non-empty "transcript" string.' });
  }

  try {
    const analysis = await analyzeTranscript(transcript);
    const entry = await saveJournalEntry(req.uid, { transcript, ...analysis });
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    console.error('[Journal] Analysis/save failed:', error.message);
    res.status(500).json({ error: 'Failed to analyse journal entry.' });
  }
});

// ── GET /api/journal/history ───────────────────────────────────────────────
// Returns all journal entries for the authenticated user, newest first.
router.get('/journal/history', verifyToken, async (req, res) => {
  try {
    const history = await getJournalEntries(req.uid);
    res.json(history);
  } catch (error) {
    console.error('[Journal] History fetch failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch journal history.' });
  }
});

module.exports = router;
