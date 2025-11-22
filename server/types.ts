// Shared types for server
// Note: This is a copy of relevant types from ../types.ts
// to avoid TypeScript rootDir issues

export enum KnowledgeSourceType {
    TEXT = 'text',
    URL = 'url',
    FILE = 'file',
}

export interface KnowledgeSource {
    id: string;
    type: KnowledgeSourceType;
    content: string;
    data?: string;
    createdAt: number;
    embedding?: number[];
}
