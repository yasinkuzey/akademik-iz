import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { callGemini } from '@/lib/api'

const SUBJECTS = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Tarih', 'Coğrafya', 'Diğer']

export type QuizQuestion = { question: string; correctAnswer: string; order: number }

export default function StudyNew() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<'form' | 'quiz' | 'result'>('form')
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [hours, setHours] = useState(1)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ passed: boolean; correctCount: number; feedback: { index: number; correct: boolean; correctAnswer: string }[] } | null>(null)

  const handleGenerateQuestions = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await callGemini('generate_questions', { subject, topic, hours })
      if (!res.ok) throw new Error('Soru üretilemedi')
      const data = await res.json()
      setQuestions(data.questions ?? [])
      setAnswers({})
      setStep('quiz')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await callGemini('evaluate_answers', {
        questions: questions.map((q) => ({ question: q.question, correctAnswer: q.correctAnswer })),
        answers: questions.map((_, i) => answers[i] ?? ''),
      })
      if (!res.ok) throw new Error('Değerlendirme yapılamadı')
      const data = await res.json()
      const correctCount = data.correctCount ?? 0
      const feedback = data.feedback ?? []
      const passed = correctCount >= 3
      setResult({ passed, correctCount, feedback })

      if (user?.id) {
        const { data: sessionData, error: sessionErr } = await supabase
          .from('study_sessions')
          .insert({
            user_id: user.id,
            subject,
            topic,
            hours,
            passed_quiz: passed,
          })
          .select('id')
          .single()
        if (sessionErr) {
          setError('Çalışma kaydedilemedi: ' + (sessionErr.message || 'Bilinmeyen hata'))
        } else if (sessionData?.id) {
          const { error: questionsErr } = await supabase.from('session_questions').insert(
            questions.map((q, i) => ({
              study_session_id: sessionData.id,
              question_text: q.question,
              user_answer: (answers[i] ?? '').trim(),
              is_correct: feedback[i]?.correct ?? false,
              order_index: i,
            }))
          )
          if (questionsErr) setError('Sorular kaydedilemedi: ' + (questionsErr.message || ''))
          else if (passed) {
            const points = 10 + Math.min(hours * 2, 20)
            await supabase.rpc('increment_user_points', { p_user_id: user.id, p_points: points })
          }
        }
      }
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'quiz' && questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Çalışma Ekle</h1>
        <div className="text-[rgb(var(--muted))]">Soru üretiliyor...</div>
      </div>
    )
  }

  if (step === 'result' && result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Sonuç</h1>
        {result.passed ? (
          <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-4 text-green-700 dark:text-green-400">
            Tebrikler! 4 sorudan {result.correctCount} doğru. Çalışman kaydedildi.
          </div>
        ) : (
          <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400">
            Daha çok çalış. 4 sorudan {result.correctCount} doğru yaptın. En az 3 doğru gerekli; çalışma kaydedilmedi.
          </div>
        )}
        <div>
          <h2 className="font-semibold mb-2">Yanlışların ve doğru cevaplar</h2>
          <ul className="space-y-3">
            {result.feedback.filter((f) => !f.correct).map((f, i) => (
              <li key={i} className="rounded-lg border border-[rgb(var(--border))] p-3 text-sm">
                <p className="font-medium mb-1">Soru: {questions[f.index]?.question}</p>
                <p className="text-red-600">Senin cevabın: {answers[f.index] || '(boş)'}</p>
                <p className="text-green-600">Doğru cevap: {f.correctAnswer}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { setStep('form'); setResult(null); setQuestions([]); }}
            className="px-4 py-2 rounded-lg bg-[rgb(var(--accent))] text-white"
          >
            Yeni çalışma ekle
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-lg border border-[rgb(var(--border))]"
          >
            Ana sayfaya dön
          </button>
        </div>
      </div>
    )
  }

  if (step === 'quiz') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Sorular – {subject}: {topic}</h1>
        {error && <div className="text-red-500 text-sm p-2 rounded bg-red-500/10">{error}</div>}
        <form onSubmit={handleSubmitQuiz} className="space-y-6">
          {questions.map((q, i) => (
            <div key={i} className="rounded-xl border border-[rgb(var(--border))] p-4">
              <p className="font-medium mb-2">{i + 1}. {q.question}</p>
              <input
                type="text"
                value={answers[i] ?? ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2"
                placeholder="Cevabını yaz"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[rgb(var(--accent))] text-white font-medium disabled:opacity-50"
          >
            {loading ? 'Gönderiliyor...' : 'Cevapları gönder'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Çalışma Ekle</h1>
      <p className="text-[rgb(var(--muted))] mb-6">Ders, konu ve süreyi gir. AI 4 soru üretecek; 3 veya 4 doğru yaparsan çalışman kaydedilir.</p>
      <form onSubmit={handleGenerateQuestions} className="space-y-4">
        {error && <div className="text-red-500 text-sm p-2 rounded bg-red-500/10">{error}</div>}
        <div>
          <label className="block text-sm font-medium mb-1">Ders</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2"
            required
          >
            <option value="">Seç</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Konu</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2"
            placeholder="Örn: Faktöriyel"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Kaç saat çalıştın?</label>
          <input
            type="number"
            min={1}
            max={24}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-[rgb(var(--accent))] text-white font-medium disabled:opacity-50"
        >
          {loading ? 'Sorular üretiliyor...' : 'Soruları üret'}
        </button>
      </form>
    </div>
  )
}
