import { performance } from 'perf_hooks';
import { validateBody } from './validate.js';
import { checkRateLimit } from './rateLimit.js';
import { verifyUser } from './auth.js';

// CORS helper refined
const allowCors = (fn) => async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-debug, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 1. Method Restriction
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Yalnızca POST istekleri kabul edilir' });
    }

    // 3. Content-Type Check
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
        return res.status(415).json({ error: 'Sadece JSON formatı destekleniyor' });
    }

    return await fn(req, res);
};

// Mask sensitive data in logs
function safeLog(message, error) {
    let safeMessage = message;
    if (error && error.message) {
        // Mask API Key patterns if they somehow appear in error messages
        safeMessage += `: ${error.message.replace(/AIza[a-zA-Z0-9-_]{35}/g, 'AIza...[MASKED]')}`;
    }
    console.error(safeMessage);
}

// Model fallback chain – user preferred 2.5-flash first, then fallbacks
// Model fallback chain: 2.0-flash -> 1.5-flash -> 1.5-flash-8b (proactive fallback for quota)
const MODELS = [
    process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b'
];

async function handler(req, res) {
    const requestId = Math.random().toString(36).substring(7);

    try {
        const start = performance.now();

        // 1. Authentication Check
        const { userId, error: authError } = await verifyUser(req);
        if (authError) {
            return res.status(401).json({ error: authError, requestId });
        }

        // Log user access (Safe for Vercel logs as requested)
        console.log(`[AUTH] User: ${userId} requested ${req.body?.action || 'unknown'}`);

        // 2. Rate Limiting Check (Include User ID)
        const { success, limit, remaining, reset } = await checkRateLimit(req, userId);
        if (!success) {
            res.setHeader('Retry-After', reset.toString());
            return res.status(429).json({
                error: 'Çok fazla istek gönderildi. Lütfen bir süre bekleyin.',
                requestId
            });
        }
        const rateLimitEnd = performance.now();

        // 5. Body Size Limit (Simple manual check since Vercel parses body)
        const bodySize = JSON.stringify(req.body || {}).length;
        if (bodySize > 250 * 1024) { // 250kb
            return res.status(413).json({ error: 'İstek gövdesi çok büyük (max 250kb)', requestId });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error('Konfigürasyon hatası: API Key bulunamadı');

        // 6. Request Validation (Zod)
        const body = req.body || {};
        const { action } = body;

        let validatedData;
        try {
            validatedData = validateBody(action, body);
        } catch (vErr) {
            return res.status(400).json({
                error: 'Geçersiz veri formatı',
                details: vErr.errors || vErr.message,
                requestId
            });
        }
        const validationEnd = performance.now();

        let promptText = '';
        let systemInstruction = '';
        let history = [];

        const lang = validatedData.language || 'Turkish';
        const langNote = lang === 'English' ? 'Tüm sorular ve şıklar İNGİLİZCE (English) olmalı.' : 'Tüm sorular ve şıklar TÜRKÇE olmalı.';

        // Handle actions
        if (action === 'health') {
            const end = performance.now();
            return res.status(200).json({
                status: 'ok',
                _debug: req.headers['x-debug'] ? { totalTime: Math.round(end - start) } : undefined
            });
        }

        if (action === 'generate_questions') {
            systemInstruction = 'Sen bir eğitim asistanısın.';
            const { subject, topic, grade, term, count } = validatedData;
            const eff_subject = subject === 'Diğer' ? topic : subject;
            const isGeneral = !topic || topic === 'Genel' || topic.toLowerCase() === subject.toLowerCase();
            const eff_topic = isGeneral ? 'TÜM MÜFREDAT (Genel Sınav)' : topic;
            const ctx = `${grade} ${term || ''}`.trim();
            const question_count = count || 5;

            promptText = `${ctx} seviyesindeki ${eff_subject} dersi, ${eff_topic} konusu için ${question_count} adet ÜST DÜZEY ZORLUKTA çoktan seçmeli soru hazırla.
Kurallar:
1. DİL: ${langNote}
2. KAPSAM: ${isGeneral ? 'Sadece bir konuya odaklanma, bu sınıf ve dönem seviyesindeki TÜM önemli konuları kapsayan bir genel tarama testi / sınav provası hazırla.' : 'Belirtilen spesifik konuya odaklan.'}
3. HIZ: Hızlı yanıt için kısa tut.
4. UZUNLUK: Sorular maks 20 kelime, şıklar kısa olsun.
5. ZORLUK: Üst düzey, derin akıl yürütme.
6. ${question_count} soru, 5 şık (A, B, C, D, E), correctAnswer tek harf (Örn: "A").
7. SADECE JSON döndür. Başka metin ekleme.
8. FORMAT:
[{"question":"...","options":{"A":"...","B":"...","C":"...","D":"...","E":"..."},"correctAnswer":"A","topic_tag":"..."},...]`;

        } else if (action === 'generate_true_false') {
            systemInstruction = 'Sen bir öğretmensin.';
            const { subject, topic, grade, term } = validatedData;
            const eff_subject = subject === 'Diğer' ? topic : subject;
            const eff_topic = subject === 'Diğer' ? 'Genel' : (topic || 'Genel');
            const ctx = `${grade || ''} ${term || ''}`.trim();
            promptText = `${ctx} seviyesindeki ${eff_subject} dersinin ${eff_topic} konusu için 5 adet PROFESYONEL ZORLUKTA Doğru/Yanlış sorusu hazırla.
Kurallar:
1. DİL: ${langNote}
2. HIZ: Hızlı yanıt, kısa soru.
3. UZUNLUK: Sorular maks 12 kelime.
4. SADECE JSON döndür:
[{"question":"...","answer":true,"explanation":"..."},...]`;

        } else if (action === 'generate_exam_rehearsal') {
            systemInstruction = 'Sen bir öğretmensin.';
            const { subject, grade, term } = validatedData;
            const ctx = `${grade || ''} ${term || ''}`.trim();
            promptText = `${ctx} seviyesindeki ${subject} dersi için ELİT SEVİYE bir sınav provası (rehearsal) hazırla.
Kurallar:
1. DİL: ${langNote}
2. HIZ: Hızlı ve net.
3. UZUNLUK: Sorular kısa (maks 15 kelime).
4. 5 MC, 5 TF, 3 Open-ended.
5. SADECE JSON döndür:
{"multiple_choice":[{"question":"...","options":{"A":"...","B":"...","C":"...","D":"...","E":"..."},"correctAnswer":"A"}],"true_false":[{"question":"...","answer":true}],"open_ended":[{"question":"...","sampleAnswer":"..."}]}`;

        } else if (action === 'exam_analysis') {
            systemInstruction = 'Sen bir eğitim danışmanısın.';
            const { examType, inputData } = validatedData;
            const typeLabel = examType === 'tyt' ? 'TYT' : examType === 'ayt' ? 'AYT' : examType === 'kpss' ? 'KPSS' : examType === 'ales' ? 'ALES' : 'Ortaokul (LGS)';
            promptText = `Öğrenci ${typeLabel} deneme sonuçlarını paylaştı. Eksikleri ve tavsiyelerini analiz et.\n${inputData}`;

        } else if (action === 'exam_prediction') {
            systemInstruction = 'Sen bir eğitim danışmanısın.';
            const { grade, curriculum } = validatedData;
            promptText = `Öğrencinin sınıfı/hedefi: ${grade}, konular: ${curriculum}. Ne çalışması gerektiğini ve sınav tahminini Türkçe yaz.`;

        } else if (action === 'chat') {
            history = (validatedData.history || []).map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }]
            }));
            promptText = validatedData.message;

        } else if (action === 'evaluate_open_answers') {
            systemInstruction = `Sen bir öğretmensin. Öğrencinin açık uçlu sorulara verdiği cevapları ${lang === 'English' ? 'İngilizce' : 'Türkçe'} olarak değerlendir.`;
            const questionsAndAnswers = (validatedData.questions || []).map((q, i) => {
                return `Soru ${i + 1}: ${q.question}\nÖrnek Cevap: ${q.sampleAnswer}\nÖğrenci Cevabı: ${validatedData.answers[i] || '(Boş bırakıldı)'}`;
            }).join('\n\n');
            promptText = `${questionsAndAnswers}\n\nSADECE aşağıdaki JSON dizisini döndür:\n[{"score":0-10,"feedback":"...","correct":true/false},...]`;
        }
        const promptBuildEnd = performance.now();

        // Build payload
        const payload = {
            contents: [
                ...history,
                { role: 'user', parts: [{ text: promptText }] }
            ]
        };
        if (systemInstruction) {
            payload.systemInstruction = { parts: [{ text: systemInstruction }] };
        }

        // Try each model in the fallback chain, with retry on 429 (quota/rate limit)
        const MAX_RETRIES = 3;
        let apiResponse;
        let usedModel;

        for (const model of MODELS) {
            usedModel = model;
            let retryCount = 0;

            while (retryCount <= MAX_RETRIES) {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                apiResponse = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (apiResponse.ok) break;

                // On 429 (rate limit / quota), retry with exponential backoff
                if (apiResponse.status === 429 && retryCount < MAX_RETRIES) {
                    const waitMs = Math.pow(2, retryCount + 2) * 1000; // 4s, 8s, 16s
                    await new Promise(r => setTimeout(r, waitMs));
                    retryCount++;
                    continue;
                }

                break; // non-retriable error for this model
            }

            if (apiResponse.ok) break;

            // Fallback on 404 (Not Found), 400 (Bad Request - e.g. Invalid Model Name), 429 (Quota), or 5xx
            const status = apiResponse.status;
            const shouldTryNext = status === 404 || status === 400 || status === 429 || (status >= 500 && status <= 599);

            if (!shouldTryNext) break;
            console.warn(`[FALLBACK] Model ${model} failed with ${status}. ID: ${requestId}. Trying next...`);
        }

        const geminiEnd = performance.now();

        if (!apiResponse.ok) {
            const errText = await apiResponse.text();
            let parsedErr = {};
            try { parsedErr = JSON.parse(errText); } catch (e) { }

            safeLog(`Gemini API Hatası [Model ${usedModel}] [Status ${apiResponse.status}] [ID ${requestId}]`, new Error(errText));

            // Specific error for quota/rate limit
            if (apiResponse.status === 429) {
                const errMsg = parsedErr.error?.message || '';
                const isQuotaExhausted = errMsg.includes('limit: 0') || errMsg.includes('Quota exceeded');
                return res.status(429).json({
                    error: isQuotaExhausted
                        ? 'AI servisi günlük kullanım kotası doldu. Lütfen birkaç dakika sonra tekrar deneyin.'
                        : 'AI servisi şu an yoğun. Lütfen birkaç saniye sonra tekrar deneyin.',
                    retryable: true,
                    requestId
                });
            }

            return res.status(502).json({
                error: 'AI servisi şu an yanıt veremiyor',
                details: parsedErr.error?.message || errText,
                status: apiResponse.status,
                requestId
            });
        }

        const data = await apiResponse.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            console.error(`[AI ERROR] Empty response for action: ${action}, ID: ${requestId}`);
            throw new Error('AI boş yanıt döndürdü.');
        }

        if (process.env.NODE_ENV === 'development' || req.headers['x-debug']) {
            console.log(`[AI RAW] ${action}: ${text.substring(0, 100)}...`);
        }

        const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

        let result = {};
        try {
            if (['generate_questions', 'generate_true_false', 'generate_exam_rehearsal', 'evaluate_open_answers'].includes(action)) {
                if (action === 'generate_questions') {
                    result = { questions: JSON.parse(clean).slice(0, 5) };
                } else if (action === 'generate_true_false') {
                    result = { questions: JSON.parse(clean).slice(0, 5) };
                } else if (action === 'evaluate_open_answers') {
                    result = { evaluations: JSON.parse(clean).slice(0, 10) };
                } else {
                    result = JSON.parse(clean);
                }
            } else if (action === 'exam_analysis') {
                result = { analysis: text };
            } else if (action === 'exam_prediction') {
                result = { prediction: text };
            } else if (action === 'chat') {
                result = { reply: text };
            }
        } catch (pErr) {
            safeLog(`JSON Parse Hatası [ID ${requestId}]`, pErr);
            // Non-JSON fallback
            if (action === 'chat') result = { reply: text };
            else throw new Error('Yapay zeka geçersiz formatta yanıt verdi');
        }

        const postProcessEnd = performance.now();

        if (req.headers['x-debug']) {
            result._debug = {
                requestId,
                usedModel,
                timings: {
                    rateLimit: Math.round(rateLimitEnd - start),
                    validation: Math.round(validationEnd - rateLimitEnd),
                    promptBuild: Math.round(promptBuildEnd - validationEnd),
                    geminiApi: Math.round(geminiEnd - promptBuildEnd),
                    postProcess: Math.round(postProcessEnd - geminiEnd),
                    totalServer: Math.round(postProcessEnd - start)
                }
            };
        }

        res.status(200).json(result);

    } catch (err) {
        safeLog(`Beklenmedik Hata [ID ${requestId}]`, err);
        res.status(500).json({
            error: 'Bir iç hata oluştu',
            requestId
        });
    }
}

export default allowCors(handler);
