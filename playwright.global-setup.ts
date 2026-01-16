import { execSync } from 'child_process';

/**
 * Global setup para tests E2E de Playwright
 * Ejecuta seed de la base de datos antes de todos los tests
 * 
 * NOTE: Assumes database schema is already up to date.
 * Run `npx prisma db push` or `npx prisma migrate deploy` manually if needed.
 */
export default async function globalSetup() {
    console.log('🌱 Seeding database for E2E tests...');

    try {
        // Only seed the database (don't reset to avoid vector extension issues)
        execSync('npx prisma db seed', {
            stdio: 'inherit',
            env: process.env
        });

        console.log('✅ Database seeded successfully');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        console.warn('⚠️  Continuing tests anyway. Make sure DB schema is up to date.');
        // Don't throw - continue with tests even if seed fails
    }
}
