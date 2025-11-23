import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_URL = 'http://localhost:3000/api/knowledge/bulk';
const DEFAULT_KB_DIR = path.join(__dirname, '../kb_content');

async function main() {
    const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_KB_DIR;

    console.log(`Scanning directory: ${targetDir}`);

    try {
        await fs.access(targetDir);
    } catch {
        console.error(`Directory not found: ${targetDir}`);
        process.exit(1);
    }

    const files = await fs.readdir(targetDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    if (mdFiles.length === 0) {
        console.log('No markdown files found.');
        return;
    }

    console.log(`Found ${mdFiles.length} markdown files. Preparing upload...`);

    const items = [];

    for (const file of mdFiles) {
        const content = await fs.readFile(path.join(targetDir, file), 'utf-8');
        const title = path.basename(file, '.md').replace(/-/g, ' ');

        items.push({
            id: path.basename(file, '.md'), // Use filename as ID for stability
            title,
            content,
            type: 'document',
            tags: ['bulk-upload']
        });
    }

    console.log(`Found ${items.length} items to upload.`);

    const BATCH_SIZE = 10;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        console.log(`Uploading batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(items.length / BATCH_SIZE)} (${batch.length} items)...`);

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batch)
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Upload failed ${res.status}: ${text}`);
            }

            const result = await res.json();
            console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} success!`, result);
        } catch (error) {
            console.error(`Error uploading batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
            // Continue with next batch or exit? Let's exit to be safe.
            process.exit(1);
        }
    }
    console.log('All uploads completed successfully!');
}

main();
