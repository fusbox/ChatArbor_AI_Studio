
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function verifyHealth() {
    const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
    console.log(`Verifying health check against: ${chromaUrl}/api/v2/heartbeat`);

    try {
        const response = await fetch(`${chromaUrl}/api/v2/heartbeat`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Health Check Passed:', data);
        } else {
            console.error(`❌ Health Check Failed: ${response.status} ${response.statusText}`);
            console.log(await response.text());
        }
    } catch (error: any) {
        console.error('❌ Connection Failed:', error.message);
    }
}

verifyHealth();
