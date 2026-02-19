import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { callGemini } from '@/lib/api'

const SUBJECTS = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Tarih', 'Coğrafya', 'Diğer']

export type QuizQuestion = {
  question: string
  options: Record<string, string>
  correctAnswer: string
  order: number
}

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
      if (!res.ok) {
        const errorText = await res.text()
        try {
          const errorJson = JSON.parse(errorText)
          throw new Error(errorJson.error || `Sunucu hatası: ${res.status}`)
        } catch {
          // HTML dönerse (örn 404/500 sayfası) sadece başını göster
          throw new Error(`API Hatası: ${res.status} - ${errorText.slice(0, 50)}...`)
        }
      }

      const data = await res.json()
      if (!data.questions || data.questions.length === 0) throw new Error('AI soru üretemedi, tekrar deneyin.')

      setQuestions(data.questions)
      setAnswers({})
      setStep('quiz')
    } catch (err) {
      console.error(err)
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
      // Local check for multiple choice
      let correctCount = 0
      const feedback = questions.map((q, i) => {
        const userAnswer = answers[i]
        const isCorrect = userAnswer === q.correctAnswer
        if (isCorrect) correctCount++
        return {
          index: i,
          correct: isCorrect,
          correctAnswer: q.correctAnswer // Stores 'A', 'B' etc.
        }
      })

      const passed = correctCount >= 3 // 3 or 4 correct to pass
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
          /* 
             Note: We store user_answer as just the letter 'A', 'B'.
             If you want full text, you can map it back using q.options.
          */
          const { error: questionsErr } = await supabase.from('session_questions').insert(
            questions.map((q, i) => ({
              study_session_id: sessionData.id,
              question_text: q.question,
              user_answer: answers[i] ?? '',
              is_correct: feedback[i].correct,
              order_index: i,
            }))
          )

          if (questionsErr) setError('Sorular kaydedilemedi')
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
            Daha çok çalış. 4 sorudan {result.correctCount} doğru yaptın. Kaydedilmedi.
          </div>
        )}
        <div className="space-y-4">
          <h2 className="font-semibold">Cevap Anahtarı</h2>
          {questions.map((q, i) => {
            const f = result.feedback[i]
            const isCorrect = f?.correct
            const userAnswer = answers[i]
            // Safe access to options in case API returned malformed data (fallback empty object)
            const opts = q.options || {}

            return (
              <div key={i} className={`rounded-lg border p-4 ${isCorrect ? 'border-green-500/30' : 'border-red-500/30'}`}>
                <p className="font-medium mb-2">{i + 1}. {q.question}</p>
                <div className="text-sm space-y-1">
                  <p className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                    Senin Cevabın: <strong>{userAnswer || '-'}</strong> {userAnswer && opts[userAnswer] ? `(${opts[userAnswer]})` : ''}
                  </p>
                  {!isCorrect && (
                    <p className="text-green-600">
                      Doğru Cevap: <strong>{q.correctAnswer}</strong> ({opts[q.correctAnswer]})
                    </p>
                  )}
                </div>
              </div>
            )
          })}
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
        <form onSubmit={handleSubmitQuiz} className="space-y-8">
          {questions.map((q, i) => {
            const opts = q.options || {}
            return (
              <div key={i} className="rounded-xl border border-[rgb(var(--border))] p-6 bg-[rgb(var(--card))]">
                <p className="font-medium text-lg mb-4">{i + 1}. {q.question}</p>
                <div className="space-y-2">
                  {Object.entries(opts).map(([key, val]) => {
                    const isSelected = answers[i] === key
                    return (
                      <div
                        key={key}
                        onClick={() => setAnswers(prev => ({ ...prev, [i]: key }))}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected
                          ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/10'
                          : 'border-[rgb(var(--border))] hover:bg-[rgb(var(--bg-hover))]'
                          }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border ${isSelected ? 'bg-[rgb(var(--accent))] text-white border-[rgb(var(--accent))]' : 'bg-transparent text-[rgb(var(--muted))] border-[rgb(var(--border))]'
                          }`}>
                          {key}
                        </div>
                        <span className="text-sm">{val}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-[rgb(var(--accent))] text-white font-medium hover:opacity-90 transition-opacity"
          >
            Cevapları Tamamla
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
            onFocus={(e) => e.target.select()}
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
