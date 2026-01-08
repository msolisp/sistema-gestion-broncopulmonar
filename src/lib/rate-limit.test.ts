import { RateLimiterMemory } from 'rate-limiter-flexible';

describe('rateLimit', () => {
    let rateLimit: (key: string) => Promise<void>;
    let mockConsume: jest.Mock;
    const originalEnv = process.env;

    beforeEach(async () => {
        jest.resetModules();
        process.env = { ...originalEnv, NODE_ENV: 'production' };

        mockConsume = jest.fn();

        jest.doMock('rate-limiter-flexible', () => {
            return {
                RateLimiterMemory: jest.fn().mockImplementation(() => ({
                    consume: mockConsume
                }))
            };
        });

        const module = await import('./rate-limit');
        rateLimit = module.rateLimit;
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('consumes a point for the key', async () => {
        mockConsume.mockResolvedValue(true);
        await rateLimit('test-key');
        expect(mockConsume).toHaveBeenCalledWith('test-key');
    });

    it('throws error when limit exceeded', async () => {
        mockConsume.mockRejectedValue(new Error('Too Many Requests'));
        await expect(rateLimit('test-key')).rejects.toThrow('Too Many Requests');
    });
});
