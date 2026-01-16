import { execSync } from 'child_process';

/**
 * Global setup para tests E2E de Playwright
 * Ejecuta seed de la base de datos antes de todos los tests
 */
export default async function globalSetup() {
    console.log('🌱 Seeding database for E2E tests...');

    try {
        // Reset and seed the database
        execSync('npx prisma db push --force-reset --skip-generate', {
            stdio: 'inherit',
            env: process.env
        });

        execSync('npx prisma db seed', {
            stdio: 'inherit',
            env: process.env
        });

        console.log('✅ Database seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
}
