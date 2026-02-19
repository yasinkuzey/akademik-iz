import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import logo from '@/assets/logo.png'

export default function Landing() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Yükleniyor...</div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">👋</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Tekrar Hoş Geldiniz!</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Çalışmalarınıza kaldığınız yerden devam etmek için panele gidin.
          </p>
          <div className="pt-4">
            <Link
              to="/dashboard"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              Panele Dön
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary tracking-tight">
            <img src={logo} alt="Logo" className="w-8 h-8 object-contain rounded-full" />
            <span>AKADEMİK İZ</span>
          </div>
          <div className="flex gap-4">
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
              Giriş Yap
            </Link>
            <Link to="/register" className="text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors px-4 py-2 rounded-lg">
              Kayıt Ol
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container py-24 md:py-32 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-center lg:text-left animate-in slide-in-from-left-8 duration-700">
          <div className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-2">
            🚀 YKS Hazırlığında Yeni Dönem
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground leading-tight">
            Hedefine Giden Yolda <br /> <span className="text-accent">İz Bırak.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
            Yapay zeka destekli analizler, detaylı çalışma takibi ve gelişmiş deneme analizi ile başarıya ulaşmak artık daha kolay.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
            <Link
              to="/register"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:-translate-y-1"
            >
              Hemen Başla
            </Link>
            <Link
              to="/login"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-input bg-background px-8 text-base font-medium shadow-sm transition-colors hover:bg-accent/5 hover:text-accent hover:border-accent"
            >
              Giriş Yap
            </Link>
          </div>
        </div>

        {/* Visual / Feature Grid */}
        <div className="relative animate-in slide-in-from-right-8 duration-700 delay-200">
          <div className="absolute -inset-4 bg-gradient-to-r from-accent to-primary opacity-20 blur-3xl rounded-full"></div>
          <div className="relative grid grid-cols-2 gap-4">
            <div className="space-y-4 mt-8">
              <div className="bg-card border border-border p-6 rounded-2xl shadow-xl">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-bold text-foreground">Deneme Analizi</h3>
                <p className="text-xs text-muted-foreground">Eksiklerini nokta atışı tespit et.</p>
              </div>
              <div className="bg-card border border-border p-6 rounded-2xl shadow-xl">
                <div className="text-3xl mb-2">📅</div>
                <h3 className="font-bold text-foreground">Planlama</h3>
                <p className="text-xs text-muted-foreground">Akıllı program ile zamanı yönet.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-card border border-border p-6 rounded-2xl shadow-xl">
                <div className="text-3xl mb-2">🤖</div>
                <h3 className="font-bold text-foreground">AI Koç</h3>
                <p className="text-xs text-muted-foreground">Sana özel tavsiyeler al.</p>
              </div>
              <div className="bg-card border border-border p-6 rounded-2xl shadow-xl">
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="font-bold text-foreground">Hedef Takip</h3>
                <p className="text-xs text-muted-foreground">İlerlemeyi anlık gör.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-border mt-auto">
        <div className="container py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="w-8 h-8 opacity-80 rounded-full" />
            <span className="text-sm font-semibold text-muted-foreground">Akademik İz &copy; 2024</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Hakkımızda</a>
            <a href="#" className="hover:text-foreground transition-colors">Gizlilik</a>
            <a href="#" className="hover:text-foreground transition-colors">İletişim</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
