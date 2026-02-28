import { useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import logo from '@/assets/logo.png'

export default function ResetPassword() {
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const { t } = useLanguage()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setMessage('')
        setLoading(true)

        const { error: err } = await supabase.auth.updateUser({
            password: password
        })

        setLoading(false)

        if (err) {
            setError(err.message)
        } else {
            setMessage(t('auth.reset_password_success'))
            setTimeout(() => {
                navigate('/login')
            }, 3000)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background">
            <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center">
                    <img src={logo} alt="Logo" className="w-16 h-16 mx-auto mb-4 object-contain" />
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">{t('auth.reset_password_title')}</h2>
                </div>

                <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {message && (
                            <div className="text-sm font-medium text-success bg-success/10 rounded-lg p-3 border border-success/20">
                                {message}
                            </div>
                        )}
                        {error && (
                            <div className="text-sm font-medium text-destructive bg-destructive/10 rounded-lg p-3 border border-destructive/20">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">{t('auth.new_password')}</label>
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
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold shadow hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? t('common.loading') : t('auth.reset_password_button')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
