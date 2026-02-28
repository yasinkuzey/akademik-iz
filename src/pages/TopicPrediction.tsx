import { useState, useEffect } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useAI } from '@/hooks/useAI'
import { AIDebugPanel } from '@/components/AIDebugPanel'

export default function TopicPrediction() {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const { request, cancel, loading, error, debugInfo, showDebug, setShowDebug, isSlow } = useAI()
  const [grade, setGrade] = useState('')
  const [curriculum, setCurriculum] = useState('')
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
    setPrediction('')
    try {
      const data = await request('exam_prediction', {
        grade: grade.trim(),
        curriculum: curriculum.trim(),
      })
      const text = data?.prediction ?? data?.text ?? ''
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
    } catch (err: any) {
      console.error(err)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-90 duration-700 relative">
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold">{t('prediction.title')}</h1>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-[10px] bg-[rgb(var(--secondary))] text-[rgb(var(--secondary-fg))] px-3 py-1 rounded-full font-bold shadow-sm hover:brightness-95 transition-all"
        >
          DEBUG
        </button>
      </div>
      <p className="text-[rgb(var(--muted))]">{t('prediction.desc')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('prediction.grade_label')}</label>
          <input
            type="text"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2"
            placeholder={t('prediction.grade_placeholder')}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('prediction.curriculum_label')}</label>
          <textarea
            value={curriculum}
            onChange={(e) => setCurriculum(e.target.value)}
            className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 min-h-[120px]"
            placeholder={t('prediction.curriculum_placeholder')}
            required
          />
        </div>
        {error && <div className="text-red-500 text-sm p-2 rounded bg-red-500/10">{error}</div>}

        <div className="space-y-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[rgb(var(--accent))] text-white font-medium disabled:opacity-50 btn-bounce relative overflow-hidden"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                {t('prediction.predicting')}
              </span>
            ) : t('prediction.predict')}
          </button>

          {loading && (
            <div className="text-center space-y-2 animate-in fade-in slide-in-from-top-2">
              {isSlow && <p className="text-sm text-yellow-600 font-medium animate-bounce">Tahmin üretiliyor, bu biraz zaman alabilir...</p>}
              <button
                type="button"
                onClick={cancel}
                className="text-xs bg-[rgb(var(--secondary))] text-[rgb(var(--secondary-fg))] px-4 py-1.5 rounded-full font-medium shadow-sm hover:brightness-95 transition-all"
              >
                İşlemi İptal Et
              </button>
            </div>
          )}
        </div>
      </form>

      {prediction && (
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <h2 className="font-semibold mb-2">{t('prediction.result_title')}</h2>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{prediction}</div>
        </div>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <div className="space-y-4 pt-8 border-t border-[rgb(var(--border))]">
          <h2 className="text-xl font-bold">{t('prediction.history')}</h2>
          <div className="grid gap-4">
            {history.map((item) => (
              <div key={item.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]/50 p-4 text-sm hover:border-[rgb(var(--accent))]/30 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-[rgb(var(--accent))]">{item.grade}</span>
                  <span className="text-xs text-[rgb(var(--muted))]">
                    {new Date(item.created_at).toLocaleDateString(language === 'English' ? 'en-US' : 'tr-TR')}
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

      {showDebug && <AIDebugPanel debugInfo={debugInfo} onClose={() => setShowDebug(false)} />}
    </div>
  )
}
