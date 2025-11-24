
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function testConnection() {
    const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
    console.log(`Testing connection to ChromaDB at: ${chromaUrl}`);

    const endpoints = [
        '/api/v1/heartbeat',
        '/api/v2/heartbeat', // Just in case
        '/api/v1/version',
        '/version',
        '/'
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`\n--- Probing ${endpoint} ---`);
            const response = await fetch(`${chromaUrl}${endpoint}`);
            console.log(`Status: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.log(`Body: ${text.substring(0, 100)}`);
        } catch (error: any) {
            console.error(`Failed: ${error.message}`);
        }
    }
}

testConnection();
