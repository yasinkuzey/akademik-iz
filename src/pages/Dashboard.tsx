import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/hooks/useLanguage'

type SessionRow = { id: string; subject: string; topic: string; hours: number; created_at: string }


export default function Dashboard() {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [weakAreas, setWeakAreas] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [dailyGoal, setDailyGoal] = useState({ text: '', progress: 0 })

  useEffect(() => {
    if (!user?.id) return
    const fetchData = async () => {
      // 1. Fetch Study Sessions
      const { data: studyData } = await supabase
        .from('study_sessions')
        .select('id, subject, topic, hours, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // 2. Fetch Weak Areas from Diagnostic Answers
      const { data: answersData } = await supabase
        .from('diagnostic_answers')
        .select('is_correct, question:diagnostic_questions(topic_tag)')
        .eq('is_correct', false)
        .limit(50)

      const topics = (answersData || []).map(a => (a.question as any)?.topic_tag).filter(Boolean)
      const uniqueWeak = Array.from(new Set(topics)).slice(0, 3)
      setWeakAreas(uniqueWeak.length > 0 ? uniqueWeak : ['Genel Tekrar', 'Soru Çözümü', 'Konu Analizi'])

      setSessions((studyData as SessionRow[]) ?? [])

      // 3. Dynamic Daily Goal based on day and weak areas
      const goals = [
        `30 DK ${uniqueWeak[0] || 'MATEMATİK'} ÇALIŞMASI`,
        `20 SORU ${uniqueWeak[1] || 'PARAGRAF'} ÇÖZÜMÜ`,
        `EYLEM PLANI: ${uniqueWeak[0] || 'FEN BİLİMLERİ'} TEKRARI`,
        `1 SAAT VERİMLİ ODAKLANMA`,
        `HEDEF: %80 BAŞARI ORANI`
      ]
      const goalIndex = (new Date().getDate() + user.id.length) % goals.length
      setDailyGoal({
        text: goals[goalIndex],
        progress: Math.floor(Math.random() * 40) + 20 // Simulated progress for now
      })

      setLoading(false)
    }
    fetchData()
  }, [user?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const lastActivity = sessions[0]

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-foreground uppercase leading-none">
            {t('dashboard.welcome')}, <span className="text-primary">{user?.user_metadata?.display_name?.split(' ')[0] || t('dashboard.student_fallback')}</span>
          </h1>
          <p className="text-muted-foreground font-bold tracking-tight text-lg">{t('dashboard.subtitle')}</p>
        </div>
        <Link
          to="/study/new"
          className="h-14 px-8 flex items-center justify-center rounded-[2rem] bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          {t('dashboard.add_study')}
        </Link>
      </div>

      {/* 3-Card Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Goal */}
        <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 text-primary">
            <span className="text-2xl">⚡</span>
            <h3 className="font-black uppercase tracking-widest text-[10px]">{t('dashboard.today_goal') || 'BUGÜNÜN HEDEFİ'}</h3>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-black leading-tight italic uppercase">{dailyGoal.text}</p>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full shadow-lg shadow-primary/10 transition-all duration-1000"
                style={{ width: `${dailyGoal.progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Weak Areas (Top 3) */}
        <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 text-destructive">
            <span className="text-2xl">⚠️</span>
            <h3 className="font-black uppercase tracking-widest text-[10px]">{t('dashboard.weak_areas') || 'ZAYIF ALANLARIN'}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {weakAreas.map((area, i) => (
              <span key={i} className="px-3 py-1 rounded-full bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-widest">
                {area}
              </span>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border/50 rounded-[2.5rem] p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 text-success">
            <span className="text-2xl">📈</span>
            <h3 className="font-black uppercase tracking-widest text-[10px]">{t('dashboard.last_activity') || 'SON AKTİVİTE'}</h3>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-black text-lg italic uppercase">{lastActivity?.topic || 'SİSTEME GİRİŞ'}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                {lastActivity ? new Date(lastActivity.created_at).toLocaleDateString() : 'BUGÜN'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-success/10 flex items-center justify-center text-success text-xl">
              ✅
            </div>
          </div>
        </div>
      </div>

      {/* "Continue" Section */}
      <section className="space-y-6">
        <h2 className="text-xl font-black italic tracking-wide text-foreground uppercase ml-2 flex items-center gap-3">
          <span className="w-8 h-[2px] bg-primary/20"></span>
          {t('dashboard.continue_learning') || 'ÖĞRENMEYE DEVAM ET'}
        </h2>

        {sessions.length > 0 ? (
          <div className="group relative bg-primary/[0.03] border border-primary/20 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 hover:bg-primary/[0.05] transition-all">
            <div className="flex items-center gap-8 text-center md:text-left">
              <div className="text-6xl group-hover:scale-110 transition-transform">{language === 'Turkish' ? '🚀' : '📚'}</div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">{sessions[0].topic}</h3>
                <p className="text-muted-foreground font-bold tracking-tight">{t(`subject.${sessions[0].subject}`)} • {sessions[0].hours} {t('dashboard.unit_hours')}</p>
              </div>
            </div>
            <Link
              to="/tutor"
              className="h-16 px-10 flex items-center justify-center rounded-[2rem] bg-foreground text-background font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-2xl"
            >
              ŞİMDİ SORU SOR 🤖
            </Link>
          </div>
        ) : (
          <Link
            to="/diagnostic"
            className="flex flex-col items-center justify-center p-20 rounded-[3rem] border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all space-y-4"
          >
            <div className="text-5xl">🔭</div>
            <div className="text-center">
              <h3 className="text-xl font-black italic uppercase tracking-tighter">{t('dashboard.start_diagnostic') || 'Eksiklerini Tespit Et'}</h3>
              <p className="text-muted-foreground font-bold">{t('dashboard.diagnostic_desc') || 'Hangi konularda eksik olduğunu öğrenmek için testi başlat.'}</p>
            </div>
          </Link>
        )}
      </section>
    </div>
  )
}
