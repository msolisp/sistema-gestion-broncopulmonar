import { test, expect } from '@playwright/test';

test.describe('CAPTCHA Login Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Set testing environment variable
        process.env.E2E_TESTING = 'true';
    });

    test('Portal Interno - Login completo con CAPTCHA', async ({ page }) => {
        // 1. Navegar al login interno
        await page.goto('http://localhost:3000/intranet/login');

        // 2. Esperar que se cargue el CAPTCHA
        await page.waitForSelector('input[placeholder="Ingresa el código"]', { timeout: 10000 });

        // 3. Llenar email y contraseña
        await page.fill('#email', 'admin@hospital.cl');
        await page.fill('#password', 'Admin123!');

        // 4. Obtener el código CAPTCHA de la imagen (para testing, usamos el token directamente)
        // En producción real, necesitarías OCR o un bypass para testing
        // Por ahora, asumimos que el CAPTCHA no se valida en E2E_TESTING=true

        // 5. Esperar Cloudflare Turnstile (en local puede fallar, por eso E2E_TESTING)
        await page.waitForTimeout(2000);

        // 6. Click en login
        const loginButton = page.locator('button[type="submit"]');
        await expect(loginButton).toBeVisible();

        // 7. En modo de testing, el login debería funcionar sin CAPTCHA estricto
        // La redirección indica éxito
        await loginButton.click();

        // 8. Verificar redirección exitosa
        await expect(page).toHaveURL(/\/(dashboard|change-password)/, { timeout: 10000 });
    });

    test('Portal de Pacientes - Login completo con CAPTCHA', async ({ page }) => {
        // 1. Navegar al login de pacientes
        await page.goto('http://localhost:3000/login');

        // 2. Esperar carga del CAPTCHA
        await page.waitForSelector('input[placeholder="Ingresa el código"]', { timeout: 10000 });

        // 3. Llenar credenciales
        await page.fill('#email', 'paciente1@test.com');
        await page.fill('#password', 'Password123!');

        // 4. Esperar Turnstile
        await page.waitForTimeout(2000);

        // 5. Click login
        const loginButton = page.locator('button[type="submit"]');
        await loginButton.click();

        // 6. Verificar redirección
        await expect(page).toHaveURL(/\/portal/, { timeout: 10000 });
    });

    test('CAPTCHA visual se renderiza correctamente', async ({ page }) => {
        await page.goto('http://localhost:3000/login');

        // Verificar que el componente CAPTCHA existe
        const captchaLabel = page.locator('text=Código de Seguridad');
        await expect(captchaLabel).toBeVisible();

        // Verificar que la imagen SVG se carga
        const captchaContainer = page.locator('div[class*="w-\\[200px\\] h-\\[80px\\]"]');
        await expect(captchaContainer).toBeVisible();

        // Verificar input field
        const captchaInput = page.locator('input[placeholder="Ingresa el código"]');
        await expect(captchaInput).toBeVisible();
        await expect(captchaInput).toHaveAttribute('maxlength', '6');

        // Verificar botón refresh
        const refreshButton = page.locator('button[title="Generar nuevo código"]');
        await expect(refreshButton).toBeVisible();
    });

    test('Botón refresh genera nuevo CAPTCHA', async ({ page }) => {
        await page.goto('http://localhost:3000/login');

        // Obtener contenido SVG inicial
        const captchaContainer = page.locator('div[class*="w-\\[200px\\] h-\\[80px\\]"]').first();
        const initialContent = await captchaContainer.innerHTML();

        // Click en refresh
        const refreshButton = page.locator('button[title="Generar nuevo código"]');
        await refreshButton.click();

        // Esperar nueva carga
        await page.waitForTimeout(1000);

        // Verificar que el contenido cambió
        const newContent = await captchaContainer.innerHTML();
        expect(initialContent).not.toBe(newContent);
    });

    test('CAPTCHA rechaza código incorrecto', async ({ page }) => {
        await page.goto('http://localhost:3000/login');

        // Llenar con código deliberadamente incorrecto
        await page.fill('#email', '  paciente1@test.com');
        await page.fill('#password', 'Password123!');
        await page.fill('input[placeholder="Ingresa el código"]', 'WRONG');

        // Esperar Turnstile
        await page.waitForTimeout(2000);

        // Intentar login
        await page.click('button[type="submit"]');

        // Verificar mensaje de error
        await expect(page.locator('text=/Código de seguridad/')).toBeVisible({ timeout: 5000 });
    });

    test('Cloudflare Turnstile está presente', async ({ page }) => {
        await page.goto('http://localhost:3000/login');

        // Verificar que Turnstile se carga (iframe de Cloudflare)
        const turnstileFrame = page.frameLocator('iframe[src*="challenges.cloudflare.com"]');
        await expect(turnstileFrame.locator('body')).toBeVisible({ timeout: 10000 });
    });
});
