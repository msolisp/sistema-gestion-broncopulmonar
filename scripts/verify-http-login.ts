
import fetch from 'node-fetch';
import { wrapper } from 'axios-cookiejar-support';
import axios from 'axios';
import { CookieJar } from 'tough-cookie';

const BASE_URL = 'http://localhost:3000';

async function testLogin(email: string) {
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar, baseURL: BASE_URL }));

    try {
        console.log(`Attempting login for ${email}...`);

        // 1. Get CSRF Token
        // NextAuth v5 often handles CSRF automatically or via specific endpoint
        // Let's try simulating the form submission to the server action or the signin endpoint

        // Actually, for credential provider, we usually POST to /api/auth/callback/credentials?
        // Or if using Auth.js server actions, it's a POST to the page.

        // Let's assume standard NextAuth API route for simplicity first
        const csrfRes = await client.get('/api/auth/csrf');
        const csrfToken = csrfRes.data.csrfToken;
        console.log('CSRF Token:', csrfToken);

        // 2. Sign In
        const params = new URLSearchParams();
        params.append('email', email);
        params.append('password', 'Password123!');
        params.append('redirect', 'false');
        params.append('csrfToken', csrfToken);
        params.append('callbackUrl', '/');
        params.append('json', 'true');

        const loginRes = await client.post('/api/auth/callback/credentials', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        console.log('Login Status:', loginRes.status);
        console.log('Cookies:', jar.getCookiesSync(BASE_URL).map(c => c.key));

        if (jar.getCookiesSync(BASE_URL).some(c => c.key.includes('session'))) {
            console.log('✅ Login Successful (Session cookie found)');
            return client;
        } else {
            console.log('❌ Login Failed (No session cookie)');
            return null;
        }

    } catch (e) {
        console.error('Login Error:', e.message);
        return null;
    }
}

// Run
testLogin('paciente1@Hospital.cl');
