
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',

    // Global setup to seed database before tests
    // TEMPORARILY DISABLED: DB push requires vector extension
    // Uncomment when DB schema issues are resolved
    // globalSetup: require.resolve('./playwright.global-setup'),

    // Increase timeouts for development environment
    timeout: 180000, // 3 minutes per test

    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        actionTimeout: 60000, // 60 seconds per action
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        // Mobile devices for testing responsive design
        {
            name: 'iPhone 14 Pro',
            use: { ...devices['iPhone 14 Pro'] },
        },
        {
            name: 'Samsung Galaxy S21',
            use: { ...devices['Galaxy S21'] },
        },
        {
            name: 'iPad Air',
            use: { ...devices['iPad Pro'] },
        },
    ],
    webServer: {
        command: 'npm run dev',
        env: {
            E2E_TESTING: 'true',
        },
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000, // 2 minutes to start server
    },
});
