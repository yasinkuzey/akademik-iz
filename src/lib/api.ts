import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()
const API_BASE = isNative ? 'http://10.0.2.2:3001/api' : '/api'

export async function callGemini(action: string, body: Record<string, unknown>): Promise<Response> {
  return fetch(`${API_BASE}/gemini`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  })
}
