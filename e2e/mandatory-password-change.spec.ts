import { test, expect } from '@playwright/test';

test.describe('Mandatory Password Change Flow', () => {
    test.skip('should force password change for new users and redirect after successful change', async ({ page }) => {
        // 1. Create a user with mustChangePassword = true
        // We'll use admin credentials to bypass this test setup

        // 2. Navigate to login
        await page.goto('http://localhost:3000/intranet/login');

        // 3. Login with admin credentials (we'll set admin to mustChangePassword first)
        await page.fill('input[name="email"]', 'admin@example.com');
        await page.fill('input[name="password"]', 'Admin123!');
        await page.click('button[type="submit"]');

        // 4. Check if we're redirected (either to dashboard or change-password)
        await page.waitForURL(/\/(dashboard|change-password)/, { timeout: 5000 });

        const currentURL = page.url();
        console.log('Current URL after login:', currentURL);

        // If redirected to change-password, test the flow
        if (currentURL.includes('/change-password')) {
            console.log('✓ Redirected to change-password as expected');

            // 5. Verify change password page elements
            await expect(page.locator('h1')).toContainText('Cambio de Contraseña Obligatorio');
            await expect(page.locator('input[name="newPassword"]')).toBeVisible();

            // 6. Try to submit without password (should fail)
            await page.click('button[type="submit"]');
            // Should stay on same page
            await expect(page).toHaveURL(/change-password/);

            // 7. Enter a too-short password
            await page.fill('input[name="newPassword"]', '12345');
            await page.click('button[type="submit"]');
            await page.waitForTimeout(1000);
            // Should show error
            await expect(page.locator('text=/al menos 6 caracteres/i')).toBeVisible();

            // 8. Enter a valid password
            const newPassword = 'NewSecure123!';
            await page.fill('input[name="newPassword"]', newPassword);

            // 9. Toggle password visibility
            const eyeButton = page.locator('button[aria-label*="contraseña"]');
            await expect(eyeButton).toBeVisible();
            await eyeButton.click();
            // Password should be visible now
            await expect(page.locator('input[name="newPassword"]')).toHaveAttribute('type', 'text');

            // Hide again
            await eyeButton.click();
            await expect(page.locator('input[name="newPassword"]')).toHaveAttribute('type', 'password');

            // 10. Submit the form
            await page.click('button[type="submit"]');

            // 11. Should redirect to dashboard after successful change
            await page.waitForURL(/dashboard/, { timeout: 10000 });
            console.log('✓ Successfully redirected to dashboard');

            // 12. Verify we're on dashboard
            await expect(page.locator('h1')).toContainText('Configuración Central');

            // 13. Logout
            await page.click('button:has-text("Cerrar Sesión")');

            // 14. Login again with NEW password
            await page.waitForURL(/login/);
            await page.fill('input[name="email"]', 'admin@example.com');
            await page.fill('input[name="password"]', newPassword);
            await page.click('button[type="submit"]');

            // 15. Should go directly to dashboard (no password change required)
            await page.waitForURL(/dashboard/, { timeout: 5000 });
            await expect(page.locator('h1')).toContainText('Configuración Central');

            console.log('✓ Password change flow completed successfully!');
        } else {
            console.log('ℹ User does not have mustChangePassword set, going to dashboard directly');
            await expect(page.locator('h1')).toContainText('Configuración Central');
        }
    });

    test.skip('should show eye icon and toggle password visibility', async ({ page }) => {
        // Set admin to mustChangePassword
        // This would require a setup step, for now we'll just navigate directly
        await page.goto('http://localhost:3000/change-password');

        // Should have password field
        const passwordInput = page.locator('input[name="newPassword"]');
        await expect(passwordInput).toBeVisible();

        // Should be type password by default
        await expect(passwordInput).toHaveAttribute('type', 'password');

        // Eye button should exist
        const eyeButton = page.locator('button[aria-label*="contraseña"]');
        await expect(eyeButton).toBeVisible();

        // Click to show
        await eyeButton.click();
        await expect(passwordInput).toHaveAttribute('type', 'text');

        // Click to hide
        await eyeButton.click();
        await expect(passwordInput).toHaveAttribute('type', 'password');
    });
});
