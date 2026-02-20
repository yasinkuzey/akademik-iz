import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Row = { display_name: string | null; total_points: number; rank?: number }

export default function Leaderboard() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, total_points')
          .order('total_points', { ascending: false })
          .limit(50)

        if (error) {
          console.error('Error fetching leaderboard:', error)
          return
        }

        console.log('Leaderboard data:', data)
        const list = (data ?? []).map((r, i) => ({ ...r, rank: i + 1 })) as Row[]
        setRows(list)
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Liderlik tablosu</h1>
      <p className="text-[rgb(var(--muted))]">Her başarıyla eklenen çalışmada puan kazanırsın. Süreye göre ek puan verilir.</p>

      {loading ? (
        <div className="text-[rgb(var(--muted))]">Yükleniyor...</div>
      ) : (
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--bg))]">
                <th className="text-left p-3 w-12">#</th>
                <th className="text-left p-3">Kullanıcı</th>
                <th className="text-right p-3">Puan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                let rankDisplay: React.ReactNode = r.rank ?? i + 1
                if (i === 0) rankDisplay = <span className="text-xl">🥇</span>
                else if (i === 1) rankDisplay = <span className="text-xl">🥈</span>
                else if (i === 2) rankDisplay = <span className="text-xl">🥉</span>

                return (
                  <tr key={i} className="border-b border-[rgb(var(--border))] hover:bg-[rgb(var(--muted))]/5 transition-colors">
                    <td className="p-3 font-medium text-center">{rankDisplay}</td>
                    <td className="p-3 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[rgb(var(--muted))] flex items-center justify-center text-xs text-[rgb(var(--bg))] font-bold">
                        {(r.display_name || 'A')[0].toUpperCase()}
                      </div>
                      {r.display_name || 'Anonim'}
                    </td>
                    <td className="p-3 text-right font-bold text-[rgb(var(--accent))]">{r.total_points ?? 0} Puan</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="p-8 text-center text-[rgb(var(--muted))]">Henüz puan yok.</div>
          )}
        </div>
      )}
    </div>
  )
}
