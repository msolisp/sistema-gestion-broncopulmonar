
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@test.com'
    const passwordToCheck = 'admin'

    console.log(`Checking user: ${email}`)

    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        console.error('User not found!')
        return
    }

    console.log('User found:', user.name)
    console.log('Role:', user.role)
    console.log('Stored Hash:', user.password)

    const isValid = await bcrypt.compare(passwordToCheck, user.password)

    if (isValid) {
        console.log('✅ Password matches!')
    } else {
        console.error('❌ Password does NOT match.')
        // Test with old password just in case
        const isOldValid = await bcrypt.compare('Paciente', user.password)
        if (isOldValid) console.log('⚠️ Password still matches "Paciente"')
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
