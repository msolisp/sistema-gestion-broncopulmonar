
import { test, expect } from '@playwright/test';

test.describe('Patient Portal Features', () => {
    // Login as patient before each test
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'paciente1@test.com');
        await page.fill('input[type="password"]', 'Paciente');
        await page.getByRole('button', { name: 'Ingresar' }).click();
        await expect(page).toHaveURL(/\/portal/);
    });

    test('should display dashboard with air quality and shadows', async ({ page }) => {
        // Check for Air Quality Widget presence and text
        await expect(page.locator('text=Calidad del Aire')).toBeVisible();
        await expect(page.locator('text=AQI')).toBeVisible();

        // Check for shadow classes on cards (implementation specific but good for regression)
        // We added shadow-md to the cards
        const cards = page.locator('.shadow-md');
        expect(await cards.count()).toBeGreaterThan(0);
    });

    test('should navigate to profile, view light theme inputs, and update info', async ({ page }) => {
        // Navigate to profile
        await page.getByRole('link', { name: 'Mis Datos' }).click();
        await expect(page).toHaveURL(/\/portal\/perfil/);

        await expect(page.locator('h1')).toContainText('Mi Perfil');

        // Check for light theme styles (bg-white) on inputs
        const nameInput = page.locator('input[name="name"]');
        await expect(nameInput).toHaveClass(/bg-white/);

        // Update phone
        const newPhone = '+56 9 8765 4321';
        await page.fill('input[name="phone"]', newPhone);

        // Update Commune via Region selector (Cascade test)
        // 1. Select Region
        await page.selectOption('select#region', 'Valparaíso');
        // 2. Select Commune (Valparaíso should be available)
        await page.selectOption('select[name="commune"]', 'VIÑA DEL MAR');

        // Save
        await page.getByRole('button', { name: 'Guardar Cambios' }).click();

        // Check success message
        await expect(page.getByText('Perfil actualizado correctamente')).toBeVisible();

        // Verify value persisted (reload)
        await page.reload();
        await expect(page.locator('input[name="phone"]')).toHaveValue(newPhone);
    });
});
