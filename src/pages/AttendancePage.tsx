import AttendanceTracker from '@/components/AttendanceTracker'

export default function AttendancePage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Devamsızlık Takibi</h1>
                <p className="text-muted-foreground">Derslere katılım durumunu buradan yönetebilirsin.</p>
            </div>

            <AttendanceTracker />
        </div>
    )
}
