import { generateEmbedding } from '../server/services/geminiService';
import dotenv from 'dotenv';

dotenv.config({ path: 'server/.env' });

async function main() {
    try {
        console.log('Generating embedding for "Hello world"...');
        const vector = await generateEmbedding('Hello world');
        console.log('Embedding generated successfully!');
        console.log('Vector length:', vector.length);
        console.log('First 5 values:', vector.slice(0, 5));
    } catch (error) {
        console.error('Error generating embedding:', error);
    }
}

main();
