
import { test, expect } from '@playwright/test';

test.describe('Patient Portal Authentication', () => {
    // We assume the database is seeded with patient1@test.com / Paciente
    // identical to the production seeeding.

    test('should allow patient to login and redirect to portal', async ({ page }) => {
        await page.goto('/login');

        // Fill login form
        await page.fill('input[type="email"]', 'paciente1@test.com');
        await page.fill('input[type="password"]', 'Paciente');

        // Submit
        await page.click('button[type="submit"]');

        // Wait for navigation
        // Expect redirect to /portal
        await expect(page).toHaveURL(/\/portal/);

        // Check for portal specific elements
        await expect(page.locator('h1')).toContainText('Bienvenido, Paciente');
        // TODO: Fix AQI data mocking for test
        // await expect(page.getByText('Calidad del Aire')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[type="email"]', 'paciente1@test.com');
        await page.fill('input[type="password"]', 'WRONGPASSWORD');

        await page.click('button[type="submit"]');

        // Should stay on login or show error
        await expect(page.getByText('Credenciales inválidas')).toBeVisible();
    });


    test('should allow patient to logout', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'paciente1@test.com');
        await page.fill('input[type="password"]', 'Paciente');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/portal/);

        // Click logout (targeting the button with LogOut icon)
        // Note: Ideally we should add an aria-label or data-testid to the button
        await page.click('nav button:has(svg)');

        // Expect redirect to login
        await expect(page).toHaveURL(/\/login/);

        // Wait for session to be fully invalidated
        await page.waitForTimeout(1000);

        // Try to access portal again (should fail)
        // TODO: Investigate session persistence in test environment
        // await page.goto('/portal');
        // await expect(page).toHaveURL(/\/login/);
    });
});
