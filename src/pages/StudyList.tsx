import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'

type Row = { id: string; subject: string; topic: string; hours: number; created_at: string }

export default function StudyList() {
  const { user } = useAuth()
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
    q.then(({ data }) => {
      setSessions((data as Row[]) ?? [])
      setLoading(false)
    })
  }, [user?.id, filterSubject])

  const subjects = Array.from(new Set(sessions.map((s) => s.subject)))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Çalışmalarım</h1>
        <Link to="/study/new" className="px-4 py-2 rounded-lg bg-[rgb(var(--accent))] text-white text-sm font-medium">
          Çalışma ekle
        </Link>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Derse göre filtrele</label>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
        >
          <option value="">Tümü</option>
          {subjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="text-[rgb(var(--muted))]">Yükleniyor...</div>
      ) : (
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden">
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-[rgb(var(--muted))]">Henüz kayıtlı çalışma yok.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--bg))]">
                  <th className="text-left p-3">Ders</th>
                  <th className="text-left p-3">Konu</th>
                  <th className="text-left p-3">Süre</th>
                  <th className="text-left p-3">Tarih</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-b border-[rgb(var(--border))]">
                    <td className="p-3">{s.subject}</td>
                    <td className="p-3">{s.topic}</td>
                    <td className="p-3">{s.hours} sa</td>
                    <td className="p-3">{new Date(s.created_at).toLocaleDateString('tr-TR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
