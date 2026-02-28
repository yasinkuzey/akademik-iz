import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import QuizGame from './QuizGame'
import TrueFalseGame from './TrueFalseGame'
import ExamRehearsal from './ExamRehearsal'

type Exam = {
    id: string
    title: string
    subject: string
    exam_date: string
    grade: string
    term?: string
    topic?: string
    target_score: number
    predicted_score: number
}

type Session = {
    id: string
    session_type: string
    score: number
    created_at: string
}

export default function ExamDetail() {
    const { id } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [exam, setExam] = useState<Exam | null>(null)
    const [sessions, setSessions] = useState<Session[]>([])
    const [mode, setMode] = useState<'overview' | 'quiz' | 'true_false' | 'rehearsal'>('overview')
    const { t } = useLanguage()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user && id) fetchExamData()
    }, [user, id])

    async function fetchExamData() {
        const { data: examData } = await supabase.from('user_exams').select('*').eq('id', id).single()
        const { data: sessionData } = await supabase.from('exam_prep_sessions').select('*').eq('user_exam_id', id).order('created_at', { ascending: false })

        if (examData) setExam(examData)
        if (sessionData) setSessions(sessionData)
        setLoading(false)
    }

    if (loading) return <div className="p-8 text-center animate-pulse">Yükleniyor...</div>
    if (!exam) return <div className="p-8 text-center text-red-500">Sınav bulunamadı.</div>

    if (mode === 'quiz') return <QuizGame exam={exam} onBack={() => { setMode('overview'); fetchExamData(); }} />
    if (mode === 'true_false') return <TrueFalseGame exam={exam} onBack={() => { setMode('overview'); fetchExamData(); }} />
    if (mode === 'rehearsal') return <ExamRehearsal exam={exam} onBack={() => { setMode('overview'); fetchExamData(); }} />

    return (
        <div className="container py-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-8 rounded-3xl border border-primary/20 relative overflow-hidden">
                <div className="relative z-10">
                    <button onClick={() => navigate('/exam-prep')} className="text-sm text-muted-foreground hover:underline mb-2">
                        ← Sınav Listesine Dön
                    </button>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight mb-2">{exam.title}</h1>
                            <div className="flex gap-3 text-sm font-medium opacity-80">
                                <span className="bg-background/50 px-3 py-1 rounded-full border">{exam.grade}</span>
                                <span className="bg-background/50 px-3 py-1 rounded-full border">{exam.subject}</span>
                                <span className="bg-background/50 px-3 py-1 rounded-full border">{new Date(exam.exam_date).toLocaleDateString('tr-TR')}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                            <div className="flex gap-4">
                                <div className="text-center bg-background/80 backdrop-blur px-4 py-2 rounded-xl border shadow-sm">
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{t('exam.target')}</div>
                                    <div className="text-2xl font-black text-primary">{exam.target_score}</div>
                                </div>
                                <div className="text-center bg-primary/20 backdrop-blur px-4 py-2 rounded-xl border border-primary/30 shadow-sm animate-pulse">
                                    <div className="text-[10px] text-primary uppercase tracking-wider font-bold">{t('exam.predicted')}</div>
                                    <div className="text-2xl font-black text-primary">{exam.predicted_score || 0}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-accent/20 rounded-full blur-3xl"></div>
            </div>

            {/* Actions */}
            <div className="grid md:grid-cols-3 gap-6">
                <button
                    onClick={() => setMode('true_false')}
                    className="group relative p-6 bg-card border hover:border-green-500/50 rounded-2xl shadow-sm hover:shadow-lg transition-all text-left overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-4xl mb-4 text-green-500">✅</div>
                    <h3 className="font-bold text-lg mb-1">Doğru / Yanlış</h3>
                    <p className="text-sm text-muted-foreground">Hızlı kavram tekrarı yap.</p>
                </button>

                <button
                    onClick={() => setMode('quiz')}
                    className="group relative p-6 bg-card border hover:border-blue-500/50 rounded-2xl shadow-sm hover:shadow-lg transition-all text-left overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-4xl mb-4 text-blue-500">🧠</div>
                    <h3 className="font-bold text-lg mb-1">Konu Testi (Quiz)</h3>
                    <p className="text-sm text-muted-foreground">Kendini test et.</p>
                </button>

                <button
                    onClick={() => setMode('rehearsal')}
                    className="group relative p-6 bg-card border hover:border-purple-500/50 rounded-2xl shadow-sm hover:shadow-lg transition-all text-left overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-4xl mb-4 text-purple-500">📝</div>
                    <h3 className="font-bold text-lg mb-1">Sınav Provası</h3>
                    <p className="text-sm text-muted-foreground">Gerçek sınav deneyimi.</p>
                </button>
            </div>

            {/* History */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold">Çalışma Geçmişi</h2>
                {sessions.length === 0 ? (
                    <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground">
                        Henüz bu sınav için çalışma yapmadın.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sessions.map(s => (
                            <div key={s.id} className="flex justify-between items-center p-4 bg-card border rounded-xl hover:bg-accent/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl
                    ${s.session_type === 'true_false' ? 'bg-green-100 text-green-600' :
                                            s.session_type === 'quiz' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}
                  `}>
                                        {s.session_type === 'true_false' ? '✅' : s.session_type === 'quiz' ? '🧠' : '📝'}
                                    </div>
                                    <div>
                                        <div className="font-medium">{t('exam.session_' + s.session_type)}</div>
                                        <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString('tr-TR')}</div>
                                    </div>
                                </div>
                                <div className="font-bold text-lg">{s.score} Puan</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
