import { rateLimit } from './rate-limit';
import { RateLimiterMemory } from 'rate-limiter-flexible';

jest.mock('rate-limiter-flexible', () => {
    return {
        RateLimiterMemory: jest.fn().mockImplementation(() => ({
            consume: jest.fn()
        }))
    };
});

describe('rateLimit', () => {
    let mockConsume: jest.Mock;

    beforeAll(() => {
        // Retrieve the mock instance created when rate-limit.ts was imported
        const MockClass = RateLimiterMemory as unknown as jest.Mock;
        // Ensure it was called
        if (MockClass.mock.instances.length === 0) {
            throw new Error('RateLimiterMemory was not instantiated.');
        }
        const mockInstance = MockClass.mock.instances[0];
        mockConsume = mockInstance.consume;
    });

    beforeEach(() => {
        mockConsume.mockReset();
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
