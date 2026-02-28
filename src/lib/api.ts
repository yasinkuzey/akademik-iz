import { Capacitor } from '@capacitor/core'
import { supabase } from './supabase'

const isNative = Capacitor.isNativePlatform()
const API_BASE = isNative ? 'http://10.0.2.2:3001/api' : '/api'

export interface GeminiResponse<T = any> {
  data: T;
  _debug?: {
    requestId: string;
    timings: {
      rateLimit: number;
      validation: number;
      promptBuild: number;
      geminiApi: number;
      postProcess: number;
      totalServer: number;
    };
    clientTimings?: {
      t0: number; // Click
      t1: number; // Fetch Start
      t2: number; // Response Received
      t3: number; // JSON Parsed
      totalClient: number;
    };
  };
}

export async function callGemini(
  action: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
  debug: boolean = false
): Promise<GeminiResponse> {
  const t1 = performance.now();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (debug) headers['x-debug'] = '1';

  // Get Supabase token
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`${API_BASE}/gemini`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, ...body }),
    signal
  });

  const t2 = performance.now();

  if (!res.ok) {
    let errMsg = 'AI servisi hata verdi';
    try {
      const err = await res.json();
      errMsg = err.details || err.error || errMsg;
    } catch (e) {
      if (res.status === 401) errMsg = 'Oturum geçersiz. Lütfen tekrar giriş yapın.';
      if (res.status === 429) errMsg = 'Çok fazla istek. Lütfen biraz bekleyin.';
    }
    throw new Error(errMsg);
  }

  const data = await res.json();
  const t3 = performance.now();

  if (data._debug) {
    data._debug.clientTimings = {
      t0: 0, // Assigned by hook
      t1: Math.round(t1),
      t2: Math.round(t2),
      t3: Math.round(t3),
      totalClient: Math.round(t3 - t1)
    };
  }

  return { data, _debug: data._debug };
}
