// Dummy environment for tests. Runs before any module is loaded, so nothing
// ever needs real credentials or network access.
process.env.NODE_ENV = 'test';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.AGENT_ID = 'test-agent-id';
process.env.XI_API_KEY = 'test-xi-api-key';
process.env.ALLOWED_ORIGIN = 'http://localhost:5173';
delete process.env.GOOGLE_CREDENTIALS_JSON;
