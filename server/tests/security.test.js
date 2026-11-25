const request = require('supertest');
const app = require('../app');

describe('Helmet security headers', () => {
  it('sets the standard hardening headers and hides x-powered-by', async () => {
    const res = await request(app).get('/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['strict-transport-security']).toMatch(/max-age=/);
    expect(res.headers['content-security-policy']).toMatch(/default-src 'self'/);
    expect(res.headers['referrer-policy']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('also applies headers to error responses', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('CORS', () => {
  it('echoes an allowed origin', async () => {
    const res = await request(app).get('/api/journal/history').set('Origin', 'http://localhost:5173');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('does not grant access to a disallowed origin', async () => {
    const res = await request(app).get('/api/journal/history').set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.status).toBe(500); // existing handler turns the CORS error into a 500
  });
});

describe('IP rate limiting on /api', () => {
  it('allows 100 requests per window, then answers 429', async () => {
    // Fresh app => fresh in-memory limiter, independent of other tests.
    let freshApp;
    jest.isolateModules(() => {
      freshApp = require('../app');
    });

    // Unauthenticated calls return 401 immediately but still count toward the limit.
    for (let i = 1; i <= 100; i++) {
      const res = await request(freshApp).get('/api/journal/history');
      expect(res.status).toBe(401);
      if (i === 1) expect(res.headers['ratelimit-limit']).toBe('100');
    }

    const limited = await request(freshApp).get('/api/journal/history');
    expect(limited.status).toBe(429);
    expect(limited.body).toEqual({ error: 'Too many requests. Please try again later.' });
    expect(limited.headers['retry-after']).toBeDefined();

    // The health probe lives outside /api and must never be throttled.
    const health = await request(freshApp).get('/health');
    expect(health.status).toBe(200);
  });
});
