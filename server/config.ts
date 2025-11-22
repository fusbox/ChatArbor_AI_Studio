import dotenv from 'dotenv';
import path from 'path';

// Load .env from server directory
dotenv.config();

// Load .env.local from parent directory
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });

console.log('Environment loaded.');

// Log which env var is being used
const geminiKey = process.env.GEMINI_API_KEY;
const viteKey = process.env.VITE_GEMINI_API_KEY;
const activeKey = geminiKey || viteKey;

if (activeKey) {
    const source = geminiKey ? 'GEMINI_API_KEY' : 'VITE_GEMINI_API_KEY';
    console.log('KEY_STATUS: PRESENT');
    console.log(`API Key Source: ${source}`);
    console.log(`API Key Preview: ${activeKey.substring(0, 7)}...${activeKey.substring(activeKey.length - 4)}`);
} else {
    console.log('KEY_STATUS: MISSING');
}
