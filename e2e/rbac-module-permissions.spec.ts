import { test, expect } from '@playwright/test';

/**
 * E2E Tests for RBAC Module-Level Permissions
 * 
 * These tests verify that permission restrictions work at the MODULE level (sidebar)
 * and not at the grid/action level (buttons within pages).
 * 
 * Test Credentials (from seed.ts):
 * - Admin: admin@hospital.cl / Admin123!
 * - Patient: paciente1@test.com / Password123!
 * 
 * Note: E2E_TESTING=true in playwright.config bypasses CAPTCHA validation in backend
 */

test.describe('RBAC Module-Level Permissions', () => {
    test('Admin has full access to Patients module with all action buttons', async ({ page }) => {
        // 1. Navigate to internal login
        await page.goto('http://localhost:3000/intranet/login');

        // 2. Wait for page to load
        await page.waitForSelector('#email', { timeout: 10000 });

        // 3. Fill in credentials
        await page.fill('#email', 'admin@hospital.cl');
        await page.fill('#password', 'Admin123!');

        // 4. Fill visual CAPTCHA (any value works in E2E mode)
        const captchaInput = page.locator('input[placeholder="Ingresa el código"]');
        if (await captchaInput.isVisible()) {
            await captchaInput.fill('TEST123');
        }

        // 5. Wait for Turnstile (Cloudflare)
        await page.waitForTimeout(2000);

        // 6. Click login button
        const loginButton = page.locator('button[type="submit"]');
        await expect(loginButton).toBeVisible();
        await loginButton.click();

        // 7. Wait for redirect to dashboard (or change-password for first login)
        await page.waitForURL(/\/(dashboard|change-password)/, { timeout: 15000 });

        // If redirected to change-password, handle it
        const currentURL = page.url();
        if (currentURL.includes('change-password')) {
            // Skip password change for this test
            await page.goto('http://localhost:3000/dashboard');
            await page.waitForURL(/.*\/dashboard/, { timeout: 5000 });
        }

        // 8. Verify we're on dashboard
        await expect(page).toHaveURL(/.*\/dashboard/);

        // 9. Verify "Pacientes" link is visible in sidebar
        const sidebar = page.locator('aside');
        await expect(sidebar).toBeVisible();

        const patientsLink = sidebar.locator('a:has-text("Pacientes")');
        await expect(patientsLink).toBeVisible();

        // 10. Navigate to Patients module
        await patientsLink.click();
        await page.waitForURL(/.*\/patients/);
        await expect(page.getByRole('heading', { name: 'Gestión de Pacientes' })).toBeVisible();

        // 11. Verify ALL action buttons are visible
        // Create button
        const createButton = page.getByRole('button', { name: 'Nuevo Paciente' });
        await expect(createButton).toBeVisible();
        await expect(createButton).toBeEnabled();

        // Wait for table to load
        await page.waitForSelector('table', { timeout: 5000 });

        // Edit buttons (should be at least one in the table)
        const editButtons = page.getByTitle('Editar');
        const firstEditBtn = editButtons.first();
        await expect(firstEditBtn).toBeVisible();
        await expect(firstEditBtn).toBeEnabled();

        // Delete buttons (should be at least one in the table)
        const deleteButtons = page.getByTitle('Eliminar');
        const firstDeleteBtn = deleteButtons.first();
        await expect(firstDeleteBtn).toBeVisible();
        await expect(firstDeleteBtn).toBeEnabled();

        console.log('✅ Admin can see and interact with all action buttons');
    });

    test('Patient without "Ver Pacientes" permission does NOT see patients module', async ({ page }) => {
        // 1. Navigate to patient login
        await page.goto('http://localhost:3000/login');

        // 2. Wait for page to load
        await page.waitForSelector('#email', { timeout: 10000 });

        // 3. Fill in credentials
        await page.fill('#email', 'paciente1@test.com');
        await page.fill('#password', 'Password123!');

        // 4. Fill visual CAPTCHA (any value works in E2E mode)
        const captchaInput = page.locator('input[placeholder="Ingresa el código"]');
        if (await captchaInput.isVisible()) {
            await captchaInput.fill('TEST123');
        }

        // 5. Wait for Turnstile
        await page.waitForTimeout(2000);

        // 6. Click login
        const loginButton = page.locator('button[type="submit"]');
        await loginButton.click();

        // 7. Verify redirect to patient portal
        await page.waitForURL(/\/portal/, { timeout: 15000 });

        // 8. Verify there is NO sidebar link for "Pacientes" or "Gestión de Pacientes"
        // Wait for navigation to settle
        await page.waitForTimeout(1000);

        const patientsLink = page.locator('a:has-text("Pacientes")').or(page.locator('a:has-text("Gestión de Pacientes")'));
        await expect(patientsLink).not.toBeVisible();

        // 9. Attempt to navigate directly to /patients (should be blocked)
        await page.goto('http://localhost:3000/patients');

        // Wait for any redirect or error page
        await page.waitForTimeout(2000);

        // Verify we're NOT on the patients management page
        const patientsHeading = page.getByRole('heading', { name: 'Gestión de Pacientes' });
        await expect(patientsHeading).not.toBeVisible();

        console.log('✅ Patient cannot access Patients module');
    });
});
