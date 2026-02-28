import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/hooks/useLanguage'
import logo from '@/assets/logo.png'

export default function Landing() {
  const { user, loading } = useAuth()
  const { t } = useLanguage()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">{t('common.loading')}</div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-6 animate-in fade-in zoom-in duration-700">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-xl shadow-primary/5">
            <span className="text-5xl">👋</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">{t('landing.welcome_back')}</h1>
          <p className="text-muted-foreground text-xl max-w-md mx-auto leading-relaxed">
            {t('landing.continue_desc')}
          </p>
          <div className="pt-6">
            <Link
              to="/dashboard"
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-10 text-lg font-semibold text-primary-foreground shadow-2xl shadow-primary/20 transition-all hover:bg-primary/90 hover:-translate-y-1 active:scale-95"
            >
              {t('landing.back_to_panel')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/10 selection:text-primary relative overflow-hidden">
      {/* Noise Overlay */}
      <div className="noise-overlay" />

      {/* Navbar */}
      <nav className="border-b border-border/40 bg-background/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 flex h-20 items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-2xl text-foreground tracking-tight group cursor-default">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-tr from-accent to-primary opacity-20 blur-md rounded-full group-hover:opacity-60 transition-opacity duration-500"></div>
              <img src={logo} alt="Logo" className="relative w-10 h-10 object-contain rounded-xl shadow-sm transform group-hover:rotate-6 transition-transform duration-500" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50">AKADEMİK İZ</span>
            <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 animate-pulse">🚀 BETA</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden sm:block text-sm font-semibold text-muted-foreground hover:text-foreground transition-all px-4 py-2 hover:translate-y-[-1px]">
              {t('landing.login')}
            </Link>
            <Link to="/register" className="text-sm font-bold bg-foreground text-background hover:bg-foreground/90 transition-all px-6 py-2.5 rounded-xl shadow-lg shadow-foreground/10 active:scale-95 shine-effect">
              {t('landing.register')}
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 overflow-hidden">
          {/* Animated Background Blobs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/20 blur-[130px] rounded-full opacity-40 animate-float" style={{ animationDelay: '0s' }}></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-accent/20 blur-[130px] rounded-full opacity-40 animate-float" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="container max-w-[1200px] mx-auto px-6 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground animate-premium-fade-in" style={{ animationDelay: '0ms' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              {t('landing.hero_badge')}
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tight text-foreground leading-[1] animate-premium-fade-in italic drop-shadow-sm" style={{ animationDelay: '150ms' }}>
              {t('landing.hero_title')} <br />
              <span className="relative inline-block mt-4 mt-2">
                <span className="relative z-10 text-primary font-black italic">{t('landing.hero_accent')}</span>
                <div className="absolute -bottom-2 left-0 w-full h-5 bg-primary/10 -skew-x-12 -z-10 opacity-70"></div>
              </span>
            </h1>

            <p className="text-lg md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-premium-fade-in" style={{ animationDelay: '300ms' }}>
              {t('landing.hero_desc')}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8 animate-premium-fade-in" style={{ animationDelay: '450ms' }}>
              <Link
                to="/register"
                className="group relative inline-flex h-16 items-center justify-center rounded-2xl bg-foreground text-background px-12 text-xl font-bold shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all hover:scale-[1.03] active:scale-100 overflow-hidden shine-effect"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary to-accent opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                <span className="relative">{t('landing.start_now')}</span>
              </Link>
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-3 px-4 py-2 hover:bg-muted/30 rounded-2xl transition-colors cursor-default">
                <span className="flex items-center -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden shadow-sm">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} alt="User" />
                    </div>
                  ))}
                </span>
                <span className="ml-2 font-bold text-foreground">300+ {t('landing.social_proof')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-32 bg-muted/30 relative overflow-hidden">
          <div className="container max-w-[1200px] mx-auto px-6 relative z-10">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">{t('landing.how_it_works_title')}</h2>
              <p className="text-muted-foreground text-xl max-w-2xl mx-auto">{t('landing.how_it_works_subtitle')}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              {[
                { step: '01', title: t('landing.step1_title'), desc: t('landing.step1_desc'), icon: '✍️' },
                { step: '02', title: t('landing.step2_title'), desc: t('landing.step2_desc'), icon: '🧠' },
                { step: '03', title: t('landing.step3_title'), desc: t('landing.step3_desc'), icon: '📈' }
              ].map((item, i) => (
                <div key={i} className="group relative bg-background border border-border/40 p-10 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                  <div className="text-5xl mb-8 group-hover:scale-110 transition-transform duration-500 origin-left">{item.icon}</div>
                  <div className="absolute top-10 right-10 text-5xl font-black text-muted opacity-10 group-hover:opacity-30 transition-opacity duration-500 tracking-tighter">{item.step}</div>
                  <h3 className="text-2xl font-bold mb-4 text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-32">
          <div className="container max-w-[1200px] mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-12">
                <div className="space-y-6">
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
                    {t('landing.features_title').split('.')[0]}. <br />
                    <span className="text-primary italic">{t('landing.features_title').split('.')[1] || ''}</span>
                  </h2>
                  <p className="text-muted-foreground text-xl leading-relaxed">{t('landing.features_subtitle')}</p>
                </div>

                <div className="grid gap-8">
                  {[
                    { title: t('landing.feature_analysis'), desc: t('landing.feature_analysis_desc'), icon: '📊' },
                    { title: t('landing.feature_planning'), desc: t('landing.feature_planning_desc'), icon: '📅' },
                    { title: t('landing.feature_ai_coach'), desc: t('landing.feature_ai_coach_desc'), icon: '🤖' },
                    { title: t('landing.feature_target'), desc: t('landing.feature_target_desc'), icon: '🎯' }
                  ].map((feat, i) => (
                    <div key={i} className="flex gap-6 p-6 rounded-[2rem] hover:bg-muted/50 transition-all duration-500 group border border-transparent hover:border-border/40">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm">
                        {feat.icon}
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold text-foreground">{feat.title}</h4>
                        <p className="text-muted-foreground leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-8 bg-gradient-to-tr from-accent to-primary opacity-20 blur-[100px] rounded-full group-hover:opacity-30 transition-opacity duration-1000"></div>
                <div className="relative bg-card border border-border/40 p-6 rounded-[3rem] shadow-2xl backdrop-blur-sm overflow-hidden transform group-hover:scale-[1.01] transition-transform duration-700">
                  <div className="bg-background rounded-[2.2rem] overflow-hidden aspect-[4/3] flex items-center justify-center relative shadow-inner">
                    {/* Visual Placeholder for App Preview */}
                    <div className="w-full h-full bg-gradient-to-br from-muted/20 to-muted/40 flex items-center justify-center p-12">
                      <div className="w-full space-y-6">
                        <div className="h-6 bg-primary/20 rounded-full w-3/4 animate-pulse"></div>
                        <div className="h-6 bg-muted-foreground/10 rounded-full w-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="h-32 bg-primary/5 rounded-[2rem] w-full border border-primary/10 flex items-center justify-center shadow-lg group-hover:shadow-primary/5 transition-all">
                          <span className="text-primary font-black text-3xl italic tracking-tight">{t('landing.ai_complete')}</span>
                        </div>
                        <div className="h-6 bg-muted-foreground/10 rounded-full w-1/2 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Global Trust Section */}
        <section className="py-20 border-y border-border/40 bg-muted/10">
          <div className="container max-w-[1200px] mx-auto px-6">
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-24">
              {[
                { label: t('landing.trust_ai'), icon: '⚡' },
                { label: t('landing.trust_secure'), icon: '🛡️' },
                { label: t('landing.trust_privacy'), icon: '🔒' }
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-3 text-muted-foreground hover:text-foreground hover:scale-105 transition-all duration-500 cursor-default">
                  <span className="text-2xl bg-background p-2 rounded-xl border border-border/40 shadow-sm">{badge.icon}</span>
                  <span className="text-xs font-black tracking-widest uppercase">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 py-16 bg-background relative z-10">
        <div className="container max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-3 font-bold text-xl opacity-80">
            <img src={logo} alt="Logo" className="w-8 h-8 opacity-80" />
            <span className="tracking-tighter uppercase">{t('landing.footer_copyright').split(' ')[0]} AKADEMİK İZ</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-sm font-bold text-muted-foreground">
            <Link to="/about" className="hover:text-primary transition-all underline-offset-8 hover:underline">
              {t('landing.footer_about')}
            </Link>
            <Link to="/privacy" className="hover:text-primary transition-all underline-offset-8 hover:underline">
              {t('landing.footer_privacy')}
            </Link>
            <Link to="/contact" className="hover:text-primary transition-all underline-offset-8 hover:underline">
              {t('landing.footer_contact')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
