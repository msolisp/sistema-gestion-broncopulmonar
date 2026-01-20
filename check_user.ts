
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'paciente1@test.com'
    const patient = await prisma.patient.findUnique({
        where: { email }
    })
    console.log('Patient check:', patient ? 'Found' : 'Not Found', patient)
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
