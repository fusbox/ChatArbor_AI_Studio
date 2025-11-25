import fetch from 'node-fetch';

export const login = async () => {
    console.log('🔐 Logging in as dev user...');
    const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'fu@dev.local', password: 'dev123' })
    });

    if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Login successful');
    return data.token;
};
