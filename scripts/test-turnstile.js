const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config({ path: '.env.local' });

async function testTurnstile() {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
        console.error('TURNSTILE_SECRET_KEY not found in .env.local');
        return;
    }

    console.log('Testing Turnstile with Secret Key:', secretKey.substring(0, 10) + '...');

    const dummyToken = 'dummy-token';
    const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    const params = new URLSearchParams();
    params.set('secret', secretKey);
    params.set('response', dummyToken);

    try {
        const response = await axios.post(verifyUrl, params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });

        const data = response.data;
        console.log('Cloudflare Response:', JSON.stringify(data, null, 2));

        if (data.success === false && data['error-codes'] && data['error-codes'].includes('invalid-input-response')) {
            console.log('\nSUCCESS: The API call reached Cloudflare and the keys are being communicated correctly (dummy token was rejected as expected).');
        } else {
            console.log('\nUNEXPECTED RESPONSE: Please check if the keys are correct.');
            if (data['error-codes']) {
                console.log('Error Codes:', data['error-codes'].join(', '));
            }
        }
    } catch (error) {
        console.error('Error fetching from Cloudflare:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

testTurnstile();
