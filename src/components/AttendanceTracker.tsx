import { useState } from 'react'
import useLocalStorage from '@/hooks/useLocalStorage'

type WeekStatus = 'empty' | 'present' | 'absent'

interface Course {
    id: string
    name: string
    weeks: WeekStatus[]
}

export default function AttendanceTracker() {
    const [courses, setCourses] = useLocalStorage<Course[]>('attendance-courses', [])
    const [newCourseName, setNewCourseName] = useState('')

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
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span>📅</span> Devamsızlık Takibi
                </h2>

                <form onSubmit={addCourse} className="flex gap-4 mb-6">
                    <input
                        type="text"
                        value={newCourseName}
                        onChange={(e) => setNewCourseName(e.target.value)}
                        placeholder="Ders adı girin (Örn: Siber Güvenliğe Giriş)..."
                        className="flex-1 px-4 py-2 rounded-lg bg-background border border-border focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all placeholder:text-muted"
                    />
                    <button
                        type="submit"
                        disabled={!newCourseName.trim()}
                        className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Ekle
                    </button>
                </form>

                <div className="space-y-4">
                    {courses.length === 0 && (
                        <div className="text-center py-8 text-muted border-2 border-dashed border-border rounded-xl">
                            Henüz ders eklenmemiş. Takip etmek istediğiniz dersleri yukarıdan ekleyebilirsiniz.
                        </div>
                    )}

                    {courses.map(course => {
                        const absentCount = course.weeks.filter(w => w === 'absent').length
                        const remainingRights = 4 - absentCount

                        let statusColor = "text-muted"
                        let statusText = `Kalan Hak: ${Math.max(0, remainingRights)}`
                        let rowBorderColor = "border-border"

                        if (absentCount >= 4) {
                            statusColor = "text-destructive font-bold"
                            statusText = "Kaldın!"
                            rowBorderColor = "border-destructive"
                        } else if (absentCount === 3) {
                            statusColor = "text-warning font-bold"
                            statusText = "Sınırda!"
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
                                            title="Dersi Sil"
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
                                            title="Dersi Sil"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 md:grid-cols-14 gap-2">
                                    {course.weeks.map((status, index) => (
                                        <button
                                            key={index}
                                            onClick={() => toggleWeek(course.id, index)}
                                            title={`${index + 1}. Hafta: ${status === 'present' ? 'Geldi' : status === 'absent' ? 'Gelmedi' : 'Belirsiz'}`}
                                            className={`
                        aspect-square md:aspect-auto md:h-10 rounded-md flex items-center justify-center text-xs font-medium transition-all duration-200
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
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
