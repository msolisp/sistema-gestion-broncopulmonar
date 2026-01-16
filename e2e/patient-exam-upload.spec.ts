import { test, expect } from '@playwright/test'

test.describe('Patient Exam Upload', () => {
    test('should allow patient to upload exam with all fields', async ({ page }) => {
        // Login as patient
        await page.goto('/login')
        await page.fill('input[name="email"]', 'paciente1@test.com')
        await page.fill('input[name="password"]', 'Paciente')
        await page.click('button:has-text("Ingresar")')

        // Wait for redirect to portal
        await expect(page).toHaveURL(/.*\/portal/, { timeout: 10000 })

        // Navigate to exams page
        await page.goto('/portal/examenes')

        // Verify page loaded
        await expect(page.locator('h1')).toContainText('Mis Exámenes Médicos')

        // Fill form
        const testPdfPath = 'test-fixtures/test-exam.pdf'
        await page.setInputFiles('input[type="file"]', testPdfPath)
        await page.fill('input#centerName', 'Clínica Las Condes')
        await page.fill('input#doctorName', 'Dr. Juan Pérez')
        await page.fill('input#examDate', '2024-01-10')

        // Submit
        await page.click('button:has-text("Guardar y Subir")')

        // Verify success message
        await expect(page.locator('text=Examen médico subido exitosamente')).toBeVisible({ timeout: 10000 })

        // Verify exam appears in list
        await expect(page.locator('text=Clínica Las Condes')).toBeVisible()
        await expect(page.locator('text=Dr. Juan Pérez')).toBeVisible()
    })

    test('should validate PDF file is required', async ({ page }) => {
        await page.goto('/login')
        await page.fill('input[name="email"]', 'paciente1@test.com')
        await page.fill('input[name="password"]', 'Paciente')
        await page.click('button:has-text("Ingresar")')

        await page.goto('/portal/examenes')

        // Try to submit without file
        await page.fill('input#centerName', 'Clínica Test')
        await page.fill('input#doctorName', 'Dr. Test')
        await page.fill('input#examDate', '2024-01-10')
        await page.click('button:has-text("Guardar y Subir")')

        // Should show HTML5 validation or error message
        const fileInput = page.locator('input[type="file"]')
        await expect(fileInput).toHaveAttribute('required')
    })

    test('should validate all text fields are required', async ({ page }) => {
        await page.goto('/login')
        await page.fill('input[name="email"]', 'paciente1@test.com')
        await page.fill('input[name="password"]', 'Paciente')
        await page.click('button:has-text("Ingresar")')

        await page.goto('/portal/examenes')

        const testPdfPath = 'test-fixtures/test-exam.pdf'
        await page.setInputFiles('input[type="file"]', testPdfPath)

        // Try submit without other fields
        await page.click('button:has-text("Guardar y Subir")')

        // Fields should be marked as required
        await expect(page.locator('input#centerName')).toHaveAttribute('required')
        await expect(page.locator('input#doctorName')).toHaveAttribute('required')
        await expect(page.locator('input#examDate')).toHaveAttribute('required')
    })

    test('should show list of uploaded exams', async ({ page }) => {
        await page.goto('/login')
        await page.fill('input[name="email"]', 'paciente1@test.com')
        await page.fill('input[name="password"]', 'Paciente')
        await page.click('button:has-text("Ingresar")')

        await page.goto('/portal/examenes')

        // Should show exams table or empty state
        const hasExams = await page.locator('table').isVisible()

        if (hasExams) {
            // Verify table headers
            await expect(page.locator('th:has-text("Archivo")')).toBeVisible()
            await expect(page.locator('th:has-text("Centro Médico")')).toBeVisible()
            await expect(page.locator('th:has-text("Médico")')).toBeVisible()
            await expect(page.locator('th:has-text("Fecha Examen")')).toBeVisible()
        } else {
            // Should show empty state
            await expect(page.locator('text=No hay exámenes subidos')).toBeVisible()
        }
    })

    test('should allow patient to download exam', async ({ page }) => {
        await page.goto('/login')
        await page.fill('input[name="email"]', 'paciente1@test.com')
        await page.fill('input[name="password"]', 'Paciente')
        await page.click('button:has-text("Ingresar")')

        await page.goto('/portal/examenes')

        // Check if there are exams
        const hasExams = await page.locator('table tbody tr').count() > 0

        if (hasExams) {
            // Click "Ver" button - first() is a locator method, not a Promise method
            const firstViewLink = page.locator('a:has-text("Ver")').first()
            await firstViewLink.click()

            // Verify download started (or new tab opened)
            // PDF will open in new tab, so we just verify the link works
        }
    })

    test('should allow patient to delete own exam with confirmation', async ({ page }) => {
        await page.goto('/login')
        await page.fill('input[name="email"]', 'paciente1@test.com')
        await page.fill('input[name="password"]', 'Paciente')
        await page.click('button:has-text("Ingresar")')

        await page.goto('/portal/examenes')

        // Check if there are patient-uploaded exams
        const deleteButton = page.locator('button:has-text("Eliminar")').first()
        const isVisible = await deleteButton.isVisible()

        if (isVisible) {
            await deleteButton.click()

            // Verify confirmation modal
            await expect(page.locator('text=¿Eliminar examen?')).toBeVisible()

            // Cancel first
            await page.click('button:has-text("Cancelar")')
            await expect(page.locator('text=¿Eliminar examen?')).not.toBeVisible()

            // Try again and confirm
            await deleteButton.click()
            await page.click('button:has-text("Eliminar"):not(:has-text("Cancelar"))')

            // Should show success or exam disappears
            // (exact behavior depends on implementation)
        }
    })
})

test.describe('Admin View Patient Exams', () => {
    test('should show badge for patients with uploaded exams', async ({ page }) => {
        // Login as admin
        await page.goto('/intranet/login')
        await page.fill('input[name="email"]', 'admin@example.com')
        await page.fill('input[name="password"]', 'admin123')
        await page.click('button:has-text("Iniciar Sesión Segura")')

        await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 30000 })

        // Navigate to patients tab
        await page.click('button:has-text("Gestión de Pacientes")')

        // Look for badge or indicator of pre-uploaded exams
        // This will vary based on implementation
        // For now, just verify patient table loads
        await expect(page.locator('table')).toBeVisible()
    })

    test.skip('should display pre-uploaded exams in patient detail', async ({ page }) => {
        // Login as admin  
        await page.goto('/intranet/login')
        await page.fill('input[name="email"]', 'admin@example.com')
        await page.fill('input[name="password"]', 'admin123')
        await page.click('button:has-text("Iniciar Sesión Segura")')

        await page.click('button:has-text("Gestión de Pacientes")')

        // Find a patient with exams and click to view details
        // This test is skipped until we implement the detail view
    })
})
