import { test, expect } from '@playwright/test';

test.describe('Admin User Management', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/intranet/login');
        await page.fill('input[name="email"]', 'admin@example.com');
        await page.fill('input[name="password"]', 'admin123');
        await page.click('button:has-text("Iniciar Sesión Segura")');

        // Handle potential mandatory password change redirect
        const currentURL = page.url();
        if (currentURL.includes('/change-password')) {
            // If redirected to change password, fill it out
            await page.fill('input[name="newPassword"]', 'AdminNewPass123!');
            await page.fill('input[name="confirmPassword"]', 'AdminNewPass123!');
            await page.click('button[type="submit"]');
        }

        await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 60000 });
    });

    test('should allow admin to create and delete a system user', async ({ page }) => {
        // Navigate to "Usuarios y Roles"
        // This is a tab in DashboardContent.tsx, not a separate page?
        // Let's check DashboardContent.tsx tabs.
        // It has a tab 'Usuarios y Roles'.
        await page.click('button:has-text("Usuarios y Roles")');

        // Create User
        await page.click('button:has-text("Nuevo Usuario")');

        const uniqueEmail = `kine_${Date.now()}@test.com`;

        await page.fill('input[id="userName"]', 'Test Kine');
        await page.fill('input[id="userEmail"]', uniqueEmail);
        await page.selectOption('select[id="userRole"]', 'KINESIOLOGIST');

        await page.click('button:has-text("Guardar Cambios")');

        // Verify in list
        await expect(page.getByText(uniqueEmail)).toBeVisible();
        await expect(page.getByText('KINESIÓLOGO')).toBeVisible();

        // Delete User
        // Find row
        const row = page.getByRole('row').filter({ hasText: uniqueEmail });

        // Handle confirm dialog
        page.on('dialog', async dialog => {
            await dialog.accept();
        });

        await row.getByText('Eliminar').click();

        // Verify removed
        await expect(page.getByText(uniqueEmail)).not.toBeVisible();
    });

    test('should verify sidebar admin link is present', async ({ page }) => {
        // Since we are admin
        await expect(page.locator('aside').getByText('Administración')).toBeVisible();
    });
});
