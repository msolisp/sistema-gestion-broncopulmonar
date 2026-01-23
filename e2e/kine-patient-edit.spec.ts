import { test, expect } from '@playwright/test';

test.describe('Kinesiologist Patient Permissions', () => {

    test('Kinesiologist should be able to create, edit and delete a patient', async ({ page }) => {
        const kineEmail = 'kine_e2e@test.com';
        const kinePass = 'Password123!';

        // --- STEP 1: Login as Kinesiologist ---
        await page.goto('/intranet/login');
        await page.fill('input[name="email"]', kineEmail);
        await page.fill('input[name="password"]', kinePass);
        await page.click('button:has-text("Iniciar Sesión Segura")');

        // Should redirect to /patients
        await expect(page).toHaveURL(/.*\/patients/);

        // --- STEP 2: Create a Patient (Test Create Permission) ---
        await page.click('button:has-text("Nuevo Paciente")');

        const patientName = `Patient Kine E2E ${Date.now()}`;
        const patientEmail = `pat_kine_e2e_${Date.now()}@test.com`;
        const patientRutNum = Math.floor(Math.random() * 10000000) + 10000000;
        const patientRut = `${patientRutNum}-1`;

        await page.fill('input[name="name"]', patientName);
        await page.fill('input[name="email"]', patientEmail);

        const [rutBody, rutDv] = patientRut.split('-');
        await page.fill('input[id="rut_num"]', rutBody);
        await page.fill('input[id="rut_dv"]', rutDv);

        // Force hidden input update
        await page.evaluate(({ rut }) => {
            const hidden = document.getElementById('rut_hidden') as HTMLInputElement;
            if (hidden) hidden.value = rut;
        }, { rut: patientRut });

        await page.fill('input[name="password"]', 'Pass123!');
        await page.fill('input[name="address"]', 'Test Address');
        await page.selectOption('select[name="region"]', 'Metropolitana');
        await page.selectOption('select[name="commune"]', 'PROVIDENCIA');
        await page.selectOption('select[name="gender"]', 'Masculino');
        await page.fill('input[name="birthDate"]', '1990-01-01');

        await page.click('button:has-text("Crear Paciente")');

        // Wait for modal to close (Success)
        await expect(page.locator('text=Nuevo Paciente')).not.toBeVisible();

        // --- STEP 3: Edit the patient (Test Update Permission) ---
        // Find the patient row
        const row = page.locator('tr').filter({ hasText: patientName });
        await expect(row).toBeVisible();

        // Click Edit
        await row.getByTitle('Editar').click();

        // Modal opens
        await expect(page.locator('text=Editar Paciente')).toBeVisible();

        // Change name
        const newName = patientName + ' Updated';
        await page.fill('input[name="name"]', newName); // In the modal

        // Save
        await page.click('button:has-text("Guardar Cambios")');

        // Expect success (Modal closes)
        await expect(page.locator('text=Editar Paciente')).not.toBeVisible();

        // Verify change in table
        await expect(page.locator('tr').filter({ hasText: newName })).toBeVisible();

        // --- STEP 4: Delete the patient (Test Delete Permission) ---
        const updatedRow = page.locator('tr').filter({ hasText: newName });
        await updatedRow.getByTitle('Eliminar').click();

        await expect(page.locator('text=¿Eliminar Paciente?')).toBeVisible();
        await page.click('button:has-text("Sí, Eliminar")');

        await expect(page.locator('text=¿Eliminar Paciente?')).not.toBeVisible();
        await expect(page.locator('tr').filter({ hasText: newName })).not.toBeVisible();
    });
});
