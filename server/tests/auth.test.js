const request = require('supertest');
const admin = require('firebase-admin');
const axios = require('axios');
const app = require('../app');

const { verifyIdToken, get, users } = admin.__mocks;

describe('Firebase Auth JWT middleware', () => {
  beforeEach(() => {
    verifyIdToken.mockReset();
    get.mockReset();
  });

  it('rejects requests with no Authorization header (401)', async () => {
    const res = await request(app).get('/api/journal/history');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/missing token/i);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('rejects a non-Bearer Authorization header (401)', async () => {
    const res = await request(app).get('/api/journal/history').set('Authorization', 'Basic abc123');
    expect(res.status).toBe(401);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it('rejects an invalid / expired token (401)', async () => {
    verifyIdToken.mockRejectedValueOnce(new Error('Firebase ID token has expired'));

    const res = await request(app)
      .get('/api/journal/history')
      .set('Authorization', 'Bearer not-a-real-jwt');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid token/i);
    expect(verifyIdToken).toHaveBeenCalledWith('not-a-real-jwt');
    expect(get).not.toHaveBeenCalled();
  });

  it('allows a valid mocked token and scopes Firestore access to its uid', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'user-123' });
    get.mockResolvedValueOnce({
      docs: [{ id: 'e1', data: () => ({ mood: 'calm', timestamp: '2026-01-01T00:00:00.000Z' }) }],
    });

    const res = await request(app)
      .get('/api/journal/history')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: 'e1', mood: 'calm', timestamp: '2026-01-01T00:00:00.000Z' },
    ]);
    expect(users.doc).toHaveBeenCalledWith('user-123');
  });

  it('returns 500 (not a crash) when Firestore fails for an authenticated user', async () => {
    verifyIdToken.mockResolvedValueOnce({ uid: 'user-123' });
    get.mockRejectedValueOnce(new Error('firestore unavailable'));

    const res = await request(app)
      .get('/api/journal/history')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/failed to fetch journal history/i);
  });
});

describe('GET /api/signed-url (ElevenLabs, mocked)', () => {
  beforeEach(() => {
    verifyIdToken.mockReset();
    axios.get.mockReset();
    verifyIdToken.mockResolvedValue({ uid: 'user-123' });
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/signed-url');
    expect(res.status).toBe(401);
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('returns the signed URL from ElevenLabs without exposing the API key', async () => {
    axios.get.mockResolvedValueOnce({ data: { signed_url: 'wss://example.test/signed' } });

    const res = await request(app).get('/api/signed-url').set('Authorization', 'Bearer ok');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ signedUrl: 'wss://example.test/signed' });
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('agent_id=test-agent-id'),
      { headers: { 'xi-api-key': 'test-xi-api-key' } }
    );
    expect(JSON.stringify(res.body)).not.toContain('test-xi-api-key');
  });

  it('returns 502 when ElevenLabs is down', async () => {
    axios.get.mockRejectedValueOnce(new Error('ECONNRESET'));

    const res = await request(app).get('/api/signed-url').set('Authorization', 'Bearer ok');

    expect(res.status).toBe(502);
    expect(res.body.error).toMatch(/elevenlabs/i);
  });
});
