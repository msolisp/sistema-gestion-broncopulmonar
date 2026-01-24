
const { exec } = require('child_process');

const CONCURRENCY = 5; // Start with 5 concurrent users (browsers)
const REPEATS = 2; // How many batches to run

console.log(`🚀 Starting Load Test with ${CONCURRENCY} concurrent workers.`);

const runBatch = (batchId) => {
    return new Promise((resolve) => {
        console.log(`[Batch ${batchId}] Starting...`);
        const start = Date.now();
        // Playwright supports parallel workers natively with --workers
        const cmd = `npx playwright test e2e/load-exam-upload.spec.ts --workers ${CONCURRENCY} --reporter=line`;

        exec(cmd, (error, stdout, stderr) => {
            const duration = Date.now() - start;
            if (error) {
                console.error(`[Batch ${batchId}] Failed in ${duration}ms`);
                // console.error(stderr);
            } else {
                console.log(`[Batch ${batchId}] Completed in ${duration}ms`);
            }
            console.log(stdout);
            resolve();
        });
    });
};

async function main() {
    for (let i = 0; i < REPEATS; i++) {
        await runBatch(i + 1);
    }
    console.log('✅ Load Test Sequence Complete');
}

main();
