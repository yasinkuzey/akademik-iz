import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { callGemini } from '@/lib/api'

export default function ExamPrediction() {
  const { user } = useAuth()
  const [grade, setGrade] = useState('')
  const [curriculum, setCurriculum] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [prediction, setPrediction] = useState('')
  const [history, setHistory] = useState<{ id: string; created_at: string; prediction_text: string; grade: string }[]>([])

  useEffect(() => {
    // Load history
    const fetchHistory = async () => {
      if (!user) return
      const { data } = await supabase
        .from('exam_predictions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (data) setHistory(data)
    }
    fetchHistory()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setPrediction('')
    setLoading(true)
    try {
      const res = await callGemini('exam_prediction', {
        grade: grade.trim(),
        curriculum: curriculum.trim(),
      })
      if (!res.ok) throw new Error('Tahmin yapılamadı')
      const data = await res.json()
      const text = data.prediction ?? data.text ?? ''
      setPrediction(text)
      if (user?.id && text) {
        await supabase.from('exam_predictions').insert({
          user_id: user.id,
          grade: grade.trim(),
          curriculum_input: curriculum.trim(),
          prediction_text: text,
        })

        // Add to local history immediately
        setHistory((prev) => [
          {
            id: Date.now().toString(),
            created_at: new Date().toISOString(),
            prediction_text: text,
            grade: grade.trim(),
          },
          ...prev,
        ])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-90 duration-700">
      <h1 className="text-2xl font-bold">Sınav Tahmini</h1>
      <p className="text-[rgb(var(--muted))]">Sınıfını ve müfredat/konularını yaz. AI ne çalışman gerektiğini ve sınavda neler çıkabileceğini yazacak.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Sınıf / hedef sınav</label>
          <input
            type="text"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2"
            placeholder="Örn: 12. sınıf, YKS"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Müfredat / konular</label>
          <textarea
            value={curriculum}
            onChange={(e) => setCurriculum(e.target.value)}
            className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 min-h-[120px]"
            placeholder="İşlediğin konular veya müfredat özeti..."
            required
          />
        </div>
        {error && <div className="text-red-500 text-sm p-2 rounded bg-red-500/10">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-[rgb(var(--accent))] text-white font-medium disabled:opacity-50 btn-bounce"
        >
          {loading ? 'Tahmin yapılıyor...' : 'Tahmin al'}
        </button>
      </form>

      {prediction && (
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
          <h2 className="font-semibold mb-2">Tahmin ve öneriler</h2>
          <div className="whitespace-pre-wrap text-sm">{prediction}</div>
        </div>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-[rgb(var(--border))]">
          <h2 className="text-xl font-bold">Geçmiş Tahminler</h2>
          <div className="grid gap-4">
            {history.map((item) => (
              <div key={item.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]/50 p-4 text-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-[rgb(var(--accent))]">{item.grade}</span>
                  <span className="text-xs text-[rgb(var(--muted))]">
                    {new Date(item.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <div className="whitespace-pre-wrap line-clamp-3 hover:line-clamp-none transition-all cursor-pointer">
                  {item.prediction_text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
