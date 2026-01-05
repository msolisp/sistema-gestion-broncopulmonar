
import { test, expect } from '@playwright/test';

test.describe('Patient Portal - Broken User', () => {
    test('should show error for user without profile in history', async ({ page }) => {
        // Login as broken user
        await page.goto('/login');
        await page.fill('input[type="email"]', 'broken@test.com');
        await page.fill('input[type="password"]', 'BrokenUser');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/portal/);

        // Go to History
        await page.goto('/portal/historial');

        // Assert Error Message
        await expect(page.getByText('Paciente no encontrado')).toBeVisible();
    });
});
