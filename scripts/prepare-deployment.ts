
import fs from 'fs';
import path from 'path';

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const backupPath = path.join(__dirname, '../prisma/schema.sqlite.backup');

function main() {
    console.log('🔄 Preparing project for Vercel Deployment (PostgreSQL)...');

    // 1. Read Schema
    if (!fs.existsSync(schemaPath)) {
        console.error('❌ Error: prisma/schema.prisma not found');
        process.exit(1);
    }

    let schema = fs.readFileSync(schemaPath, 'utf-8');

    // 2. Check if already Postgres
    if (schema.includes('provider = "postgresql"')) {
        console.log('✅ Schema is already configured for PostgreSQL.');
        return;
    }

    // 3. Backup
    console.log(`📦 Backing up SQLite schema to ${backupPath}...`);
    fs.writeFileSync(backupPath, schema);

    // 4. Transform
    console.log('🛠️ Updating datasource provider to "postgresql"...');
    schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');

    // 5. Write
    fs.writeFileSync(schemaPath, schema);

    console.log('\n✅ Success! Your project is now ready for Vercel/Postgres.');
    console.log('⚠️  NOTE: Your local "npm run dev" might fail if you don\'t have a local Postgres running.');
    console.log('👉 To revert to SQLite for local development, run:');
    console.log('   cp prisma/schema.sqlite.backup prisma/schema.prisma');
}

main();
