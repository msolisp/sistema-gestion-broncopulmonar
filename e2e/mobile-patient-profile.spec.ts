
import { test, expect } from '@playwright/test';

test.describe.skip('Mobile Patient Profile - Phone and Tablet', () => {
    // Helper function to register and login a user
    async function registerAndLogin(page: any, email: string, name: string) {
        // Register
        await page.goto('/register');
        await page.fill('input[name="name"]', name);

        const rutNum = Math.floor(Math.random() * 10000000) + 10000000;
        const rutDv = Math.floor(Math.random() * 9);
        await page.fill('input[name="rutBody"]', rutNum.toString());
        await page.fill('input[name="rutDv"]', rutDv.toString());

        await page.selectOption('select[id="region"]', { label: 'Metropolitana de Santiago' });
        await page.selectOption('select[name="commune"]', { value: 'SANTIAGO' });
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button:has-text("Registrarse")');
        await expect(page.getByText(/Cuenta creada exitosamente/)).toBeVisible();

        // Login
        await page.goto('/login');
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button:has-text("Ingresar")');
        await expect(page).toHaveURL(/\/portal/);
    }

    test.describe('Phone Viewports - RUT Fields', () => {
        test('should display separated RUT fields on iPhone', async ({ page }) => {
            const email = `iphone_profile_${Date.now()}@test.com`;
            await registerAndLogin(page, email, 'iPhone Profile User');

            // Navigate to profile
            await page.getByRole('link', { name: 'Mis Datos' }).click();
            await expect(page).toHaveURL(/\/portal\/perfil/);

            // Verify RUT fields are separated
            const rutNumInput = page.locator('input#rut_num');
            const rutDvInput = page.locator('input#rut_dv');

            await expect(rutNumInput).toBeVisible();
            await expect(rutDvInput).toBeVisible();

            // Check placeholders
            await expect(rutNumInput).toHaveAttribute('placeholder', '12345678');
            await expect(rutDvInput).toHaveAttribute('placeholder', 'K');
        });

        test('should validate RUT number input on mobile', async ({ page }) => {
            const email = `mobile_rut_${Date.now()}@test.com`;
            await registerAndLogin(page, email, 'Mobile RUT User');

            await page.getByRole('link', { name: 'Mis Datos' }).click();
            await expect(page).toHaveURL(/\/portal\/perfil/);

            const rutNumInput = page.locator('input#rut_num');

            // Try typing non-numeric characters
            await rutNumInput.fill('abc123def456');

            // Should only contain numbers
            const value = await rutNumInput.inputValue();
            expect(value).toMatch(/^\d*$/);
        });

        test('should validate RUT verification digit on mobile', async ({ page }) => {
            const email = `mobile_dv_${Date.now()}@test.com`;
            await registerAndLogin(page, email, 'Mobile DV User');

            await page.getByRole('link', { name: 'Mis Datos' }).click();
            await expect(page).toHaveURL(/\/portal\/perfil/);

            const rutDvInput = page.locator('input#rut_dv');

            // Type K (valid)
            await rutDvInput.fill('K');
            expect(await rutDvInput.inputValue()).toBe('K');

            // Type a number (valid)
            await rutDvInput.fill('5');
            expect(await rutDvInput.inputValue()).toBe('5');

            // Max length should be 1
            await expect(rutDvInput).toHaveAttribute('maxLength', '1');
        });

        test('should update profile with   new RUT on phone', async ({ page }) => {
            const email = `phone_update_rut_${Date.now()}@test.com`;
            await registerAndLogin(page, email, 'Phone Update User');

            await page.getByRole('link', { name: 'Mis Datos' }).click();
            await expect(page).toHaveURL(/\/portal\/perfil/);

            // Fill RUT fields
            await page.fill('input#rut_num', '11111111');
            await page.fill('input#rut_dv', 'K');

            // Save
            await page.getByRole('button', { name: 'Guardar Cambios' }).click();

            // Verify success
            await expect(page.getByText('Perfil actualizado correctamente')).toBeVisible();

            // Reload and verify persistence
            await page.reload();
            expect(await page.locator('input#rut_num').inputValue()).toBe('11111111');
            expect(await page.locator('input#rut_dv').inputValue()).toBe('K');
        });

        test('should have proper touch targets for RUT fields on mobile', async ({ page }) => {
            const email = `touch_rut_${Date.now()}@test.com`;
            await registerAndLogin(page, email, 'Touch RUT User');

            await page.getByRole('link', { name: 'Mis Datos' }).click();
            await expect(page).toHaveURL(/\/portal\/perfil/);

            const rutNumInput = page.locator('input#rut_num');
            const rutDvInput = page.locator('input#rut_dv');

            // Check minimum touch target height (should be at least 40px)
            const numBox = await rutNumInput.boundingBox();
            const dvBox = await rutDvInput.boundingBox();

            expect(numBox?.height).toBeGreaterThanOrEqual(40);
            expect(dvBox?.height).toBeGreaterThanOrEqual(40);
        });
    });

    test.describe('Tablet Viewport - Profile Form', () => {
        test('should display full profile form on iPad', async ({ page }) => {
            const email = `ipad_profile_${Date.now()}@test.com`;
            await registerAndLogin(page, email, 'iPad Profile User');

            await page.getByRole('link', { name: 'Mis Datos' }).click();
            await expect(page).toHaveURL(/\/portal\/perfil/);

            // Verify all form sections are visible
            await expect(page.getByLabel('Nombre Completo')).toBeVisible();
            await expect(page.locator('input#rut_num')).toBeVisible();
            await expect(page.locator('input#rut_dv')).toBeVisible();
            await expect(page.getByLabel('Teléfono')).toBeVisible();
            await expect(page.getByLabel('Región')).toBeVisible();
            await expect(page.getByLabel('Comuna')).toBeVisible();
        });

        test('should update complete profile on iPad', async ({ page }) => {
            const email = `ipad_update_${Date.now()}@test.com`;
            await registerAndLogin(page, email, 'iPad Update User');

            await page.getByRole('link', { name: 'Mis Datos' }).click();
            await expect(page).toHaveURL(/\/portal\/perfil/);

            // Update all fields
            await page.fill('input[name="phone"]', '+56 9 8888 7777');
            await page.fill('input#rut_num', '22222222');
            await page.fill('input#rut_dv', '2');

            await page.selectOption('select#region', 'Valparaíso');
            await page.selectOption('select[name="commune"]', 'VIÑA DEL MAR');
            await page.selectOption('select[name="gender"]', 'Femenino');
            await page.selectOption('select[name="healthSystem"]', 'ISAPRE');

            // Save
            await page.getByRole('button', { name: 'Guardar Cambios' }).click();
            await expect(page.getByText('Perfil actualizado correctamente')).toBeVisible();

            // Verify persistence
            await page.reload();
            expect(await page.locator('input[name="phone"]').inputValue()).toBe('+56 9 8888 7777');
            expect(await page.locator('input#rut_num').inputValue()).toBe('22222222');
            expect(await page.locator('input#rut_dv').inputValue()).toBe('2');
        });

        test('should have good spacing between form fields on tablet', async ({ page }) => {
            const email = `ipad_spacing_${Date.now()}@test.com`;
            await registerAndLogin(page, email, 'iPad Spacing User');

            await page.getByRole('link', { name: 'Mis Datos' }).click();
            await expect(page).toHaveURL(/\/portal\/perfil/);

            // Check that form sections have proper spacing
            const nameInput = page.getByLabel('Nombre Completo');
            const rutNum = page.locator('input#rut_num');

            const nameBox = await nameInput.boundingBox();
            const rutBox = await rutNum.boundingBox();

            // There should be vertical space between fields
            if (nameBox && rutBox) {
                expect(rutBox.y).toBeGreaterThan(nameBox.y + nameBox.height);
            }
        });
    });

    test.describe('Responsive Grid Behavior', () => {
        test('should stack phone and birthdate fields properly on mobile', async ({ page }) => {
            const email = `mobile_grid_${Date.now()}@test.com`;
            await registerAndLogin(page, email, 'Mobile Grid User');

            await page.getByRole('link', { name: 'Mis Datos' }).click();
            await expect(page).toHaveURL(/\/portal\/perfil/);

            const phoneInput = page.getByLabel('Teléfono');
            const birthDateInput = page.getByLabel('Fecha de Nacimiento');

            await expect(phoneInput).toBeVisible();
            await expect(birthDateInput).toBeVisible();
        });

        test('should display region and commune selectors on tablet', async ({ page }) => {
            const email = `tablet_selectors_${Date.now()}@test.com`;
            await registerAndLogin(page, email, 'Tablet Selectors User');

            await page.getByRole('link', { name: 'Mis Datos' }).click();
            await expect(page).toHaveURL(/\/portal\/perfil/);

            const regionSelect = page.locator('select#region');
            const communeSelect = page.locator('select[name="commune"]');

            await expect(regionSelect).toBeVisible();
            await expect(communeSelect).toBeVisible();

            // Test interaction
            await regionSelect.selectOption('Biobío');

            // Wait for communes to populate
            await page.waitForTimeout(500);

            // Commune options should update
            const communeOptions = await communeSelect.locator('option').count();
            expect(communeOptions).toBeGreaterThan(1);
        });
    });
});
