import { test, expect } from '@playwright/test';

test('Assistente Clínico loads correctly', async ({ page }) => {
    // 1. Login
    await page.goto('/intranet/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button:has-text("Iniciar Sesión Segura")');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 30000 });

    // 2. Navigate to Assistant
    await page.click('a[href="/asistente"]'); // Use specific selector for the link
    await expect(page).toHaveURL(/.*\/asistente/);

    // 3. Verify Page Content
    await expect(page.getByRole('heading', { name: /Asistente Clínico/i })).toBeVisible();
    await expect(page.locator('input[placeholder*="Pregunta"]')).toBeVisible();
});

test('Assistant renders images from markdown', async ({ page }) => {
    // 1. Mock API Response with Image Markdown
    await page.route('/api/chat', async route => {
        const customResponse = 'Aquí tienes el gráfico solicitado: \n\n![Gráfico Fibrosis](https://via.placeholder.com/150) \n\nEspero que sirva.';
        await route.fulfill({
            status: 200,
            contentType: 'text/plain',
            body: customResponse // Simple text response usually works for non-stream UI or mocked stream
        });
    });

    // 2. Login & Navigate
    await page.goto('/intranet/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button:has-text("Iniciar Sesión Segura")');
    await page.click('a[href="/asistente"]');

    // 3. Send Message
    await page.fill('input[placeholder*="Pregunta"]', 'Muéstrame una imagen de prueba');
    await page.keyboard.press('Enter');

    // 4. Verify Image Rendering
    // Wait for the image with specific src to appear
    const image = page.locator('img[src="https://via.placeholder.com/150"]');
    await expect(image).toBeVisible({ timeout: 10000 });
});
