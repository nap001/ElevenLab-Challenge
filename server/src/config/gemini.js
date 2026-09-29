const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Pre-configured Gemini generative model.
 * Model name kept in one place so it is easy to update.
 */
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

module.exports = { model };
