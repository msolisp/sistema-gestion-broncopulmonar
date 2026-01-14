import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('=== Listing ALL System Users ===\n')

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true
        },
        orderBy: {
            role: 'asc'
        }
    })

    console.log(`Found ${users.length} user(s):\n`)
    users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Role: ${user.role}`)
        console.log(`   ID: ${user.id}`)
        console.log('')
    })

    // Find and delete neumovital
    const neumovital = users.find(u => u.email === 'neumo@example.com' || u.name.toLowerCase().includes('neumo'))

    if (neumovital) {
        console.log(`\n🗑️  Deleting user: ${neumovital.name} (${neumovital.email})\n`)
        await prisma.user.delete({
            where: { id: neumovital.id }
        })
        console.log('✓ User deleted successfully!')

        // Show remaining users
        const remaining = await prisma.user.findMany({
            where: { role: 'ADMIN' }
        })
        console.log(`\n✓ Administrators remaining: ${remaining.length}`)
        remaining.forEach(admin => {
            console.log(`  - ${admin.name} (${admin.email})`)
        })
    } else {
        console.log('\n✓ No neumovital user found')
    }
}

main()
    .catch((e) => {
        console.error('Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
