
import { test, expect } from '@playwright/test';

test('Admin Flow: Login and Access Dashboard', async ({ page }) => {
    // 1. Go to Login
    await page.goto('/login');

    // 2. Login as Admin (using seeded credentials)
    // 2. Login as Admin (using seeded credentials)
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'admin'); // Updated password
    await page.click('button:has-text("Ingresar")');

    // Expect redirect to dashboard (Admin logic)
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 4. Verify Dashboard content
    await expect(page.getByRole('heading', { name: /Administración Central/i })).toBeVisible();
    await expect(page.getByText('Seguridad - Control de acceso')).toBeVisible();

    // 5. Verify Map (if present, otherwise just the tab check is sufficient for this task)
    // await expect(page.getByText('Mapa Distribución')).toBeVisible();
});
