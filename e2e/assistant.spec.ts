import { test, expect } from '@playwright/test';

test('Assistente Clínico loads correctly', async ({ page }) => {
    // 1. Login
    await page.goto('/intranet/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button:has-text("Iniciar Sesión Segura")');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. Navigate to Assistant
    await page.click('a[href="/asistente"]'); // Use specific selector for the link
    await expect(page).toHaveURL(/.*\/asistente/);

    // 3. Verify Page Content
    await expect(page.getByRole('heading', { name: /Asistente Clínico/i })).toBeVisible();
    await expect(page.locator('input[placeholder*="Pregunta"]')).toBeVisible();
});
