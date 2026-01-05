
import { test, expect } from '@playwright/test';

test('Patient Flow: Register, Login and Book Appointment', async ({ page }) => {
    // 1. Go to Home
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Gestión Integral/i })).toBeVisible();

    // 2. Register
    await page.click('text=Portal Pacientes');
    await page.click('text=Regístrate');

    const uniqueRut = `12.${Math.floor(Math.random() * 900) + 100}.${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9)}`;
    const uniqueEmail = `patient_${Date.now()}@test.com`;

    await page.fill('input[name="name"]', 'Test Patient');
    await page.fill('input[name="rut"]', uniqueRut);
    await page.selectOption('select[id="region"]', { label: 'Metropolitana de Santiago' });
    // Playwright will wait for the option to appear
    const communeSelect = page.locator('select[name="commune"]');
    await communeSelect.selectOption({ value: 'SANTIAGO' });
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'password123');

    await page.click('button:has-text("Registrarse")');

    // Expect redirect to login (or success message on same page? check implementation)
    // Current implementation shows success message on register page
    await expect(page.getByText('Cuenta creada exitosamente! Puedes iniciar sesión.')).toBeVisible();

    // 3. Login
    await page.click('text=Inicia Sesión');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Ingresar")');

    // 4. Verification: Redirect to Portal
    await page.waitForURL(/.*\/portal/);
    await expect(page).toHaveURL(/.*\/portal/);
    await expect(page.locator('h1')).toContainText('Bienvenido');

    // 5. Navigate to Reserve
    // 5. Book
    // Click 'Agendar Hora' on Portal
    await page.click('text=Agendar Hora');

    // Expect to be on Booking Page
    await expect(page.getByRole('heading', { name: 'Agendar Hora' })).toBeVisible();

    // Select Next Month to avoid "past time" issues
    // Find the right chevron button (assuming it's the second one locally within the calendar header)
    // Or simpler: just click the 15th of current month? No, might be past.
    // Let's simple click a future logical date.
    // The UI has ChevronRight for next month.
    // We can rely on aria-labels if they existed, but here we can select by icon or order.
    // Let's assume there are two chevron buttons, left and right.
    const nextMonthBtn = page.locator('button:has(.lucide-chevron-right)');
    await nextMonthBtn.click();

    // Select the 15th
    await page.click('button:text-is("15")');

    // Select a time slot (e.g. 09:00, which should be free in the future)
    await page.click('button:has-text("09:00")');

    // Confirm
    await page.click('button:has-text("Confirmar Reserva")');

    await expect(page.getByText('¡Hora reservada exitosamente!')).toBeVisible({ timeout: 15000 });
});
