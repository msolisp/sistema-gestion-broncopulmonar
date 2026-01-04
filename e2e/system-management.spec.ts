
import { test, expect } from '@playwright/test';

test('System Management: Create User, Update Permissions, Check Logs', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button:has-text("Ingresar")');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. Create System User (Kinesiologist)
    await page.click('text=Usuarios y Roles');
    await page.click('button:has-text("Nuevo Usuario")');

    const uniqueEmail = `kine_${Date.now()}@test.com`;
    await page.fill('input#userName', 'Test Kinesiologist');
    await page.fill('input#userEmail', uniqueEmail);
    await page.selectOption('select#userRole', 'KINESIOLOGIST');
    // active checkbox is checked by default

    await page.click('button:has-text("Guardar Cambios")');

    // Verify user appears in table
    await expect(page.getByText(uniqueEmail)).toBeVisible();
    await expect(page.getByText('KINESIÓLOGO').first()).toBeVisible();

    // 3. Update Permissions (Optimistic UI + DB)
    await page.click('text=Seguridad - Control de acceso');

    // Toggle "Ver Pacientes" for Kinesiologist (First row, first button)
    // We need to identify the button precisely.
    // Row: 'Ver Pacientes'
    const row = page.getByRole('row').filter({ hasText: 'Ver Pacientes' });
    const kineBtn = row.locator('button').first();

    // Store initial state (color)
    // Assuming green (bg-green-500) if enabled (seeded to true) based on previous seed
    // If we click it, it should toggle.
    await kineBtn.click();

    // Wait for optimistic/server update
    await page.waitForTimeout(1000);

    // 4. Check Audit Logs
    await page.reload(); // Force full reload to ensure logs are fetched
    await page.click('text=Auditoría');
    await expect(page.getByText('Logs de Sistema')).toBeVisible();

    // Should see Log for User Creation
    await expect(page.getByText('CREATE_SYSTEM_USER').first()).toBeVisible();
    await expect(page.getByText(`User created: ${uniqueEmail}`)).toBeVisible();

    // Should see Log for Permission Update
    // Depending on what we toggled.
    await expect(page.getByText('UPDATE_PERMISSION').first()).toBeVisible();
});
