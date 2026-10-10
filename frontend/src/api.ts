import { Amplify } from 'aws-amplify';
import { fetchAuthSession, getCurrentUser, signIn, signOut, signUp, confirmSignUp } from 'aws-amplify/auth';
import type { Place } from './types';
const env = import.meta.env;
export const demoMode = env.DEV && !env.VITE_API_URL;
export const authConfigured = Boolean(env.VITE_USER_POOL_ID && env.VITE_USER_POOL_CLIENT_ID);
if (authConfigured) Amplify.configure({ Auth: { Cognito: { userPoolId: env.VITE_USER_POOL_ID, userPoolClientId: env.VITE_USER_POOL_CLIENT_ID, loginWith: { email: true } } } });
let demoToken = '';
export class ApiError extends Error { constructor(public code: string, public status = 0) { super(code); } }
async function request<T>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  const base = env.VITE_API_URL?.replace(/\/$/, '') || (demoMode ? '/api' : '');
  if (!base) throw new ApiError('setup');
  let token = demoToken;
  if (method !== 'GET' && !path.startsWith('/dev/')) {
    if (!demoMode) { try { token = (await fetchAuthSession()).tokens?.idToken?.toString() || ''; } catch { throw new ApiError('sign_in_required', 401); } }
    if (!token) throw new ApiError('sign_in_required', 401);
  }
  try {
    const res = await fetch(base + path, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: signal || AbortSignal.timeout(15000) });
    const data = await res.json();
    if (!res.ok) throw new ApiError(data.error || 'server_error', res.status);
    return data;
  } catch (error) { if (error instanceof ApiError || (error instanceof DOMException && error.name === 'AbortError')) throw error; throw new ApiError('network_error'); }
}
export const api = {
  list: (signal?: AbortSignal) => request<Place[]>('/places', 'GET', undefined, signal),
  create: (body: unknown) => request<Place>('/places', 'POST', body),
  vote: (id: string, type: 'confirm' | 'report', reason = '') => request<Place>(`/places/${encodeURIComponent(id)}/${type}`, 'POST', { reason }),
  async loginDemo(userId: string) { const res = await request<{ token: string; userId: string }>('/dev/session', 'POST', { userId }); demoToken = res.token; return res.userId; },
  async user() { if (!authConfigured) return null; try { return (await getCurrentUser()).signInDetails?.loginId || 'Contributor'; } catch { return null; } },
  async logout() { demoToken = ''; if (authConfigured) await signOut(); },
  async login(email: string, password: string) { const result = await signIn({ username: email, password }); if (!result.isSignedIn) throw new ApiError('auth_error'); return email; },
  async register(email: string, password: string) { await signUp({ username: email, password, options: { userAttributes: { email } } }); },
  async verify(email: string, code: string) { await confirmSignUp({ username: email, confirmationCode: code }); }
};
