import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
    points: 5, // 5 attempts
    duration: 60, // per 60 seconds
});

export async function rateLimit(key: string) {
    try {
        await rateLimiter.consume(key);
    } catch (rejRes) {
        throw new Error('Too Many Requests');
    }
}
