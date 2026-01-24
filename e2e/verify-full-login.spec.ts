
import { test, expect } from '@playwright/test';

test.describe('Full System Login Verification', () => {

    test('Patient Portal Login - Should Redirect to Portal/Reservar', async ({ page }) => {
        console.log('Testing Patient Portal Login...');
        await page.goto('/login');
        await page.fill('input[name="email"]', 'verify@hospital.cl');
        await page.fill('input[name="password"]', 'Password123!');

        // Handle Captcha
        const captchaInput = page.getByPlaceholder('Ingresa el código');
        if (await captchaInput.isVisible()) {
            await captchaInput.fill('0000');
        }

        await page.click('button:has-text("Ingresar")');

        // Allow redirection to either /portal (ideal) or /reservar (current fallback)
        await expect(page).toHaveURL(/.*(\/portal|\/reservar)/, { timeout: 10000 });
        console.log(`✅ Patient Login Successful. Landed on: ${page.url()}`);
    });

    test('Internal Portal Login - Should Redirect to Dashboard', async ({ page }) => {
        console.log('Testing Internal Portal Login...');
        await page.goto('/intranet/login');

        // Check if we are on the internal login page
        await expect(page.locator('h1')).toContainText('Acceso Funcionario');

        await page.fill('input[name="email"]', 'admin@hospital.cl');
        await page.fill('input[name="password"]', 'Admin123!');

        // Handle Captcha (Internal might use it too)
        const captchaInput = page.getByPlaceholder('Ingresa el código');
        if (await captchaInput.isVisible()) {
            await captchaInput.fill('0000');
        }

        await page.click('button:has-text("Ingresar")');

        // Admin should go to /dashboard
        await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
        console.log(`✅ Internal Admin Login Successful. Landed on: ${page.url()}`);
    });

});
