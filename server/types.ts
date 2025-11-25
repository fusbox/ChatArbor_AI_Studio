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

export interface ChatLog {
    id: string;
    userId: string;
    messages: any[]; // Stored as JSON string in DB, parsed in storage
    timestamp: number;
}

export interface UserFeedback {
    id: string;
    chatId: string;
    userMessageId: string;
    aiMessageId: string;
    messageId: string;
    userMessage: any; // Stored as JSON string in DB
    aiMessage: any; // Stored as JSON string in DB
    initialRating: string;
    scores: any; // Stored as JSON string in DB
    totalWeightedScore: number;
    maxPossibleScore: number;
    comment?: string;
    submittedAt: number;
}

export interface Greeting {
    id: string;
    text: string;
    isActive: boolean;
}
