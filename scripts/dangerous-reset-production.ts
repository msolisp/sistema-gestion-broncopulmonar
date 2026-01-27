import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load production env vars
const envPath = path.join(process.cwd(), '.env.production.local');
if (fs.existsSync(envPath)) {
    console.log('Loading .env.production.local');
    dotenv.config({ path: envPath });
} else {
    console.warn('⚠️  .env.production.local not found. Trying .env...');
    dotenv.config();
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.POSTGRES_URL || process.env.DATABASE_URL
        }
    }
});

async function main() {
    console.log('⚠️  WARNING: THIS WILL DELETE ALL DATA IN PRODUCTION ⚠️');
    console.log('Waiting 5 seconds before proceeding...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
        await prisma.$connect();

        console.log('🔥 Dropping Schema public...');
        await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE;');

        console.log('✨ Recreating Schema public...');
        await prisma.$executeRawUnsafe('CREATE SCHEMA public;');

        // Ensure extensions if needed (e.g. vector for AI)
        // console.log('🔌 Enabling extensions...');
        // await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');

        console.log('🚀 Deploying generic Prisma migrations...');
        execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env });

        console.log('✅ Database reset and FHIR schema applied successfully.');

    } catch (e: any) {
        console.error('❌ Reset failed:', e.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
