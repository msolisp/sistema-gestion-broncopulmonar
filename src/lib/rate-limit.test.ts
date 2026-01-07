import { RateLimiterMemory } from 'rate-limiter-flexible';

// Delegate variable that can be swapped per test
let mockConsumeDelegate: jest.Mock;

jest.mock('rate-limiter-flexible', () => {
    return {
        RateLimiterMemory: jest.fn().mockImplementation(() => ({
            // Forward calls to the delegate
            consume: (...args: any[]) => mockConsumeDelegate(...args)
        }))
    };
});

describe('rateLimit', () => {
    let rateLimit: (key: string) => Promise<void>;

    beforeEach(async () => {
        jest.resetModules();
        mockConsumeDelegate = jest.fn();

        // Dynamic import to trigger new instantiation which will use the mock factory above
        const module = await import('./rate-limit');
        rateLimit = module.rateLimit;
    });

    it('consumes a point for the key', async () => {
        mockConsumeDelegate.mockResolvedValue(true);
        await rateLimit('test-key');
        expect(mockConsumeDelegate).toHaveBeenCalledWith('test-key');
    });

    it('throws error when limit exceeded', async () => {
        mockConsumeDelegate.mockRejectedValue(new Error('Too Many Requests'));
        await expect(rateLimit('test-key')).rejects.toThrow('Too Many Requests');
    });
});
