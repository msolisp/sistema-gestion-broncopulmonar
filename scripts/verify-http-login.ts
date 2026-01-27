

import { wrapper } from 'axios-cookiejar-support';
import axios from 'axios';
import { CookieJar } from 'tough-cookie';

const BASE_URL = 'http://localhost:3001';

async function testLogin(email: string) {
    const jar = new CookieJar();
    const client = wrapper(axios.create({ jar, baseURL: BASE_URL }));

    try {
        console.log(`Attempting login for ${email} at ${BASE_URL}...`);

        // 1. Get CSRF Token
        const csrfRes = await client.get('/api/auth/csrf');
        const csrfToken = csrfRes.data.csrfToken;
        console.log('CSRF Token:', csrfToken);

        // 2. Sign In
        const params = new URLSearchParams();
        params.append('email', email);
        params.append('password', 'Admin123!');
        params.append('redirect', 'false');
        params.append('csrfToken', csrfToken);
        params.append('callbackUrl', '/');
        params.append('json', 'true');

        const loginRes = await client.post('/api/auth/callback/credentials', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        console.log('Login Status:', loginRes.status);
        console.log('Login Data:', loginRes.data);
        console.log('Cookies:', jar.getCookiesSync(BASE_URL).map(c => c.key));

        if (jar.getCookiesSync(BASE_URL).some(c => c.key.includes('session'))) {
            console.log('✅ Login Successful (Session cookie found)');
            return client;
        } else {
            console.log('❌ Login Failed (No session cookie)');
            return null;
        }

    } catch (e) {
        if (axios.isAxiosError(e)) {
            console.error('Login Error Status:', e.response?.status);
            console.error('Login Error Data:', e.response?.data);
        } else {
            console.error('Login Error:', (e as Error).message);
        }
        return null;
    }
}

// Run
testLogin('admin@hospital.cl');
