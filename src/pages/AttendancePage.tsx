import AttendanceTracker from '@/components/AttendanceTracker'
import { useLanguage } from '@/hooks/useLanguage'

export default function AttendancePage() {
    const { t } = useLanguage()
    return (
        <div className="space-y-6 animate-in fade-in zoom-in-90 duration-700">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('attendance.title')}</h1>
                <p className="text-muted-foreground">{t('attendance.desc')}</p>
            </div>

            <AttendanceTracker />
        </div>
    )
}
