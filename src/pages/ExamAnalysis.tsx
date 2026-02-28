import { useState, useEffect } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useAI } from '@/hooks/useAI'
import { AIDebugPanel } from '@/components/AIDebugPanel'

const EXAM_TYPES = [
  { value: 'tyt', label: 'TYT' },
  { value: 'ayt', label: 'AYT' },
  { value: 'kpss', label: 'KPSS' },
  { value: 'ales', label: 'ALES' },
  { value: 'middle_school', label: 'LGS (Middle School)' },
]

const SUBJECTS_BY_EXAM: Record<string, string[]> = {
  tyt: ['Türkçe', 'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'Felsefe', 'Din Kültürü'],
  ayt: ['Matematik', 'Edebiyat', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'Felsefe', 'Din Kültürü'],
  kpss: ['Genel Yetenek (Türkçe)', 'Genel Yetenek (Matematik)', 'Genel Kültür (Tarih)', 'Genel Kültür (Coğrafya)', 'Genel Kültür (Vatandaşlık)'],
  ales: ['Sayısal 1', 'Sayısal 2', 'Sözel 1', 'Sözel 2'],
  middle_school: ['Türkçe', 'Matematik', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İnkılap Tarihi', 'Din Kültürü', 'İngilizce'],
}

const SUBJECT_MAP_EN: Record<string, string> = {
  'Türkçe': 'Turkish', 'Matematik': 'Math', 'Fizik': 'Physics', 'Kimya': 'Chemistry', 'Biyoloji': 'Biology',
  'Tarih': 'History', 'Coğrafya': 'Geography', 'Felsefe': 'Philosophy', 'Din Kültürü': 'Religion',
  'Edebiyat': 'Literature', 'Fen Bilimleri': 'Science', 'Sosyal Bilgiler': 'Social Studies',
  'İnkılap Tarihi': 'History of Revolution', 'İngilizce': 'English',
  'Genel Yetenek (Türkçe)': 'General Ability (Turkish)', 'Genel Yetenek (Matematik)': 'General Ability (Math)',
  'Genel Kültür (Tarih)': 'General Culture (History)', 'Genel Kültür (Coğrafya)': 'General Culture (Geography)',
  'Genel Kültür (Vatandaşlık)': 'General Culture (Citizenship)',
  'Sayısal 1': 'Quantitative 1', 'Sayısal 2': 'Quantitative 2', 'Sözel 1': 'Verbal 1', 'Sözel 2': 'Verbal 2'
}

type SubjectScores = Record<string, { dogru: number | ''; yanlis: number | ''; bos: number | '' }>

function emptyScores(subjects: string[]): SubjectScores {
  const o: SubjectScores = {}
  subjects.forEach((s) => { o[s] = { dogru: '', yanlis: '', bos: '' } })
  return o
}

export default function ExamAnalysis() {
  const { user } = useAuth()
  const { language, t } = useLanguage()
  const [examType, setExamType] = useState('tyt')
  const [scores, setScores] = useState<SubjectScores>(() => emptyScores(SUBJECTS_BY_EXAM.tyt))
  const { request, cancel, loading, error, debugInfo, showDebug, setShowDebug, isSlow } = useAI()
  const [analysis, setAnalysis] = useState('')
  const [history, setHistory] = useState<{ id: string; exam_type: string; analysis_text: string; created_at: string }[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const subjects = SUBJECTS_BY_EXAM[examType] ?? SUBJECTS_BY_EXAM.tyt

  useEffect(() => {
    setScores(emptyScores(subjects))
  }, [examType])

  const loadHistory = async () => {
    if (!user?.id) return
    const { data } = await supabase
      .from('exam_analyses')
      .select('id, exam_type, analysis_text, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    setHistory((data as typeof history) ?? [])
    setLoadingHistory(false)
  }

  useEffect(() => {
    loadHistory()
  }, [user?.id])

  const setSubjectScore = (subject: string, field: 'dogru' | 'yanlis' | 'bos', value: number | '') => {
    setScores((prev) => ({
      ...prev,
      [subject]: { ...prev[subject], [field]: value === '' ? '' : Math.max(0, value) },
    }))
  }

  const buildInputData = (): string => {
    return subjects
      .map((s) => {
        const v = scores[s] ?? { dogru: 0, yanlis: 0, bos: 0 }
        return `${s}: ${v.dogru || 0} doğru, ${v.yanlis || 0} yanlış, ${v.bos || 0} boş`
      })
      .join('\n')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAnalysis('')
    const inputData = buildInputData()
    try {
      const data = await request('exam_analysis', {
        examType,
        inputData,
      })
      const text = data?.analysis ?? data?.text ?? ''
      setAnalysis(text)
      if (user?.id && text) {
        await supabase.from('exam_analyses').insert({
          user_id: user.id,
          exam_type: examType,
          input_data: { scores, raw: inputData },
          analysis_text: text,
        })
        loadHistory()
      }
    } catch (err: any) {
      console.error(err)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in zoom-in-90 duration-700 relative">
      <div className="flex justify-between items-start">
        <h1 className="text-2xl font-bold">{t('analysis.title')}</h1>
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="text-[10px] opacity-20 hover:opacity-100"
        >
          DEBUG
        </button>
      </div>
      <p className="text-[rgb(var(--muted))]">{t('analysis.desc')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('analysis.type')}</label>
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2"
          >
            {EXAM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden shadow-sm">
          <div className="bg-[rgb(var(--bg))] px-4 py-2 border-b border-[rgb(var(--border))] text-sm font-medium grid grid-cols-4 gap-2">
            <span>{t('analysis.subject')}</span>
            <span className="text-center">{t('analysis.correct')}</span>
            <span className="text-center">{t('analysis.wrong')}</span>
            <span className="text-center">{t('analysis.empty')}</span>
          </div>
          {subjects.map((subject) => {
            const v = scores[subject] ?? { dogru: 0, yanlis: 0, bos: 0 }
            return (
              <div key={subject} className="px-4 py-2 border-b border-[rgb(var(--border))] last:border-0 grid grid-cols-4 gap-2 items-center">
                <span className="text-sm font-medium">{language === 'English' ? (SUBJECT_MAP_EN[subject] || subject) : subject}</span>
                <input
                  type="number"
                  min={0}
                  value={v.dogru}
                  onChange={(e) => setSubjectScore(subject, 'dogru', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1 text-sm text-center w-16 justify-self-center focus:ring-1 focus:ring-primary outline-none"
                  placeholder="0"
                />
                <input
                  type="number"
                  min={0}
                  value={v.yanlis}
                  onChange={(e) => setSubjectScore(subject, 'yanlis', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1 text-sm text-center w-16 justify-self-center focus:ring-1 focus:ring-primary outline-none"
                  placeholder="0"
                />
                <input
                  type="number"
                  min={0}
                  value={v.bos}
                  onChange={(e) => setSubjectScore(subject, 'bos', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1 text-sm text-center w-16 justify-self-center focus:ring-1 focus:ring-primary outline-none"
                  placeholder="0"
                />
              </div>
            )
          })}
        </div>

        {error && <div className="text-red-500 text-sm p-2 rounded bg-red-500/10">{error}</div>}

        <div className="space-y-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[rgb(var(--accent))] text-white font-medium disabled:opacity-50 btn-bounce relative"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                {t('analysis.analyzing')}
              </span>
            ) : t('analysis.analyze')}
          </button>

          {loading && (
            <div className="text-center space-y-2 animate-in fade-in slide-in-from-top-2">
              {isSlow && <p className="text-sm text-yellow-600 font-medium animate-bounce">Analiz yapılıyor, lütfen bekleyin...</p>}
              <button
                type="button"
                onClick={cancel}
                className="text-xs text-muted-foreground hover:text-red-500 underline"
              >
                İşlemi İptal Et
              </button>
            </div>
          )}
        </div>
      </form>

      {analysis && (
        <div className="space-y-6">
          {analysis.split(/(?=## )/).map((section, index) => {
            const titleMatch = section.match(/## (.*)/);
            const titleRaw = titleMatch ? titleMatch[1].trim() : (index === 0 ? (language === 'English' ? 'Intro' : 'Giriş') : '');
            let title = titleRaw;

            // Map common AI section titles to current language
            if (language === 'English') {
              if (titleRaw.includes('Genel Durum')) title = 'General Status';
              else if (titleRaw.includes('Güçlü')) title = 'Strengths';
              else if (titleRaw.includes('Geliştirmen')) title = 'Areas to Improve';
              else if (titleRaw.includes('Tavsiye')) title = 'Recommendations';
            }

            const content = section.replace(/## .*/, '').trim();

            if (!content) return null;

            let icon = '📝';
            let colorClass = 'border-l-4 border-l-[rgb(var(--primary))]';

            if (title.includes('Genel Durum')) { icon = '📊'; colorClass = 'border-l-4 border-l-blue-500'; }
            else if (title.includes('Güçlü')) { icon = '✅'; colorClass = 'border-l-4 border-l-green-500'; }
            else if (title.includes('Geliştirmen')) { icon = '⚠️'; colorClass = 'border-l-4 border-l-orange-500'; }
            else if (title.includes('Tavsiye')) { icon = '🚀'; colorClass = 'border-l-4 border-l-purple-500'; }

            return (
              <div key={index} className={`rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm ${colorClass} animate-in slide-in-from-bottom-2 fade-in duration-500`} style={{ animationDelay: `${index * 100}ms` }}>
                {title && (
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="text-2xl">{icon}</span> {title}
                  </h3>
                )}
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-[rgb(var(--foreground))]/90">
                  {content}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-8 border-t border-[rgb(var(--border))]">
        <h2 className="text-lg font-semibold mb-4">{t('analysis.history')}</h2>
        {loadingHistory ? (
          <div className="flex items-center gap-2 text-[rgb(var(--muted))]">
            <span className="w-4 h-4 border-2 border-muted border-t-transparent rounded-full animate-spin"></span>
            {t('common.loading') || 'Yükleniyor...'}
          </div>
        ) : history.length === 0 ? (
          <div className="text-[rgb(var(--muted))]">{t('analysis.no_history')}</div>
        ) : (
          <ul className="space-y-4">
            {history.map((h) => (
              <li key={h.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]/50 p-4 transition-all hover:bg-[rgb(var(--card))] shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-[rgb(var(--accent))] uppercase tracking-wider">{EXAM_TYPES.find((t) => t.value === h.exam_type)?.label ?? h.exam_type}</span>
                  <span className="text-[10px] text-[rgb(var(--muted))] font-medium">{new Date(h.created_at).toLocaleString(language === 'English' ? 'en-US' : 'tr-TR')}</span>
                </div>
                <p className="text-sm line-clamp-2 text-[rgb(var(--foreground))]/80">{h.analysis_text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showDebug && <AIDebugPanel debugInfo={debugInfo} onClose={() => setShowDebug(false)} />}
    </div>
  )
}
