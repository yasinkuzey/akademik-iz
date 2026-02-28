import { useEffect, useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { supabase } from '@/lib/supabase'

type Row = { display_name: string | null; total_points: number; rank?: number }

export default function Leaderboard() {
  const { t } = useLanguage()
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
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <div className="space-y-2 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-foreground uppercase">{t('leaderboard.title')}</h1>
        <p className="text-muted-foreground font-medium">{t('leaderboard.desc')}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="rounded-[2.5rem] border border-border bg-card shadow-xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-6 w-16 text-xs font-black uppercase tracking-widest text-muted-foreground">#</th>
                  <th className="text-left p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">{t('leaderboard.user')}</th>
                  <th className="text-right p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">{t('leaderboard.points')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {rows.map((r, i) => {
                  let rankDisplay: React.ReactNode = r.rank ?? i + 1
                  if (i === 0) rankDisplay = <span className="text-2xl drop-shadow-md">🥇</span>
                  else if (i === 1) rankDisplay = <span className="text-2xl drop-shadow-md">🥈</span>
                  else if (i === 2) rankDisplay = <span className="text-2xl drop-shadow-md">🥉</span>

                  return (
                    <tr key={i} className="group hover:bg-primary/[0.02] transition-colors">
                      <td className="p-6 font-black text-center text-lg">{rankDisplay}</td>
                      <td className="p-6 text-base">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-primary/60 flex items-center justify-center text-sm text-primary-foreground font-black shadow-lg shadow-primary/20 rotate-3 group-hover:rotate-0 transition-transform">
                            {(r.display_name || 'A')[0].toUpperCase()}
                          </div>
                          <span className="font-bold text-foreground tracking-tight">{r.display_name || (t('common.anonymous') || 'Anonim')}</span>
                        </div>
                      </td>
                      <td className="p-6 text-right font-black text-primary text-lg tabular-nums">
                        {r.total_points ?? 0}
                        <span className="text-[10px] ml-1 uppercase tracking-tighter opacity-70">pts</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <div className="p-16 text-center">
              <div className="text-4xl mb-4 opacity-20">🏆</div>
              <p className="text-muted-foreground font-bold italic tracking-tight uppercase">{t('leaderboard.no_points')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
