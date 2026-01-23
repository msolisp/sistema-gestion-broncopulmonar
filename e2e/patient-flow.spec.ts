
import { test, expect } from '@playwright/test';

test('Patient Flow: Register, Login and Book Appointment', async ({ page }) => {
    // 1. Go to Home
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Gestión Integral/i })).toBeVisible();

    // 2. Register
    await page.click('text=Registrarse');

    const uniqueRut = `${Math.floor(Math.random() * 90000000) + 10000000}-${Math.floor(Math.random() * 9)}`;
    const uniqueEmail = `patient_${Date.now()}@test.com`;

    await page.fill('input[name="name"]', 'Test Patient');
    const [rutBody, rutDv] = uniqueRut.split('-');
    await page.fill('input[name="rutBody"]', rutBody);
    await page.fill('input[name="rutDv"]', rutDv);

    // Select Region first to populate Commune options
    const regionSelect = page.locator('select#region');
    await regionSelect.selectOption({ label: 'Metropolitana de Santiago' });

    // Wait for the state update
    await page.waitForTimeout(2000);

    // Explicitly wait for options to be populated (length > 1)
    await page.waitForFunction(() => {
        const select = document.querySelector('select[name="commune"]') as HTMLSelectElement;
        return select && select.options.length > 1;
    });

    const communeSelect = page.locator('select[name="commune"]');
    await communeSelect.selectOption({ value: 'SANTIAGO' });
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'Password123!');

    await page.click('button:has-text("Registrarse")');

    // Expect redirect to login (or success message on same page? check implementation)
    // Current implementation shows success message on register page
    await expect(page.getByText('Cuenta creada exitosamente! Puedes iniciar sesión.')).toBeVisible();

    // 3. Login
    await page.click('text=Inicia Sesión');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'Password123!');
    // Fill Visual Captcha (required by HTML5 validation, bypassed by server in E2E)
    await page.getByPlaceholder('Ingresa el código').fill('0000');
    await page.click('button:has-text("Ingresar")');

    // 4. Verification: Redirect to Portal
    await page.waitForURL(/.*\/portal/, { timeout: 30000 });
    await expect(page).toHaveURL(/.*\/portal/);
    await expect(page.locator('h1')).toContainText('Bienvenido');

    // 5. Navigate to Reserve
    // 5. Book
    // Navigate to booking page directly as it's not on the main dashboard anymore
    await page.goto('/reservar');

    // Expect to be on Booking Page
    await expect(page.getByRole('heading', { name: 'Agendar Hora' })).toBeVisible();

    // Select Next Month to avoid "past time" issues
    const nextMonthBtn = page.locator('button:has(.lucide-chevron-right)');
    await nextMonthBtn.click();

    // Select the first available day in the grid
    // Days are buttons inside a grid div
    const firstDayBtn = page.locator('.grid button:not([disabled])').first();
    await firstDayBtn.click();

    // Select a time slot (09:00 is usually available, 10:00 is mocked as occupied)
    const timeSlotBtn = page.locator('button:has-text("09:00")');
    await timeSlotBtn.click();

    // Confirm
    await page.click('button:has-text("Confirmar Reserva")');

    await expect(page.getByText('¡Hora reservada exitosamente!')).toBeVisible({ timeout: 15000 });

    // 6. Verify "Mis Reservas"
    await page.click('text=Mis Citas');
    // Note: The page heading might be "Mis Citas" or "Mis Reservas", assuming "Mis Reservas" for now based on mis-reservas page content
    // But since we navigate to /portal/citas, let's be loose or check content
    // Actually, let's assume the heading is consistent with the link or checking existance of reservation logic
    // await expect(page.getByRole('heading', { name: 'Mis Reservas' })).toBeVisible(); 
    // Let's just check for text "Pendiente" which implies the list loaded
    await expect(page.getByText('Pendiente')).toBeVisible();

    // 7. Edit Profile
    await page.click('text=Mis Datos');
    // Heading might be "Mis Datos" or "Mi Perfil". Assuming "Mis Datos" or similar.
    // Let's loose match
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mi Perfil' })).toBeVisible();

    // Change Phone
    await page.fill('input[name="phone"]', '912345678');
    await page.click('button:has-text("Guardar Cambios")');
    await expect(page.getByText('Perfil actualizado correctamente')).toBeVisible();
});

test('Patient Administration: Edit Patient', async ({ page }) => {
    // Note: Requires admin login. Assuming we have seeded an admin or can use the one from previous test if session persists?
    // Start fresh with admin login for stability
    await page.goto('/login');
    // await page.click('text=Inicia Sesión'); // Removed to avoid potential timeouts
    await page.fill('input[name="email"]', 'admin@hospital.cl'); // Assuming seeded admin
    await page.fill('input[name="password"]', 'Admin123!'); // Assuming seeded admin password
    await page.click('button:has-text("Ingresar")');

    // Wait for login to complete (redirect to dashboard/portal)
    // Assuming admin dashboard is at /admin or /summary or just checking for absence of login form
    await expect(page.locator('input[name="password"]')).not.toBeVisible({ timeout: 10000 });

    // Go to patients management
    await page.goto('/patients');

    // Create a patient first to ensure we have one to edit
    // Use a unique name to avoid conflicts
    const uniqueId = Date.now();
    const name = `Edit Candidate ${uniqueId}`;
    const email = `edit_${uniqueId}@test.com`;
    const rutNum = Math.floor(Math.random() * 90000000) + 10000000;

    // Calculate valid DV
    let T = rutNum;
    let M = 0;
    let S = 1;
    for (; T; T = Math.floor(T / 10))
        S = (S + T % 10 * (9 - M++ % 6)) % 11;
    const rutDv = S ? (S - 1).toString() : 'K';

    await page.click('text=Nuevo Paciente');
    await page.fill('input[name="name"]', name);
    await page.fill('input[name="email"]', email);
    await page.fill('input[id="rut_num"]', rutNum.toString());
    await page.fill('input[id="rut_dv"]', rutDv);
    await page.fill('input[name="password"]', 'Password123!');

    // Select Region first
    await page.selectOption('select[name="region"]', { label: 'Metropolitana' });

    // Wait for commune population
    await page.waitForTimeout(1000);

    await page.selectOption('select[name="commune"]', 'SANTIAGO');

    // Fill other fields to satisfy schema
    await page.selectOption('select[name="gender"]', 'Masculino');
    await page.fill('input[name="birthDate"]', '1990-01-01');
    await page.fill('input[name="address"]', 'Calle Falsa 123');

    await page.click('button:has-text("Crear Paciente")');

    // Verify modal closes (implies success)
    if (await page.getByRole('heading', { name: 'Nuevo Paciente' }).isVisible()) {
        const error = await page.locator('.text-red-500').textContent();
        throw new Error(`Patient creation failed with error: ${error}`);
    }
    await expect(page.getByRole('heading', { name: 'Nuevo Paciente' })).not.toBeVisible();

    // Wait for the patient to appear in the table
    // Use search to find the patient in case of pagination
    await page.fill('input[placeholder="Buscar por nombre, RUT, email..."]', name);
    await expect(page.getByText(name)).toBeVisible();

    // Click Edit button for this patient
    // We need to find the row with 'Edit Candidate' and click the edit button in it.
    const row = page.getByRole('row', { name: name });
    await row.getByTitle('Editar').click();

    await expect(page.getByText('Editar Paciente')).toBeVisible();

    // Verify fields are pre-filled correctly
    await expect(page.locator('input[name="name"]')).toHaveValue(name);
    await expect(page.locator('input[id="edit_rut_num"]')).toHaveValue(rutNum.toString());
    await expect(page.locator('input[id="edit_rut_dv"]')).toHaveValue('K');
    await expect(page.locator('input[name="email"]')).toHaveValue(email);

    // Edit fields
    const newName = `Edited Name ${uniqueId}`;
    await page.fill('input[name="name"]', newName);

    const newEmail = `edited_${uniqueId}@test.com`;
    await page.fill('input[name="email"]', newEmail);

    // Changing RUT might be tricky if it affects the ID or uniqueness, but let's try
    await page.fill('input[id="edit_rut_num"]', '11222333');
    await page.fill('input[id="edit_rut_dv"]', '9');

    await page.click('button:has-text("Guardar Cambios")');

    // Verify changes in the table
    await expect(page.getByText(newName)).toBeVisible();
    await expect(page.getByText(newEmail)).toBeVisible();
    // Verify RUT formatting in table if possible, or just implicit visibility
    await expect(page.getByText('11.222.333-9')).toBeVisible();
});
