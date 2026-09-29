/**
 * Centralised API client.
 *
 * Wraps axios with the backend base URL and provides a helper to
 * build authenticated request headers from a Firebase user object.
 */
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
});

/**
 * Returns an Authorization header object containing a fresh Firebase ID token.
 * @param {import('firebase/auth').User} user
 * @returns {Promise<{ Authorization: string }>}
 */
export async function getAuthHeaders(user) {
  if (!user) throw new Error('getAuthHeaders: user is not authenticated.');
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

/**
 * Fetches a short-lived ElevenLabs signed WebSocket URL.
 * @param {import('firebase/auth').User} user
 * @returns {Promise<string>} The signed URL.
 */
export async function fetchSignedUrl(user) {
  const headers = await getAuthHeaders(user);
  const { data } = await apiClient.get('/api/signed-url', { headers });
  return data.signedUrl;
}

/**
 * Sends a transcript for Gemini analysis and saves the result.
 * @param {import('firebase/auth').User} user
 * @param {string} transcript
 * @returns {Promise<object>} The saved journal entry.
 */
export async function analyzeJournal(user, transcript) {
  const headers = await getAuthHeaders(user);
  const { data } = await apiClient.post('/api/journal/analyze', { transcript }, { headers });
  return data;
}

/**
 * Fetches the authenticated user's journal history.
 * @param {import('firebase/auth').User} user
 * @returns {Promise<Array<object>>}
 */
export async function fetchHistory(user) {
  const headers = await getAuthHeaders(user);
  const { data } = await apiClient.get('/api/journal/history', { headers });
  return data;
}
