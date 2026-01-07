
import { test, expect } from '@playwright/test';

test.describe('Patient Portal Features', () => {
    // Login as patient before each test
    // We register a new user per test to ensure isolation, preventing conflicts with existing data.


    test('should register, login, navigate to profile, and update all fields', async ({ page }) => {
        // 1. Register a new user to ensure a clean state
        const uniqueRut = `${Math.floor(Math.random() * 10000000) + 10000000}-${Math.floor(Math.random() * 9)}`;
        const uniqueEmail = `profile-test-${Date.now()}@example.com`;

        await page.goto('/register');
        await page.fill('input[name="name"]', 'Profile Test User');
        const [rutBody, rutDv] = uniqueRut.split('-');
        await page.fill('input[name="rutBody"]', rutBody);
        await page.fill('input[name="rutDv"]', rutDv);

        // Initial Region/Commune
        await page.selectOption('select[id="region"]', { label: 'Metropolitana de Santiago' });
        await page.selectOption('select[name="commune"]', { label: 'Santiago' });

        await page.fill('input[name="email"]', uniqueEmail);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button:has-text("Registrarse")');

        // 2. Login
        await page.goto('/login');
        await page.fill('input[name="email"]', uniqueEmail);
        await page.fill('input[name="password"]', 'password123');
        await page.click('button:has-text("Ingresar")');

        await expect(page).toHaveURL(/.*\/portal/);

        // 3. Navigate to Profile
        await page.getByRole('link', { name: 'Mis Datos' }).click();
        await expect(page).toHaveURL(/\/portal\/perfil/);

        // 4. Update Fields
        const newPhone = '+56 9 8765 4321';
        await page.fill('input[name="phone"]', newPhone);

        // Change Region & Commune
        await page.selectOption('select#region', 'Valparaíso');
        await page.selectOption('select[name="commune"]', 'VIÑA DEL MAR');

        // Update Gender & Health System
        await page.selectOption('select[name="gender"]', 'Masculino');
        await page.selectOption('select[name="healthSystem"]', 'ISAPRE');

        // Save
        await page.getByRole('button', { name: 'Guardar Cambios' }).click();

        // 5. Verify Success
        await expect(page.getByText('Perfil actualizado correctamente')).toBeVisible();

        // 6. Reload and Verify Persistence
        await page.reload();
        await expect(page.locator('input[name="phone"]')).toHaveValue(newPhone);
        await expect(page.locator('select#region')).toHaveValue('Valparaíso');
        await expect(page.locator('select[name="commune"]')).toHaveValue('VIÑA DEL MAR');
        await expect(page.locator('select[name="gender"]')).toHaveValue('Masculino');
        await expect(page.locator('select[name="healthSystem"]')).toHaveValue('ISAPRE');
    });
});
