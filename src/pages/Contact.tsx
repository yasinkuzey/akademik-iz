import { useLanguage } from '@/hooks/useLanguage'
import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function Contact() {
    const { t } = useLanguage()
    const [sent, setSent] = useState(false)

    return (
        <div className="min-h-screen bg-background py-20 px-4">
            <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-black tracking-tight text-foreground italic">
                        {t('landing.footer_contact')}
                    </h1>
                    <div className="h-1.5 w-20 bg-primary mx-auto rounded-full"></div>
                </div>

                <div className="bg-card p-8 rounded-[2rem] border border-border shadow-xl space-y-8">
                    <div className="text-center space-y-2">
                        <p className="text-muted-foreground">
                            {t('legal.contact_content')}
                        </p>
                        <p className="text-xl font-bold text-primary">
                            {t('legal.contact_email')}
                        </p>
                    </div>

                    {!sent ? (
                        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
                            <div className="grid md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder={t('legal.contact_form_name')}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all"
                                    required
                                />
                                <input
                                    type="email"
                                    placeholder={t('auth.email')}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all"
                                    required
                                />
                            </div>
                            <textarea
                                placeholder={t('legal.contact_form_msg')}
                                rows={4}
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all"
                                required
                            ></textarea>
                            <button
                                type="submit"
                                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-all active:scale-[0.98]"
                            >
                                {t('legal.contact_send')}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-8 animate-in zoom-in">
                            <div className="text-4xl mb-4">✅</div>
                            <h3 className="text-xl font-bold text-success">{t('common.success')}</h3>
                            <p className="text-muted-foreground mt-2">{t('auth.reset_email_sent')}</p>
                        </div>
                    )}
                </div>

                <div className="text-center">
                    <Link to="/" className="text-primary hover:underline font-medium">
                        ← {t('landing.back_to_panel')}
                    </Link>
                </div>
            </div>
        </div>
    )
}
