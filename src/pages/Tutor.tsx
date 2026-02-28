import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useAI } from '@/hooks/useAI'
import { AIDebugPanel } from '@/components/AIDebugPanel'

type Message = { role: 'user' | 'assistant'; content: string }

export default function Tutor() {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const { request, cancel, loading, debugInfo, showDebug, setShowDebug, isSlow } = useAI()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
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

    try {
      // Use useAI hook's request
      const data = await request('chat', {
        history: messages.map((m) => ({ role: m.role, content: m.content })),
        message: text,
      })

      const reply = data?.reply ?? data?.message ?? ''
      if (reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
        if (user?.id) {
          await supabase.from('chat_messages').insert({ user_id: user.id, role: 'assistant', content: reply })
        }
      }
    } catch (err: any) {
      console.error(err)
      setMessages((prev) => [...prev, { role: 'assistant', content: t('tutor.error') }])
    }
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)] relative">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{t('tutor.title')}</h1>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-[10px] opacity-50 hover:opacity-100 bg-muted/10 px-3 py-1 rounded-full font-bold transition-all"
        >
          DEBUG
        </button>
      </div>
      <p className="text-[rgb(var(--muted))] text-sm mb-4">{t('tutor.desc')}</p>

      <div className="flex-1 overflow-y-auto rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 space-y-4 min-h-0 shadow-sm transition-all duration-300">
        {messages.length === 0 && (
          <div className="text-center text-[rgb(var(--muted))] py-8 italic">{t('tutor.start_msg')}</div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${m.role === 'user'
                ? 'bg-[rgb(var(--accent))] text-white rounded-tr-none'
                : 'bg-[rgb(var(--bg))] border border-[rgb(var(--border))] rounded-tl-none'
                }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex flex-col gap-2">
            <div className="flex justify-start animate-pulse">
              <div className="rounded-2xl rounded-tl-none px-4 py-2 bg-[rgb(var(--bg))] border border-[rgb(var(--border))] text-[rgb(var(--muted))] flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-xs font-medium">{t('tutor.typing')}</span>
              </div>
            </div>
            {isSlow && (
              <div className="flex flex-col items-center gap-2 py-4 animate-in fade-in zoom-in">
                <p className="text-xs text-yellow-600 font-medium animate-bounce">
                  {language === 'Turkish' ? 'Hala hazırlanıyor, az kaldı...' : 'Still preparing, almost there...'}
                </p>
                <button
                  onClick={cancel}
                  className="text-[10px] text-muted-foreground hover:text-red-500 bg-muted/10 px-3 py-1.5 rounded-full font-medium transition-colors"
                >
                  {language === 'Turkish' ? 'Yanıltmayı Durdur' : 'Stop Thinking'}
                </button>
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 shadow-inner focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          placeholder={t('tutor.placeholder')}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-3 rounded-xl bg-[rgb(var(--accent))] text-white font-bold shadow-lg disabled:opacity-50 hover:brightness-110 active:scale-95 transition-all"
        >
          {t('tutor.send')}
        </button>
      </form>

      {showDebug && <AIDebugPanel debugInfo={debugInfo} onClose={() => setShowDebug(false)} />}
    </div>
  )
}
