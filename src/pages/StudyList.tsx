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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('study.list_title')}</h1>
        <Link to="/study/new" className="px-4 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium">
          {t('dashboard.add_study')}
        </Link>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t('study.filter_label')}</label>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm focus:ring-2 focus:ring-[rgb(var(--accent))]/30 outline-none transition-all"
        >
          <option value="">{t('common.all')}</option>
          {subjects.map((s) => (
            <option key={s} value={s}>{t(`subject.${s}`)}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="text-[rgb(var(--muted))] flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[rgb(var(--accent))] border-t-transparent rounded-full animate-spin"></div>
          {t('common.loading')}
        </div>
      ) : (
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden shadow-sm">
          {sessions.length === 0 ? (
            <div className="p-12 text-center text-[rgb(var(--muted))]">
              <div className="text-4xl mb-2">📄</div>
              {t('study.no_records')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-[rgb(var(--border))]">
                  <tr>
                    <th className="p-4">{t('study.table_subject')}</th>
                    <th className="p-4">{t('study.table_topic')}</th>
                    <th className="p-4">{t('study.table_duration')}</th>
                    <th className="p-4">{t('study.table_date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--border))]">
                  {sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium text-foreground">{t(`subject.${s.subject}`)}</td>
                      <td className="p-4 text-muted-foreground">{s.topic}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgb(var(--accent))]/10 text-[rgb(var(--accent))]">
                          {s.hours} {t('study.unit_hours_short')}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">{new Date(s.created_at).toLocaleDateString(language === 'Turkish' ? 'tr-TR' : 'en-US')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
