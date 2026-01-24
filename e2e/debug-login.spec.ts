
import { test, expect } from '@playwright/test';

test('Debug Login Seeded User', async ({ page }) => {
    console.log('Navigating to login...');
    await page.goto('/login');

    console.log('Filling credentials...');
    await page.fill('input[name="email"]', 'paciente1@Hospital.cl');
    await page.fill('input[name="password"]', 'Password123!');

    // Fill Captcha
    const captchaInput = page.getByPlaceholder('Ingresa el código');
    if (await captchaInput.isVisible()) {
        await captchaInput.fill('0000');
    }

    console.log('Clicking submit...');
    await page.click('button:has-text("Ingresar")');

    console.log('Waiting for navigation...');
    try {
        await expect(page).toHaveURL(/.*\/portal/, { timeout: 10000 });
        console.log('Login Successful!');
    } catch (e) {
        console.log('Login Failed. Checking page content...');
        const errorText = await page.locator('.text-red-500, .error, .alert').allInnerTexts();
        console.log('Error Messages found:', errorText);
        await page.screenshot({ path: 'debug-login-failure.png' });
        throw e;
    }
});
