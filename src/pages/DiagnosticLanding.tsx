import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '@/hooks/useLanguage'

type Stage = 'middle' | 'high' | 'university' | 'general'

const STAGES = [
    { id: 'middle', label: 'Ortaokul', icon: '🎒', desc: '5-8. Sınıf arası eksiklerini tespit et.' },
    { id: 'high', label: 'Lise / YKS', icon: '🎓', desc: 'Sınav yolculuğunda hangi konudasın?' },
    { id: 'university', label: 'Üniversite', icon: '🏛️', desc: 'Akademik becerilerini ölç.' },
    { id: 'general', label: 'Genel Kültür', icon: '🌍', desc: 'Farklı alanlarda kendini dene.' },
]

const SUBJECTS_BY_STAGE: Record<Stage, string[]> = {
    middle: ['Matematik', 'Fen Bilimleri', 'Türkçe', 'Sosyal Bilgiler'],
    high: ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Edebiyat', 'Coğrafya'],
    university: ['Lineer Cebir', 'Kalkülüs', 'Olasılık & İstatistik', 'Yapay Zeka'],
    general: ['Genel Yetenek', 'Mantık', 'Hızlı Okuma'],
}

export default function DiagnosticLanding() {
    const { t } = useLanguage()
    const navigate = useNavigate()
    const [selectedStage, setSelectedStage] = useState<Stage | null>(null)
    const [selectedSubject, setSelectedSubject] = useState<string>('')
    const [selectedMode, setSelectedMode] = useState<string>('Standard')

    const handleStart = () => {
        if (!selectedStage || !selectedSubject) return
        // Navigate to session with params (MVP uses subjects in seed data)
        navigate(`/diagnostic/session/new?stage=${selectedStage}&subject=${selectedSubject.toLowerCase()}&mode=${selectedMode.toLowerCase()}`)
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
            <div className="space-y-2 text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-foreground uppercase">
                    {t('diagnostic.title') || 'EKSİK TESPİT (DİAGNOSTİK)'}
                </h1>
                <p className="text-muted-foreground font-medium text-lg">
                    {t('diagnostic.subtitle') || 'Hangi seviyede ve hangi konuda olduğunu öğrenmek için bir seçim yap.'}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {STAGES.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => {
                            setSelectedStage(s.id as Stage)
                            setSelectedSubject('')
                        }}
                        className={`group relative bg-card border-2 p-8 rounded-[2.5rem] text-left transition-all duration-300 hover:shadow-xl ${selectedStage === s.id
                            ? 'border-primary shadow-2xl shadow-primary/10 -translate-y-2 scale-[1.02]'
                            : 'border-border/50 hover:border-primary/30'
                            }`}
                    >
                        <div className="text-5xl mb-6 group-hover:scale-110 transition-transform inline-block">{s.icon}</div>
                        <div className="space-y-2">
                            <h3 className="font-black uppercase tracking-widest text-xs text-foreground">{s.label}</h3>
                            <p className="text-[11px] font-bold text-muted-foreground leading-relaxed uppercase">{s.desc}</p>
                        </div>
                        {selectedStage === s.id && (
                            <div className="absolute top-4 right-4 text-primary text-xl">✨</div>
                        )}
                    </button>
                ))}
            </div>

            {selectedStage && (
                <div className="bg-primary/[0.03] border border-primary/20 rounded-[3rem] p-10 space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="space-y-4">
                        <h2 className="text-xl font-black italic uppercase tracking-tighter">DERS VE MOD SEÇİMİ</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">HANGİ DERS?</label>
                                {selectedStage === 'university' ? (
                                    <input
                                        type="text"
                                        placeholder={t('diagnostic.custom_subject')}
                                        value={selectedSubject}
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                        className="w-full h-16 bg-background border border-border/50 rounded-2xl px-6 font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                    />
                                ) : (
                                    <select
                                        value={selectedSubject}
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                        className="w-full h-16 bg-background border border-border/50 rounded-2xl px-6 font-bold text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                                    >
                                        <option value="">Seçiniz...</option>
                                        {SUBJECTS_BY_STAGE[selectedStage].map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">DENEYİM MODU</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Quick', 'Standard', 'Comprehensive'].map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => setSelectedMode(mode)}
                                            className={`h-16 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${selectedMode === mode ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' : 'border-border/50 hover:bg-muted text-muted-foreground'}`}
                                        >
                                            {t(`diagnostic.mode.${mode.toLowerCase()}`)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        disabled={!selectedSubject}
                        onClick={handleStart}
                        className="w-full h-20 bg-primary text-primary-foreground rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100 italic"
                    >
                        ANLAŞILDI, TESTİ BAŞLATALIM 🚀
                    </button>
                </div>
            )}
        </div>
    )
}
