import { Link } from 'react-router-dom'
import { useLanguage } from '@/hooks/useLanguage'

export default function ToolsHub() {
    const { t, language } = useLanguage()

    const categories = [
        {
            title: t('tools.exam_and_analysis'),
            tools: [
                { to: '/diagnostic', label: t('nav.diagnostic'), icon: '🔍', desc: language === 'Turkish' ? 'Eksik olduğun konuları yapay zeka ile tespit et.' : 'Identify the topics you are missing with artificial intelligence.' },
                { to: '/exam-analysis', label: t('nav.exam_analysis'), icon: '📝', desc: language === 'Turkish' ? 'Sınav sonuçlarını derinlemesine incele ve gelişimini takip et.' : 'Analyze exam results in depth and track your progress.' },
                { to: '/exam-prediction', label: t('nav.exam_prediction'), icon: '🔭', desc: language === 'Turkish' ? 'Gelecek sınav sonuçlarını yapay zeka ile bilimsel olarak tahmin et.' : 'Scientifically predict future exam results using AI.' },
                { to: '/exam-prep', label: t('nav.exam_prep'), icon: '📚', desc: language === 'Turkish' ? 'Sınav formatına göre özel çalışma setleri ile hazırlık yap.' : 'Prepare with custom study sets based on exam format.' },
            ]
        },
        {
            title: t('tools.notes_and_tracking'),
            tools: [
                { to: '/attendance-tracker', label: t('nav.attendance'), icon: '📅', desc: language === 'Turkish' ? 'Devamsızlık durumunu ve akademik takvimini yönet.' : 'Manage your attendance status and academic calendar.' },
            ]
        },
        {
            title: t('tools.ai_helpers'),
            tools: [
                { to: '/tutor', label: t('nav.tutor'), icon: '🤖', desc: language === 'Turkish' ? '7/24 aktif yapay zeka öğretmeninle konuları pekiştir.' : 'Reinforce topics with your 24/7 active AI tutor.' },
            ]
        },
        {
            title: t('tools.others'),
            tools: [
                { to: '/leaderboard', label: t('nav.leaderboard'), icon: '🏆', desc: language === 'Turkish' ? 'Genel sıralamada yerini al ve diğer öğrencilerle rekabet et.' : 'Take your place in the general ranking and compete with others.' },
                { to: '/games', label: t('nav.games'), icon: '🎮', desc: language === 'Turkish' ? 'Stres atarken zihinsel becerilerini geliştiren oyunlar oyna.' : 'Play games that improve mental skills while relieving stress.' },
            ]
        }
    ]

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
            <div className="space-y-2 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter text-foreground uppercase">{t('nav.tools') || 'Araçlar'}</h1>
                <p className="text-muted-foreground font-medium">{t('tools.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 gap-12">
                {categories.map((cat, idx) => (
                    <section key={idx} className="space-y-6">
                        <h2 className="text-xl font-black italic tracking-wide text-primary uppercase ml-2 flex items-center gap-3">
                            <span className="w-8 h-[2px] bg-primary/20"></span>
                            {cat.title}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {cat.tools.map((tool, tIdx) => (
                                <Link
                                    key={tIdx}
                                    to={tool.to}
                                    className="group relative bg-card border border-border/50 rounded-[2.5rem] p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 overflow-hidden"
                                >
                                    <div className="absolute -right-4 -top-4 text-8xl opacity-[0.03] transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-12">
                                        {tool.icon}
                                    </div>

                                    <div className="flex items-start gap-6 relative z-10">
                                        <div className="text-4xl">{tool.icon}</div>
                                        <div className="space-y-1">
                                            <h3 className="font-black uppercase tracking-widest text-[12px] text-foreground group-hover:text-primary transition-colors">
                                                {tool.label}
                                            </h3>
                                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                                {tool.desc}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    )
}
