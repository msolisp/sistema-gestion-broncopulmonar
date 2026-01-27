import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.join(process.cwd(), '.env.production.local');
if (fs.existsSync(envPath)) {
    console.log('Loading .env.production.local');
    dotenv.config({ path: envPath });
} else {
    console.warn('⚠️  .env.production.local not found. Trying .env...');
    dotenv.config();
}

try {
    const migration = '20260122034341_add_master_tables';
    console.log(`Resolving migration: ${migration} as APPLIED...`);
    execSync(`npx prisma migrate resolve --applied ${migration}`, { stdio: 'inherit' });
    console.log('✅ Migration resolved.');
} catch (e: any) {
    console.error('❌ Failed to resolve migration:', e.message);
    process.exit(1);
}
