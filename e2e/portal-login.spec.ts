
import { test, expect } from '@playwright/test';

test.describe('Patient Portal Authentication', () => {
    // We assume the database is seeded with patient1@test.com / Paciente
    // identical to the production seeeding.

    test('should allow patient to login and redirect to portal', async ({ page }) => {
        // Register a new user first to ensure credentials work
        await page.goto('/register');
        const uniqueEmail = `portal_test_${Date.now()}@test.com`;
        await page.fill('input[name="name"]', 'Portal Test Patient');
        await page.fill('input[name="rut"]', `10.000.000-${Math.floor(Math.random() * 9)}`);
        await page.selectOption('select[id="region"]', { label: 'Metropolitana de Santiago' });
        await page.locator('select[name="commune"]').selectOption({ value: 'SANTIAGO' });
        await page.fill('input[name="email"]', uniqueEmail);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button:has-text("Registrarse")');
        await expect(page.getByText('Cuenta creada exitosamente')).toBeVisible();

        await page.goto('/login');

        // Fill login form
        await page.fill('input[type="email"]', uniqueEmail);
        await page.fill('input[type="password"]', 'password123');

        // Submit
        await page.click('button[type="submit"]');

        // Wait for navigation
        // Expect redirect to /portal
        await expect(page).toHaveURL(/\/portal/);

        // Check for portal specific elements
        await expect(page.locator('h1')).toContainText('Bienvenido');
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
        // Register a new user first
        await page.goto('/register');
        const uniqueEmail = `logout_test_${Date.now()}@test.com`;
        await page.fill('input[name="name"]', 'Logout Test Patient');
        await page.fill('input[name="rut"]', `10.000.111-${Math.floor(Math.random() * 9)}`);
        await page.selectOption('select[id="region"]', { label: 'Metropolitana de Santiago' });
        await page.locator('select[name="commune"]').selectOption({ value: 'SANTIAGO' });
        await page.fill('input[name="email"]', uniqueEmail);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button:has-text("Registrarse")');
        await expect(page.getByText('Cuenta creada exitosamente')).toBeVisible();

        await page.goto('/login');
        await page.fill('input[type="email"]', uniqueEmail);
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/portal/);

        // Click logout (targeting the button with LogOut icon)
        await page.getByRole('button', { name: /cerrar sesión/i }).click();

        // Expect redirect to login
        await expect(page).toHaveURL(/\/login/);

        // Wait for session to be fully invalidated
        await page.waitForTimeout(1000);
    });
});
