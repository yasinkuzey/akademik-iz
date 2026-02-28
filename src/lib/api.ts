const API_BASE = '/api'

export async function callGemini(action: string, body: Record<string, unknown>): Promise<Response> {
  return fetch(`${API_BASE}/gemini`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  })
}
