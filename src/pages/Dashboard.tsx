import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type SessionRow = { id: string; subject: string; topic: string; hours: number; created_at: string }
type StatsRow = { total_sessions: number; total_hours: number; total_correct: number; total_wrong: number; total_blank: number; quiz_count: number }

export default function Dashboard() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [stats, setStats] = useState<StatsRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    const fetchData = async () => {
      const { data: sessionsData } = await supabase
        .from('study_sessions')
        .select('id, subject, topic, hours, created_at')
        .eq('user_id', user.id)
        .eq('passed_quiz', true)
        .order('created_at', { ascending: false })
        .limit(10)
      setSessions((sessionsData as SessionRow[]) ?? [])

      const { data: sessionsAll } = await supabase
        .from('study_sessions')
        .select('id, hours, passed_quiz')
        .eq('user_id', user.id)
      const totalSessions = (sessionsAll ?? []).filter((s: { passed_quiz: boolean }) => s.passed_quiz).length
      const totalHours = (sessionsAll ?? []).filter((s: { passed_quiz: boolean }) => s.passed_quiz).reduce((acc: number, s: { hours: number }) => acc + (s.hours ?? 0), 0)

      const sessionIds = (sessionsAll ?? []).map((s: { id: string }) => s.id)
      let correct = 0
      let wrong = 0
      let blank = 0
      if (sessionIds.length > 0) {
        const { data: questionsData } = await supabase
          .from('session_questions')
          .select('is_correct, user_answer')
          .in('study_session_id', sessionIds)
        for (const q of questionsData ?? []) {
          const ans = (q as { user_answer?: string }).user_answer
          const empty = ans == null || String(ans).trim() === ''
          if (empty) blank++
          else if ((q as { is_correct: boolean }).is_correct) correct++
          else wrong++
        }
      }
      setStats({
        total_sessions: totalSessions,
        total_hours: totalHours,
        total_correct: correct,
        total_wrong: wrong,
        total_blank: blank,
        quiz_count: sessionsAll?.length ?? 0,
      })
      setLoading(false)
    }
    fetchData()
  }, [user?.id])

  if (loading) {
    return <div className="animate-pulse text-[rgb(var(--muted))]">Yükleniyor...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Ana Sayfa</h1>
        <p className="text-[rgb(var(--muted))]">Özet ve son çalışmaların</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <div className="text-2xl font-bold">{stats?.total_sessions ?? 0}</div>
          <div className="text-sm text-[rgb(var(--muted))]">Eklenen çalışma</div>
        </div>
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <div className="text-2xl font-bold">{stats?.total_hours ?? 0} sa</div>
          <div className="text-sm text-[rgb(var(--muted))]">Toplam saat</div>
        </div>
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <div className="text-2xl font-bold">{stats?.quiz_count ?? 0}</div>
          <div className="text-sm text-[rgb(var(--muted))]">Yapılan test</div>
        </div>
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <div className="text-2xl font-bold text-green-600">{stats?.total_correct ?? 0}</div>
          <div className="text-sm text-[rgb(var(--muted))]">Doğru / Yanlış / Boş</div>
          <div className="text-xs text-red-500">{stats?.total_wrong ?? 0} yanlış, {stats?.total_blank ?? 0} boş</div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Son çalışmalar</h2>
        <Link to="/study/list" className="text-sm text-[rgb(var(--accent))]">Tümünü gör</Link>
      </div>
      <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden">
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-[rgb(var(--muted))]">Henüz çalışma eklemedin. <Link to="/study/new" className="text-[rgb(var(--accent))]">Çalışma ekle</Link></div>
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
    </div>
  )
}
