import { z } from 'zod';

const MessageSchema = z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(800, 'Mesaj çok uzun (max 800)'),
});

const BaseSchema = z.object({
    action: z.string(),
    language: z.enum(['Turkish', 'English']).optional(),
});

export const Schemas = {
    generate_questions: BaseSchema.extend({
        subject: z.string().max(100),
        topic: z.string().max(100),
        grade: z.string().max(50).optional(),
        term: z.string().max(50).optional(),
        hours: z.number().optional(),
        count: z.number().optional(),
    }),
    generate_true_false: BaseSchema.extend({
        subject: z.string().max(100),
        topic: z.string().max(100),
        grade: z.string().max(50).optional(),
        term: z.string().max(50).optional(),
    }),
    generate_exam_rehearsal: BaseSchema.extend({
        subject: z.string().max(100),
        grade: z.string().max(50).optional(),
        term: z.string().max(50).optional(),
    }),
    exam_analysis: BaseSchema.extend({
        examType: z.string().max(20),
        inputData: z.string().max(3000, 'Girdi verisi çok büyük (max 3000)'),
    }),
    exam_prediction: BaseSchema.extend({
        grade: z.string().max(50).optional(),
        curriculum: z.string().max(500).optional(),
    }),
    chat: BaseSchema.extend({
        message: z.string().max(1500, 'Mesaj çok uzun (max 1500)'),
        history: z.array(MessageSchema).max(15, 'Geçmiş çok uzun (max 15 mesaj)'),
    }),
    evaluate_open_answers: BaseSchema.extend({
        questions: z.array(z.object({
            question: z.string(),
            sampleAnswer: z.string(),
        })).max(10),
        answers: z.array(z.string().max(1000)).max(10),
    }),
    health: BaseSchema.extend({}),
};

export function validateBody(action, body) {
    const schema = Schemas[action];
    if (!schema) {
        throw new Error('Geçersiz aksiyon');
    }
    return schema.parse(body);
}
