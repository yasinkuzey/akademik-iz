import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize Redis and Ratelimit only if credentials exist
let ratelimit = null;
export let redis = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, '300 s'), // 30 requests per 5 minutes
        analytics: true,
        prefix: '@upstash/ratelimit',
    });
}

/**
 * Checks rate limit for the given request
 * @param {import('http').IncomingMessage} req 
 * @param {string | null} [userId]
 */
export async function checkRateLimit(req, userId = null) {
    if (!ratelimit) {
        // If Upstash is not configured, skip rate limiting (allow for local dev)
        return { success: true };
    }

    // Use User ID if available, otherwise fallback to IP
    const identifier = userId ? `user:${userId}` : (req.headers['x-forwarded-for'] || req.ip || '127.0.0.1');
    const result = await ratelimit.limit(identifier);

    return result;
}
