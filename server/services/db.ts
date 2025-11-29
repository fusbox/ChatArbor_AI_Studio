import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// --- PRODUCTION MIGRATION NOTE ---
// When migrating to RangamWorks production:
// 1. Replace this file with a connection to your PostgreSQL/MySQL instance.
// 2. Use an ORM like Prisma (recommended) or TypeORM, or a query builder like Knex.js.
// 3. Ensure environment variables (DB_HOST, DB_USER, etc.) are used for connection details.
// 4. The schema below should be converted to a migration script (e.g., Prisma schema or SQL migration).
// ---------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize Schema
const initSchema = () => {
    // Users
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            createdAt INTEGER NOT NULL
        )
    `);

    // Knowledge Sources
    db.exec(`
        CREATE TABLE IF NOT EXISTS knowledge_sources (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            content TEXT NOT NULL,
            data TEXT,
            embedding TEXT, -- Stored as JSON string
            chunkCount INTEGER DEFAULT 0,
            createdAt INTEGER NOT NULL
        )
    `);

    // Chat Logs
    db.exec(`
        CREATE TABLE IF NOT EXISTS chat_logs (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            messages TEXT NOT NULL, -- Stored as JSON string
            timestamp INTEGER NOT NULL
        )
    `);

    // Feedback
    db.exec(`
        CREATE TABLE IF NOT EXISTS feedback (
            id TEXT PRIMARY KEY,
            chatId TEXT NOT NULL,
            userMessageId TEXT NOT NULL,
            aiMessageId TEXT NOT NULL,
            messageId TEXT NOT NULL,
            userMessage TEXT NOT NULL,
            aiMessage TEXT NOT NULL,
            initialRating TEXT NOT NULL,
            scores TEXT NOT NULL,
            totalWeightedScore REAL NOT NULL,
            maxPossibleScore REAL NOT NULL,
            comment TEXT,
            submittedAt INTEGER NOT NULL
        )
    `);

    // Settings (Key-Value Store)
    db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL -- Stored as JSON string
        )
    `);

    // Seed default settings if not exists
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const existing = stmt.get('app_settings');

    if (!existing) {
        const defaultSettings = {
            systemPrompt: "You are a helpful and knowledgeable AI assistant for Job Connections, powered by Rangam. Your goal is to assist job seekers with career advice, resume tips, and interview preparation. Be professional, encouraging, and concise.",
            greetings: [
                { id: '1', text: "Hi! I'm your Job Connections Virtual Assistant. How can I help you today?", isActive: true },
                { id: '2', text: "Hello! Ready to work on your career goals? Ask me anything!", isActive: false }
            ]
        };
        const insert = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
        insert.run('app_settings', JSON.stringify(defaultSettings));
    }
};

initSchema();

export default db;
