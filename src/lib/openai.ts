import OpenAI from 'openai';

// Allow build to proceed even if key is missing (it might be injected at runtime or missing in build env)
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.warn('⚠️ OPENAI_API_KEY is missing. AI features will not work.');
}

export const openai = new OpenAI({
    apiKey: apiKey || 'dummy-key-for-build', // Fallback to avoid build crash
});
