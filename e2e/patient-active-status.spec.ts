
import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './utils'; // Assuming utils exists, or I will write raw steps

test.describe('Patient Management Workflow', () => {
    test('should allow admin to toggle patient active status', async ({ page }) => {
        // 1. Login as Admin
        await page.goto('/login');
        await page.fill('input[name="email"]', 'admin@example.com');
        await page.fill('input[name="password"]', 'admin123'); // Assuming these creds or similar
        await page.click('button[type="submit"]');

        // Wait for redirect
        await page.waitForURL('/dashboard');

        // 2. Navigate to Patients
        await page.click('a[href="/patients"]');
        await page.waitForURL('/patients');

        // 3. Find a patient and click Edit
        // We assume seed data exists. Let's pick the first one.
        await page.waitForSelector('table');
        const firstEditBtn = page.locator('button[title="Editar"]').first();
        await firstEditBtn.click();

        // 4. Verify Modal Open
        await expect(page.locator('text=Editar Paciente')).toBeVisible();

        // 5. Toggle Active Status
        const checkbox = page.locator('input[name="active"]');
        const isCheckedInitial = await checkbox.isChecked();

        await checkbox.click(); // Toggle

        // 6. Save
        await page.click('button:has-text("Guardar Cambios")');

        // 7. Verify Modal Closed and Success Message (if any) or check table
        await expect(page.locator('text=Editar Paciente')).not.toBeVisible();

        // 8. Re-open to verify persistence
        await firstEditBtn.click();
        await expect(page.locator('text=Editar Paciente')).toBeVisible();
        const isCheckedAfter = await page.locator('input[name="active"]').isChecked();

        expect(isCheckedAfter).toBe(!isCheckedInitial);
    });
});
