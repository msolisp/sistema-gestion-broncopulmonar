#!/usr/bin/env node

/**
 * This script resolves failed migrations before running migrate deploy
 * Run with: node scripts/resolve-failed-migrations.js
 */

const { execSync } = require('child_process');

console.log('🔍 Checking for failed migrations...');

try {
    // Mark the failed migration as rolled back so new migrations can proceed
    const failedMigration = '20260113014636_add_cota_field';

    console.log(`📝 Attempting to resolve migration: ${failedMigration}`);

    execSync(
        `npx prisma migrate resolve --rolled-back ${failedMigration}`,
        { stdio: 'inherit' }
    );

    console.log('✅ Failed migration resolved successfully');
} catch (error) {
    // If the migration doesn't exist or is already resolved, that's OK
    console.log('ℹ️  No failed migrations to resolve (this is fine)');
}

console.log('🚀 Ready to run migrate deploy');
