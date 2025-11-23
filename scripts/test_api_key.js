async function testEmbedding() {
    const apiKey = 'AIzaSyBd8WFyO2n5Uhwe0sUASyzYHp-JVaJqrPU';
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
