import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { callGemini } from '@/lib/api'

type Message = { role: 'user' | 'assistant'; content: string }

export default function Tutor() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
      if (data?.length) setMessages(data as Message[])
    }
    load()
  }, [user?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    const userMsg: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    if (user?.id) {
      await supabase.from('chat_messages').insert({ user_id: user.id, role: 'user', content: text })
    }
    setLoading(true)
    try {
      const res = await callGemini('chat', {
        history: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        message: text,
      })
      if (!res.ok) throw new Error('Yanıt alınamadı')
      const data = await res.json()
      const reply = data.reply ?? data.message ?? ''
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
      if (user?.id && reply) {
        await supabase.from('chat_messages').insert({ user_id: user.id, role: 'assistant', content: reply })
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Bir hata oluştu. Tekrar dene.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-bold mb-4">AI Öğretmen</h1>
      <p className="text-[rgb(var(--muted))] text-sm mb-4">Sorularını sor veya konu anlatımı iste. Türkçe yanıt verir.</p>

      <div className="flex-1 overflow-y-auto rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-[rgb(var(--muted))] py-8">Mesaj yazarak başla.</div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-[rgb(var(--accent))] text-white'
                  : 'bg-[rgb(var(--bg))] border border-[rgb(var(--border))]'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg px-4 py-2 bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-[rgb(var(--muted))]">
              Yazıyor...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-2"
          placeholder="Sorunu veya konuyu yaz..."
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 rounded-lg bg-[rgb(var(--accent))] text-white font-medium disabled:opacity-50"
        >
          Gönder
        </button>
      </form>
    </div>
  )
}
