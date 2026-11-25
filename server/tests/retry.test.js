const { __mocks: gemini } = require('@google/generative-ai');
const { analyzeTranscript } = require('../src/services/geminiService');

const { generateContent } = gemini;

const ANALYSIS = { mood: 'calm', summary: 'ok', advice: 'rest' };
const okReply = { response: { text: () => JSON.stringify(ANALYSIS) } };

// Matches geminiService: delay before retry N is N * 5000ms (growing backoff).
const FIRST_DELAY = 5000;
const SECOND_DELAY = 10000;

describe('Gemini retry / backoff', () => {
  beforeEach(() => {
    generateContent.mockReset();
    jest.useFakeTimers();
    jest.spyOn(global, 'setTimeout');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('succeeds first time without waiting', async () => {
    generateContent.mockResolvedValueOnce(okReply);

    await expect(analyzeTranscript('hi')).resolves.toEqual(ANALYSIS);
    expect(generateContent).toHaveBeenCalledTimes(1);
    expect(setTimeout).not.toHaveBeenCalled();
  });

  it('retries transient 503 failures with increasing delays, then succeeds', async () => {
    generateContent
      .mockRejectedValueOnce(new Error('[503 Service Unavailable] model is overloaded'))
      .mockRejectedValueOnce(new Error('The model is overloaded. Please try again later.'))
      .mockResolvedValueOnce(okReply);

    const promise = analyzeTranscript('hi');

    await jest.advanceTimersByTimeAsync(0);
    expect(generateContent).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(FIRST_DELAY - 1);
    expect(generateContent).toHaveBeenCalledTimes(1); // still waiting
    await jest.advanceTimersByTimeAsync(1);
    expect(generateContent).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(SECOND_DELAY - 1);
    expect(generateContent).toHaveBeenCalledTimes(2); // second wait is longer
    await jest.advanceTimersByTimeAsync(1);

    await expect(promise).resolves.toEqual(ANALYSIS);
    expect(generateContent).toHaveBeenCalledTimes(3);

    const delays = setTimeout.mock.calls.map((c) => c[1]);
    expect(delays).toEqual([FIRST_DELAY, SECOND_DELAY]);
    expect(delays[1]).toBeGreaterThan(delays[0]);
  });

  it('gives up after max retries and surfaces the last upstream error', async () => {
    generateContent.mockRejectedValue(new Error('[503 Service Unavailable] overloaded'));

    const promise = analyzeTranscript('hi');
    const assertion = expect(promise).rejects.toThrow('503');

    await jest.advanceTimersByTimeAsync(FIRST_DELAY + SECOND_DELAY);
    await assertion;

    expect(generateContent).toHaveBeenCalledTimes(3); // MAX_RETRIES
    expect(setTimeout).toHaveBeenCalledTimes(2); // no wait after the final attempt
  });

  it('does not retry non-transient errors', async () => {
    generateContent.mockRejectedValue(new Error('[400 Bad Request] invalid API key'));

    await expect(analyzeTranscript('hi')).rejects.toThrow('400');
    expect(generateContent).toHaveBeenCalledTimes(1);
    expect(setTimeout).not.toHaveBeenCalled();
  });
});
