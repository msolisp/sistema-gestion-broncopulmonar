
import { test, expect } from '@playwright/test';

test('Patient Search and Sorting', async ({ page }) => {
    // Login as Admin
    await page.goto('/intranet/login');
    await page.fill('input[name="email"]', 'admin@hospital.cl');
    await page.fill('input[name="password"]', 'Admin123!');

    // Check for error message
    const errorMsg = page.locator('.text-red-500');
    if (await errorMsg.isVisible()) {
        console.log('Login Error pre-submit:', await errorMsg.textContent());
    }

    const loginBtn = page.locator('button:has-text("Iniciar Sesión Segura")');
    await expect(loginBtn).toBeEnabled();
    await loginBtn.click();

    // Wait for navigation or error
    try {
        await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 5000 });
    } catch (e) {
        console.log('Login failed. Current URL:', page.url());
        if (await errorMsg.isVisible()) {
            console.log('Login Error post-submit:', await errorMsg.textContent());
        }
        throw e;
    }

    // Go to Patients
    await page.goto('/patients');

    // Test Search - Unique Name
    const uniqueName = `SearchTest ${Date.now()}`;
    // Create patient to search for
    await page.click('button:has-text("Nuevo Paciente")');
    await page.fill('input[name="name"]', uniqueName);
    await page.fill('input[name="email"]', `search${Date.now()}@test.com`);
    await page.fill('input[id="rut_num"]', '12345678');
    await page.fill('input[id="rut_dv"]', '9');
    await page.evaluate(() => {
        (document.getElementById('rut_hidden') as HTMLInputElement).value = '12345678-9';
    });
    await page.fill('input[name="password"]', 'Pass123!');
    await page.fill('input[name="address"]', 'Address');
    await page.selectOption('select[name="region"]', 'Metropolitana');
    await page.selectOption('select[name="commune"]', 'PROVIDENCIA');
    await page.selectOption('select[name="gender"]', 'Masculino');
    await page.fill('input[name="birthDate"]', '2000-01-01');
    await page.click('button:has-text("Crear Paciente")');

    await expect(page.locator('text=Nuevo Paciente')).not.toBeVisible();

    // Perform Search
    await page.fill('input[placeholder*="Buscar"]', uniqueName);

    // Verify only that patient is visible
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody tr').first()).toContainText(uniqueName);

    // Test Sorting - Newest First
    // Since we just created one, it should be at the top if we clear search
    await page.fill('input[placeholder*="Buscar"]', '');
    // Wait for reload/filter clear
    await expect(page.locator('tbody tr').filter({ hasText: uniqueName })).toBeVisible();

    // Verify it is the first row
    const firstRowText = await page.locator('tbody tr').first().innerText();
    expect(firstRowText).toContain(uniqueName);
});
