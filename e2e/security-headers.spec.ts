
import { test, expect } from '@playwright/test';

test.describe('Security Headers', () => {
    test('should have strict security headers', async ({ page, request }) => {
        const response = await request.get('/');
        expect(response.ok()).toBeTruthy();

        const headers = response.headers();

        // HSTS
        expect(headers['strict-transport-security']).toBe('max-age=63072000; includeSubDomains; preload');

        // X-Frame-Options
        expect(headers['x-frame-options']).toBe('DENY');

        // X-Content-Type-Options
        expect(headers['x-content-type-options']).toBe('nosniff');

        // Referrer-Policy
        expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');

        // Permissions-Policy
        expect(headers['permissions-policy']).toBe('camera=(), microphone=(), geolocation=(), browsing-topics=()');
    });
});
