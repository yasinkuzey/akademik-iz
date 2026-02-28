import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '@/hooks/useLanguage'
import logo from '@/assets/logo.png'

export default function Sidebar() {
    const location = useLocation()
    const { t, language } = useLanguage()

    const mainNav = [
        { to: '/dashboard', label: t('nav.dashboard'), icon: '🏠' },
        { to: '/learning-plan', label: t('nav.learning_plan') || 'Öğrenme Planı', icon: '🎯' },
        { to: '/tutor', label: t('nav.tutor_chat') || 'AI ile Konuş', icon: '🤖' },
        { to: '/leaderboard', label: t('nav.leaderboard') || 'Liderlik Tablosu', icon: '🏆' },
        { to: '/tools', label: t('nav.tools') || 'Araçlar', icon: '🛠️' },
        { to: '/settings', label: t('nav.settings') || 'Ayarlar', icon: '⚙️' },
    ]

    return (
        <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-card border-r border-border/50 p-6 z-40">
            <Link to="/dashboard" className="flex items-center gap-3 mb-12 px-2">
                <img src={logo} alt="Logo" className="w-10 h-10 object-contain rounded-full bg-primary/5 p-1" />
                <span className="font-black italic tracking-tighter text-xl text-primary uppercase">AKADEMİKİZ</span>
            </Link>

            <nav className="flex-1 space-y-2">
                {mainNav.map(({ to, label, icon }) => (
                    <Link
                        key={to}
                        to={to}
                        className={`flex items-center gap-4 px-4 py-3 rounded-2xl font-bold uppercase tracking-widest text-[11px] transition-all duration-300 group ${location.pathname === to
                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                            }`}
                    >
                        <span className={`text-xl transition-transform duration-300 group-hover:scale-110 ${location.pathname === to ? 'scale-110' : ''}`}>
                            {icon}
                        </span>
                        {label}
                    </Link>
                ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-border/50">
                <div className="bg-primary/5 rounded-3xl p-5 space-y-3 border border-primary/10">
                    <div className="flex items-center gap-2 text-primary">
                        <span className="text-lg">✨</span>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">{t('dashboard.quote_of_day')}</h4>
                    </div>
                    <p className="text-[11px] font-bold italic leading-relaxed text-foreground/80">
                        {language === 'Turkish'
                            ? '"Zorluklar, başarıyı daha da değerli kılan basamaklardır."'
                            : '"Difficulties are the steps that make success even more valuable."'}
                    </p>
                </div>
            </div>
        </aside>
    )
}
