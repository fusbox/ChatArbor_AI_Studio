import * as fs from 'fs/promises';
import * as path from 'path';
import * as chromaService from '../services/chromaService.js';

// Backup ChromaDB collection to JSON file

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';
const COLLECTION_NAME = 'knowledge_sources';

const ensureWithinDir = (baseDir: string, targetPath: string) => {
    const resolvedBase = path.resolve(baseDir);
    const resolvedTarget = path.resolve(targetPath);
    const relative = path.relative(resolvedBase, resolvedTarget);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(`Path escapes backup directory: ${targetPath}`);
    }

    return resolvedTarget;
};

interface BackupData {
    timestamp: string;
    collection: string;
    count: number;
    data: {
        ids: string[];
        embeddings: number[][];
        documents: string[];
        metadatas: any[];
    };
}

async function ensureBackupDir() {
    try {
        await fs.access(BACKUP_DIR);
    } catch {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
    }
}

async function getCollectionData(): Promise<BackupData['data']> {
    // Fetch all data from ChromaDB collection
    const response = await fetch(`${CHROMA_URL}/api/v2/collections/${COLLECTION_NAME}/get`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(process.env.CHROMA_AUTH_TOKEN && {
                'Authorization': `Bearer ${process.env.CHROMA_AUTH_TOKEN}`
            })
        },
        body: JSON.stringify({
            include: ['embeddings', 'documents', 'metadatas']
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch collection data: ${response.status}`);
    }

    return response.json();
}

async function backup() {
    try {
        console.log('🔄 Starting ChromaDB backup...');

        await ensureBackupDir();

        const data = await getCollectionData();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        const backupData: BackupData = {
            timestamp: new Date().toISOString(),
            collection: COLLECTION_NAME,
            count: data.ids?.length || 0,
            data
        };

        const filename = `chromadb-backup-${timestamp}.json`;
        const filepath = ensureWithinDir(BACKUP_DIR, path.join(BACKUP_DIR, filename));

        await fs.writeFile(filepath, JSON.stringify(backupData, null, 2));

        console.log(`✅ Backup complete: ${filename}`);
        console.log(`📊 Backed up ${backupData.count} vectors`);
        console.log(`📁 Location: ${filepath}`);

        return filepath;
    } catch (error) {
        console.error('❌ Backup failed:', error);
        throw error;
    }
}

async function restore(backupFile: string) {
    try {
        console.log(`🔄 Restoring from backup: ${backupFile}...`);

        const filepath = ensureWithinDir(
            BACKUP_DIR,
            path.isAbsolute(backupFile) ? backupFile : path.join(BACKUP_DIR, backupFile)
        );

        const content = await fs.readFile(filepath, 'utf-8');
        const backupData: BackupData = JSON.parse(content);

        console.log(`📊 Restoring ${backupData.count} vectors from ${backupData.timestamp}`);

        // Upsert data back to ChromaDB
        const response = await fetch(`${CHROMA_URL}/api/v2/collections/${COLLECTION_NAME}/upsert`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(process.env.CHROMA_AUTH_TOKEN && {
                    'Authorization': `Bearer ${process.env.CHROMA_AUTH_TOKEN}`
                })
            },
            body: JSON.stringify(backupData.data)
        });

        if (!response.ok) {
            throw new Error(`Failed to restore data: ${response.status}`);
        }

        console.log(`✅ Restore complete: ${backupData.count} vectors restored`);
    } catch (error) {
        console.error('❌ Restore failed:', error);
        throw error;
    }
}

async function listBackups() {
    try {
        await ensureBackupDir();
        const files = await fs.readdir(BACKUP_DIR);
        const backupFiles = files.filter(f => f.startsWith('chromadb-backup-') && f.endsWith('.json'));

        console.log(`📁 Found ${backupFiles.length} backup(s):`);
        backupFiles.forEach(file => console.log(`  - ${file}`));

        return backupFiles;
    } catch (error) {
        console.error('❌ List failed:', error);
        return [];
    }
}

// CLI interface
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
    case 'backup':
        backup();
        break;
    case 'restore':
        if (!arg) {
            console.error('❌ Usage: npm run backup:restore -- <backup-file>');
            process.exit(1);
        }
        restore(arg);
        break;
    case 'list':
        listBackups();
        break;
    default:
        console.log(`
ChromaDB Backup/Restore Utility

Usage:
  npm run chromadb:backup           Create a new backup
  npm run chromadb:restore <file>   Restore from backup
  npm run chromadb:list             List all backups

Examples:
  npm run chromadb:backup
  npm run chromadb:restore chromadb-backup-2025-11-22T12-00-00-000Z.json
  npm run chromadb:list
    `);
}
