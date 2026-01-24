
import { test, expect } from '@playwright/test';

test('Verify FHIR Login Migration', async ({ page }) => {
    // 1. Go to Login
    await page.goto('/login');

    // 2. Login with seeded FHIR user
    await page.fill('input[name="email"]', 'verify@hospital.cl');
    await page.fill('input[name="password"]', 'Password123!');

    // 3. Handle Captcha (E2E bypass should be active)
    const captchaInput = page.getByPlaceholder('Ingresa el código');
    if (await captchaInput.isVisible()) {
        await captchaInput.fill('0000');
    }

    // 4. Submit
    await page.click('button:has-text("Ingresar")');

    // 5. Verify successful login (redirection away from /login)
    try {
        // Accept either portal or reservar (fallback)
        await expect(page).toHaveURL(/.*(\/portal|\/reservar)/, { timeout: 10000 });
        console.log('✅ Login successful with FHIR credentials!');

        const url = page.url();
        console.log(`Landed on: ${url}`);
    } catch (e) {
        console.log('Login Failed. Dumping page content...');
        const text = await page.locator('body').innerText();
        console.log('--- PAGE TEXT ---');
        console.log(text);
        console.log('-----------------');
        throw e;
    }
});
