import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/hooks/useLanguage'

export default function DiagnosticResult() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { t } = useLanguage()

    const [loading, setLoading] = useState(true)
    const [session, setSession] = useState<any>(null)
    const [answers, setAnswers] = useState<any[]>([])
    const [aiFeedback, setAiFeedback] = useState<string>('')
    const [isAiLoading, setIsAiLoading] = useState(false)
    const [aiStatus, setAiStatus] = useState<string>('')

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const { data: s } = await supabase
                .from('diagnostic_sessions')
                .select('*')
                .eq('id', id)
                .single()

            const { data: ans } = await supabase
                .from('diagnostic_answers')
                .select('*, question:diagnostic_questions(*)')
                .eq('session_id', id)

            setSession(s)
            setAnswers(ans || [])
            setLoading(false)

            if (id && s) generateAiFeedback(s, ans || [])
        }

        if (id) fetchData()
    }, [id])

    const generateAiFeedback = async (session: any, answers: any[]) => {
        setIsAiLoading(true)
        setAiStatus(t('diagnostic.loading.data'))

        try {
            // Stage 1: Slight delay for visual progression
            await new Promise(r => setTimeout(r, 800))
            setAiStatus(t('diagnostic.loading.ai'))

            const resp = await fetch('/api/diagnostic-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session, answers })
            })

            setAiStatus(t('diagnostic.loading.plan'))
            const data = await resp.json()
            setAiFeedback(data.feedback)
        } catch (err) {
            console.error(err)
            setAiFeedback(t('diagnostic.feedback_error'))
        }
        setIsAiLoading(false)
    }

    if (loading) return <div className="p-20 text-center uppercase font-black animate-pulse">{t('common.loading')}</div>

    // Basic stats calculation
    const total = answers.length
    const correct = answers.filter(a => a.is_correct).length
    const score = total > 0 ? Math.round((correct / total) * 100) : 0

    // Topic breakdown
    const topics: Record<string, { total: number, correct: number }> = {}
    answers.forEach(a => {
        const topic = a.question.topic_tag
        if (!topics[topic]) topics[topic] = { total: 0, correct: 0 }
        topics[topic].total++
        if (a.is_correct) topics[topic].correct++
    })

    return (
        <div className="space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-card border border-border/50 rounded-[3rem] p-10 md:p-16 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-8xl opacity-10 font-black italic">%{score}</div>
                <div className="space-y-4 relative z-10 w-full md:w-auto text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter leading-none">{t('diagnostic.result_title')}</h1>
                    <p className="text-muted-foreground font-bold text-lg uppercase">{session?.subject} • {session?.stage.toUpperCase()} {t('diagnostic.level')}</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto relative z-10">
                    <button onClick={() => navigate('/diagnostic')} className="flex-1 px-8 py-4 rounded-2xl bg-secondary text-secondary-foreground font-black text-[10px] uppercase tracking-widest hover:opacity-80 transition-all btn-glow">{t('diagnostic.new_test')}</button>
                    <button onClick={() => window.print()} className="flex-1 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all btn-glow">{t('diagnostic.download_report')}</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Mastery Map */}
                <section className="bg-card border border-border/50 rounded-[3rem] p-10 space-y-8 shadow-sm">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                        <span className="w-8 h-[2px] bg-primary/20"></span>
                        {t('diagnostic.mastery_map')}
                    </h2>
                    <div className="space-y-6">
                        {Object.entries(topics).map(([topic, data]) => {
                            const tScore = Math.round((data.correct / data.total) * 100)
                            return (
                                <div key={topic} className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="font-bold text-sm uppercase tracking-tight">{topic}</span>
                                        <span className={`font-black text-sm ${tScore > 70 ? 'text-success' : tScore > 40 ? 'text-warning' : 'text-destructive'}`}>%{tScore}</span>
                                    </div>
                                    <div className="w-full h-4 bg-muted/20 rounded-full overflow-hidden p-1 border border-border/30">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${tScore > 70 ? 'bg-success' : tScore > 40 ? 'bg-warning' : 'bg-destructive'}`}
                                            style={{ width: `${tScore}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* AI Feedback */}
                <section className="bg-foreground text-background rounded-[3rem] p-10 space-y-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 text-4xl opacity-20">🤖</div>
                    <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                        <span className="w-8 h-[2px] bg-background/20"></span>
                        {t('diagnostic.ai_guide')}
                    </h2>

                    {isAiLoading ? (
                        <div className="space-y-6 animate-pulse pt-4">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full border-2 border-background/20 border-b-background/80 animate-spin"></div>
                                <p className="text-[11px] font-black uppercase tracking-widest opacity-80">{aiStatus}</p>
                            </div>
                            <div className="space-y-4">
                                <div className="h-4 bg-background/10 rounded w-3/4"></div>
                                <div className="h-4 bg-background/10 rounded w-full"></div>
                                <div className="h-4 bg-background/10 rounded w-5/6"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="prose prose-invert prose-sm">
                            <p className="whitespace-pre-line leading-relaxed font-bold tracking-tight opacity-90 italic">
                                {aiFeedback}
                            </p>
                        </div>
                    )}
                </section>
            </div>

            {/* Recommended Order */}
            <section className="bg-primary/[0.03] border border-primary/20 rounded-[3rem] p-10 space-y-8">
                <h2 className="text-xl font-black italic uppercase tracking-tighter">{t('diagnostic.ideal_order')}</h2>
                <div className="flex flex-wrap gap-4">
                    {Object.entries(topics)
                        .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
                        .map(([topic], idx) => (
                            <div key={topic} className="flex items-center gap-4 bg-background border border-border/50 p-4 rounded-2xl shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">{idx + 1}</div>
                                <span className="font-bold uppercase text-[11px] tracking-widest">{topic}</span>
                            </div>
                        ))}
                </div>
            </section>
        </div>
    )
}
