import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useAI } from '@/hooks/useAI'
import { useLanguage } from '@/hooks/useLanguage'

type Question = {
    id: string
    question_text: string
    choices: string[]
    correct_index: number
    topic_tag: string
    skill_tag: string
    difficulty: number
}

export default function DiagnosticSession() {
    const { id } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { t } = useLanguage()
    const { request, error: aiError } = useAI()
    const [localError, setLocalError] = useState<string | null>(null)

    const [questions, setQuestions] = useState<Question[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [startTime] = useState(Date.now())
    const [generatingAi, setGeneratingAi] = useState(false)

    const initSession = async () => {
        if (!user) return
        setLoading(true)
        setLocalError(null)
        const stage = searchParams.get('stage')
        const subject = searchParams.get('subject')

        if (id === 'new' && stage && subject) {
            const mode = searchParams.get('mode') || 'standard'
            const questionLimits: Record<string, number> = { quick: 5, standard: 10, comprehensive: 20 }
            const limit = questionLimits[mode] || 10

            // Create new session
            const { data: session, error: sErr } = await supabase
                .from('diagnostic_sessions')
                .insert({
                    user_id: user.id,
                    stage,
                    subject,
                    mode,
                    total_questions: limit
                })
                .select()
                .single()

            if (sErr) {
                console.error("Session creation error:", sErr)
                setLocalError(`${t('diagnostic.session_error') || 'Oturum başlatılamadı'}: ${sErr.message}`)
                setLoading(false)
                return
            }
            setSessionId(session.id)

            // Calculate question count based on mode
            const modeMap: Record<string, number> = { quick: 5, standard: 10, comprehensive: 20 }
            const questionCount = modeMap[mode as string] || 10

            // Always use AI Generation
            setGeneratingAi(true)
            try {
                const data = await request('generate_questions', {
                    subject,
                    topic: subject,
                    grade: stage,
                    language: 'Turkish',
                    count: questionCount
                })
                if (data?.questions) {
                    const aiQs = data.questions.map((q: any, index: number) => ({
                        id: `ai-${index}`,
                        question_text: q.question,
                        choices: Object.values(q.options),
                        correct_index: Object.keys(q.options).indexOf(q.correctAnswer),
                        topic_tag: q.topic_tag || subject,
                        skill_tag: q.skill_tag || 'Analiz',
                        difficulty: q.difficulty || 3
                    }))
                    if (aiQs && aiQs.length > 0) {
                        setQuestions(aiQs)
                    } else {
                        setLocalError(t('diagnostic.ai_empty') || "Yapay zeka soru üretemedi (boş yanıt).")
                    }
                } else {
                    setLocalError(t('diagnostic.ai_format_error') || "Yapay zeka yanıt formatı hatalı.")
                }
            } catch (err: any) {
                setLocalError(err.message || (t('diagnostic.ai_connection_error') || "Yapay zeka ile bağlantı kurulamadı."))
            } finally {
                setGeneratingAi(false)
            }
        } else {
            navigate('/diagnostic')
        }
        setLoading(false)
    }

    useEffect(() => {
        initSession()
    }, [id, user])

    const handleAnswer = async (choiceIndex: number) => {
        if (!sessionId || !questions[currentIndex]) return

        const q = questions[currentIndex]
        const isCorrect = choiceIndex === q.correct_index
        const timeSpent = Math.floor((Date.now() - startTime) / 1000)

        // Save answer with question metadata directly (no foreign key dependency)
        const answerData = {
            session_id: sessionId,
            question_id: q.id,
            selected_index: choiceIndex,
            is_correct: isCorrect,
            time_spent_sec: timeSpent,
            topic_tag: q.topic_tag,
            skill_tag: q.skill_tag,
            question_text: q.question_text,
        }

        setAnswers([...answers, answerData])

        // Save to DB - insert without question_text and skill_tag if columns don't exist
        // We use upsert-like approach and ignore extra column errors
        const dbData: Record<string, any> = {
            session_id: sessionId,
            question_id: q.id,
            selected_index: choiceIndex,
            is_correct: isCorrect,
            time_spent_sec: timeSpent,
        }

        // Try saving with extra metadata columns
        const { error: insertErr } = await supabase.from('diagnostic_answers').insert({
            ...dbData,
            topic_tag: q.topic_tag,
            skill_tag: q.skill_tag,
            question_text: q.question_text,
        })

        // If extra columns don't exist, fallback to basic insert
        if (insertErr) {
            console.warn('Extended insert failed, trying basic insert:', insertErr.message)
            await supabase.from('diagnostic_answers').insert(dbData)
        }

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1)
        } else {
            // Finish session - save all question data as JSON in session for result page
            await supabase
                .from('diagnostic_sessions')
                .update({
                    finished_at: new Date().toISOString(),
                    questions_data: {
                        questions: questions,
                        answers: [...answers, answerData]
                    }
                })
                .eq('id', sessionId)

            navigate(`/diagnostic/result/${sessionId}`)
        }
    }

    if (loading || generatingAi) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-6">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center space-y-2">
                <p className="font-black uppercase tracking-[0.2em] text-sm animate-pulse">
                    {generatingAi ? (t('diagnostic.ai_generating') || 'Yapay Zeka Soruları Hazırlıyor...') : (t('diagnostic.ai_starting') || 'AI Sistemi Başlatılıyor...')}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {generatingAi ? (t('diagnostic.ai_analyzing') || 'Ders içeriği analiz ediliyor, lütfen bekleyin') : (t('diagnostic.engine_preparing') || 'Eksik tespit motoru hazırlanıyor')}
                </p>
            </div>
        </div>
    )

    const errorToShow = localError || aiError

    if (errorToShow) return (
        <div className="max-w-md mx-auto text-center py-20 space-y-6 bg-card border border-destructive/20 rounded-[3rem] p-10 mt-10 shadow-xl">
            <div className="text-5xl border-2 border-destructive/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-destructive/5 mb-4">⚠️</div>
            <div className="space-y-2">
                <h2 className="text-xl font-black italic uppercase tracking-tighter text-destructive">{t('diagnostic.error_title') || 'BİR SORUN OLUŞTU'}</h2>
                <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
                    <p className="text-[11px] font-bold text-muted-foreground leading-relaxed uppercase tracking-tight">
                        {t('diagnostic.error_label') || 'HATA'}: {errorToShow}
                    </p>
                </div>
            </div>
            <div className="flex gap-4">
                <button
                    onClick={() => navigate('/diagnostic')}
                    className="flex-1 h-16 rounded-2xl bg-secondary text-secondary-foreground font-black text-[10px] uppercase tracking-widest hover:opacity-80 transition-all btn-glow"
                >
                    {t('common.back') || 'GERİ DÖN'}
                </button>
                <button
                    onClick={initSession}
                    className="flex-1 h-16 rounded-2xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all btn-glow"
                >
                    {t('diagnostic.retry') || 'TEKRAR DENE'}
                </button>
            </div>
        </div>
    )

    const currentQ = questions[currentIndex]
    if (!currentQ && !loading) return (
        <div className="text-center py-20 uppercase font-black opacity-40 italic tracking-widest">
            {t('diagnostic.no_questions') || 'Soru bulunamadı.'}
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Progress */}
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t('diagnostic.question_progress') || 'Soru'} {currentIndex + 1} / {questions.length}</h2>
                        <span className="text-xl font-black italic text-primary uppercase">{currentQ.topic_tag}</span>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('diagnostic.skill_area') || 'BECERİ ALANI'}</div>
                        <div className="font-bold text-sm uppercase">{currentQ.skill_tag || 'Uygulama'}</div>
                    </div>
                </div>
                <div className="w-full h-3 bg-muted/20 rounded-full overflow-hidden border border-border/50">
                    <div
                        className="h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-card border border-border/50 rounded-[3rem] p-10 md:p-16 space-y-12 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>

                <div className="space-y-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                            {t('diagnostic.difficulty') || 'Zorluk'}: {Array(currentQ.difficulty).fill('⭐').join('')}
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-4xl font-black italic tracking-tight leading-[1.1] text-foreground uppercase">
                        {currentQ.question_text}
                    </h1>
                </div>

                <div className="grid grid-cols-1 gap-4 relative z-10">
                    {currentQ.choices.map((choice, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAnswer(idx)}
                            className="group flex items-center gap-6 p-6 rounded-3xl border-2 border-border/50 hover:border-primary hover:bg-primary/[0.02] transition-all text-left active:scale-[0.98] hover:shadow-lg"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-secondary group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center font-black transition-all text-xl">
                                {String.fromCharCode(65 + idx)}
                            </div>
                            <span className="flex-1 font-bold text-xl tracking-tight">{choice}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex justify-center italic text-muted-foreground font-bold tracking-tight text-sm uppercase opacity-50">
                💡 {t('diagnostic.focus_hint') || 'Odaklan ve en doğru seçeneği işaretle.'}
            </div>
        </div>
    )
}
