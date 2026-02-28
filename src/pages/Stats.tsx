import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

type Agg = { total_sessions: number; total_hours: number; total_correct: number; total_wrong: number; total_blank: number; quiz_count: number }
type BySubject = { subject: string; count: number; hours: number }[]

export default function Stats() {
  const { user } = useAuth()
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
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">İstatistikler</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <div className="text-2xl font-bold">{agg?.total_sessions ?? 0}</div>
          <div className="text-sm text-[rgb(var(--muted))]">Eklenen çalışma</div>
        </div>
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <div className="text-2xl font-bold">{agg?.total_hours ?? 0} sa</div>
          <div className="text-sm text-[rgb(var(--muted))]">Toplam saat</div>
        </div>
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <div className="text-2xl font-bold">{agg?.quiz_count ?? 0}</div>
          <div className="text-sm text-[rgb(var(--muted))]">Yapılan test</div>
        </div>
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <div className="text-lg font-bold text-green-600">{agg?.total_correct ?? 0} doğru</div>
          <div className="text-sm text-red-500">{agg?.total_wrong ?? 0} yanlış</div>
          <div className="text-sm text-[rgb(var(--muted))]">{agg?.total_blank ?? 0} boş</div>
        </div>
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-4">Derslere göre dağılım</h2>
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden">
          {bySubject.length === 0 ? (
            <div className="p-6 text-center text-[rgb(var(--muted))]">Veri yok</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--bg))]">
                  <th className="text-left p-3">Ders</th>
                  <th className="text-right p-3">Çalışma sayısı</th>
                  <th className="text-right p-3">Saat</th>
                </tr>
              </thead>
              <tbody>
                {bySubject.map((s) => (
                  <tr key={s.subject} className="border-b border-[rgb(var(--border))]">
                    <td className="p-3">{s.subject}</td>
                    <td className="p-3 text-right">{s.count}</td>
                    <td className="p-3 text-right">{s.hours} sa</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
