import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;
// Force usage of 1.5-flash as the user might have invalid model in Env Vars (e.g. gemini-2.5)
const MODEL_NAME = 'gemini-1.5-flash';

console.log('API Initialized.');
console.log('GEMINI_KEY Present:', !!GEMINI_KEY);
console.log('MODEL_NAME:', MODEL_NAME);

// CORS helper
const allowCors = (fn) => async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    return await fn(req, res);
};

async function handleGenerateQuestions(model, { subject, topic, hours }) {
    const prompt = `Sen bir eğitim asistanısın. Şu ders ve konu için ${hours} saat çalışma süresine göre 4 adet çoktan seçmeli soru hazırla.
Ders: ${subject}
Konu: ${topic}
Süre: ${hours} saat

Kurallar:
1. Tam 4 soru üret.
2. Her soru için 5 şık (A, B, C, D, E) olsun. Şıklar sadece cevap metnini içersin (Örn: "Paris", "Londra").
3. "correctAnswer" alanı sadece doğru şıkkın harfi olsun (Örn: "A", "B").
4. JSON formatında döndür:
[
  {
    "question": "Soru metni?",
    "options": { "A": "...", "B": "...", "C": "...", "D": "...", "E": "..." },
    "correctAnswer": "A"
  },
  ...
]
Sadece JSON dizisi döndür.`;

    const result = await model.generateContent(prompt);
    const text = result.response?.text?.() || '[]';
    let questions = [];
    try {
        const jsonStr = text.replace(/```json?\s*|\s*```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        questions = Array.isArray(parsed) ? parsed.slice(0, 4) : [];
        questions = questions.map((q, i) => ({
            question: q.question || '',
            options: q.options || {},
            correctAnswer: q.correctAnswer || 'A',
            order: i,
        }));
    } catch (e) {
        console.error('Parse error:', e);
        questions = [];
    }
    return { questions };
}

async function handleEvaluateAnswers(model, { questions, answers }) {
    // For multiple choice, we can arguably do this locally, but if we want AI explanations, we keep it.
    // The current frontend does local checking for correctness, but maybe we want AI to explain *why*.
    // For now, let's keep the logic simple and consistent with the previous server.
    // Actually, the new frontend uses local checking! 
    // But let's keep this handler in case we revert or need it for other things.

    const prompt = `Aşağıdaki sorular ve cevaplar verildi. Öğrencinin cevaplarını değerlendir.
Sorular: ${JSON.stringify(questions)}
Cevaplar: ${JSON.stringify(answers)}
Format: [{"correct": true, "correctAnswer": "..."}, ...]`;

    // Note: The frontend updated to check locally, so this might not be called widely, 
    // but good to have for legacy or fallback.
    const result = await model.generateContent(prompt);
    // ... parsing logic ...
    // returning mock for safe fallback as frontend does local check
    return { correctCount: 0, feedback: [] };
}

async function handleExamAnalysis(model, { examType, inputData }) {
    const typeLabel = examType === 'tyt' ? 'TYT' : examType === 'ayt' ? 'AYT' : 'Ortaokul (LGS)';
    const prompt = `Sen bir eğitim danışmanısın. Öğrenci ${typeLabel} deneme sonuçlarını paylaştı. Eksikleri, güçlü/zayıf alanları ve ne yapması gerektiğini Türkçe olarak analiz et.
Deneme verisi:
${inputData}`;

    const result = await model.generateContent(prompt);
    const analysis = result.response?.text?.() || 'Analiz üretilemedi.';
    return { analysis };
}

async function handleExamPrediction(model, { grade, curriculum }) {
    const prompt = `Sen bir eğitim danışmanısın. Öğrencinin sınıfı/hedefi: ${grade}, konular: ${curriculum}. Ne çalışması gerektiğini ve sınav tahminini Türkçe yaz.`;
    const result = await model.generateContent(prompt);
    const prediction = result.response?.text?.() || 'Tahmin üretilemedi.';
    return { prediction };
}

async function handleChat(model, { history, message }) {
    const chat = model.startChat({
        history: (history || []).map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
        })),
    });
    const result = await chat.sendMessage(message);
    const reply = result.response?.text?.() || 'Yanıt üretilemedi.';
    return { reply };
}

const handlers = {
    generate_questions: handleGenerateQuestions,
    evaluate_answers: handleEvaluateAnswers,
    exam_analysis: handleExamAnalysis,
    exam_prediction: handleExamPrediction,
    chat: handleChat,
};

async function handler(req, res) {
    // Use REST API directly to avoid SDK issues on Vercel
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        const model = 'gemini-2.5-flash'; // Updated per user request

        if (!apiKey) throw new Error('API Key is missing');

        // Vercel parses body automatically usually, but let's be safe
        const body = req.body || {};
        const action = body.action;

        let promptText = '';
        let systemInstruction = '';
        let history = []; // For chat

        if (action === 'generate_questions') {
            systemInstruction = 'Sen bir eğitim asistanısın.';
            promptText = `Şu ders ve konu için ${body.hours} saat çalışma süresine göre 4 adet çoktan seçmeli soru hazırla.
Ders: ${body.subject}
Konu: ${body.topic}
Süre: ${body.hours} saat

Kurallar:
1. Tam 4 soru üret.
2. Her soru için 5 şık (A, B, C, D, E) olsun. Şıklar sadece cevap metnini içersin.
3. "correctAnswer" alanı sadece doğru şıkkın harfi olsun.
4. JSON formatında döndür:
[{"question": "...", "options": {"A": "...", ...}, "correctAnswer": "A"}, ...]
Sadece JSON dizisi döndür.`;
        }
        else if (action === 'exam_analysis') {
            const typeLabel = body.examType === 'tyt' ? 'TYT' : body.examType === 'ayt' ? 'AYT' : 'Ortaokul (LGS)';
            systemInstruction = 'Sen bir eğitim danışmanısın.';
            promptText = `Öğrenci ${typeLabel} deneme sonuçlarını paylaştı. Eksikleri, güçlü/zayıf alanları ve ne yapması gerektiğini Türkçe olarak analiz et.
Deneme verisi:
${body.inputData}`;
        }
        else if (action === 'exam_prediction') {
            systemInstruction = 'Sen bir eğitim danışmanısın.';
            promptText = `Öğrencinin sınıfı/hedefi: ${body.grade}, konular: ${body.curriculum}. Ne çalışması gerektiğini ve sınav tahminini Türkçe yaz.`;
        }
        else if (action === 'chat') {
            // Chat format is specific
            history = (body.history || []).map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }));
            promptText = body.message;
        }
        else {
            return res.status(400).json({ error: 'Unknown action' });
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const payload = {
            contents: [
                ...history, // Add chat history if present
                { role: 'user', parts: [{ text: promptText }] }
            ]
        };

        if (systemInstruction) {
            payload.systemInstruction = { parts: [{ text: systemInstruction }] };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('AI returned empty response (No candidates/parts).');
        }

        // Response formatting based on action
        let result = {};

        if (action === 'generate_questions') {
            try {
                const jsonStr = text.replace(/```json?\s*|\s*```/g, '').trim();
                const parsed = JSON.parse(jsonStr);

                if (!Array.isArray(parsed)) throw new Error('Response is not an array');

                const questions = parsed.slice(0, 4).map((q, i) => ({
                    question: q.question || '',
                    options: q.options || {},
                    correctAnswer: q.correctAnswer || 'A',
                    order: i,
                }));

                if (questions.length === 0) throw new Error('Parsed array is empty');
                result = { questions };
            } catch (e) {
                console.error('Parse error:', e);
                throw new Error(`JSON Parse Failed: ${e.message}. Raw Text: ${text.slice(0, 200)}...`);
            }
        }
        else if (action === 'exam_analysis') {
            result = { analysis: text };
        }
        else if (action === 'exam_prediction') {
            result = { prediction: text };
        }
        else if (action === 'chat') {
            result = { reply: text };
        }

        res.status(200).json(result);

    } catch (err) {
        console.error('API Error:', err);
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
        res.status(500).json({
            error: err.message || 'Server error',
            details: 'REST API Fallback',
            modelUsed: 'gemini-2.5-flash',
            keyStatus: apiKey ? `Present (${apiKey.slice(0, 5)}...)` : 'Missing'
        });
    }
}

export default allowCors(handler);
