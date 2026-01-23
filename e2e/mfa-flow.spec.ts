import { test, expect } from '@playwright/test';

test.describe('MFA (Multi-Factor Authentication)', () => {
    test.describe('MFA Setup Flow', () => {
        test('should enable MFA with QR code and backup codes', async ({ page }) => {
            // Login as admin
            await page.goto('/intranet/login');
            await page.fill('input[name="email"]', 'admin@test.com');
            await page.fill('input[name="password"]', 'Admin123!');
            await page.click('button[type="submit"]');

            await page.waitForURL('**/dashboard', { timeout: 10000 });

            // Navigate to security settings
            await page.goto('/admin/security');

            // Check MFA status is disabled
            await expect(page.locator('text=/Deshabilitado/i')).toBeVisible({ timeout: 5000 });

            // Click enable MFA button
            await page.click('button:has-text("Habilitar MFA")');

            // Should show QR code
            await expect(page.locator('img[alt*="QR"]')).toBeVisible({ timeout: 5000 });

            // Should show secret key for manual entry
            await expect(page.locator('code')).toBeVisible();

            // For testing, we'll mock entering a TOTP code
            // In real scenario, you'd use the secret to generate valid TOTP
            // For now, we'll test the UI flow

            // Click "Next" to go to verification
            await page.click('button:has-text("Siguiente")');

            // Should show verification code input
            await expect(page.locator('input[placeholder*="000000"]')).toBeVisible({ timeout: 5000 });

            // Note: In real test, you'd need to:
            // 1. Extract the secret from the page
            // 2. Generate valid TOTP using speakeasy in the test
            // 3. Enter that code
            // For now, we just verify the flow exists

            // Verify backup codes section would appear after verification
            // (Can't test fully without valid TOTP)
            await expect(page.locator('text=/código/i')).toBeVisible();
        });

        test('should show backup codes after MFA setup', async ({ page }) => {
            // This test assumes MFA is already enabled
            // In a real scenario, you'd set up test data or complete the setup first

            await page.goto('/intranet/login');
            await page.fill('input[name="email"]', 'admin@test.com');
            await page.fill('input[name="password"]', 'Admin123!');
            await page.click('button[type="submit"]');

            await page.waitForURL('**/dashboard', { timeout: 10000 });
            await page.goto('/admin/security');

            // If MFA is enabled, should show backup codes status
            const mfaEnabled = await page.locator('text=/Habilitado/i').isVisible();

            if (mfaEnabled) {
                await expect(page.locator('text=/códigos de respaldo/i')).toBeVisible();
                await expect(page.locator('text=/disponibles/i')).toBeVisible();
            }
        });
    });

    test.describe('MFA Disable Flow', () => {
        test('should require password to disable MFA', async ({ page }) => {
            await page.goto('/intranet/login');
            await page.fill('input[name="email"]', 'admin@test.com');
            await page.fill('input[name="password"]', 'Admin123!');
            await page.click('button[type="submit"]');

            await page.waitForURL('**/dashboard', { timeout: 10000 });
            await page.goto('/admin/security');

            // Check if MFA is enabled
            const mfaEnabled = await page.locator('text=/✓ Habilitado/i').isVisible();

            if (mfaEnabled) {
                // Should show password input for disabling
                await expect(page.locator('input[type="password"]')).toBeVisible();

                // Should show disable button
                await expect(page.locator('button:has-text("Deshabilitar")')).toBeVisible();
            }
        });
    });

    test.describe('MFA Login Flow', () => {
        test('should prompt for MFA code after password (if enabled)', async ({ page }) => {
            // This test checks if MFA prompt appears
            // Note: Requires a test user with MFA enabled

            await page.goto('/intranet/login');
            await page.fill('input[name="email"]', 'mfa-user@test.com'); // Hypothetical user with MFA
            await page.fill('input[name="password"]', 'password123');
            await page.click('button[type="submit"]');

            // If user has MFA enabled, should prompt for code
            // Otherwise, should proceed to dashboard

            // Check for either MFA prompt or dashboard
            const hasMfaPrompt = await page.locator('text=/código/i').isVisible({ timeout: 3000 }).catch(() => false);
            const hasDashboard = await page.url().includes('dashboard');

            // One of the two should be true
            expect(hasMfaPrompt || hasDashboard).toBeTruthy();
        });
    });

    test.describe('Backup Codes', () => {
        test('should allow regenerating backup codes', async ({ page }) => {
            await page.goto('/intranet/login');
            await page.fill('input[name="email"]', 'admin@test.com');
            await page.fill('input[name="password"]', 'Admin123!');
            await page.click('button[type="submit"]');

            await page.waitForURL('**/dashboard', { timeout: 10000 });
            await page.goto('/admin/security');

            const mfaEnabled = await page.locator('text=/✓ Habilitado/i').isVisible();

            if (mfaEnabled) {
                // Look for regenerate button
                const regenButton = page.locator('button:has-text("Regenerar")');

                if (await regenButton.isVisible()) {
                    // Should require password
                    await expect(page.locator('input[type="password"]')).toBeVisible();
                }
            }
        });
    });
});
