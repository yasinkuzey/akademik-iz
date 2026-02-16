import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'

const nav = [
  { to: '/dashboard', label: 'Ana Sayfa' },
  { to: '/study/new', label: 'Çalışma Ekle' },
  { to: '/study/list', label: 'Çalışmalarım' },
  { to: '/stats', label: 'İstatistikler' },
  { to: '/exam-analysis', label: 'Deneme Analizi' },
  { to: '/exam-prediction', label: 'Sınav Tahmini' },
  { to: '/tutor', label: 'AI Öğretmen' },
  { to: '/leaderboard', label: 'Liderlik' },
]

export default function Layout({ children }: { children?: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { dark, toggle } = useTheme()

  useEffect(() => {
    if (!user?.id) return
    supabase.from('profiles').upsert(
      { id: user.id, display_name: (user.user_metadata?.display_name as string) || null },
      { onConflict: 'id' }
    ).then(() => {})
  }, [user?.id])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/dashboard" className="font-semibold text-lg text-[rgb(var(--accent))]">
            Öğrenci Platformu
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            {nav.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-1.5 rounded-md text-sm ${
                  location.pathname === to
                    ? 'bg-[rgb(var(--accent))] text-white'
                    : 'text-[rgb(var(--muted))] hover:bg-[rgb(var(--border))] hover:text-[rgb(var(--fg))]'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggle}
              className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              title={dark ? 'Açık tema' : 'Koyu tema'}
            >
              {dark ? '☀️' : '🌙'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
