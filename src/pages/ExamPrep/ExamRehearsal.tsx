import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { useAI } from '@/hooks/useAI'
import { AIDebugPanel } from '@/components/AIDebugPanel'

type MCQuestion = {
    question: string
    options: Record<string, string>
    correctAnswer: string
}
type TFQuestion = {
    question: string
    answer: boolean
}
type OpenQuestion = {
    question: string
    sampleAnswer: string
}
type OpenEval = {
    score: number
    feedback: string
    correct: boolean
}

type Props = {
    exam: { id: string, subject: string, grade: string, term?: string, topic?: string, title: string }
    onBack: () => void
}

export default function ExamRehearsal({ exam, onBack }: Props) {
    const { user } = useAuth()
    const { language, t } = useLanguage()
    const { request, cancel, loading, error, debugInfo, showDebug, setShowDebug, isSlow } = useAI()

    const [mcQuestions, setMcQuestions] = useState<MCQuestion[]>([])
    const [tfQuestions, setTfQuestions] = useState<TFQuestion[]>([])
    const [openQuestions, setOpenQuestions] = useState<OpenQuestion[]>([])
    const [mcAnswers, setMcAnswers] = useState<Record<number, string>>({})
    const [tfAnswers, setTfAnswers] = useState<Record<number, boolean>>({})
    const [openAnswers, setOpenAnswers] = useState<Record<number, string>>({})
    const [submitted, setSubmitted] = useState(false)
    const [evaluating, setEvaluating] = useState(false)
    const [score, setScore] = useState(0)
    const [openEvals, setOpenEvals] = useState<OpenEval[]>([])

    useEffect(() => {
        fetchRehearsal()
    }, [])

    async function fetchRehearsal() {
        try {
            const data = await request('generate_exam_rehearsal', {
                subject: exam.subject,
                topic: exam.title,
                grade: exam.grade,
                term: exam.term,
                language
            })
            if (data) {
                setMcQuestions(data.multiple_choice || [])
                setTfQuestions(data.true_false || [])
                setOpenQuestions(data.open_ended || [])
            }
        } catch (err: any) {
            console.error(err)
            // Error handled by useAI
        }
    }

    const handleSubmit = async () => {
        if (!confirm(t('exam.rehearsal_finish_confirm'))) return
        setEvaluating(true)

        // Score MC + TF locally
        let correctCount = 0
        mcQuestions.forEach((q, i) => {
            if (mcAnswers[i] === q.correctAnswer) correctCount++
        })
        tfQuestions.forEach((q, i) => {
            if (tfAnswers[i] === q.answer) correctCount++
        })

        // Evaluate open-ended via AI
        let evals: OpenEval[] = []
        if (openQuestions.length > 0) {
            try {
                const answers = openQuestions.map((_, i) => openAnswers[i] || '')
                const data = await request('evaluate_open_answers', {
                    questions: openQuestions,
                    answers,
                    subject: exam.subject,
                    grade: exam.grade,
                    language
                })
                if (data?.evaluations && Array.isArray(data.evaluations)) {
                    evals = data.evaluations
                    evals.forEach(ev => {
                        if (ev.correct) correctCount++
                    })
                }
            } catch (err) {
                console.error('Açık uçlu değerlendirme hatası:', err)
            }
        }

        setOpenEvals(evals)
        const total = mcQuestions.length + tfQuestions.length + openQuestions.length
        const finalScore = Math.round((correctCount / total) * 100)
        setScore(finalScore)
        setSubmitted(true)
        setEvaluating(false)

        if (user) {
            await supabase.from('exam_prep_sessions').insert({
                user_id: user.id,
                user_exam_id: exam.id,
                session_type: 'rehearsal',
                score: finalScore,
                total_questions: total,
                details: { correctCount, total }
            })

            const points = correctCount * 10
            await supabase.rpc('increment_user_points', { p_user_id: user.id, p_points: points })

            // Update predicted score in user_exams
            const { data: currentExam, error: fetchErr } = await supabase.from('user_exams').select('predicted_score').eq('id', exam.id).single()
            if (fetchErr) console.error('Score fetch error:', fetchErr)

            const oldScore = currentExam?.predicted_score || 0
            const newPredicted = oldScore === 0 ? finalScore : Math.round(oldScore * 0.4 + finalScore * 0.6)

            console.log(`Updating score: old=${oldScore}, new=${newPredicted}`)
            const { error: updateErr } = await supabase.from('user_exams').update({ predicted_score: newPredicted }).eq('id', exam.id)
            if (updateErr) console.error('Score update error:', updateErr)
        }
    }

    const totalAnswered = Object.keys(mcAnswers).length + Object.keys(tfAnswers).length + Object.keys(openAnswers).filter(k => openAnswers[Number(k)]?.trim()).length
    const totalQuestions = mcQuestions.length + tfQuestions.length + openQuestions.length

    if (loading && !evaluating) return (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center space-y-2">
                <p className="text-xl font-bold animate-pulse">{t('exam.rehearsal_preparing')}</p>
                {isSlow && <p className="text-sm text-yellow-600 font-medium animate-bounce">Hala hazırlanıyor, az kaldı...</p>}
            </div>
            <button
                onClick={() => { cancel(); onBack(); }}
                className="text-sm text-muted-foreground hover:text-red-500 underline"
            >
                İsteği İptal Et
            </button>
        </div>
    )

    if (error) return (
        <div className="text-center py-20 space-y-4">
            <p className="text-red-500 font-bold">{error}</p>
            <div className="flex justify-center gap-4">
                <button onClick={onBack} className="px-4 py-2 bg-secondary rounded-lg">Geri Git</button>
                <button onClick={submitted ? () => { } : fetchRehearsal} className="px-4 py-2 bg-primary text-white rounded-lg">Tekrar Dene</button>
            </div>
        </div>
    )

    if (evaluating) return (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center space-y-2">
                <p className="text-xl font-bold animate-pulse">{t('exam.rehearsal_evaluating')}</p>
                {isSlow && <p className="text-sm text-yellow-600 font-medium animate-bounce">Değerlendirme biraz zaman alıyor...</p>}
            </div>
            <button
                onClick={() => { cancel(); setEvaluating(false); }}
                className="text-sm text-muted-foreground hover:text-red-500 underline"
            >
                İptal Et ve Geri Dön
            </button>
        </div>
    )

    if (submitted) {
        return (
            <div className="max-w-3xl mx-auto space-y-8 py-10 animate-in zoom-in h-screen overflow-y-auto pb-32 relative">
                <div className="text-center space-y-6">
                    <h2 className="text-3xl font-bold">{t('exam.rehearsal_result')}</h2>
                    <div className="flex flex-col items-center justify-center w-48 h-48 rounded-full border-8 border-primary mx-auto">
                        <span className="text-5xl font-black">{score}</span>
                        <span className="text-sm text-muted-foreground">{t('exam.rehearsal_score_label')}</span>
                    </div>
                    <p className="text-muted-foreground">{t('exam.rehearsal_saved')}</p>
                </div>

                {/* Multiple Choice Review */}
                {mcQuestions.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold border-b pb-2">{t('exam.rehearsal_eval_mc')}</h3>
                        {mcQuestions.map((q, i) => {
                            const isCorrect = mcAnswers[i] === q.correctAnswer
                            return (
                                <div key={`mc-res-${i}`} className={`bg-card border p-5 rounded-xl space-y-2 ${isCorrect ? 'border-green-500/30' : 'border-red-500/30'}`}>
                                    <p className="font-medium">{i + 1}. {q.question}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                        <p className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                                            {t('exam.rehearsal_your_answer')}: <strong>{mcAnswers[i] ?? '-'}</strong> {mcAnswers[i] ? `(${q.options[mcAnswers[i]]})` : ''}
                                        </p>
                                        {!isCorrect && (
                                            <p className="text-green-600">
                                                {t('exam.rehearsal_correct_answer')}: <strong>{q.correctAnswer}</strong> ({q.options[q.correctAnswer]})
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* True/False Review */}
                {tfQuestions.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold border-b pb-2">{t('exam.rehearsal_eval_tf')}</h3>
                        {tfQuestions.map((q, i) => {
                            const isCorrect = tfAnswers[i] === q.answer
                            return (
                                <div key={`tf-res-${i}`} className={`bg-card border p-5 rounded-xl space-y-2 ${isCorrect ? 'border-green-500/30' : 'border-red-500/30'}`}>
                                    <p className="font-medium">{i + 1}. {q.question}</p>
                                    <div className="flex gap-4 text-sm font-medium">
                                        <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                                            {t('exam.rehearsal_your_answer')}: {tfAnswers[i] === undefined ? '-' : (tfAnswers[i] ? 'D' : 'Y')}
                                        </span>
                                        {!isCorrect && (
                                            <span className="text-green-600">
                                                {t('exam.rehearsal_correct_answer')}: {q.answer ? 'D' : 'Y'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Open-ended results */}
                {openEvals.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold border-b pb-2">{t('exam.rehearsal_eval_oe')}</h3>
                        {openQuestions.map((q, i) => (
                            <div key={`oe-result-${i}`} className={`bg-card border p-5 rounded-xl space-y-3 ${openEvals[i]?.correct ? 'border-green-500/30' : 'border-red-500/30'}`}>
                                <p className="font-medium">{i + 1}. {q.question}</p>
                                <div className="text-sm space-y-1">
                                    <p className="text-muted-foreground"><span className="font-semibold">{t('exam.rehearsal_your_answer')}:</span> {openAnswers[i] || '(Boş)'}</p>
                                    <p className="text-muted-foreground"><span className="font-semibold">{t('exam.rehearsal_sample_answer')}:</span> {q.sampleAnswer}</p>
                                </div>
                                {openEvals[i] && (
                                    <div className={`flex items-center gap-3 text-sm p-3 rounded-lg ${openEvals[i].correct ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                        <span className="font-bold text-lg">{openEvals[i].score}/10</span>
                                        <span>{openEvals[i].feedback}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="text-center pb-20">
                    <button onClick={onBack} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold shadow-lg hover:translate-y-1 transition-transform">
                        {t('exam.rehearsal_back')}
                    </button>
                </div>

                <div className="fixed bottom-4 left-4 z-50">
                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        className="p-2 bg-black/20 hover:bg-black/50 rounded-full text-[10px] text-white backdrop-blur"
                    >
                        DEBUG
                    </button>
                </div>
                {showDebug && <AIDebugPanel debugInfo={debugInfo} onClose={() => setShowDebug(false)} />}
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-12 relative">
            <div className="flex justify-between items-center bg-card p-4 rounded-xl border sticky top-4 z-10 shadow-sm backdrop-blur">
                <h2 className="font-bold text-lg">{t('exam.rehearsal_title')}</h2>
                <div className="flex items-center gap-4">
                    <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {t('exam.rehearsal_answered').replace('{count}', totalAnswered.toString()).replace('{total}', totalQuestions.toString())}
                    </div>
                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        className="text-[10px] opacity-20 hover:opacity-100"
                    >
                        DEBUG
                    </button>
                </div>
            </div>

            {/* Multiple Choice Section */}
            {mcQuestions.length > 0 && (
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold border-b pb-2">{t('exam.rehearsal_multiple_choice')}</h3>
                    {mcQuestions.map((q, i) => (
                        <div key={`mc-${i}`} className="bg-card border p-6 rounded-xl space-y-4">
                            <p className="font-medium text-lg">{i + 1}. {q.question}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.entries(q.options).map(([key, val]) => (
                                    <button
                                        key={key}
                                        onClick={() => setMcAnswers(prev => ({ ...prev, [i]: key }))}
                                        className={`text-left p-3 rounded-lg border transition-all ${mcAnswers[i] === key
                                            ? 'bg-primary/10 border-primary ring-1 ring-primary'
                                            : 'hover:bg-accent/5'
                                            }`}
                                    >
                                        <span className="font-bold mr-2">{key})</span> {val}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* True/False Section */}
            {tfQuestions.length > 0 && (
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold border-b pb-2">{t('exam.rehearsal_true_false')}</h3>
                    {tfQuestions.map((q, i) => (
                        <div key={`tf-${i}`} className="bg-card border p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <p className="font-medium text-lg flex-1">{i + 1}. {q.question}</p>
                            <div className="flex gap-2 min-w-[200px]">
                                <button
                                    onClick={() => setTfAnswers(prev => ({ ...prev, [i]: true }))}
                                    className={`flex-1 py-2 rounded-lg border font-bold transition-all ${tfAnswers[i] === true
                                        ? 'bg-green-500 text-white border-green-600'
                                        : 'hover:bg-green-50 text-green-600 border-green-200'
                                        }`}
                                >
                                    D
                                </button>
                                <button
                                    onClick={() => setTfAnswers(prev => ({ ...prev, [i]: false }))}
                                    className={`flex-1 py-2 rounded-lg border font-bold transition-all ${tfAnswers[i] === false
                                        ? 'bg-red-500 text-white border-red-600'
                                        : 'hover:bg-red-50 text-red-600 border-red-200'
                                        }`}
                                >
                                    Y
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Open-Ended Section */}
            {openQuestions.length > 0 && (
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold border-b pb-2">{t('exam.rehearsal_open_ended')}</h3>
                    <p className="text-sm text-muted-foreground">{t('exam.rehearsal_open_ended_desc')}</p>
                    {openQuestions.map((q, i) => (
                        <div key={`oe-${i}`} className="bg-card border p-6 rounded-xl space-y-3">
                            <p className="font-medium text-lg">{i + 1}. {q.question}</p>
                            <textarea
                                rows={4}
                                placeholder={t('exam.rehearsal_open_placeholder')}
                                className="w-full p-3 rounded-lg border border-input bg-background resize-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                value={openAnswers[i] || ''}
                                onChange={e => setOpenAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                            />
                        </div>
                    ))}
                </div>
            )}

            <div className="pt-8 text-center pb-20">
                <button
                    onClick={handleSubmit}
                    className="w-full py-4 bg-primary text-primary-foreground text-xl font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
                >
                    {t('exam.rehearsal_finish')}
                </button>
            </div>

            {showDebug && <AIDebugPanel debugInfo={debugInfo} onClose={() => setShowDebug(false)} />}
        </div>
    )
}
