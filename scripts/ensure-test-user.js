const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const email = 'paciente1@test.com'
    const password = 'Paciente'

    const patient = await prisma.patient.findUnique({
        where: { email }
    })

    if (patient) {
        console.log(`User ${email} exists.`)
        // Update password just in case
        const hashedPassword = await bcrypt.hash(password, 10)
        await prisma.patient.update({
            where: { email },
            data: { password: hashedPassword }
        })
        console.log('Password reset to ensure test validity.')
    } else {
        console.log(`User ${email} does not exist. Creating...`)
        const hashedPassword = await bcrypt.hash(password, 10)
        await prisma.patient.create({
            data: {
                email,
                password: hashedPassword,
                name: 'Paciente Test',
                rut: '12345678-9',
                phone: '+56912345678',
                address: 'Calle Falsa 123'
            }
        })
        console.log('User created.')
    }
    // Check Admin User
    const adminEmail = 'admin@example.com'
    const adminPass = 'admin123'

    const admin = await prisma.user.findUnique({
        where: { email: adminEmail }
    })

    if (admin) {
        console.log(`Admin ${adminEmail} exists.`)
        const hashedAdminPass = await bcrypt.hash(adminPass, 10)
        await prisma.user.update({
            where: { email: adminEmail },
            data: { password: hashedAdminPass }
        })
        console.log('Admin password reset.')
    } else {
        console.log(`Admin ${adminEmail} does not exist. Creating...`)
        const hashedAdminPass = await bcrypt.hash(adminPass, 10)
        await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedAdminPass,
                name: 'Admin Test',
                role: 'ADMIN',
                active: true
            }
        })
        console.log('Admin user created.')
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
