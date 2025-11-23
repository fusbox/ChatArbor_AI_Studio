import dotenv from 'dotenv';

dotenv.config({ path: new URL('../.env.local', import.meta.url).pathname });

async function testEmbedding() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('Missing GEMINI_API_KEY. Add a valid key to your .env.local file to run this test.');
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'text-embedding-004',
                content: {
                    parts: [{ text: 'Hello world' }]
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`HTTP ${response.status}:`, errorText);
            return;
        }

        const data = await response.json();
        console.log('Success! Embedding dimension:', data.embedding?.values?.length);
        console.log('First 5 values:', data.embedding?.values?.slice(0, 5));
    } catch (error) {
        console.error('Error:', error);
    }
}

testEmbedding();
