import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'

import logo from '@/assets/logo.png'

const nav = [
  { to: '/dashboard', label: 'Ana Sayfa' },
  { to: '/attendance-tracker', label: 'Devamsızlık Takibi' },
  { to: '/study/new', label: 'Çalışma Ekle' },
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
    { to: '/attendance-tracker', label: 'Devamsızlık', icon: '📅' },
    { to: '/study/new', label: 'Ekle', icon: '➕' },
    { to: '/exam-analysis', label: 'Deneme', icon: '📝' },
    { to: '/tutor', label: 'AI', icon: '🤖' },
  ]

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0 bg-background text-foreground transition-colors duration-300">
      {/* Top Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-20 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-3 font-bold text-xl text-primary tracking-tight btn-bounce">
            <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
            <span className="hidden sm:inline">AKADEMİK İZ</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-3">
            {nav.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 btn-bounce ${location.pathname === to
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
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
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors btn-bounce"
              title={dark ? 'Açık tema' : 'Koyu tema'}
            >
              {dark ? '☀️' : '🌙'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors btn-bounce"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-border z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16 px-2">
          {mobileNav.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors btn-bounce ${location.pathname === to
                  ? 'text-accent'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <span className="text-xl">{icon}</span>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
