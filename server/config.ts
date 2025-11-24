import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import * as userService from './services/userService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

console.log('Environment loaded.');

if (process.env.GEMINI_API_KEY) {
    const preview = process.env.GEMINI_API_KEY.substring(0, 9) + '...' + process.env.GEMINI_API_KEY.slice(-5);
    console.log('KEY_STATUS: PRESENT');
    console.log(`API Key Preview: ${preview}`);
} else {
    console.log('KEY_STATUS: MISSING - Gemini features will not work.');
}

// ============================================================================
// DEV ONLY - REMOVE BEFORE PRODUCTION MIGRATION
// Create test user for development authentication flow validation
// ============================================================================
const isDev = process.env.NODE_ENV !== 'production';
if (isDev) {
    (async () => {
        try {
            await userService.createUser('Fu', 'fu@dev.local', 'dev123');
            console.log('✅ Dev user created: fu@dev.local / dev123');
        } catch (error: any) {
            if (error.message === 'User already exists') {
                console.log('ℹ️ Dev user already exists');
            } else {
                console.error('Failed to create dev user:', error);
            }
        }
    })();
}
// ============================================================================
// END DEV ONLY
// ============================================================================
