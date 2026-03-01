import { Link, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import logo from '@/assets/logo.png'

export default function AppShell({ children }: { children: React.ReactNode }) {
    const location = useLocation()
    const { t, language, setLanguage } = useLanguage()
    const { dark, toggle } = useTheme()

    return (
        <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="h-16 flex items-center justify-between px-6 sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="flex items-center gap-2">
                            <img src={logo} alt="Logo" className="w-8 h-8 object-contain rounded-full bg-primary/5 p-0.5" />
                            <span className="font-black italic tracking-tighter text-xl text-primary uppercase">{t('app.name')}</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Desktop Lang Switcher */}
                        <div className="hidden sm:flex bg-muted/40 rounded-full p-1 border border-border/50">
                            <button
                                onClick={() => setLanguage('Turkish')}
                                className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest transition-all ${language === 'Turkish' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                            >
                                TR
                            </button>
                            <button
                                onClick={() => setLanguage('English')}
                                className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest transition-all ${language === 'English' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted'}`}
                            >
                                EN
                            </button>
                        </div>

                        <button
                            onClick={toggle}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/30 hover:bg-muted transition-all active:scale-95 border border-border/30"
                        >
                            {dark ? '☀️' : '🌙'}
                        </button>
                    </div>
                </header>

                {/* Content Container */}
                <main className="flex-1 overflow-x-hidden p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Nav (Simplified) */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 h-16 flex items-center justify-around z-50">
                {[
                    { to: '/dashboard', icon: '🏠' },
                    { to: '/learning-plan', icon: '🎯' },
                    { to: '/leaderboard', icon: '🏆' },
                    { to: '/tools', icon: '🛠️' },
                    { to: '/settings', icon: '⚙️' }
                ].map(item => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className={`p-3 rounded-2xl transition-all active:scale-90 ${location.pathname === item.to ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
                    >
                        <span className="text-2xl">{item.icon}</span>
                    </Link>
                ))}
            </nav>
        </div>
    )
}
