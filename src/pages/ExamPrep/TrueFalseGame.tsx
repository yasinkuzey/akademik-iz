import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import { useAI } from '@/hooks/useAI'
import { AIDebugPanel } from '@/components/AIDebugPanel'

type Question = {
    question: string
    answer: boolean
    explanation: string
}

type Props = {
    exam: { id: string, subject: string, grade: string, term?: string, topic?: string, title: string }
    onBack: () => void
}

export default function TrueFalseGame({ exam, onBack }: Props) {
    const { user } = useAuth()
    const { language, t } = useLanguage()
    const { request, cancel, loading, error, debugInfo, showDebug, setShowDebug, isSlow } = useAI()
    const [questions, setQuestions] = useState<Question[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [score, setScore] = useState(0)
    const [gameOver, setGameOver] = useState(false)
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)

    useEffect(() => {
        fetchQuestions()
    }, [])

    async function fetchQuestions() {
        try {
            const data = await request('generate_true_false', {
                subject: exam.subject,
                topic: exam.title,
                grade: exam.grade,
                term: exam.term,
                language
            })
            if (data?.questions) {
                setQuestions(data.questions)
            }
        } catch (err: any) {
            console.error(err)
            // Error handled by useAI
        }
    }

    const handleAnswer = (userAnswer: boolean) => {
        const currentQ = questions[currentIndex]
        const isCorrect = userAnswer === currentQ.answer

        if (isCorrect) {
            setScore(s => s + 1)
            setFeedback('correct')
        } else {
            setFeedback('wrong')
        }

        setTimeout(() => {
            setFeedback(null)
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(i => i + 1)
            } else {
                finishGame(score + (isCorrect ? 1 : 0))
            }
        }, 1500)
    }

    async function finishGame(finalScore: number) {
        setGameOver(true)
        if (user) {
            await supabase.from('exam_prep_sessions').insert({
                user_id: user.id,
                user_exam_id: exam.id,
                session_type: 'true_false',
                score: finalScore,
                total_questions: questions.length,
                details: { mode: 'true_false' }
            })
            // Bonus points
            await supabase.rpc('increment_user_points', { p_user_id: user.id, p_points: finalScore * 5 })

            // Update predicted score in user_exams
            const { data: currentExam, error: fetchErr } = await supabase.from('user_exams').select('predicted_score').eq('id', exam.id).single()
            if (fetchErr) console.error('Score fetch error:', fetchErr)

            const oldScore = currentExam?.predicted_score || 0
            const normalizedScore = Math.round((finalScore / questions.length) * 100)
            const newPredicted = oldScore === 0 ? normalizedScore : Math.round(oldScore * 0.4 + normalizedScore * 0.6)

            console.log(`Updating score: old=${oldScore}, normalized=${normalizedScore}, new=${newPredicted}`)
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

    if (gameOver) {
        return (
            <div className="text-center space-y-6 py-8 animate-in zoom-in">
                <h2 className="text-3xl font-bold">{t('exam.game_over')}</h2>
                <div className="text-6xl font-black text-primary">{score} / {questions.length}</div>
                <p className="text-muted-foreground">{t('exam.result_added')}</p>
                <button onClick={onBack} className="bg-secondary px-6 py-2 rounded-lg">{t('study.back')}</button>
            </div>
        )
    }

    if (questions.length === 0 && !loading) {
        return (
            <div className="text-center py-20 space-y-4">
                <p className="text-muted-foreground italic">Soru bulunamadı veya bir hata oluştu.</p>
                <button onClick={fetchQuestions} className="px-4 py-2 bg-primary text-white rounded-lg">Tekrar Dene</button>
            </div>
        )
    }

    const question = questions[currentIndex]

    if (!question) return null

    return (
        <div className="max-w-md mx-auto space-y-8 py-8 px-4 relative">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{t('study.quiz_title')} {currentIndex + 1}/{questions.length}</span>
                <div className="flex items-center gap-4">
                    <span>{language === 'Turkish' ? 'Skor' : 'Score'}: {score}</span>
                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        className="text-[10px] opacity-20 hover:opacity-100"
                    >
                        DEBUG
                    </button>
                </div>
            </div>

            <div className="min-h-[200px] flex flex-col items-center justify-center text-center p-6 bg-card border rounded-2xl shadow-lg relative overflow-hidden">
                {feedback && (
                    <div className={`absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10 animate-in fade-in`}>
                        <div className={`text-5xl font-bold ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                            {feedback === 'correct' ? (language === 'Turkish' ? 'DOĞRU!' : 'CORRECT!') : (language === 'Turkish' ? 'YANLIŞ!' : 'WRONG!')}
                        </div>
                    </div>
                )}
                <h3 className="text-xl font-medium leading-relaxed">{question.question}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                    disabled={feedback !== null}
                    onClick={() => handleAnswer(true)}
                    className="h-16 rounded-xl bg-green-500/10 text-green-600 border border-green-500/20 hover:bg-green-500/20 font-bold text-lg transition-all active:scale-[0.98]"
                >
                    {language === 'Turkish' ? 'DOĞRU' : 'TRUE'}
                </button>
                <button
                    disabled={feedback !== null}
                    onClick={() => handleAnswer(false)}
                    className="h-16 rounded-xl bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20 font-bold text-lg transition-all active:scale-[0.98]"
                >
                    {language === 'Turkish' ? 'YANLIŞ' : 'FALSE'}
                </button>
            </div>

            {feedback && (
                <div className="text-center text-sm text-muted-foreground animate-in slide-in-from-bottom-2 bg-accent/5 p-4 rounded-lg italic">
                    {question.explanation}
                </div>
            )}

            {showDebug && <AIDebugPanel debugInfo={debugInfo} onClose={() => setShowDebug(false)} />}
        </div>
    )
}
