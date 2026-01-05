
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
        await expect(page.locator('h1')).toContainText('Portal del Paciente');
        await expect(page.getByText('Calidad Aire')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[type="email"]', 'paciente1@test.com');
        await page.fill('input[type="password"]', 'WRONGPASSWORD');

        await page.click('button[type="submit"]');

        // Should stay on login or show error
        await expect(page.getByText('Credenciales inválidas')).toBeVisible();
    });

    test('should redirect unauthenticated access to login', async ({ page }) => {
        await page.goto('/portal');
        await expect(page).toHaveURL(/\/login/);
    });
});
