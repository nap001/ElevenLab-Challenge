const request = require('supertest');
const admin = require('firebase-admin');
const { GoogleGenerativeAI, __mocks: gemini } = require('@google/generative-ai');
const { analyzeTranscript } = require('../src/services/geminiService');
const app = require('../app');

const { verifyIdToken, add } = admin.__mocks;
const { generateContent } = gemini;

// Models known to be retired/unavailable on the Gemini API.
const RETIRED_MODELS = [
  'gemini-pro',
  'gemini-1.0-pro',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
];

describe('Gemini model configuration', () => {
  const originalKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_MODEL;

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalKey;
    if (originalModel === undefined) {
      delete process.env.GEMINI_MODEL;
    } else {
      process.env.GEMINI_MODEL = originalModel;
    }
  });

  it('uses an active (non-retired) default Gemini model', () => {
    delete process.env.GEMINI_MODEL;
    let config;
    jest.isolateModules(() => {
      config = require('../src/config/gemini');
    });

    expect(config.GEMINI_MODEL).toMatch(/^gemini-[\w.-]+$/);
    expect(RETIRED_MODELS).not.toContain(config.GEMINI_MODEL);
  });

  it('passes the configured GEMINI_MODEL env override to the SDK', () => {
    process.env.GEMINI_MODEL = 'gemini-custom-test';
    const getGenerativeModel = jest.fn(() => ({ generateContent: jest.fn() }));
    GoogleGenerativeAI.mockImplementationOnce(() => ({ getGenerativeModel }));

    let config;
    jest.isolateModules(() => {
      config = require('../src/config/gemini');
    });

    expect(config.GEMINI_MODEL).toBe('gemini-custom-test');
    expect(getGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-custom-test' });
  });

  it('throws immediately at boot when GEMINI_API_KEY is missing', () => {
    delete process.env.GEMINI_API_KEY;
    expect(() => {
      jest.isolateModules(() => {
        require('../src/config/gemini');
      });
    }).toThrow(/GEMINI_API_KEY/);
  });
});

describe('Upstream 404 / retired Gemini model handling', () => {
  beforeEach(() => {
    verifyIdToken.mockReset();
    verifyIdToken.mockResolvedValue({ uid: 'user-123' });
    generateContent.mockReset();
    add.mockReset();
  });

  it('fails fast without retrying when Gemini returns 404 model not found', async () => {
    const modelNotFound = new Error(
      '[404 Not Found] This model is no longer available. Please update your code.'
    );
    generateContent.mockRejectedValue(modelNotFound);

    jest.useFakeTimers();
    jest.spyOn(global, 'setTimeout');
    try {
      await expect(analyzeTranscript('Checking model availability')).rejects.toThrow('404 Not Found');
      expect(generateContent).toHaveBeenCalledTimes(1);
      expect(setTimeout).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('returns 500 and writes nothing to Firestore when the Gemini model is unavailable', async () => {
    generateContent.mockRejectedValueOnce(
      new Error('[404 Not Found] This model is no longer available.')
    );

    const res = await request(app)
      .post('/api/journal/analyze')
      .set('Authorization', 'Bearer valid-token')
      .send({ transcript: 'Had a calm walk today.' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to analyse journal entry.' });
    expect(add).not.toHaveBeenCalled();
  });
});
