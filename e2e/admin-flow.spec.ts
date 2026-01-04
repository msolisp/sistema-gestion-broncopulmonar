
import { test, expect } from '@playwright/test';

test('Admin Flow: Login and Access Dashboard', async ({ page }) => {
    // 1. Go to Login
    await page.goto('/login');

    // 2. Login as Admin (using seeded credentials)
    // 2. Login as Admin (using seeded credentials)
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'admin'); // Updated password
    await page.click('button:has-text("Ingresar")');

    // Expect redirect to dashboard (Admin logic)
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 4. Verify Dashboard content
    await expect(page.getByRole('heading', { name: /Administración Central/i })).toBeVisible();
    await expect(page.getByText('Seguridad - Control de acceso')).toBeVisible();

    // 5. Verify Map
    // await expect(page.getByText('Mapa Distribución')).toBeVisible();
});

test('Admin Flow: Create Patient and Upload Exam', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button:has-text("Ingresar")');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. Navigate to Patients
    // Assuming there is a sidebar or we can go directly
    await page.goto('/patients');
    await expect(page.getByRole('heading', { name: 'Gestión de Pacientes' })).toBeVisible();

    // 3. Create New Patient
    await page.click('button:has-text("Nuevo Paciente")');
    const uniqueRut = `15.${Math.floor(Math.random() * 900) + 100}.${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9)}`;
    const uniqueEmail = `new_patient_${Date.now()}@test.com`;

    await page.fill('input[name="name"]', 'Admin Created Patient');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'password123');
    // Force specific RUT format if needed, but generic works
    await page.fill('input[name="rut"]', uniqueRut);
    // Select Commune
    await page.selectOption('select[name="commune"]', 'PROVIDENCIA');
    // Fill Address
    await page.fill('input[name="address"]', 'Calle Test 123');
    // Select Gender
    await page.selectOption('select[name="gender"]', 'Masculino');
    // Date
    await page.fill('input[name="birthDate"]', '1990-01-01');

    await page.click('button:has-text("Crear Paciente")');

    // Wait for modal to close (implies success)
    const createForm = page.locator('form').filter({ hasText: 'Crear Paciente' });
    await expect(createForm).not.toBeVisible();

    // Reload to ensure list is updated (if revalidatePath is slow or client router needs it)
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Gestión de Pacientes' })).toBeVisible();

    // 4. Verify Creation
    // Should see the new patient in the table. We search for it.
    await page.fill('input[placeholder*="Buscar"]', uniqueRut);
    await expect(page.getByText(uniqueEmail)).toBeVisible();

    // 5. Go to History
    // The history button is an icon link. We can find it by finding the row first.
    // Row contains uniqueRut.
    const row = page.getByRole('row').filter({ hasText: uniqueRut });
    // Find the link inside the row that points to history (title="Historial Médico")
    const historyLink = row.getByRole('link', { name: "Historial Médico" }); // Aria label or title?
    // The Link has title="Historial Médico". Playwright might not query by title easily with getByRole.
    // simpler: row.locator('a[href*="/history"]')
    await historyLink.first().click();

    // 6. Upload Exam
    await expect(page.getByRole('heading', { name: 'Historial Médico' })).toBeVisible();
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
    await expect(page.getByText('Clínica Test E2E')).toBeVisible();
});
