
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Configuration
const CONCURRENT_USERS = 50
const ITERATIONS_PER_USER = 1 // Keep it simple for now, simulated strict concurrency
const TEST_USER_EMAIL = 'admin@test.com'
const TEST_USER_PASSWORD = 'admin'

async function benchmarkLogin() {
    const start = performance.now()
    try {
        const user = await prisma.user.findUnique({
            where: { email: TEST_USER_EMAIL }
        })
        if (!user) throw new Error('User not found')

        await bcrypt.compare(TEST_USER_PASSWORD, user.password)
    } catch (e) {
        // console.error(e)
    }
    return performance.now() - start
}

async function benchmarkDashboardData() {
    const start = performance.now()
    try {
        // Simulate BiReportsContent Data Fetching Logic (Heavy aggregation)
        const patients = await prisma.patient.findMany({
            include: { user: true, exams: true }
        })

        // Simulate standard processing
        let total = 0
        patients.forEach(p => total += 1)

    } catch (e) {
        // console.error(e)
    }
    return performance.now() - start
}

async function runLoadTest(name: string, fn: () => Promise<number>) {
    console.log(`\n🚀 Starting Load Test: ${name}`)
    console.log(`   Concurrent Users: ${CONCURRENT_USERS}`)

    const promises = []
    for (let i = 0; i < CONCURRENT_USERS; i++) {
        promises.push(fn())
    }

    const startTotal = performance.now()
    const results = await Promise.all(promises)
    const endTotal = performance.now()

    const totalTime = endTotal - startTotal
    const avgLatency = results.reduce((a, b) => a + b, 0) / results.length
    const minLatency = Math.min(...results)
    const maxLatency = Math.max(...results)
    const sub500 = results.filter(r => r < 500).length
    const throughput = (CONCURRENT_USERS / (totalTime / 1000)).toFixed(2)

    console.log(`   ✅ Completed in ${(totalTime / 1000).toFixed(2)}s`)
    console.log(`   📊 Average Latency: ${avgLatency.toFixed(2)}ms`)
    console.log(`   ⚡ Min/Max Latency: ${minLatency.toFixed(2)}ms / ${maxLatency.toFixed(2)}ms`)
    console.log(`   📈 Throughput: ${throughput} req/sec`)
    console.log(`   🎯 Success Rate (<500ms): ${sub500}/${CONCURRENT_USERS} (${((sub500 / CONCURRENT_USERS) * 100).toFixed(1)}%)`)

    return { avgLatency, throughput }
}

async function main() {
    try {
        // 1. Warmup
        console.log("Warming up DB connection...")
        await prisma.user.findFirst()

        // 2. Login Test (CPU Heavy due to bcrypt)
        await runLoadTest("Login Flow (DB Read + Bcrypt)", benchmarkLogin)

        // 3. Dashboard Test (DB Heavy)
        await runLoadTest("Dashboard Data (Complex Fetch)", benchmarkDashboardData)

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
