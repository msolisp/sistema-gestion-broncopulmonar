
import { test, expect } from '@playwright/test';

test('Admin Flow: Login and Access Dashboard', async ({ page }) => {
    // 1. Go to Login
    await page.goto('/intranet/login');

    // 2. Login as Admin (using seeded credentials)
    // 2. Login as Admin (using seeded credentials)
    await page.fill('input[name="email"]', 'admin@hospital.cl');
    await page.fill('input[name="password"]', 'Admin123!');
    // Fill Visual Captcha (required by HTML5 validation, bypassed by server in E2E)
    await page.getByPlaceholder('Ingresa el código').fill('0000');
    await page.click('button:has-text("Iniciar Sesión Segura")');

    // Expect redirect to dashboard (Admin logic)
    // Expect redirect to dashboard (Admin logic)
    try {
        await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 30000 });
    } catch (e) {
        console.log('Login failed. Current URL:', page.url());
        const errorMsg = await page.locator('.text-red-600').textContent().catch(() => 'No red error text found');
        if (errorMsg === 'No red error text found') {
            // Check for success message just in case
            const successMsg = await page.locator('.text-green-600').textContent().catch(() => '');
            console.log('Success Message (unexpected):', successMsg);
        }
        console.log('Error Message:', errorMsg);

        // Check for specific error containers if alert is not used
        const bodyText = await page.locator('body').innerText();
        console.log('Page Body Text Preview:', bodyText.substring(0, 500));
        throw e;
    }

    // 4. Verify Dashboard content
    await expect(page.getByRole('heading', { name: /Administración Central/i })).toBeVisible();
    await expect(page.getByText('Seguridad - Control de acceso')).toBeVisible();

    // 5. Verify Map
    // await expect(page.getByText('Mapa Distribución')).toBeVisible();
});

test('Admin Flow: Create Patient and Upload Exam', async ({ page }) => {
    // 1. Login
    await page.goto('/intranet/login');
    await page.fill('input[name="email"]', 'admin@hospital.cl');
    await page.fill('input[name="password"]', 'Admin123!');
    // Fill Visual Captcha (required by HTML5 validation, bypassed by server in E2E)
    await page.getByPlaceholder('Ingresa el código').fill('0000');
    await page.click('button:has-text("Iniciar Sesión Segura")');
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 30000 });

    // 2. Navigate to Patients
    // Assuming there is a sidebar or we can go directly
    await page.goto('/patients');
    await expect(page.getByRole('heading', { name: 'Gestión de Pacientes' })).toBeVisible();

    // 3. Create New Patient
    console.log('Clicking New Patient...');
    await page.click('button:has-text("Nuevo Paciente")');
    console.log('Clicked.');
    const uniqueRutNum = `${Math.floor(Math.random() * 10000000) + 20000000}`; // 20M+ range to avoid seed collision
    const uniqueRutDv = `${Math.floor(Math.random() * 9)}`;
    const uniqueRut = `${uniqueRutNum}-${uniqueRutDv}`;
    const uniqueEmail = `new_patient_${Date.now()}@test.com`;

    await page.fill('input[name="name"]', 'Paciente E2E');
    await page.fill('input[name="email"]', uniqueEmail);
    // Split RUT filling
    await page.fill('input[id="rut_num"]', uniqueRutNum);
    await page.fill('input[id="rut_dv"]', uniqueRutDv);
    // Explicitly set hidden input because onChange might happen too fast or not trigger with programmatic fill sometimes
    await page.evaluate(({ rut }) => {
        (document.getElementById('rut_hidden') as HTMLInputElement).value = rut;
    }, { rut: uniqueRut });

    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="address"]', 'Calle Falsa 123');
    // Select Region first (dependent dropdown) using explicit ID
    await page.selectOption('#create_region', 'Metropolitana de Santiago');
    // Wait for Commune to be enabled after region selection
    await expect(page.locator('#create_commune')).toBeEnabled();
    // Select Commune using explicit ID
    await page.selectOption('#create_commune', 'PROVIDENCIA');
    // Select Gender
    await page.selectOption('select[name="gender"]', 'Masculino');
    // Date
    await page.fill('input[name="birthDate"]', '1990-01-01');

    // Submit
    await page.click('button:has-text("Crear Paciente")');

    // Wait for modal to close (implies success)
    const createForm = page.locator('form').filter({ hasText: 'Crear Paciente' });
    await expect(createForm).not.toBeVisible();

    // Reload to ensure list is updated (if revalidatePath is slow or client router needs it)
    await page.reload();
    // Wait for table to load
    await expect(page.locator('table')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Gestión de Pacientes' })).toBeVisible();

    // 4. Verify Creation
    // Should see the new patient in the table. We search for it.
    await page.fill('input[placeholder*="Buscar"]', uniqueRut);
    await expect(page.getByText(uniqueEmail)).toBeVisible();

    // 5. Go to History
    // The history button is an icon link. We can find it by finding the row first.
    // Row contains uniqueRut.
    const row = page.getByRole('row').filter({ hasText: uniqueRut });
    // Find the link inside the row that points to history (title="Ver Historial")
    const historyLink = row.locator('a[title="Ver Historial"]');
    await historyLink.first().click();

    // 6. Upload Exam
    await expect(page.getByRole('heading', { name: /Historial de/ })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Subir Nuevo Examen')).toBeVisible();

    // Fill Upload Form
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('e2e/dummy.pdf');

    await page.fill('input[name="centerName"]', 'Clínica Test E2E');
    await page.fill('input[name="doctorName"]', 'Dr. Playwright');
    await page.fill('input[name="examDate"]', '2025-01-01');

    // Handle dialog (alert)
    page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Examen subido correctamente');
        await dialog.accept();
    });

    await page.click('button:has-text("Guardar y Subir")');

    // 7. Verify Timeline update
    // Should see the new exam in the timeline

    // Force reload to see the new data if not automatically revalidated

    // Wait for the timeline to update (revalidation should happen on server)
    // We might need to reload if standard client router cache persists
    await page.waitForTimeout(2000);
    await page.reload();
    await expect(page.getByText('Clínica Test E2E')).toBeVisible();
});
