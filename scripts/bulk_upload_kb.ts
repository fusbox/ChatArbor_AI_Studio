import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_URL = 'http://localhost:3000/api/knowledge/bulk';
const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_KB_DIR_CANDIDATES = ['kb_content', 'kbfiles'];

const assertPathWithinRepo = (targetPath: string) => {
    const resolved = path.resolve(targetPath);
    const relative = path.relative(REPO_ROOT, resolved);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(`Refusing to read outside repo root: ${targetPath}`);
    }

    return resolved;
};

const resolveTargetDirectory = async (input?: string) => {
    if (input) {
        return assertPathWithinRepo(input);
    }

    for (const candidate of DEFAULT_KB_DIR_CANDIDATES) {
        const candidatePath = path.join(REPO_ROOT, candidate);
        try {
            await fs.access(candidatePath);
            return assertPathWithinRepo(candidatePath);
        } catch {
            // Continue searching
        }
    }

    throw new Error('Unable to locate a default knowledge base directory. Provide a path explicitly.');
};

async function main() {
    let targetDir: string;

    try {
        targetDir = await resolveTargetDirectory(process.argv[2]);
    } catch (error) {
        console.error((error as Error).message);
        process.exit(1);
    }

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
