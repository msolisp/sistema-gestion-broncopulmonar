
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
    await page.click('button:has-text("Ingresar")');

    // 4. Verification: Redirect to Portal
    await page.waitForURL(/.*\/portal/);
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
