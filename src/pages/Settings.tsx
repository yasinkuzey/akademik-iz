import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/hooks/useLanguage'

export default function Settings() {
    const { user } = useAuth()
    const { t, language } = useLanguage()
    const navigate = useNavigate()

    const [name, setName] = useState(user?.user_metadata?.display_name || '')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleUpdateName = async () => {
        setLoading(true)
        setMessage(null)
        const { error } = await supabase.auth.updateUser({
            data: { display_name: name }
        })

        if (error) {
            setMessage({ type: 'error', text: t('settings.error_update') })
        } else {
            setMessage({ type: 'success', text: t('settings.success_update') })
        }
        setLoading(false)
    }

    const handleResetPassword = async () => {
        if (!user?.email) return
        setLoading(true)
        setMessage(null)
        const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
            redirectTo: window.location.origin + '/reset-password',
        })

        if (error) {
            setMessage({ type: 'error', text: t('settings.error_update') })
        } else {
            setMessage({ type: 'success', text: t('settings.reset_password_desc') })
        }
        setLoading(false)
    }

    const handleLogout = async () => {
        setLoading(true)
        await supabase.auth.signOut()
        navigate('/')
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-20">
            <div className="space-y-2">
                <h1 className="text-4xl font-black italic tracking-tighter text-foreground uppercase">{t('settings.title')}</h1>
                <p className="text-muted-foreground font-bold tracking-tight text-lg">{t('settings.subtitle')}</p>
            </div>

            {message && (
                <div className={`p-6 rounded-[2rem] border ${message.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-destructive/10 border-destructive/20 text-destructive'} font-bold text-sm flex items-center gap-4`}>
                    <span className="text-2xl">{message.type === 'success' ? '✅' : '❌'}</span>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Section */}
                <section className="bg-card border border-border/50 rounded-[3rem] p-10 space-y-8 shadow-sm">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                        <span className="w-8 h-[2px] bg-primary/20"></span>
                        {t('settings.profile_section')}
                    </h2>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">{t('settings.name_label')}</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full h-14 px-6 rounded-2xl bg-muted/30 border border-border/50 focus:border-primary outline-none transition-all font-bold text-sm"
                            />
                        </div>

                        <div className="space-y-2 opacity-60">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">{t('settings.email_label')}</label>
                            <input
                                type="text"
                                value={user?.email || ''}
                                disabled
                                className="w-full h-14 px-6 rounded-2xl bg-muted/10 border border-border/50 cursor-not-allowed font-bold text-sm"
                            />
                        </div>

                        <button
                            onClick={handleUpdateName}
                            disabled={loading || name === user?.user_metadata?.display_name}
                            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            {loading ? '...' : t('settings.update_name')}
                        </button>
                    </div>
                </section>

                {/* Account Security */}
                <section className="bg-card border border-border/50 rounded-[3rem] p-10 space-y-8 shadow-sm">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                        <span className="w-8 h-[2px] bg-destructive/20"></span>
                        {language === 'Turkish' ? 'GÜVENLİK VE HESAP' : 'SECURITY & ACCOUNT'}
                    </h2>

                    <div className="space-y-6">
                        <div className="p-6 rounded-[2rem] bg-muted/30 border border-border/50 space-y-4">
                            <p className="text-sm font-bold text-muted-foreground leading-relaxed">
                                {language === 'Turkish'
                                    ? 'Hesap güvenliğin için şifreni düzenli olarak yenilemen önerilir.'
                                    : 'It is recommended to renew your password regularly for account security.'}
                            </p>
                            <button
                                onClick={handleResetPassword}
                                disabled={loading}
                                className="w-full h-12 rounded-xl bg-[rgb(var(--secondary))] text-[rgb(var(--secondary-fg))] font-black uppercase tracking-widest text-[10px] shadow-sm hover:brightness-95 transition-all"
                            >
                                {t('settings.reset_password')}
                            </button>
                        </div>

                        <div className="p-6 rounded-[2rem] bg-destructive/5 border border-destructive/20 space-y-4">
                            <p className="text-sm font-bold text-destructive/80 leading-relaxed">
                                {language === 'Turkish'
                                    ? 'Hesabından güvenli bir şekilde çıkış yapmak için aşağıdaki butonu kullan.'
                                    : 'Use the button below to safely log out of your account.'}
                            </p>
                            <button
                                onClick={handleLogout}
                                disabled={loading}
                                className="w-full h-14 rounded-2xl bg-destructive text-destructive-foreground font-black uppercase tracking-widest text-[10px] shadow-lg shadow-destructive/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                {t('nav.logout')}
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* Daily Quote Feature Highlight */}
            <div className="bg-primary text-primary-foreground rounded-[3rem] p-12 relative overflow-hidden group shadow-2xl shadow-primary/30">
                <div className="absolute top-0 right-0 p-12 text-9xl opacity-10 group-hover:scale-110 transition-transform duration-700">📜</div>
                <div className="relative z-10 space-y-6 max-w-2xl">
                    <h3 className="text-2xl font-black italic uppercase italic tracking-tighter">
                        {t('dashboard.quote_of_day')}
                    </h3>
                    <p className="text-xl font-bold italic leading-relaxed opacity-90">
                        {language === 'Turkish'
                            ? '"Zorluklar, başarıyı daha da değerli kılan basamaklardır."'
                            : '"Difficulties are the steps that make success even more valuable."'}
                    </p>
                    <div className="w-20 h-1 bg-white/30 rounded-full"></div>
                </div>
            </div>
        </div>
    )
}
