
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Listing Personas (Patients/Users):')
    const personas = await prisma.persona.findMany({
        take: 10,
        include: {
            usuarioSistema: true
        }
    })

    personas.forEach(p => {
        console.log(`- ${p.nombre} ${p.apellidoPaterno} (${p.rut}) [${p.usuarioSistema ? 'STAFF: ' + p.usuarioSistema.rol : 'PATIENT'}]`)
    })
}

main()
    .catch(e => {
        throw e
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
