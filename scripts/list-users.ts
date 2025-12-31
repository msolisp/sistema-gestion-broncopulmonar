import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({
        select: {
            email: true,
            role: true,
            name: true,
            password: true // Only checking if it looks like a hash or plain text (will not display full hash)
        }
    })
    console.log('Available Configured Users:')
    users.forEach(u => {
        console.log(`- Role: ${u.role} | Name: ${u.name} | Email: ${u.email}`)
    })
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
