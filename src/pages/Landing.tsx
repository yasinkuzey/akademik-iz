import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import logo from '@/assets/logo.png'

export default function Landing() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[rgb(var(--muted))]">Yükleniyor...</div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg))]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Zaten giriş yaptınız</h1>
          <Link
            to="/dashboard"
            className="inline-block px-6 py-3 rounded-lg bg-[rgb(var(--accent))] text-white font-medium"
          >
            Panele git
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[rgb(var(--bg))]">
      <img src={logo} alt="Akademik İz" className="w-24 h-24 mb-6 object-contain" />
      <h1 className="text-4xl font-black text-center mb-2 tracking-tight">AKADEMİK İZ</h1>
      <p className="text-[rgb(var(--muted))] text-center mb-8 max-w-md">
        Çalışmalarını ekle, AI ile soru çöz, deneme analizi yap ve sınav tahminlerini al.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          to="/login"
          className="px-6 py-3 rounded-lg border border-[rgb(var(--border))] font-medium hover:bg-[rgb(var(--card))]"
        >
          Giriş yap
        </Link>
        <Link
          to="/register"
          className="px-6 py-3 rounded-lg bg-[rgb(var(--accent))] text-white font-medium"
        >
          Kayıt ol
        </Link>
      </div>
    </div>
  )
}
