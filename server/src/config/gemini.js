const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set.');
}

const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
const GEMINI_MODEL = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Pre-configured Gemini generative model.
 * Override with the GEMINI_MODEL environment variable if Google rotates models.
 */
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

module.exports = { model, GEMINI_MODEL, DEFAULT_GEMINI_MODEL };
