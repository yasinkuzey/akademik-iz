import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // First check if we already have a session (might have been handled by Supabase or previously)
                const { data: { session: existingSession } } = await supabase.auth.getSession()
                if (existingSession) {
                    const { data: { user } } = await supabase.auth.getUser()
                    const displayName = user?.user_metadata?.display_name
                    if (!displayName || displayName.includes('@')) {
                        window.location.replace('/profile-setup')
                    } else {
                        window.location.replace('/dashboard')
                    }
                    return
                }

                const url = new URL(window.location.href)
                const code = url.searchParams.get('code')
                const errorParam = url.searchParams.get('error')
                const errorDescription = url.searchParams.get('error_description')

                if (errorParam) {
                    setError(errorDescription || errorParam)
                    return
                }

                if (code) {
                    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
                    if (exchangeError) {
                        // If it's a PKCE error but we somehow got a session anyway, proceed
                        const { data: { session: retrySession } } = await supabase.auth.getSession()
                        if (retrySession) {
                            console.log('Session found despite exchange error:', exchangeError.message)
                        } else {
                            setError(exchangeError.message)
                            return
                        }
                    }
                } else {
                    // Fallback: wait briefly for session if no code is present
                    await new Promise(resolve => setTimeout(resolve, 1500))
                    const { data: { session: fallbackSession } } = await supabase.auth.getSession()
                    if (!fallbackSession) {
                        setError('Oturum bulunamadı. Lütfen tekrar giriş yapın.')
                        return
                    }
                }

                // Final check and redirect
                const { data: { user } } = await supabase.auth.getUser()
                const displayName = user?.user_metadata?.display_name

                if (!displayName || displayName.includes('@')) {
                    window.location.replace('/profile-setup')
                } else {
                    window.location.replace('/dashboard')
                }
            } catch (err: any) {
                console.error('Auth callback error:', err)
                setError(err?.message || 'Beklenmeyen bir hata oluştu.')
            }
        }

        handleCallback()
    }, [])

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 bg-background">
                <div className="w-full max-w-md text-center space-y-6">
                    <div className="text-6xl">⚠️</div>
                    <h1 className="text-2xl font-bold text-foreground">Giriş Başarısız</h1>
                    <p className="text-muted-foreground">{error}</p>
                    <a
                        href="/login"
                        className="inline-block px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold shadow hover:bg-primary/90 transition-all"
                    >
                        Tekrar Dene
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-muted-foreground font-medium">Giriş yapılıyor…</p>
            </div>
        </div>
    )
}
