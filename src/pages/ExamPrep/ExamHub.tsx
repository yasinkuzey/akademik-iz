import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

type Exam = {
    id: string
    title: string
    subject: string
    exam_date: string
    grade: string
    target_score: number
    predicted_score: number
}

const SUBJECTS = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Tarih', 'Coğrafya', 'Diğer']
const GRADES = [
    '5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf',
    '9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf', 'Mezun',
    'Hazırlık', 'Üniversite 1', 'Üniversite 2', 'Üniversite 3', 'Üniversite 4'
]
const TERMS = ['1. Dönem', '2. Dönem', 'Güz', 'Bahar', 'Yaz Okulu']

export default function ExamHub() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [exams, setExams] = useState<Exam[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [newExam, setNewExam] = useState({
        title: '', subject: '', grade: '10. Sınıf', term: '', exam_date: '', target_score: 85
    })

    useEffect(() => {
        if (user) fetchExams()
    }, [user])

    async function fetchExams() {
        const { data, error } = await supabase
            .from('user_exams')
            .select('*')
            .order('exam_date', { ascending: true })

        if (!error && data) setExams(data)
        setLoading(false)
    }

    async function handleAddExam(e: React.FormEvent) {
        e.preventDefault()
        if (!user) return

        const { data, error } = await supabase.from('user_exams').insert({
            user_id: user.id,
            ...newExam
        }).select().single()

        if (!error && data) {
            setExams([...exams, data])
            setShowAddModal(false)
            setNewExam({ title: '', subject: '', grade: '10. Sınıf', term: '', exam_date: '', target_score: 85 })
        }
    }

    async function handleDeleteExam(e: React.MouseEvent, examId: string) {
        e.stopPropagation() // Do not navigate to exam detail
        if (!confirm('Bu sınavı silmek istediğine emin misin?')) return
        const { error } = await supabase.from('user_exams').delete().eq('id', examId)
        if (!error) setExams(exams.filter(ex => ex.id !== examId))
    }

    if (loading) return <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>

    return (
        <div className="container py-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sınavım Var</h1>
                    <p className="text-muted-foreground">Yaklaşan sınavlarını ekle ve özel program oluştur.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium shadow hover:bg-primary/90 transition-colors"
                >
                    + Yeni Sınav Ekle
                </button>
            </div>

            {exams.length === 0 ? (
                <div className="text-center py-16 bg-card border border-dashed rounded-xl">
                    <p className="text-muted-foreground text-lg mb-4">Henüz eklenmiş bir sınavın yok.</p>
                    <button onClick={() => setShowAddModal(true)} className="text-primary font-medium hover:underline">
                        İlk sınavını ekle
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {exams.map(exam => (
                        <div
                            key={exam.id}
                            onClick={() => navigate(`/exam-prep/${exam.id}`)}
                            className="group cursor-pointer bg-card border border-border p-5 rounded-xl shadow-sm hover:shadow-md hover:border-accent transition-all relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-15 transition-opacity pointer-events-none">
                                <span className="text-6xl">📝</span>
                            </div>
                            {/* Delete Button - top-right, visible on hover */}
                            <button
                                onClick={(e) => handleDeleteExam(e, exam.id)}
                                className="absolute top-2 right-2 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-red-500/15 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500/40 transition-all text-sm font-bold"
                                title="Sınavı Sil"
                            >
                                ✕
                            </button>
                            <h3 className="text-xl font-bold mb-1 truncate">{exam.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                <span className="px-2 py-0.5 bg-secondary rounded text-xs text-secondary-foreground">{exam.subject}</span>
                                <span>•</span>
                                <span>{new Date(exam.exam_date).toLocaleDateString('tr-TR')}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Hedef: {exam.target_score}</div>
                                    <div className="text-sm font-black text-primary flex items-center gap-2">
                                        Tahmini: {exam.predicted_score || 0}
                                        <div className="w-16 h-1 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary"
                                                style={{ width: `${Math.min(100, (exam.predicted_score / exam.target_score) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="text-accent text-sm font-medium group-hover:underline">Başla →</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-background border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold mb-4">Yeni Sınav Ekle</h2>
                        <form onSubmit={handleAddExam} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Sınav Adı</label>
                                <input
                                    required
                                    placeholder="Örn: Matematik 1. Yazılı"
                                    className="w-full mt-1 p-2 rounded-lg border border-input bg-background"
                                    value={newExam.title}
                                    onChange={e => setNewExam({ ...newExam, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Ders</label>
                                    <select
                                        className="w-full mt-1 p-2 rounded-lg border border-input bg-background"
                                        value={newExam.subject}
                                        onChange={e => setNewExam({ ...newExam, subject: e.target.value })}
                                        required
                                    >
                                        <option value="">Seçiniz</option>
                                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Sınıf</label>
                                    <select
                                        className="w-full mt-1 p-2 rounded-lg border border-input bg-background"
                                        value={newExam.grade}
                                        onChange={e => setNewExam({ ...newExam, grade: e.target.value })}
                                    >
                                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Dönem</label>
                                    <select
                                        className="w-full mt-1 p-2 rounded-lg border border-input bg-background"
                                        value={newExam.term}
                                        onChange={e => setNewExam({ ...newExam, term: e.target.value })}
                                    >
                                        <option value="">Seçiniz</option>
                                        {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Tarih</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full mt-1 p-2 rounded-lg border border-input bg-background"
                                        value={newExam.exam_date}
                                        onChange={e => setNewExam({ ...newExam, exam_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Hedef Puan</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-full mt-1 p-2 rounded-lg border border-input bg-background"
                                    value={newExam.target_score}
                                    onChange={e => setNewExam({ ...newExam, target_score: Number(e.target.value) })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-lg"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90"
                                >
                                    Ekle
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
