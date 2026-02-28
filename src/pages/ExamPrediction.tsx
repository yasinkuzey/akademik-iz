import { useState } from 'react'
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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
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
          className="w-full py-3 rounded-lg bg-[rgb(var(--accent))] text-white font-medium disabled:opacity-50"
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
    </div>
  )
}
