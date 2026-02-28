import http from 'http'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY
const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

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
  const prompt = `Sen bir eğitim asistanısın. Şu ders ve konu için ${hours} saat çalışma süresine göre zorluk ayarla: 1 saat daha kolay, 4+ saat daha zor olsun.
Ders: ${subject}
Konu: ${topic}
Süre: ${hours} saat

Tam 4 soru üret (kolaydan zora). Her biri için "question" ve "correctAnswer" alanları olan bir JSON dizisi döndür. Sadece JSON döndür, başka metin yazma. Format:
[{"question":"Soru metni?", "correctAnswer":"Doğru cevap metni"}, ...]`

  const result = await model.generateContent(prompt)
  const text = result.response?.text?.() || '[]'
  let questions = []
  try {
    const parsed = JSON.parse(text.replace(/```json?\s*|\s*```/g, '').trim())
    questions = Array.isArray(parsed) ? parsed.slice(0, 4) : []
    questions = questions.map((q, i) => ({
      question: q.question || q.soru || '',
      correctAnswer: q.correctAnswer || q.dogruCevap || q.cevap || '',
      order: i,
    }))
  } catch (_) {
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
  evaluate_answers: handleEvaluateAnswers,
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
