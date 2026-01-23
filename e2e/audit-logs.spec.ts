import { test, expect } from '@playwright/test';

test.describe('Audit Logs Verification', () => {

    test('Should log a critical action (Login) and display it in the Audit Dashboard', async ({ page }) => {
        // 1. Perform an auditable action: Login as Admin
        // This generates a 'USER_LOGIN' event ideally, or at least we check previous events if login isn't logged 
        // (but usually login is logged).
        await page.goto('/intranet/login');
        await page.fill('input[name="email"]', 'admin@hospital.cl');
        await page.fill('input[name="password"]', 'Admin123!');
        await page.click('button:has-text("Iniciar Sesión Segura")');

        // Wait for redirect
        await expect(page).toHaveURL(/.*\/dashboard/);

        // 2. Navigate to "Auditoría" tab
        // Use explicit URL to avoid UI flakes
        await page.goto('/dashboard?tab=Auditoría');

        // 3. Verify the log table is visible
        await expect(page.getByRole('heading', { name: 'Logs de Sistema' })).toBeVisible();

        // 4. Check for the specific log entry
        const logEntry = page.locator('div').filter({ hasText: 'admin@hospital.cl' }).first();
        await expect(logEntry).toBeVisible();
    });

    test('Should log Patient Creation event', async ({ page }) => {
        // 1. Login
        await page.goto('/intranet/login');
        await page.fill('input[name="email"]', 'admin@hospital.cl');
        await page.fill('input[name="password"]', 'Admin123!');
        await page.click('button:has-text("Iniciar Sesión Segura")');

        // 2. Create Patient
        // We use the dedicated /patients route which has the full CRUD capabilities
        await page.goto('/patients');

        // Wait for the button to be strictly visible
        const newPatientBtn = page.locator('button:has-text("Nuevo Paciente")');
        await expect(newPatientBtn).toBeVisible();
        await newPatientBtn.click();

        const uniqueRutNum = Math.floor(Math.random() * 10000000) + 20000000;
        const uniqueRut = `${uniqueRutNum}-${Math.floor(Math.random() * 9)}`;
        const uniqueEmail = `audit_test_${Date.now()}@example.com`;

        await page.fill('input[name="name"]', 'Audit Test Patient');
        await page.fill('input[name="email"]', uniqueEmail);
        // Fill RUT components if separate
        const [rutBody, rutDv] = uniqueRut.split('-');
        await page.fill('input[id="rut_num"]', rutBody);
        await page.fill('input[id="rut_dv"]', rutDv);
        // Force hidden input update if needed
        await page.evaluate(({ rut }) => {
            const hidden = document.getElementById('rut_hidden') as HTMLInputElement;
            if (hidden) hidden.value = rut;
        }, { rut: uniqueRut });

        await page.fill('input[name="password"]', 'Password123!');
        await page.fill('input[name="address"]', 'Audit Lane 1');
        await page.selectOption('select[name="region"]', 'Metropolitana');
        await page.selectOption('select[name="commune"]', 'PROVIDENCIA');
        await page.selectOption('select[name="gender"]', 'Masculino');
        await page.fill('input[name="birthDate"]', '1990-01-01');

        await page.click('button:has-text("Crear Paciente")');

        // Check if error message appeared
        const errorMessage = page.locator('.text-red-500');
        if (await errorMessage.isVisible()) {
            console.log('Error creating patient:', await errorMessage.textContent());
        }
        await expect(errorMessage).not.toBeVisible();

        // Wait for creation success (modal close)
        await expect(page.locator('form').filter({ hasText: 'Crear Paciente' })).not.toBeVisible({ timeout: 20000 });

        // 3. Verify Log
        // 3. Verify Log
        // Navigate explicitly to Audit tab
        await page.goto('/dashboard?tab=Auditoría');

        // Look for CREATE_PATIENT
        await expect(page.getByText('CREATE_PATIENT')).toBeVisible();
        // Look for details containing the email or user
        const logRow = page.locator('div').filter({ hasText: 'CREATE_PATIENT' }).first();
        await expect(logRow).toContainText('admin@hospital.cl');
    });

});
