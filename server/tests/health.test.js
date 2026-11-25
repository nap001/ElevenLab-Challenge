const request = require('supertest');
const app = require('../app');

describe('GET /health', () => {
  it('returns 200 with { status: "ok" }', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('does not require authentication', async () => {
    const res = await request(app).get('/health').set('Authorization', '');
    expect(res.status).toBe(200);
  });
});

describe('unknown routes', () => {
  it('returns a JSON 404', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});
