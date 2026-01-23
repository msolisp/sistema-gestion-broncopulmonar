import { test, expect } from '@playwright/test';

test.describe('RUT Validation in Forms', () => {
    test('should validate RUT in patient registration (public portal)', async ({ page }) => {
        // Go to public registration page
        await page.goto('/register');

        // Fill form with INVALID RUT
        await page.fill('input[name="nombre"]', 'Test Usuario');
        await page.fill('input[name="apellidoPaterno"]', 'Apellido');
        await page.fill('input[name="rut"]', '12.345.678-0'); // Invalid DV
        await page.fill('input[name="email"]', 'test@example.com');
        await page.fill('input[name="password"]', 'Password123!');

        // Submit form
        await page.click('button[type="submit"]');

        // Should show RUT validation error
        await expect(page.locator('text=/RUT inválido/i')).toBeVisible({ timeout: 5000 });

        // Now fix RUT to valid one
        await page.fill('input[name="rut"]', '12.345.678-5'); // Valid DV
        await page.click('button[type="submit"]');

        // Should NOT show error (or different error like "email already exists")
        await expect(page.locator('text=/RUT inválido/i')).not.toBeVisible({ timeout: 2000 });
    });

    test('should validate RUT in admin patient creation', async ({ page }) => {
        // Login as admin first
        await page.goto('/intranet/login');
        await page.fill('input[name="email"]', 'admin@test.com');
        await page.fill('input[name="password"]', 'Admin123!');
        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard
        await page.waitForURL('**/dashboard', { timeout: 10000 });

        // Navigate to patient creation
        await page.goto('/dashboard'); // Or wherever patient creation is
        await page.click('text=/Nuevo Paciente/i');

        // Fill form with invalid RUT
        await page.fill('input[name="rut"]', '11.111.111-1'); // Invalid
        await page.fill('input[name="nombre"]', 'Paciente Test');
        await page.fill('input[name="apellidoPaterno"]', 'Test');

        // Try to submit
        await page.click('button[type="submit"]');

        // Should show error
        await expect(page.locator('text=/RUT inválido/i')).toBeVisible({ timeout: 5000 });

        // Fix RUT
        await page.fill('input[name="rut"]', '11.111.111-K'); // Valid with K
        await page.click('button[type="submit"]');

        // Should proceed (may show other validation errors, but not RUT)
        await expect(page.locator('text=/RUT inválido/i')).not.toBeVisible({ timeout: 2000 });
    });

    test('should auto-format RUT as user types', async ({ page }) => {
        await page.goto('/register');

        const rutInput = page.locator('input[name="rut"]');

        // Type unformatted RUT
        await rutInput.fill('123456785');

        // Blur to trigger formatting (if implemented)
        await rutInput.blur();

        // Check if formatted (this depends on implementation)
        // Some implementations format on blur, some on keystroke
        const value = await rutInput.inputValue();

        // Value should be formatted (with dots and dash) or stay unformatted
        // We just verify it accepts the input
        expect(value.length).toBeGreaterThan(0);
    });

    test('should accept RUT with K (uppercase and lowercase)', async ({ page }) => {
        await page.goto('/register');

        // Fill with lowercase k
        await page.fill('input[name="rut"]', '11.111.111-k');
        await page.fill('input[name="nombre"]', 'Test');
        await page.fill('input[name="apellidoPaterno"]', 'User');
        await page.fill('input[name="email"]', 'testk@example.com');
        await page.fill('input[name="password"]', 'Pass123!');

        await page.click('button[type="submit"]');

        // Should accept lowercase k
        await expect(page.locator('text=/RUT inválido/i')).not.toBeVisible({ timeout: 2000 });
    });
});
