// Reverse engineer bcrypt hashes
import bcrypt from 'bcryptjs';

async function testHashes() {
    const adminHash = '$2b$10$.0CgmXqIlKP5aIsN5UKgXOAxuBPbx1kAY96NX0Z8wNzMQwa3m5v62';
    const patientHash = '$2b$10$HKnjjiRnt4m44y4..jiMuerfGj923CKrSDGe/zC2gtM7EAM6IvZLu';

    // Contraseñas comunes a probar
    const commonPasswords = [
        'admin123',
        'Admin123',
        'Admin123!',
        'admin',
        'password',
        'Password123!',
        'paciente123',
        'Paciente123',
        'paciente',
        '123456',
        'kine123',
        'recep123',
        '12345678'
    ];

    console.log('🔍 Testing Admin Hash...\n');
    for (const pwd of commonPasswords) {
        const match = await bcrypt.compare(pwd, adminHash);
        if (match) {
            console.log(`✅ ADMIN PASSWORD FOUND: "${pwd}"`);
            break;
        }
    }

    console.log('\n🔍 Testing Patient Hash...\n');
    for (const pwd of commonPasswords) {
        const match = await bcrypt.compare(pwd, patientHash);
        if (match) {
            console.log(`✅ PATIENT PASSWORD FOUND: "${pwd}"`);
            break;
        }
    }

    console.log('\n\n📋 SUMMARY:');
    console.log('Testing hashes you provided from Neon console update.');
}

testHashes();
