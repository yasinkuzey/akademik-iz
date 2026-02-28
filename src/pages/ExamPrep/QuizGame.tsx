import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { useAI } from '@/hooks/useAI'
import { AIDebugPanel } from '@/components/AIDebugPanel'

type Question = {
    question: string
    options: Record<string, string>
    correctAnswer: string
    order: number
}

type Props = {
    exam: { id: string, subject: string, grade: string, term?: string, topic?: string, title: string }
    onBack: () => void
}

export default function QuizGame({ exam, onBack }: Props) {
    const { user } = useAuth()
    const { language, t } = useLanguage()
    const { request, cancel, loading, error, debugInfo, showDebug, setShowDebug, isSlow } = useAI()
    const [questions, setQuestions] = useState<Question[]>([])
    const [answers, setAnswers] = useState<Record<number, string>>({})
    const [submitted, setSubmitted] = useState(false)
    const [score, setScore] = useState(0)

    useEffect(() => {
        fetchQuestions()
    }, [])

    async function fetchQuestions() {
        try {
            const data = await request('generate_questions', {
                subject: exam.subject,
                topic: exam.title,
                grade: exam.grade,
                term: exam.term,
                language,
                hours: 1
            })
            if (data?.questions) {
                setQuestions(data.questions)
            }
        } catch (err: any) {
            console.error(err)
            // Error handled by useAI
        }
    }

    const handleSubmit = async () => {
        let correctCount = 0
        questions.forEach((q, i) => {
            if (answers[i] === q.correctAnswer) correctCount++
        })

        const finalScore = Math.round((correctCount / questions.length) * 100)
        setScore(finalScore)
        setSubmitted(true)

        if (user) {
            await supabase.from('exam_prep_sessions').insert({
                user_id: user.id,
                user_exam_id: exam.id,
                session_type: 'quiz',
                score: finalScore,
                total_questions: questions.length,
                details: { correctCount }
            })

            const points = correctCount * 8
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

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center space-y-2">
                <p className="text-xl font-bold animate-pulse">{t('study.generating')}</p>
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
                <button onClick={fetchQuestions} className="px-4 py-2 bg-primary text-white rounded-lg">Tekrar Dene</button>
            </div>
        </div>
    )

    if (submitted) {
        return (
            <div className="text-center space-y-6 py-8 animate-in zoom-in">
                <h2 className="text-3xl font-bold">{t('study.result_title')}</h2>
                <div className="text-6xl font-black text-primary">{score}</div>
                <p className="text-muted-foreground">{t('exam.result_added')}</p>
                <button onClick={onBack} className="bg-secondary px-6 py-2 rounded-lg">{t('study.back')}</button>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-12 relative">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Soru {Object.keys(answers).length}/{questions.length}</span>
                <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-[10px] opacity-20 hover:opacity-100"
                >
                    DEBUG
                </button>
            </div>

            {questions.map((q, i) => (
                <div key={i} className="bg-card border p-6 rounded-xl space-y-4">
                    <p className="font-medium text-lg">{i + 1}. {q.question}</p>
                    <div className="grid grid-cols-1 gap-2">
                        {Object.entries(q.options).map(([key, val]) => (
                            <button
                                key={key}
                                onClick={() => setAnswers(prev => ({ ...prev, [i]: key }))}
                                className={`text-left p-3 rounded-lg border transition-all ${answers[i] === key
                                    ? 'bg-primary/10 border-primary'
                                    : 'hover:bg-accent/5'
                                    }`}
                            >
                                <span className="font-bold mr-2">{key})</span> {val}
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            <button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length !== questions.length}
                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50 active:scale-[0.98] transition-all"
            >
                {t('study.quiz_submit')}
            </button>

            {showDebug && <AIDebugPanel debugInfo={debugInfo} onClose={() => setShowDebug(false)} />}
        </div>
    )
}
