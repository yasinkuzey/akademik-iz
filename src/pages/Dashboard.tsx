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
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Hoş geldin, {user?.user_metadata?.display_name || 'Öğrenci'} 👋</h1>
          <p className="text-muted-foreground mt-1">Bugün hedeflerine ulaşmak için harika bir gün!</p>
        </div>
        <Link
          to="/study/new"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-transform active:scale-95 hover:scale-105"
        >
          + Yeni Çalışma Ekle
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-500 delay-100 fill-mode-forwards">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="text-3xl font-bold text-foreground">{stats?.total_sessions ?? 0}</div>
          <div className="text-sm font-medium text-muted-foreground mt-1">Tamamlanan Çalışma</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="text-3xl font-bold text-foreground">{stats?.total_hours ?? 0}<span className="text-lg text-muted-foreground ml-1">sa</span></div>
          <div className="text-sm font-medium text-muted-foreground mt-1">Toplam Süre</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="text-3xl font-bold text-foreground">{stats?.quiz_count ?? 0}</div>
          <div className="text-sm font-medium text-muted-foreground mt-1">Çözülen Test</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="text-3xl font-bold text-success">{stats?.total_correct ?? 0}</div>
          <div className="text-sm font-medium text-muted-foreground mt-1">Doğru Cevap</div>
          <div className="text-xs text-muted-foreground mt-2 flex gap-2">
            <span className="text-destructive font-medium">{stats?.total_wrong ?? 0} Yanlış</span>
            <span>•</span>
            <span>{stats?.total_blank ?? 0} Boş</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">

          {/* Recent Sessions */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground">Son Çalışmalar</h2>
              <Link to="/study/list" className="text-sm font-medium text-accent hover:text-accent/80 transition-colors">
                Tümünü Gör →
              </Link>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              {sessions.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-4">📚</div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Henüz çalışma kaydı yok</h3>
                  <p className="text-muted-foreground mb-6">İlk çalışmanı ekleyerek serüvenine başla.</p>
                  <Link to="/study/new" className="text-accent hover:underline">Hemen Ekle</Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-medium">
                      <tr>
                        <th className="p-4 rounded-tl-xl">Ders</th>
                        <th className="p-4">Konu</th>
                        <th className="p-4">Süre</th>
                        <th className="p-4 rounded-tr-xl">Tarih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sessions.map((s) => (
                        <tr key={s.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="p-4 font-medium text-foreground">{s.subject}</td>
                          <td className="p-4 text-muted-foreground group-hover:text-foreground transition-colors">{s.topic}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-accent/10 text-accent font-medium text-xs">
                              {s.hours} saat
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground">{new Date(s.created_at).toLocaleDateString('tr-TR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          {/* Attendance Quick Access */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Devamsızlık Durumu</h3>
              <span className="text-2xl">📅</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Derslerinin katılım durumunu kontrol et ve güncelle.
            </p>
            <Link
              to="/attendance-tracker"
              className="block w-full py-2 text-center rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all active:scale-95 text-sm font-medium"
            >
              Takibi Aç
            </Link>
          </div>

          {/* Motivational Card Example */}
          <div className="rounded-xl border border-border bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-lg">
            <h3 className="font-bold text-lg mb-2">Günün Sözü</h3>
            <p className="text-primary-foreground/90 italic">"Başarı, her gün tekrarlanan küçük çabaların toplamıdır."</p>
            <div className="mt-4 text-sm text-primary-foreground/70">- Robert Collier</div>
          </div>

          {/* Quick Stats or Promo */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4">Sınav Tahmini</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Yapay zeka performansını analiz ederek YKS sıralamanı tahmin ediyor.
            </p>
            <Link
              to="/exam-prediction"
              className="block w-full py-2 text-center rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm font-medium active:scale-95 btn-bounce"
            >
              Tahmini Gör
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
