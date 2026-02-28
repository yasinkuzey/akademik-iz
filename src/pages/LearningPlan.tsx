import { useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage'

export default function LearningPlan() {
    const { t, language } = useLanguage()
    const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly')
    const [selectedWeek, setSelectedWeek] = useState(1)

    const days = [
        { name: language === 'Turkish' ? 'Pazartesi' : 'Monday', date: '24 ŞUB', tasks: ['Matematik: Fonksiyonlar', 'Türkçe: Paragraf'] },
        { name: language === 'Turkish' ? 'Salı' : 'Tuesday', date: '25 ŞUB', tasks: ['Fizik: Optik', 'Kimya: Mol Kavramı'] },
        { name: language === 'Turkish' ? 'Çarşamba' : 'Wednesday', date: '26 ŞUB', tasks: ['Biyoloji: Hücre', 'Geometri: Üçgenler'] },
        { name: language === 'Turkish' ? 'Perşembe' : 'Thursday', date: '27 ŞUB', tasks: ['Matematik: Denklemler', 'Edebiyat: Şiir Bilgisi'] },
        { name: language === 'Turkish' ? 'Cuma' : 'Friday', date: '28 ŞUB', tasks: ['Fen Bilimleri: Deney', 'Tarih: İlk Çağ'] },
    ]

    const weeks = [
        {
            id: 1,
            label: language === 'Turkish' ? '1. Hafta' : 'Week 1',
            focus: language === 'Turkish' ? 'Temel Kavramlar' : 'Core Concepts',
            tasks: language === 'Turkish'
                ? ['Diagnostik Test Tamamlama', 'Eksik Konu Analizi', 'Haftalık Plan Hazırlığı']
                : ['Complete Diagnostic Test', 'Gap Analysis', 'Weekly Plan Preparation']
        },
        {
            id: 2,
            label: language === 'Turkish' ? '2. Hafta' : 'Week 2',
            focus: language === 'Turkish' ? 'Derinleştirme' : 'Deepening',
            tasks: language === 'Turkish'
                ? ['Zayıf Konu Çalışması', 'Soru Çözüm Teknikleri', 'AI Coach ile Kavram Revizyonu']
                : ['Weak Area Study', 'Problem Solving Techniques', 'Concept Revision with AI Coach']
        },
        {
            id: 3,
            label: language === 'Turkish' ? '3. Hafta' : 'Week 3',
            focus: language === 'Turkish' ? 'Sınav Pratiği' : 'Exam Practice',
            tasks: language === 'Turkish'
                ? ['Konu Tarama Testleri', 'Deneme Analizi Pratiği', 'Zaman Yönetimi Egzersizleri']
                : ['Subject Scanning Tests', 'Mock Analysis Practice', 'Time Management Exercises']
        },
        {
            id: 4,
            label: language === 'Turkish' ? '4. Hafta' : 'Week 4',
            focus: language === 'Turkish' ? 'Deneme & Tekrar' : 'Mocks & Review',
            tasks: language === 'Turkish'
                ? ['Genel Deneme Sınavı', 'Hızlı Tekrar Seansları', 'Ay Sonu Değerlendirmesi']
                : ['General Mock Exam', 'Fast Review Sessions', 'End-of-Month Evaluation']
        },
    ]

    const activeWeek = weeks.find(w => w.id === selectedWeek) || weeks[0]

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black italic tracking-tighter text-foreground uppercase">{t('nav.learning_plan')}</h1>
                    <p className="text-muted-foreground font-bold tracking-tight text-lg">
                        {language === 'Turkish'
                            ? `${viewMode === 'weekly' ? 'HAFTALIK' : 'AYLIK'} AKADEMİK YOL HARİTAN`
                            : `YOUR ${viewMode === 'weekly' ? 'WEEKLY' : 'MONTHLY'} ACADEMIC ROADMAP`}
                    </p>
                </div>
                <div className="flex bg-muted/30 p-1 rounded-2xl border border-border/50">
                    <button
                        onClick={() => setViewMode('weekly')}
                        className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === 'weekly' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted/50'}`}
                    >
                        {language === 'Turkish' ? 'HAFTALIK' : 'WEEKLY'}
                    </button>
                    <button
                        onClick={() => setViewMode('monthly')}
                        className={`px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${viewMode === 'monthly' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-muted/50'}`}
                    >
                        {language === 'Turkish' ? 'AYLIK' : 'MONTHLY'}
                    </button>
                </div>
            </div>

            {viewMode === 'weekly' ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {days.map((day, idx) => (
                        <div key={idx} className="bg-card border border-border/50 rounded-[2.5rem] p-6 space-y-6 shadow-sm group hover:border-primary/30 transition-all hover:-translate-y-1">
                            <div className="space-y-1 text-center border-b border-border/50 pb-4">
                                <h3 className="font-black uppercase tracking-tighter italic text-lg text-primary">{day.name}</h3>
                                <p className="text-[10px] font-bold text-muted-foreground">{day.date}</p>
                            </div>

                            <div className="space-y-3">
                                {day.tasks.map((task, tIdx) => (
                                    <div key={tIdx} className="p-3 rounded-xl bg-muted/20 border border-border/40 text-[10px] font-black uppercase tracking-widest text-center group-hover:bg-primary/5 transition-colors">
                                        {task}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {weeks.map((week) => (
                            <button
                                key={week.id}
                                onClick={() => setSelectedWeek(week.id)}
                                className={`bg-card border rounded-[2.5rem] p-6 space-y-6 shadow-sm group transition-all hover:-translate-y-1 text-center relative overflow-hidden ${selectedWeek === week.id ? 'border-primary ring-2 ring-primary/20' : 'border-border/50 hover:border-primary/30'}`}
                            >
                                {selectedWeek === week.id && <div className="absolute top-0 right-0 p-2 text-xs">✨</div>}
                                <h3 className="font-black uppercase tracking-tighter italic text-xl text-primary">{week.label}</h3>
                                <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-[10px] font-black uppercase tracking-widest">
                                    {week.focus}
                                </div>
                                <div className="grid grid-cols-7 gap-1 opacity-20">
                                    {[...Array(28)].map((_, i) => (
                                        <div key={i} className={`aspect-square rounded-sm ${selectedWeek === week.id ? 'bg-primary' : 'bg-foreground/20'}`}></div>
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="bg-card/50 border border-border/50 rounded-[3rem] p-10 animate-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">📋</div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-primary">{activeWeek.label} - {activeWeek.focus}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {activeWeek.tasks.map((task, i) => (
                                <div key={i} className="bg-background border border-border/40 p-6 rounded-3xl flex items-center gap-4 hover:border-primary/50 transition-colors shadow-sm">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black text-xs">
                                        {i + 1}
                                    </div>
                                    <span className="font-bold uppercase tracking-widest text-[10px] font-black">{task}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <section className="bg-foreground text-background rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-8xl opacity-10 group-hover:scale-110 transition-transform duration-700">🎯</div>
                <div className="space-y-4">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">
                        {language === 'Turkish' ? 'SMART REHBER' : 'SMART GUIDE'}
                    </h2>
                    <p className="max-w-xl font-bold italic opacity-80 leading-relaxed">
                        {language === 'Turkish'
                            ? 'Diagnostik sonuçlarına göre hazırlanan kişiselleştirilmiş planın hazır. Bu modül senin eksiklerini kapatman için en verimli çalışma sırasını belirler.'
                            : 'Your personalized plan, prepared according to diagnostic results, is ready. This module determines the most efficient study order for you to close your gaps.'}
                    </p>
                </div>
                <button
                    onClick={() => { }}
                    className="h-14 px-10 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all relative z-10 shadow-lg shadow-primary/20"
                >
                    {language === 'Turkish' ? 'TAHMİN AL' : 'GET PREDICTION'}
                </button>
            </section>
        </div>
    )
}
