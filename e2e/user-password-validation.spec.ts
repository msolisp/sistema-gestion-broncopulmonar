import { test, expect } from '@playwright/test';

test.describe('Internal Portal - User Creation with Password Validation', () => {

    // Helper to login as admin
    async function loginAsAdmin(page: any) {
        await page.goto('/intranet/login');
        await page.fill('input[type="email"]', 'admin@example.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
    }

    test('should display password field with requirements when creating new user', async ({ page }) => {
        await loginAsAdmin(page);

        // Navigate to Users tab
        await page.click('text=Usuarios y Roles');

        // Click "Nuevo Usuario" button
        await page.click('text=Nuevo Usuario');

        // Verify modal opened
        await expect(page.locator('text=Nuevo Usuario')).toBeVisible();

        // Verify password field exists
        const passwordLabel = page.locator('label:has-text("Contraseña")');
        await expect(passwordLabel).toBeVisible();

        const passwordInput = page.locator('input#userPassword');
        await expect(passwordInput).toBeVisible();
        await expect(passwordInput).toHaveAttribute('type', 'password');
        await expect(passwordInput).toHaveAttribute('placeholder', 'Mínimo 8 caracteres');

        // Verify requirements are shown
        await expect(page.locator('text=Requisitos:')).toBeVisible();
        await expect(page.locator('text=Mínimo 8 caracteres')).toBeVisible();
        await expect(page.locator('text=Una mayúscula')).toBeVisible();
        await expect(page.locator('text=Una minúscula')).toBeVisible();
        await expect(page.locator('text=Un carácter especial')).toBeVisible();
    });

    test('should show visual feedback as password requirements are met', async ({ page }) => {
        await loginAsAdmin(page);

        await page.click('text=Usuarios y Roles');
        await page.click('text=Nuevo Usuario');

        const passwordInput = page.locator('input#userPassword');

        // Type invalid password character by character
        await passwordInput.fill('t');

        // Should show empty circles initially
        const emptyCircles = await page.locator('text=○').count();
        expect(emptyCircles).toBeGreaterThan(0);

        // Type progressively valid password
        await passwordInput.fill('TestPass123!');

        // All requirements should show checkmarks
        const checkmarks = await page.locator('text=✓').count();
        expect(checkmarks).toBe(4); // All 4 requirements met
    });

    test('should prevent submission with password less than 8 characters', async ({ page }) => {
        await loginAsAdmin(page);

        await page.click('text=Usuarios y Roles');
        await page.click('text=Nuevo Usuario');

        // Fill form
        await page.fill('input#userName', 'Test User Short');
        await page.fill('input#userEmail', `test_short_${Date.now()}@hospital.cl`);
        await page.fill('input#userPassword', 'Test1!'); // Only 6 characters

        // Try to submit
        await page.click('text=Guardar Cambios');

        // Should show error message
        await expect(page.locator('text=La contraseña debe tener al menos 8 caracteres')).toBeVisible();

        // Modal should still be open
        await expect(page.locator('text=Nuevo Usuario')).toBeVisible();
    });

    test('should prevent submission without uppercase letter', async ({ page }) => {
        await loginAsAdmin(page);

        await page.click('text=Usuarios y Roles');
        await page.click('text=Nuevo Usuario');

        await page.fill('input#userName', 'Test User NoUpper');
        await page.fill('input#userEmail', `test_noupper_${Date.now()}@hospital.cl`);
        await page.fill('input#userPassword', 'testpass123!'); // No uppercase

        await page.click('text=Guardar Cambios');

        await expect(page.locator('text=Debe contener al menos una mayúscula')).toBeVisible();
    });

    test('should prevent submission without lowercase letter', async ({ page }) => {
        await loginAsAdmin(page);

        await page.click('text=Usuarios y Roles');
        await page.click('text=Nuevo Usuario');

        await page.fill('input#userName', 'Test User NoLower');
        await page.fill('input#userEmail', `test_nolower_${Date.now()}@hospital.cl`);
        await page.fill('input#userPassword', 'TESTPASS123!'); // No lowercase

        await page.click('text=Guardar Cambios');

        await expect(page.locator('text=Debe contener al menos una minúscula')).toBeVisible();
    });

    test('should prevent submission without special character', async ({ page }) => {
        await loginAsAdmin(page);

        await page.click('text=Usuarios y Roles');
        await page.click('text=Nuevo Usuario');

        await page.fill('input#userName', 'Test User NoSpecial');
        await page.fill('input#userEmail', `test_nospecial_${Date.now()}@hospital.cl`);
        await page.fill('input#userPassword', 'TestPass123'); // No special char

        await page.click('text=Guardar Cambios');

        await expect(page.locator('text=Debe contener al menos un carácter especial')).toBeVisible();
    });

    test('should successfully create user with valid password', async ({ page }) => {
        await loginAsAdmin(page);

        await page.click('text=Usuarios y Roles');
        await page.click('text=Nuevo Usuario');

        const uniqueEmail = `valid_user_${Date.now()}@hospital.cl`;

        // Fill all fields with valid data
        await page.fill('input#userName', 'Valid User Test');
        await page.fill('input#userEmail', uniqueEmail);
        await page.fill('input#userPassword', 'ValidPass123!');

        // Select role
        await page.selectOption('select#userRole', 'RECEPTIONIST');

        // Submit
        await page.click('text=Guardar Cambios');

        // Modal should close
        await expect(page.locator('text=Nuevo Usuario')).not.toBeVisible({ timeout: 3000 });

        // New user should appear in table
        await expect(page.locator(`text=${uniqueEmail}`)).toBeVisible();
    });

    test('should accept various special characters', async ({ page }) => {
        await loginAsAdmin(page);

        await page.click('text=Usuarios y Roles');
        await page.click('text=Nuevo Usuario');

        // Test different special characters
        const specialChars = ['!', '@', '#', '$', '%', '&', '*'];

        for (const char of specialChars) {
            const password = `TestPass1${char}`;
            await page.fill('input#userPassword', password);

            // Should not show special character error
            await expect(page.locator('text=Debe contener al menos un carácter especial')).not.toBeVisible();
        }
    });

    test('should show different placeholder when editing existing user', async ({ page }) => {
        await loginAsAdmin(page);

        await page.click('text=Usuarios y Roles');

        // Click on first "Editar" button (skip admin)
        const editButtons = page.locator('button:has-text("Editar")');
        const count = await editButtons.count();

        if (count > 0) {
            await editButtons.first().click();

            // Verify password field has different placeholder
            const passwordInput = page.locator('input#userPassword');
            await expect(passwordInput).toHaveAttribute('placeholder', 'Dejar vacío para no cambiar');

            // Should show hint text
            await expect(page.locator('text=(dejar vacío para mantener actual)')).toBeVisible();

            // Should NOT show requirements checklist
            await expect(page.locator('text=Requisitos:')).not.toBeVisible();
        }
    });

    test('should allow editing user without changing password', async ({ page }) => {
        await loginAsAdmin(page);

        await page.click('text=Usuarios y Roles');

        // Click edit on a user
        const editButtons = page.locator('button:has-text("Editar")');
        const count = await editButtons.count();

        if (count > 0) {
            await editButtons.first().click();

            // Change name but leave password empty
            const nameInput = page.locator('input#userName');
            const currentName = await nameInput.inputValue();
            await nameInput.fill(`${currentName} Updated`);

            // Leave password empty
            await page.fill('input#userPassword', '');

            // Submit
            await page.click('text=Guardar Cambios');

            // Should successfully update
            await expect(page.locator('text=Editar Usuario')).not.toBeVisible({ timeout: 3000 });
        }
    });

    test('should validate password if provided when editing', async ({ page }) => {
        await loginAsAdmin(page);

        await page.click('text=Usuarios y Roles');

        const editButtons = page.locator('button:has-text("Editar")');
        const count = await editButtons.count();

        if (count > 0) {
            await editButtons.first().click();

            // Enter invalid password
            await page.fill('input#userPassword', 'weak');

            // Submit
            await page.click('text=Guardar Cambios');

            // Should show error
            await expect(page.locator('text=La contraseña debe tener al menos 8 caracteres')).toBeVisible();

            // Modal should still be open
            await expect(page.locator('text=Editar Usuario')).toBeVisible();
        }
    });
});
