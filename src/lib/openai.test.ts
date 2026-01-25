
import OpenAI from 'openai';

// Mock OpenAI class
jest.mock('openai', () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation((config) => ({
            apiKey: config.apiKey,
        })),
    };
});

describe('OpenAI Config', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
        (OpenAI as unknown as jest.Mock).mockClear();
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('uses provided API key', () => {
        process.env.OPENAI_API_KEY = 'test-key';
        let openaiInstance;
        jest.isolateModules(() => {
            const { openai } = require('./openai');
            openaiInstance = openai;
        });
        // @ts-ignore
        expect(openaiInstance.apiKey).toBe('test-key');
    });

    it('falls back to dummy key if missing', () => {
        delete process.env.OPENAI_API_KEY;
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        let openaiInstance;
        jest.isolateModules(() => {
            const { openai } = require('./openai');
            openaiInstance = openai;
        });

        // @ts-ignore
        expect(openaiInstance.apiKey).toBe('dummy-key-for-build');
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('OPENAI_API_KEY is missing'));

        consoleSpy.mockRestore();
    });
});
