import http from 'http'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY
const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-flash'

const PORT = process.env.PORT || 3001

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

async function handleGenerateQuestions(model, { subject, topic, hours }) {
  const prompt = `Ders: ${subject}, Konu: ${topic}, Süre: ${hours} saat. 
HIZLI ve KISA (maks 15 kelime/soru) 4 adet çoktan seçmeli soru hazırla.
Şıklar tek kelime/kısa olsun.
JSON döndür:
[{"question":"...","options":{"A":"...","B":"...","C":"...","D":"...","E":"..."},"correctAnswer":"A"}]`

  const result = await model.generateContent(prompt)
  const text = result.response?.text?.() || '[]'
  let questions = []
  try {
    const jsonStr = text.replace(/```json?\s*|\s*```/g, '').trim()
    const parsed = JSON.parse(jsonStr)
    questions = Array.isArray(parsed) ? parsed.slice(0, 4) : []
    questions = questions.map((q, i) => ({
      question: q.question || '',
      options: q.options || {},
      correctAnswer: q.correctAnswer || 'A',
      order: i,
    }))
  } catch (e) {
    console.error('Parse error:', e)
    questions = []
  }
  return { questions }
}

async function handleEvaluateAnswers(model, { questions, answers }) {
  const prompt = `Aşağıdaki sorular ve doğru cevaplar verildi. Öğrencinin cevaplarını değerlendir. Cevap anlam olarak doğruysa veya sayısal eşitse doğru kabul et.
Her soru için sadece "correct" (boolean) ve "correctAnswer" (doğru cevap metni) döndür. Sadece JSON dizi döndür.
Sorular ve doğru cevaplar:
${questions.map((q, i) => `${i + 1}. Soru: ${q.question}\nDoğru cevap: ${q.correctAnswer}`).join('\n')}

Öğrenci cevapları:
${answers.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Çıktı formatı: [{"correct": true/false, "correctAnswer": "..."}, ...]`

  const result = await model.generateContent(prompt)
  const text = result.response?.text?.() || '[]'
  let feedback = []
  try {
    const parsed = JSON.parse(text.replace(/```json?\s*|\s*```/g, '').trim())
    feedback = Array.isArray(parsed) ? parsed.slice(0, questions.length) : []
    feedback = feedback.map((f, i) => ({
      index: i,
      correct: !!f.correct,
      correctAnswer: questions[i]?.correctAnswer || f.correctAnswer || '',
    }))
  } catch (_) {
    feedback = questions.map((q, i) => ({ index: i, correct: false, correctAnswer: q.correctAnswer }))
  }
  const correctCount = feedback.filter((f) => f.correct).length
  return { correctCount, feedback }
}

async function handleExamAnalysis(model, { examType, inputData }) {
  const typeLabel = examType === 'tyt' ? 'TYT' : examType === 'ayt' ? 'AYT' : 'Ortaokul (LGS)'
  const prompt = `Sen bir eğitim danışmanısın. Öğrenci ${typeLabel} deneme sonuçlarını paylaştı. Eksikleri, güçlü/zayıf alanları ve ne yapması gerektiğini Türkçe olarak analiz et. Net ve öneri odaklı yaz.

Deneme verisi:
${inputData}`

  const result = await model.generateContent(prompt)
  const analysis = result.response?.text?.() || 'Analiz üretilemedi.'
  return { analysis }
}

async function handleExamPrediction(model, { grade, curriculum }) {
  const prompt = `Sen bir eğitim danışmanısın. Öğrencinin sınıfı/hedefi ve müfredat bilgisi verildi. Ne çalışması gerektiğini ve sınavda neler çıkabileceğini Türkçe olarak yaz. Kişiselleştirilmiş tahmin ve öneriler ver.

Sınıf/hedef: ${grade}
Müfredat/konular: ${curriculum}`

  const result = await model.generateContent(prompt)
  const prediction = result.response?.text?.() || 'Tahmin üretilemedi.'
  return { prediction }
}

async function handleGenerateTrueFalse(model, { subject, topic, grade, term }) {
  const eff_subject = subject === 'Diğer' ? topic : subject;
  const eff_topic = subject === 'Diğer' ? 'Genel' : (topic || 'Genel');
  const ctx = `${grade || ''} ${term || ''}`.trim();
  const prompt = `${ctx} seviyesindeki ${eff_subject} dersinin ${eff_topic} konusu için 5 adet PROFESYONEL ZORLUKTA Doğru/Yanlış sorusu hazırla.
Kurallar:
1. HIZLI yanıt, kısa soru.
2. Sorular maks 12 kelime.
3. SADECE JSON döndür:
[{"question":"...","answer":true,"explanation":"..."},...]`

  const result = await model.generateContent(prompt)
  const text = result.response?.text?.() || '[]'
  try {
    const jsonStr = text.replace(/```json?\s*|\s*```/g, '').trim()
    const parsed = JSON.parse(jsonStr)
    return { questions: Array.isArray(parsed) ? parsed.slice(0, 5) : [] }
  } catch (e) {
    console.error('Parse error:', e)
    return { questions: [] }
  }
}

async function handleGenerateExamRehearsal(model, { subject, grade, term }) {
  const ctx = `${grade || ''} ${term || ''}`.trim();
  const prompt = `${ctx} seviyesindeki ${subject} dersi için ELİT SEVİYE bir sınav provası (rehearsal) hazırla.
Kurallar:
1. HIZLI ve net.
2. Sorular kısa (maks 15 kelime).
3. 5 MC, 5 TF, 3 Open-ended.
4. SADECE JSON döndür:
{"multiple_choice":[{"question":"...","options":{"A":"...","B":"...","C":"...","D":"...","E":"..."},"correctAnswer":"A"}],"true_false":[{"question":"...","answer":true}],"open_ended":[{"question":"...","sampleAnswer":"..."}]}`

  const result = await model.generateContent(prompt)
  const text = result.response?.text?.() || '{}'
  try {
    const jsonStr = text.replace(/```json?\s*|\s*```/g, '').trim()
    return JSON.parse(jsonStr)
  } catch (e) {
    console.error('Parse error:', e)
    return { multiple_choice: [], true_false: [], open_ended: [] }
  }
}

async function handleEvaluateOpenAnswers(model, { questions, answers, language }) {
  const lang = language === 'English' ? 'İngilizce' : 'Türkçe';
  const questionsAndAnswers = (questions || []).map((q, i) => {
    return `Soru ${i + 1}: ${q.question}\nÖrnek Cevap: ${q.sampleAnswer}\nÖğrenci Cevabı: ${answers[i] || '(Boş bırakıldı)'}`;
  }).join('\n\n');
  const prompt = `Sen bir öğretmensin. Öğrencinin açık uçlu sorulara verdiği cevapları ${lang} olarak değerlendir.
${questionsAndAnswers}

SADECE aşağıdaki JSON dizisini döndür:
[{"score":0-10,"feedback":"...","correct":true/false},...]`;

  const result = await model.generateContent(prompt)
  const text = result.response?.text?.() || '[]'
  try {
    const jsonStr = text.replace(/```json?\s*|\s*```/g, '').trim()
    const parsed = JSON.parse(jsonStr)
    return { evaluations: Array.isArray(parsed) ? parsed.slice(0, 10) : [] }
  } catch (e) {
    console.error('Parse error:', e)
    return { evaluations: [] }
  }
}

async function handleChat(model, { history, message }) {
  const chat = model.startChat({
    history: (history || []).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    })),
  })
  const result = await chat.sendMessage(message)
  const reply = result.response?.text?.() || 'Yanıt üretilemedi.'
  return { reply }
}

const handlers = {
  generate_questions: handleGenerateQuestions,
  generate_true_false: handleGenerateTrueFalse,
  generate_exam_rehearsal: handleGenerateExamRehearsal,
  evaluate_answers: handleEvaluateAnswers,
  evaluate_open_answers: handleEvaluateOpenAnswers,
  exam_analysis: handleExamAnalysis,
  exam_prediction: handleExamPrediction,
  chat: handleChat,
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/api/gemini') {
    send(res, 404, { error: 'Not found' })
    return
  }

  if (!genAI) {
    send(res, 503, { error: 'GEMINI_API_KEY not set' })
    return
  }

  try {
    const authHeader = req.headers['authorization']
    if (!authHeader) {
      console.warn('[WARN] No authorization header found in local server request')
    }

    const body = await parseBody(req)
    const action = body.action
    const handler = handlers[action]
    if (!handler) {
      send(res, 400, { error: 'Unknown action' })
      return
    }
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: action === 'chat' ? 'Sen bir öğrenci öğretmenisin. Soruları Türkçe ve anlaşılır şekilde yanıtla. Konu anlatımı yap, örnek ver. Kısa ve net ol.' : undefined,
    })
    const result = await handler(model, body)
    send(res, 200, result)
  } catch (err) {
    console.error(err)
    send(res, 500, { error: err.message || 'Server error' })
  }
})

server.listen(PORT, () => {
  console.log(`API server http://localhost:${PORT}`)
  console.log(`Model: ${MODEL_NAME}`)
})
