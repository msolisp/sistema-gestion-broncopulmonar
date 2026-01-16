
import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('Patient History Page Stability', () => {
    let patientId: string;

    test.beforeAll(async () => {
        // Create a dummy patient
        const patient = await prisma.patient.create({
            data: {
                email: `crash_test_${Date.now()}@test.com`,
                password: 'hashed_password',
                name: 'Crash Test Patient',
                rut: `12.345.678-${Math.floor(Math.random() * 10)}`, // Randomize check digit/rut partially
                commune: 'Santiago',
                active: true,
            }
        });
        patientId = patient.id;
    });

    test.afterAll(async () => {
        if (patientId) {
            await prisma.patient.deleteMany({ where: { id: patientId } });
        }
    });

    test('should load the patient history page without crashing', async ({ page }) => {
        // Login as Admin or Kine (assuming we have a test user or bypass login if possible, 
        // but the app requires auth. We'll use the login flow or reuse state if available.
        // tailored for the existing project auth setup)

        await page.goto('/intranet/login');
        await page.fill('input[name="email"]', 'kine@broncopulmonar.cl'); // Assuming this user exists from previous seeds
        await page.fill('input[name="password"]', 'Kine123!');
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await page.waitForURL('/dashboard');

        // Go to the patient history page
        const historyUrl = `/patients/${patientId}/history`;
        console.log(`Navigating to ${historyUrl}`);
        await page.goto(historyUrl);

        // Verify critical elements to confirm no white screen of death
        await expect(page.locator('h1')).toContainText('Historial de Crash Test Patient');
        await expect(page.locator('text=Exámenes y Documentos')).toBeVisible();
    });
});
