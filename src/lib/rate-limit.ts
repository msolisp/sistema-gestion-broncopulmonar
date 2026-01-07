import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
    points: 5, // 5 attempts
    duration: 60, // per 60 seconds
});

export async function rateLimit(key: string) {
    // Disable rate limiting in test environment to avoid flaky E2E tests
    if (process.env.NODE_ENV === 'test' || process.env.E2E_TESTING === 'true') return;

    // try {
    //     await rateLimiter.consume(key);
    // } catch (rejRes) {
    //     throw new Error('Too Many Requests');
    // }
}
