import { useLanguage } from '@/hooks/useLanguage'
import { Link } from 'react-router-dom'

export default function Privacy() {
    const { t } = useLanguage()

    return (
        <div className="min-h-screen bg-background py-20 px-4">
            <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-black tracking-tight text-foreground italic">
                        {t('landing.footer_privacy')}
                    </h1>
                    <div className="h-1.5 w-20 bg-primary mx-auto rounded-full"></div>
                </div>

                <div className="prose prose-lg dark:prose-invert mx-auto bg-card p-8 rounded-[2rem] border border-border shadow-xl">
                    <p className="text-muted-foreground leading-relaxed">
                        {t('legal.privacy_content')}
                    </p>
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
