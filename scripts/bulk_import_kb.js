
import { login } from './loginHelper.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:3000/api';
const KB_DIR = path.join(__dirname, '../kbfiles');



const readKbFiles = () => {
    console.log(`📂 Reading files from ${KB_DIR}...`);
    const files = fs.readdirSync(KB_DIR);
    const items = [];

    for (const file of files) {
        if (file.endsWith('.md') || file.endsWith('.txt')) {
            const content = fs.readFileSync(path.join(KB_DIR, file), 'utf-8');
            items.push({
                type: 'file',
                content: file, // Filename as content/title
                data: content  // File content as data
            });
        }
    }

    console.log(`found ${items.length} files.`);
    return items;
};

const bulkImport = async (token, items) => {
    console.log(`🚀 Sending ${items.length} items to bulk import...`);
    const response = await fetch(`${API_URL}/knowledge/bulk`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(items)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Bulk import failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Bulk import successful:', result);
};

const main = async () => {
    try {
        const token = await login();
        const items = readKbFiles();
        if (items.length > 0) {
            await bulkImport(token, items);
        } else {
            console.log('⚠️ No files found to import.');
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
};

main();
