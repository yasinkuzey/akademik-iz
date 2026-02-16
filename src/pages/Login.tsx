import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
        <h1 className="text-xl font-bold mb-4">Giriş yap</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-500 bg-red-500/10 rounded-lg p-2">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-[rgb(var(--accent))] text-white font-medium disabled:opacity-50"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş yap'}
          </button>
        </form>
        <p className="mt-4 text-sm text-[rgb(var(--muted))]">
          Hesabın yok mu? <Link to="/register" className="text-[rgb(var(--accent))]">Kayıt ol</Link>
        </p>
      </div>
    </div>
  )
}
