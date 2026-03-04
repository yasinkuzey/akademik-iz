import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit, redis } from './rateLimit.js';
import { performance } from 'perf_hooks';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const MODELS = [
    process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b'
];

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        // 1. Rate Limiting
        const ratelimitResult = await checkRateLimit(req);
        if (!ratelimitResult.success) {
            return res.status(429).json({ error: 'Çok fazla istek gönderildi. Lütfen biraz bekle.' });
        }

        const { session, answers } = req.body;
        if (!session || !answers) {
            return res.status(400).json({ error: 'Eksik veri (session veya answers)' });
        }

        const cacheKey = `diagnostic:feedback:${session.id}`;

        // 2. Cache Check
        if (redis) {
            try {
                const cached = await redis.get(cacheKey);
                if (cached) return res.status(200).json({ feedback: cached });
            } catch (ce) {
                console.warn('Redis cache read error:', ce.message);
            }
        }

        // 3. AI Prompt Generation
        const performanceSummary = answers.map(a => {
            const topic = a._topic_tag || a.topic_tag || (a.question && a.question.topic_tag) || 'Genel';
            const skill = a._skill_tag || a.skill_tag || (a.question && a.question.skill_tag) || 'Analiz';
            return `- Konu: ${topic}, Beceri: ${skill}, Sonuç: ${a.is_correct ? 'Doğru' : 'Yanlış'}`;
        }).join('\n');

        const prompt = `
            Sen profesyonel bir eğitim koçusun. Şu test sonuçlarını analiz et:
            Ders: ${session.subject}
            Seviye: ${session.stage}
            Performans:
            ${performanceSummary}
            
            Görevin:
            1. Güçlü ve zayıf yanları belirle.
            2. Samimi ve motive edici bir dille hitap et.
            3. 1 haftalık net bir çalışma programı öner.
            4. 3 pratik ipucu ver.
            
            Kural: Doğrudan öğrenciye hitap et. Markdown kullanma. Düz metin. Maksimum 300 kelime. Bilgileri tekrar etme.
        `;

        if (!genAI) {
            throw new Error('Konfigürasyon hatası: API Key bulunamadı');
        }

        // Model fallback chain
        let apiResponse;
        let lastError;

        for (const modelName of MODELS) {
            const model = genAI.getGenerativeModel({ model: modelName });
            try {
                const result = await model.generateContent(prompt);
                const feedback = result.response.text();

                if (feedback) {
                    // 4. Cache Result
                    if (redis) {
                        try {
                            await redis.set(cacheKey, feedback, { ex: 86400 }); // 24h cache
                        } catch (se) {
                            console.warn('Redis cache set error:', se.message);
                        }
                    }
                    return res.status(200).json({ feedback });
                }
            } catch (err) {
                console.warn(`[FALLBACK] Model ${modelName} failed. Trying next...`, err.message);
                lastError = err;
            }
        }

        throw lastError || new Error('Feedback oluşturulamadı');

    } catch (error) {
        console.error('AI Feedback Error:', error);
        res.status(500).json({
            error: 'Geri bildirim oluşturulurken hata oluştu.',
            details: error.message
        });
    }
}
