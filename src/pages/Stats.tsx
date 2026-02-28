import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

import { useLanguage } from '@/hooks/useLanguage'

type Agg = { total_sessions: number; total_hours: number; total_correct: number; total_wrong: number; total_blank: number; quiz_count: number }
type BySubject = { subject: string; count: number; hours: number }[]

export default function Stats() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [agg, setAgg] = useState<Agg | null>(null)
  const [bySubject, setBySubject] = useState<BySubject>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    const run = async () => {
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('id, subject, hours, passed_quiz')
        .eq('user_id', user.id)
      const passed = (sessions ?? []).filter((s: { passed_quiz: boolean }) => s.passed_quiz)
      const totalHours = passed.reduce((a: number, s: { hours: number }) => a + (s.hours ?? 0), 0)
      const ids = (sessions ?? []).map((s: { id: string }) => s.id)
      let correct = 0
      let wrong = 0
      let blank = 0
      if (ids.length) {
        const { data: qs } = await supabase.from('session_questions').select('is_correct, user_answer').in('study_session_id', ids)
        for (const q of qs ?? []) {
          const ans = (q as { user_answer?: string }).user_answer
          const empty = ans == null || String(ans).trim() === ''
          if (empty) blank++
          else if ((q as { is_correct: boolean }).is_correct) correct++
          else wrong++
        }
      }
      const bySub: BySubject = []
      const map = new Map<string, { count: number; hours: number }>()
      for (const s of passed as { subject: string; hours: number }[]) {
        const cur = map.get(s.subject) ?? { count: 0, hours: 0 }
        cur.count += 1
        cur.hours += s.hours ?? 0
        map.set(s.subject, cur)
      }
      map.forEach((v, k) => bySub.push({ subject: k, ...v }))
      bySub.sort((a, b) => b.hours - a.hours)
      setAgg({
        total_sessions: passed.length,
        total_hours: totalHours,
        total_correct: correct,
        total_wrong: wrong,
        total_blank: blank,
        quiz_count: sessions?.length ?? 0,
      })
      setBySubject(bySub)
      setLoading(false)
    }
    run()
  }, [user?.id])

  if (loading) return <div className="animate-pulse text-[rgb(var(--muted))]">Yükleniyor...</div>

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-foreground uppercase">{t('nav.stats') || 'İstatistikler'}</h1>
        <p className="text-muted-foreground font-medium">{t('stats.desc') || 'Akademik ilerlemenin detaylı analizi.'}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('dashboard.completed_study'), value: agg?.total_sessions ?? 0, icon: '📚' },
          { label: t('dashboard.total_time'), value: `${agg?.total_hours ?? 0} ${t('dashboard.unit_hours')}`, icon: '⏱️' },
          { label: t('dashboard.solved_test'), value: agg?.quiz_count ?? 0, icon: '📝' },
        ].map((item, i) => (
          <div key={i} className="rounded-3xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all">
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="text-2xl md:text-3xl font-black text-foreground">{item.value}</div>
            <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">{item.label}</div>
          </div>
        ))}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all">
          <div className="text-xl font-bold text-success flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success"></span>
            {agg?.total_correct ?? 0} {t('dashboard.correct_answer').split(' ')[0]}
          </div>
          <div className="text-sm text-destructive font-bold mt-1">{agg?.total_wrong ?? 0} {t('dashboard.wrong')}</div>
          <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground mt-3">{t('dashboard.correct_answer')}</div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-black italic tracking-tight text-foreground uppercase">{t('stats.subject_distribution') || 'Ders Dağılımı'}</h2>
        <div className="rounded-[2.5rem] border border-border bg-card shadow-xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            {bySubject.length === 0 ? (
              <div className="p-16 text-center">
                <div className="text-4xl mb-4 opacity-20">📊</div>
                <p className="text-muted-foreground font-bold italic tracking-tight uppercase">{t('dashboard.no_studies')}</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">{t('study.table_subject')}</th>
                    <th className="text-right p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">{t('study.table_duration')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {bySubject.map((s) => (
                    <tr key={s.subject} className="group hover:bg-primary/[0.02] transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-sm font-black shadow-sm group-hover:scale-110 transition-transform">
                            {s.subject[0].toUpperCase()}
                          </div>
                          <span className="font-bold text-foreground text-base tracking-tight">{t(`subject.${s.subject}`) || s.subject}</span>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="text-lg font-black text-primary">{s.hours} <span className="text-[10px] uppercase opacity-70">sa</span></div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase">{s.count} {t('dashboard.completed_study').split(' ')[0]}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
