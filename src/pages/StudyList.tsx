import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'
import { useLanguage } from '@/hooks/useLanguage'

type Row = { id: string; subject: string; topic: string; hours: number; created_at: string }

export default function StudyList() {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const [sessions, setSessions] = useState<Row[]>([])
  const [filterSubject, setFilterSubject] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    let q = supabase
      .from('study_sessions')
      .select('id, subject, topic, hours, created_at')
      .eq('user_id', user.id)
      .eq('passed_quiz', true)
      .order('created_at', { ascending: false })
    if (filterSubject) q = q.eq('subject', filterSubject)
    q.then(({ data, error }) => {
      if (error) {
        console.error('List Fetch Error:', error);
      } else {
        setSessions((data as Row[]) ?? [])
      }
      setLoading(false)
    })
  }, [user?.id, filterSubject])

  const subjects = Array.from(new Set(sessions.map((s) => s.subject)))

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-foreground uppercase leading-none">{t('study.list_title')}</h1>
          <p className="text-muted-foreground font-bold tracking-tight text-lg">{language === 'Turkish' ? 'Tüm akademik çalışmaların ve başarıların.' : 'All your academic studies and achievements.'}</p>
        </div>
        <Link
          to="/study/new"
          className="h-14 px-8 flex items-center justify-center rounded-[2rem] bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          {t('dashboard.add_study')}
        </Link>
      </div>

      <div className="bg-card border border-border/50 rounded-[3rem] p-6 md:p-10 shadow-sm space-y-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/20 border border-border/50 p-4 rounded-[2rem]">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap pl-2">
            {t('study.filter_label')}
          </label>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="w-full sm:w-64 rounded-2xl border-none bg-background/50 px-6 py-3 text-sm font-bold focus:ring-0 outline-none transition-all shadow-sm"
          >
            <option value="">{t('common.all')}</option>
            {subjects.map((s) => (
              <option key={s} value={s}>{t(`subject.${s}`)}</option>
            ))}
          </select>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
            <div className="text-6xl mb-6 opacity-50">🧭</div>
            <p className="text-xl font-black italic uppercase tracking-tighter">{t('study.no_records')}</p>
            <p className="text-sm font-bold text-muted-foreground uppercase">{language === 'Turkish' ? 'Henüz kaydedilmiş bir çalışma yok.' : 'No studies recorded yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/10">
                  <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('study.table_subject')}</th>
                  <th className="text-left p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('study.table_topic')}</th>
                  <th className="text-center p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">{t('study.table_duration')}</th>
                  <th className="text-right p-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('study.table_date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {sessions.map((s) => (
                  <tr key={s.id} className="group hover:bg-primary/[0.03] transition-colors duration-300">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[1.25rem] bg-primary/10 text-primary flex items-center justify-center text-lg font-black shadow-sm group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                          {s.subject[0].toUpperCase()}
                        </div>
                        <span className="font-bold text-foreground text-sm tracking-tight">{t(`subject.${s.subject}`)}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="font-bold text-muted-foreground text-sm group-hover:text-foreground transition-colors">{s.topic}</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className="inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-secondary text-secondary-foreground">
                        {s.hours} {t('study.unit_hours_short') || 'SA'}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <span className="text-[10px] font-black text-muted-foreground uppercase opacity-70">
                        {new Date(s.created_at).toLocaleDateString(language === 'Turkish' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
