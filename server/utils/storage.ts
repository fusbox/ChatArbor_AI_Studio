import db from '../services/db.js';
import { KnowledgeSource, ChatLog, UserFeedback, Greeting } from '../types.js';

// --- Knowledge Base ---

export const getKnowledgeBase = async (): Promise<KnowledgeSource[]> => {
    const stmt = db.prepare('SELECT * FROM knowledge_sources ORDER BY createdAt DESC');
    const rows = stmt.all();
    return rows.map((row: any) => ({
        ...row,
        embedding: row.embedding ? JSON.parse(row.embedding) : undefined
    }));
};

export const saveKnowledgeBase = async (kb: KnowledgeSource[]): Promise<void> => {
    const insert = db.prepare(`
        INSERT INTO knowledge_sources (id, type, content, data, embedding, createdAt)
        VALUES (@id, @type, @content, @data, @embedding, @createdAt)
    `);

    const deleteMany = db.transaction((sources: KnowledgeSource[]) => {
        db.prepare('DELETE FROM knowledge_sources').run();
        for (const source of sources) {
            insert.run({
                ...source,
                data: source.data || null,
                embedding: source.embedding ? JSON.stringify(source.embedding) : null
            });
        }
    });

    deleteMany(kb);
};

// --- Chat Logs ---

export const getChatLogs = async (): Promise<ChatLog[]> => {
    const stmt = db.prepare('SELECT * FROM chat_logs ORDER BY timestamp DESC');
    const rows = stmt.all();
    return rows.map((row: any) => ({
        ...row,
        messages: JSON.parse(row.messages)
    }));
};

export const saveChatLogs = async (logs: ChatLog[]): Promise<void> => {
    const insert = db.prepare(`
        INSERT INTO chat_logs (id, userId, messages, timestamp)
        VALUES (@id, @userId, @messages, @timestamp)
    `);

    const replaceAll = db.transaction((items: ChatLog[]) => {
        db.prepare('DELETE FROM chat_logs').run();
        for (const item of items) {
            insert.run({
                ...item,
                messages: JSON.stringify(item.messages)
            });
        }
    });

    replaceAll(logs);
};

// --- Feedback ---

export const getFeedback = async (): Promise<UserFeedback[]> => {
    const stmt = db.prepare('SELECT * FROM feedback ORDER BY submittedAt DESC');
    return stmt.all() as UserFeedback[];
};

export const saveFeedback = async (feedbackList: UserFeedback[]): Promise<void> => {
    const insert = db.prepare(`
        INSERT INTO feedback (id, chatId, userMessageId, aiMessageId, rating, comment, submittedAt)
        VALUES (@id, @chatId, @userMessageId, @aiMessageId, @rating, @comment, @submittedAt)
    `);

    const replaceAll = db.transaction((items: UserFeedback[]) => {
        db.prepare('DELETE FROM feedback').run();
        for (const item of items) {
            insert.run(item);
        }
    });

    replaceAll(feedbackList);
};

// --- Settings ---

export const getSettings = async (): Promise<{ systemPrompt: string; greetings: Greeting[] }> => {
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const row = stmt.get('app_settings') as { value: string } | undefined;
    if (row) {
        return JSON.parse(row.value);
    }
    return { systemPrompt: '', greetings: [] };
};

export const saveSettings = async (settings: { systemPrompt?: string; greetings?: Greeting[] }): Promise<void> => {
    const current = await getSettings();
    const updated = { ...current, ...settings };

    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    stmt.run('app_settings', JSON.stringify(updated));
};

export const storage = {
    getKnowledgeBase,
    saveKnowledgeBase,
    getChatLogs,
    saveChatLogs,
    getFeedback,
    saveFeedback,
    getSettings,
    saveSettings
};
