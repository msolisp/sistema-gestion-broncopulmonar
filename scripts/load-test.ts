#!/usr/bin/env ts-node

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const CONCURRENCY = 20; // Simulated concurrent users
const TOTAL_REQUESTS = 100; // Total requests to fire

interface RequestResult {
    success: boolean;
    duration: number;
    status: number;
}

async function makeRequest(id: number): Promise<RequestResult> {
    const start = performance.now();
    try {
        const response = await fetch(`${BASE_URL}/api/health`);
        const duration = performance.now() - start;
        return {
            success: response.ok,
            duration,
            status: response.status
        };
    } catch (error) {
        return {
            success: false,
            duration: performance.now() - start,
            status: 0
        };
    }
}

async function runLoadTest() {
    console.log(`🚀 Starting Load Test`);
    console.log(`URL: ${BASE_URL}`);
    console.log(`Concurrency: ${CONCURRENCY}`);
    console.log(`Total Requests: ${TOTAL_REQUESTS}`);
    console.log('---');

    const results: RequestResult[] = [];
    const queue = Array.from({ length: TOTAL_REQUESTS }, (_, i) => i);

    // Process queue with limited concurrency
    const activePromises: Promise<void>[] = [];

    const processItem = async () => {
        while (queue.length > 0) {
            const id = queue.shift();
            if (id === undefined) break;

            const result = await makeRequest(id);
            results.push(result);
            process.stdout.write(result.success ? '.' : 'x');
        }
    };

    for (let i = 0; i < CONCURRENCY; i++) {
        activePromises.push(processItem());
    }

    await Promise.all(activePromises);

    console.log('\n---');

    // Analyze results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const durations = successful.map(r => r.duration);

    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const max = Math.max(...durations);
    const min = Math.min(...durations);

    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);

    if (successful.length > 0) {
        console.log(`⏱️  Average Latency: ${avg.toFixed(2)}ms`);
        console.log(`🐢 Max Latency: ${max.toFixed(2)}ms`);
        console.log(`⚡ Min Latency: ${min.toFixed(2)}ms`);
    }

    if (failed.length > 0) {
        console.log('⚠️  Load test had failures!');
        process.exit(1);
    } else {
        console.log('✨ Load test completed successfully');
        process.exit(0);
    }
}

runLoadTest().catch(console.error);
