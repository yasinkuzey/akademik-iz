import { useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/hooks/useTheme'
import logo from '@/assets/logo.png'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { dark, toggle } = useTheme()

  const getLocalizedError = (message: string) => {
    if (message.includes('User already registered')) return t('auth.error_user_exists')
    if (message.includes('Password should be at least 6 characters')) return t('auth.error_password_too_short')
    return t('auth.error_generic')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } })
    setLoading(false)
    if (err) {
      setError(getLocalizedError(err.message))
      return
    }
    navigate('/dashboard')
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background relative selection:bg-primary/10 selection:text-primary">
      {/* Dark Mode Toggle */}
      <button
        onClick={toggle}
        className="absolute top-6 right-6 p-3 rounded-full bg-[rgb(var(--secondary))] text-[rgb(var(--secondary-fg))] shadow-md hover:brightness-95 transition-all z-50 group hover:scale-110"
        title={!dark ? t('nav.dark_mode') || 'Karanlık Mod' : t('nav.light_mode') || 'Aydınlık Mod'}
      >
        {!dark ? (
          <span className="text-xl group-hover:rotate-12 transition-transform block">🌙</span>
        ) : (
          <span className="text-xl group-hover:-rotate-12 transition-transform block">☀️</span>
        )}
      </button>

      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
        <div className="text-center">
          <img src={logo} alt="Logo" className="w-16 h-16 mx-auto mb-4 object-contain" />
          <h2 className="text-3xl font-bold tracking-tight text-foreground">{t('auth.register_title')}</h2>
          <p className="text-muted-foreground mt-2">{t('auth.register_subtitle')}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="text-sm font-medium text-destructive bg-destructive/10 rounded-lg p-3 border border-destructive/20">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('auth.display_name')}</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder={t('auth.display_name_placeholder')}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder={t('auth.email_placeholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('auth.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder={t('auth.password_placeholder')}
                required
                minLength={6}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Veya e-posta ile</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold shadow hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('auth.registering') : t('auth.register_button')}
            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3.5 rounded-xl bg-[rgb(var(--secondary))] text-[rgb(var(--secondary-fg))] font-bold shadow-md hover:brightness-95 hover:shadow-lg transition-all flex items-center justify-center gap-3 group"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 group-hover:scale-110 transition-transform">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.01.67-2.3 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {t('auth.register_google')}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.have_account')} <Link to="/login" className="font-semibold text-accent hover:underline">{t('auth.login_button')}</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

