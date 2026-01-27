import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.join(process.cwd(), '.env.production.local');
if (fs.existsSync(envPath)) {
    console.log('Loading .env.production.local');
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

try {
    const migration = '20260124051428_restore_medical_knowledge_schema';
    console.log(`Resolving migration: ${migration} as APPLIED...`);
    execSync(`npx prisma migrate resolve --applied ${migration}`, { stdio: 'inherit' });
    console.log('✅ Migration resolved.');
} catch (e: any) {
    console.error('❌ Failed to resolve migration:', e.message);
    process.exit(1);
}
