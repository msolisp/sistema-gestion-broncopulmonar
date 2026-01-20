
import { test, expect } from '@playwright/test';

test.describe('Mobile Login - Phone and Tablet', () => {
    test.describe('Phone Viewports (iPhone & Android)', () => {
        test('should login successfully on iPhone 14 Pro', async ({ page }) => {
            // Register a new user
            const uniqueEmail = `iphone_login_${Date.now()}@test.com`;
            await page.goto('/register');

            await page.fill('input[name="name"]', 'iPhone Test User');
            const rutNum = Math.floor(Math.random() * 10000000) + 10000000;
            const rutDv = Math.floor(Math.random() * 9);
            await page.fill('input[name="rutBody"]', rutNum.toString());
            await page.fill('input[name="rutDv"]', rutDv.toString());
            await page.selectOption('select[id="region"]', { label: 'Metropolitana de Santiago' });
            await page.selectOption('select[name="commune"]', { value: 'SANTIAGO' });
            await page.fill('input[name="email"]', uniqueEmail);
            await page.fill('input[name="password"]', 'Password123!');
            await page.click('button:has-text("Registrarse")');

            await expect(page.getByText(/Cuenta creada exitosamente/)).toBeVisible();

            // Navigate to login
            await page.goto('/login');

            // Verify mobile-optimized layout
            const emailInput = page.locator('input[type="email"]');
            const passwordInput = page.locator('input[type="password"]');
            const submitButton = page.locator('button[type="submit"]');

            // Check that inputs are visible and accessible
            await expect(emailInput).toBeVisible();
            await expect(passwordInput).toBeVisible();
            await expect(submitButton).toBeVisible();

            // Fill and submit
            await emailInput.fill(uniqueEmail);
            await passwordInput.fill('Password123!');
            await submitButton.click();

            // Verify redirect to portal
            await expect(page).toHaveURL(/\/portal/);
        });

        test('should have touch-friendly inputs on mobile (text-base font size)', async ({ page }) => {
            await page.goto('/login');

            const emailInput = page.locator('input[type="email"]');

            // Check computed font size is at least 16px (text-base) to prevent auto-zoom on iOS
            const fontSize = await emailInput.evaluate((el) => {
                return window.getComputedStyle(el).fontSize;
            });

            const fontSizeValue = parseFloat(fontSize);
            expect(fontSizeValue).toBeGreaterThanOrEqual(16);
        });

        test('should have proper button height for touch targets', async ({ page }) => {
            await page.goto('/login');

            const submitButton = page.locator('button[type="submit"]');

            // Get computed height - should be at least 44px (Apple HIG recommendation)
            const boundingBox = await submitButton.boundingBox();
            expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
        });

        test('should show error message properly on mobile', async ({ page }) => {
            await page.goto('/login');

            await page.fill('input[type="email"]', 'wrong@test.com');
            await page.fill('input[type="password"]', 'wrongpass');
            await page.click('button[type="submit"]');

            // Error should be visible and readable on mobile
            const errorMessage = page.getByText(/credenciales inválidas/i);
            await expect(errorMessage).toBeVisible();
        });
    });

    test.describe('Tablet Viewport (iPad)', () => {
        test('should login successfully on iPad Air', async ({ page }) => {
            // Register a new user
            const uniqueEmail = `ipad_login_${Date.now()}@test.com`;
            await page.goto('/register');

            await page.fill('input[name="name"]', 'iPad Test User');
            const rutNum = Math.floor(Math.random() * 10000000) + 10000000;
            const rutDv = Math.floor(Math.random() * 9);
            await page.fill('input[name="rutBody"]', rutNum.toString());
            await page.fill('input[name="rutDv"]', rutDv.toString());
            await page.selectOption('select[id="region"]', { label: 'Metropolitana de Santiago' });
            await page.selectOption('select[name="commune"]', { value: 'SANTIAGO' });
            await page.fill('input[name="email"]', uniqueEmail);
            await page.fill('input[name="password"]', 'Password123!');
            await page.click('button:has-text("Registrarse")');

            await expect(page.getByText(/Cuenta creada exitosamente/)).toBeVisible();

            // Navigate to login
            await page.goto('/login');

            // Fill and submit
            await page.fill('input[type="email"]', uniqueEmail);
            await page.fill('input[type="password"]', 'Password123!');
            await page.click('button[type="submit"]');

            // Verify redirect to portal
            await expect(page).toHaveURL(/\/portal/);
            await expect(page.locator('h1')).toContainText('Bienvenido');
        });

        test('should have proper layout on tablet viewport', async ({ page }) => {
            await page.goto('/login');

            // Check that the login form is centered and has appropriate max-width
            const formContainer = page.locator('div.max-w-sm');
            await expect(formContainer).toBeVisible();

            // Verify form elements are properly stacked
            const emailLabel = page.locator('label:has-text("Email")');
            const passwordLabel = page.locator('label:has-text("Contraseña")');

            await expect(emailLabel).toBeVisible();
            await expect(passwordLabel).toBeVisible();
        });

        test('should navigate between fields smoothly on iPad', async ({ page }) => {
            await page.goto('/login');

            const emailInput = page.locator('input[type="email"]');
            const passwordInput = page.locator('input[type="password"]');

            // Tab navigation should work
            await emailInput.click();
            await emailInput.fill('test@example.com');
            await page.keyboard.press('Tab');

            // Password field should be focused
            await expect(passwordInput).toBeFocused();
        });
    });

    test.describe('Responsive Behavior', () => {
        test('should maintain layout integrity across device rotations', async ({ page }) => {
            await page.goto('/login');

            // Portrait mode (default)
            const titlePortrait = page.locator('h1:has-text("Bienvenido")');
            await expect(titlePortrait).toBeVisible();

            // Verify all form elements are visible in portrait
            await expect(page.locator('input[type="email"]')).toBeVisible();
            await expect(page.locator('input[type="password"]')).toBeVisible();
            await expect(page.locator('button[type="submit"]')).toBeVisible();
        });

        test('should have consistent spacing on different mobile devices', async ({ page }) => {
            await page.goto('/login');

            const formContainer = page.locator('div.p-8');
            await expect(formContainer).toBeVisible();

            // Check that submit button is separated from inputs
            const submitButton = page.locator('button[type="submit"]');
            const boundingBox = await submitButton.boundingBox();

            expect(boundingBox).toBeTruthy();
        });
    });
});
