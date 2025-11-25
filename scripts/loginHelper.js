import fetch from 'node-fetch';

const DEV_LOGIN_EMAIL = process.env.DEV_LOGIN_EMAIL || 'fu@dev.local';

const resolvePassword = () => {
    const password = process.env.DEV_LOGIN_PASSWORD;
    if (!password) {
        throw new Error('DEV_LOGIN_PASSWORD environment variable is required for loginHelper.');
    }
    return password;
};

export const login = async () => {
    console.log('🔐 Logging in as dev user...');
    const password = resolvePassword();
    const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: DEV_LOGIN_EMAIL, password })
    });

    if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Login successful');
    return data.token;
};
