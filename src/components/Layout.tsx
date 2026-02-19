import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'

import logo from '@/assets/logo.png'

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
    ).then(() => { })
  }, [user?.id])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  // Mobile Bottom Navigation items (subset of full nav)
  const mobileNav = [
    { to: '/dashboard', label: 'Ana Sayfa', icon: '🏠' },
    { to: '/study/new', label: 'Ekle', icon: '➕' },
    { to: '/exam-analysis', label: 'Deneme', icon: '📝' },
    { to: '/exam-prediction', label: 'Tahmin', icon: '🎯' },
    { to: '/tutor', label: 'AI', icon: '🤖' },
  ]

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      {/* Top Header */}
      <header className="sticky top-0 z-10 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg text-[rgb(var(--accent))] truncate">
            <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
            <span>AKADEMİK İZ</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex flex-wrap items-center gap-1">
            {nav.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${location.pathname === to
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
              className="p-2 rounded-full hover:bg-[rgb(var(--border))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              title={dark ? 'Açık tema' : 'Koyu tema'}
            >
              {dark ? '☀️' : '🌙'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[rgb(var(--card))] border-t border-[rgb(var(--border))] z-50">
        <div className="flex justify-around items-center h-16">
          {mobileNav.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${location.pathname === to
                ? 'text-[rgb(var(--accent))]'
                : 'text-[rgb(var(--muted))]'
                }`}
            >
              <span className="text-xl">{icon}</span>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
          {/* 'More' button for items that didn't fit (optional, linking to a menu page or just listing more) 
              For now keeping it simple with the most important ones.
          */}
        </div>
      </div>
    </div>
  )
}
