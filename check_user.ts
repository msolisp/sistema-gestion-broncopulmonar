
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'paciente@test.com'
    const user = await prisma.user.findUnique({
        where: { email },
        include: { patientProfile: true }
    })

    console.log('User check:', JSON.stringify(user, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
