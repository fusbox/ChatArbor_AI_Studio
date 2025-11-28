// Run with: npx tsx inspect_db.ts

import db from '../server/services/db.js';

console.log('--- Database Inspection V2 ---');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();

if (tables.length === 0) {
    console.log('No tables found.');
} else {
    console.log(`Found ${tables.length} tables:`);

    for (const table of tables as { name: string }[]) {
        const tableName = table.name;
        const count = (db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as { count: number }).count;
        console.log(`\n[TABLE] ${tableName} (${count} rows)`);

        if (count > 0) {
            const row = db.prepare(`SELECT * FROM ${tableName} LIMIT 1`).get();
            // Create a summary object with truncated strings
            const summary: any = {};
            for (const [key, value] of Object.entries(row)) {
                if (typeof value === 'string' && value.length > 50) {
                    summary[key] = value.substring(0, 47) + '...';
                } else {
                    summary[key] = value;
                }
            }
            console.log('Sample:', JSON.stringify(summary, null, 2));
        }
    }
}
