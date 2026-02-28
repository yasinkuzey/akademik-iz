import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkRateLimit, redis } from './rateLimit.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        // 1. Rate Limiting
        const ratelimitResult = await checkRateLimit(req);
        if (!ratelimitResult.success) {
            return res.status(429).json({ error: 'Çok fazla istek gönderildi. Lütfen biraz bekle.' });
        }

        const { session, answers } = req.body;
        const cacheKey = `diagnostic:feedback:${session.id}`;

        // 2. Cache Check
        if (redis) {
            const cached = await redis.get(cacheKey);
            if (cached) return res.status(200).json({ feedback: cached });
        }

        // 3. AI Prompt Generation
        const performanceSummary = answers.map(a =>
            `- Konu: ${a.question.topic_tag}, Beceri: ${a.question.skill_tag}, Sonuç: ${a.is_correct ? 'Doğru' : 'Yanlış'}`
        ).join('\n');

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
            
            Kural: Doğrudan öğrenciye hitap et. Markdown kullanma. Düz metin. Maksimum 250 kelime. Bilgileri tekrar etme.
        `;

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(prompt);
        const feedback = result.response.text();

        // 4. Cache Result
        if (redis) {
            await redis.set(cacheKey, feedback, { ex: 86400 }); // 24h cache
        }

        res.status(200).json({ feedback });
    } catch (error) {
        console.error('AI Feedback Error:', error);
        res.status(500).json({ error: 'Geri bildirim oluşturulurken hata oluştu.' });
    }
}
