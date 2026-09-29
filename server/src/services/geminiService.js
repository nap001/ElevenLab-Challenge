const { model } = require('../config/gemini');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

/**
 * Waits for a given number of milliseconds.
 * @param {number} ms
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Strips a Gemini text response of markdown code fences and parses it as JSON.
 * @param {string} text - Raw text from Gemini.
 * @returns {{ mood: string, summary: string, advice: string }}
 */
function parseGeminiJson(text) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Sends a transcript to Gemini for mood/summary/advice analysis.
 * Retries up to MAX_RETRIES times on 503 overload errors.
 *
 * @param {string} transcript - The voice journal transcript text.
 * @returns {Promise<{ mood: string, summary: string, advice: string }>}
 */
async function analyzeTranscript(transcript) {
  // Sanitise input: strip characters that could break the JSON prompt
  const sanitised = transcript.replace(/["`\\]/g, '').trim();

  const prompt = [
    'You are a wellness journaling assistant.',
    'Analyse the following journal transcript and respond ONLY with valid JSON',
    '(no markdown fences) in this exact shape:',
    '{ "mood": "<single word>", "summary": "<2-3 sentences>", "advice": "<1-2 actionable sentences>" }',
    '',
    `Transcript: """${sanitised}"""`,
  ].join('\n');

  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return parseGeminiJson(text);
    } catch (err) {
      lastError = err;
      const isOverload = err.message.includes('503') || err.message.includes('overloaded');
      if (isOverload && attempt < MAX_RETRIES) {
        const wait = attempt * RETRY_DELAY_MS;
        console.warn(`[Gemini] Attempt ${attempt}/${MAX_RETRIES} overloaded — retrying in ${wait / 1000}s`);
        await sleep(wait);
      } else {
        break;
      }
    }
  }

  throw lastError;
}

module.exports = { analyzeTranscript };
