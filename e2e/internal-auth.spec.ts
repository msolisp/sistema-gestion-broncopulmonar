import { test, expect } from '@playwright/test';

test.describe('Internal Portal Login Security', () => {

    test('should reject patient login to internal portal', async ({ page }) => {
        // 1. Go to internal login
        await page.goto('/intranet/login');

        // 2. Try to login as patient (using seeded patient)
        await page.fill('input[name="email"]', 'paciente1@test.com');
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button:has-text("Iniciar Sesión Segura")');

        // 3. Expect error message
        await expect(page.getByText('No tiene acceso al portal interno.')).toBeVisible();

        // 4. Verify we are NOT redirected (still on login page or similar)
        // Login page usually has "Acceso Funcionario" text
        await expect(page.getByText('Acceso Funcionario')).toBeVisible();

        // Also ensure we didn't go to /portal or /dashboard
        const url = page.url();
        expect(url).not.toContain('/portal');
        expect(url).not.toContain('/dashboard');
    });

    test('should allow admin login to internal portal', async ({ page }) => {
        await page.goto('/intranet/login');
        await page.fill('input[name="email"]', 'admin@hospital.cl');
        await page.fill('input[name="password"]', 'Admin123!');
        await page.click('button[type="submit"]');

        // Should redirect to dashboard
        await expect(page).toHaveURL(/\/dashboard/);
    });
});
