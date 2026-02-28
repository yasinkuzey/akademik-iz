import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/hooks/useLanguage'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useAI } from '@/hooks/useAI'
import { AIDebugPanel } from '@/components/AIDebugPanel'

const SUBJECTS = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Tarih', 'Coğrafya', 'Felsefe', 'İngilizce', 'Diğer']
const SUBJECT_MAP_EN: Record<string, string> = {
  'Matematik': 'Math', 'Fizik': 'Physics', 'Kimya': 'Chemistry', 'Biyoloji': 'Biology',
  'Türkçe': 'Turkish', 'Tarih': 'History', 'Coğrafya': 'Geography', 'Felsefe': 'Philosophy',
  'İngilizce': 'English', 'Diğer': 'Other'
}

export type QuizQuestion = {
  question: string
  options: Record<string, string>
  correctAnswer: string
  order: number
}

export default function StudyNew() {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const { request, cancel, loading, error, debugInfo, showDebug, setShowDebug, isSlow } = useAI()
  const [step, setStep] = useState<'form' | 'quiz' | 'result'>('form')
  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [hours, setHours] = useState<number | ''>('')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [result, setResult] = useState<{ passed: boolean; correctCount: number; feedback: { index: number; correct: boolean; correctAnswer: string }[] } | null>(null)

  const handleGenerateQuestions = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = await request('generate_questions', { subject, topic, hours })
      if (!data?.questions || data.questions.length === 0) throw new Error('AI soru üretemedi, tekrar deneyin.')

      setQuestions(data.questions)
      setAnswers({})
      setStep('quiz')
    } catch (err: any) {
      console.error(err)
    }
  }

  const handleSubmitQuiz = async (e: React.FormEvent) => {
    e.preventDefault()
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
          console.error('Session save error:', sessionErr)
        } else if (sessionData?.id) {
          const { error: questionsErr } = await supabase.from('session_questions').insert(
            questions.map((q, i) => ({
              study_session_id: sessionData.id,
              question_text: q.question,
              user_answer: answers[i] ?? '',
              is_correct: feedback[i].correct,
              order_index: i,
            }))
          )

          if (questionsErr) console.error('Questions save error:', questionsErr)
          else if (passed) {
            const points = 10 + Math.min(Number(hours) * 2, 20)
            await supabase.rpc('increment_user_points', { p_user_id: user.id, p_points: points })
          }
        }
      }
      setStep('result')
    } catch (err: any) {
      console.error(err)
    }
  }

  if (step === 'quiz' && questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20 space-y-6">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xl font-bold animate-pulse">{t('study.generating')}</p>
      </div>
    )
  }

  if (step === 'result' && result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in zoom-in relative">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('study.result_title')}</h1>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-[10px] opacity-50 hover:opacity-100 bg-muted/10 px-3 py-1 rounded-full font-bold transition-all"
          >
            DEBUG
          </button>
        </div>
        {result.passed ? (
          <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-4 text-green-700 dark:text-green-400 font-medium">
            {t('study.result_pass').replace('{count}', result.correctCount.toString())}
          </div>
        ) : (
          <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400 font-medium">
            {t('study.result_fail').replace('{count}', result.correctCount.toString())}
          </div>
        )}
        <div className="space-y-4">
          <h2 className="font-semibold">{t('study.answer_key')}</h2>
          {questions.map((q, i) => {
            const f = result.feedback[i]
            const isCorrect = f?.correct
            const userAnswer = answers[i]
            const opts = q.options || {}

            return (
              <div key={i} className={`rounded-xl border p-4 shadow-sm transition-all ${isCorrect ? 'border-green-500/30 bg-green-50/5' : 'border-red-500/30 bg-red-50/5'}`}>
                <p className="font-medium mb-2">{i + 1}. {q.question}</p>
                <div className="text-sm space-y-1">
                  <p className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                    {t('study.your_answer')}: <strong>{userAnswer || '-'}</strong> {userAnswer && opts[userAnswer] ? `(${opts[userAnswer]})` : ''}
                  </p>
                  {!isCorrect && (
                    <p className="text-green-600">
                      {t('study.correct_answer')}: <strong>{q.correctAnswer}</strong> ({opts[q.correctAnswer]})
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={() => { setStep('form'); setResult(null); setQuestions([]); }}
            className="flex-1 px-4 py-3 rounded-xl bg-[rgb(var(--accent))] text-white font-bold shadow-lg hover:brightness-110 transition-all"
          >
            {t('study.new')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex-1 px-4 py-3 rounded-xl bg-[rgb(var(--secondary))] text-[rgb(var(--secondary-fg))] font-bold shadow-md hover:brightness-95 transition-all"
          >
            {t('study.back')}
          </button>
        </div>
        {showDebug && <AIDebugPanel debugInfo={debugInfo} onClose={() => setShowDebug(false)} />}
      </div>
    )
  }

  if (step === 'quiz') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in relative">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('study.quiz_title')}</h1>
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-[10px] opacity-50 hover:opacity-100 bg-muted/10 px-3 py-1 rounded-full font-bold transition-all"
          >
            DEBUG
          </button>
        </div>
        <p className="text-muted-foreground font-medium">{subject}: {topic}</p>
        <form onSubmit={handleSubmitQuiz} className="space-y-8">
          {questions.map((q, i) => {
            const opts = q.options || {}
            return (
              <div key={i} className="rounded-2xl border border-[rgb(var(--border))] p-6 bg-[rgb(var(--card))] shadow-sm space-y-4">
                <p className="font-bold text-lg leading-relaxed">{i + 1}. {q.question}</p>
                <div className="grid gap-3">
                  {Object.entries(opts).map(([key, val]) => {
                    const isSelected = answers[i] === key
                    return (
                      <div
                        key={key}
                        onClick={() => setAnswers(prev => ({ ...prev, [i]: key }))}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                          ? 'border-[rgb(var(--accent))] bg-[rgb(var(--accent))]/5'
                          : 'border-[rgb(var(--border))] hover:border-[rgb(var(--accent))]/30 hover:bg-accent/5'
                          }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 transition-all ${isSelected ? 'bg-[rgb(var(--accent))] text-white border-[rgb(var(--accent))] shadow-lg' : 'bg-transparent text-[rgb(var(--muted))] border-[rgb(var(--border))]'
                          }`}>
                          {key}
                        </div>
                        <span className="text-base font-medium">{val}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-[rgb(var(--accent))] text-white text-xl font-black shadow-xl hover:brightness-110 active:scale-[0.98] transition-all btn-bounce"
          >
            {t('study.quiz_submit')}
          </button>
        </form>
        {showDebug && <AIDebugPanel debugInfo={debugInfo} onClose={() => setShowDebug(false)} />}
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto animate-in fade-in zoom-in-90 duration-700 relative">
      <div className="flex justify-between items-start mb-4">
        <h1 className="text-2xl font-bold">{t('study.title')}</h1>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-[10px] bg-[rgb(var(--secondary))] text-[rgb(var(--secondary-fg))] px-3 py-1 rounded-full font-bold shadow-sm hover:brightness-95 transition-all"
        >
          DEBUG
        </button>
      </div>
      <p className="text-[rgb(var(--muted))] mb-6">{t('study.desc')}</p>
      <form onSubmit={handleGenerateQuestions} className="space-y-6">
        {error && <div className="text-red-500 text-sm p-3 rounded-lg bg-red-500/10 border border-red-500/20 font-medium">{error}</div>}
        <div className="space-y-2">
          <label className="block text-sm font-bold ml-1">{t('study.subject')}</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
            required
          >
            <option value="">{t('common.select') || 'Seç'}</option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{language === 'English' ? (SUBJECT_MAP_EN[s] || s) : s}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-bold ml-1">{t('study.topic')}</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
            placeholder="Örn: Faktöriyel"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-bold ml-1">{t('study.hours')}</label>
          <input
            type="number"
            min={1}
            max={24}
            value={hours}
            onChange={(e) => setHours(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
            onFocus={(e) => e.target.select()}
            placeholder="Süre (saat)..."
            required
          />
        </div>
        <div className="space-y-4 pt-4">
          <button
            type="submit"
            disabled={loading || !hours}
            className="w-full py-4 rounded-2xl bg-[rgb(var(--accent))] text-white text-xl font-black shadow-xl disabled:opacity-50 btn-bounce relative overflow-hidden"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
                {t('study.generating')}
              </span>
            ) : t('study.generate')}
          </button>
          {loading && (
            <div className="text-center space-y-2 animate-in fade-in slide-in-from-top-2">
              {isSlow && <p className="text-sm text-yellow-600 font-medium animate-bounce">Sorular hazıllanıyor, az kaldı...</p>}
              <button
                type="button"
                onClick={cancel}
                className="text-xs bg-[rgb(var(--secondary))] text-[rgb(var(--secondary-fg))] px-4 py-1.5 rounded-full font-medium shadow-sm hover:brightness-95 transition-all"
              >
                İsteği İptal Et
              </button>
            </div>
          )}
        </div>
      </form>
      {showDebug && <AIDebugPanel debugInfo={debugInfo} onClose={() => setShowDebug(false)} />}
    </div>
  )
}
