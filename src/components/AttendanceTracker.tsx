import { useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import useLocalStorage from '@/hooks/useLocalStorage'

type WeekStatus = 'empty' | 'present' | 'absent'

interface Course {
    id: string
    name: string
    weeks: WeekStatus[]
}

export default function AttendanceTracker() {
    const { language, t } = useLanguage()
    const [courses, setCourses] = useLocalStorage<Course[]>('attendance-courses', [])
    const [newCourseName, setNewCourseName] = useState('')
    const [showAddForm, setShowAddForm] = useState(false)

    const addCourse = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCourseName.trim()) return

        const newCourse: Course = {
            id: crypto.randomUUID(),
            name: newCourseName.trim(),
            weeks: Array(14).fill('empty'),
        }

        setCourses([...courses, newCourse])
        setNewCourseName('')
    }

    const removeCourse = (id: string) => {
        setCourses(courses.filter(c => c.id !== id))
    }

    const toggleWeek = (courseId: string, weekIndex: number) => {
        setCourses(courses.map(course => {
            if (course.id !== courseId) return course

            const newWeeks = [...course.weeks]
            const currentStatus = newWeeks[weekIndex]

            // Cycle: empty -> present -> absent -> empty
            let nextStatus: WeekStatus = 'empty'
            if (currentStatus === 'empty') nextStatus = 'present'
            else if (currentStatus === 'present') nextStatus = 'absent'
            else nextStatus = 'empty'

            newWeeks[weekIndex] = nextStatus
            return { ...course, weeks: newWeeks }
        }))
    }

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span>📅</span> {t('attendance.title')}
                    </h2>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full"
                    >
                        {showAddForm ? t('common.close') : `+ ${t('attendance.add_course')}`}
                    </button>
                </div>

                {showAddForm && (
                    <div className="bg-muted/30 p-4 rounded-xl mb-6 animate-in slide-in-from-top-2 fade-in duration-300">
                        <div className="mb-4">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">{t('attendance.quick_add')}</span>
                            <div className="flex flex-wrap gap-2">
                                {(language === 'English' ? ['Math', 'Physics', 'Chemistry', 'Biology', 'Turkish', 'History', 'Geography', 'Philosophy', 'English'] : ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Tarih', 'Coğrafya', 'Felsefe', 'İngilizce']).map(subject => (
                                    <button
                                        key={subject}
                                        onClick={() => {
                                            const newCourse: Course = {
                                                id: crypto.randomUUID(),
                                                name: subject,
                                                weeks: Array(14).fill('empty'),
                                            }
                                            setCourses([...courses, newCourse])
                                            setShowAddForm(false)
                                        }}
                                        className="px-3 py-1 bg-background border border-border rounded-full text-sm hover:border-accent hover:text-accent transition-colors"
                                    >
                                        + {subject}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">{t('attendance.or_type')}</span>
                            </div>
                        </div>

                        <form onSubmit={addCourse} className="flex flex-col sm:flex-row gap-4 mt-4">
                            <input
                                type="text"
                                value={newCourseName}
                                onChange={(e) => setNewCourseName(e.target.value)}
                                placeholder={t('attendance.enter_name')}
                                className="flex-1 px-4 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all placeholder:text-muted"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!newCourseName.trim()}
                                className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed btn-bounce"
                            >
                                Ekle
                            </button>
                        </form>
                    </div>
                )}

                <div className="space-y-4">
                    {courses.length === 0 && (
                        <div className="text-center py-8 text-muted border-2 border-dashed border-border rounded-xl">
                            {t('attendance.no_courses')}
                        </div>
                    )}

                    {courses.map(course => {
                        const absentCount = course.weeks.filter(w => w === 'absent').length
                        const remainingRights = 4 - absentCount

                        let statusColor = "text-muted"
                        let statusText = `${t('attendance.remaining')}: ${Math.max(0, remainingRights)}`
                        let rowBorderColor = "border-border"

                        if (absentCount >= 4) {
                            statusColor = "text-destructive font-bold"
                            statusText = t('attendance.failed')
                            rowBorderColor = "border-destructive"
                        } else if (absentCount === 3) {
                            statusColor = "text-warning font-bold"
                            statusText = t('attendance.limit')
                            rowBorderColor = "border-warning"
                        }

                        return (
                            <div key={course.id} className={`bg-background border ${rowBorderColor} rounded-xl p-4 transition-all hover:shadow-md`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center justify-between w-full md:w-auto">
                                        <h3 className="font-semibold text-lg">{course.name}</h3>
                                        <button
                                            onClick={() => removeCourse(course.id)}
                                            className="md:hidden text-muted hover:text-destructive p-1"
                                            title={t('attendance.delete')}
                                        >
                                            🗑️
                                        </button>
                                    </div>

                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-sm ${statusColor}`}>
                                        {absentCount >= 4 ? '⚠️' : absentCount === 3 ? '⚡' : 'info'}
                                        {statusText}
                                        <button
                                            onClick={() => removeCourse(course.id)}
                                            className="hidden md:block ml-4 text-muted hover:text-destructive transition-colors"
                                            title={t('attendance.delete')}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto pb-2">
                                    <div className="grid grid-cols-14 gap-2 min-w-[500px] md:min-w-0">
                                        {course.weeks.map((status, index) => (
                                            <button
                                                key={index}
                                                onClick={() => toggleWeek(course.id, index)}
                                                title={`${index + 1}. ${t('attendance.week')}: ${status === 'present' ? t('attendance.present') : status === 'absent' ? t('attendance.absent') : t('attendance.undefined')}`}
                                                className={`
                            h-8 w-8 md:h-10 md:w-auto rounded-md flex items-center justify-center text-xs font-medium transition-all duration-200 shrink-0
                            ${status === 'empty' ? 'bg-secondary text-muted hover:bg-border' : ''}
                            ${status === 'present' ? 'bg-success/10 text-success border border-success/20' : ''}
                            ${status === 'absent' ? 'bg-destructive/10 text-destructive border border-destructive/20' : ''}
                          `}
                                            >
                                                {status === 'empty' && (index + 1)}
                                                {status === 'present' && '✓'}
                                                {status === 'absent' && '✗'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
