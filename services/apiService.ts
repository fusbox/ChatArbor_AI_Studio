import { KnowledgeSource, KnowledgeSourceWithSimilarity, Message, ChatLog, UserFeedback, Greeting, User } from '../types.js';
import * as mockApi from './mockApiService.js';
import * as chroma from './chromaService.js';
import { generateChatResponse, isGeminiConfigured } from './geminiService.js';

// --- API Client Service ---
// This service simulates making network requests to a backend.
// In a real app, this would use `fetch` to call a REST or GraphQL API.
// To simulate latency, a small delay is added to each call.

const SIMULATED_LATENCY_MS = 250;
const USE_CHROMA = ((import.meta as any).env?.VITE_USE_CHROMA === 'true');
const MAX_CONTEXT_SOURCES = 4;
const MAX_CONTEXT_CHARS = 6000;
const PER_SOURCE_CHAR_LIMIT = 1200;

const API_BASE = '/api';

// Token management
const TOKEN_KEY = 'auth_token';

const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

const setToken = (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
};

const clearToken = (): void => {
    localStorage.removeItem(TOKEN_KEY);
};

const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    try {
        const token = getToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_BASE}${endpoint}`, {
            headers: { ...headers, ...(options.headers as Record<string, string> || {}) },
            ...options,
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `Request failed: ${res.status}`);
        }
        return res.json();
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
};

const truncate = (text: string, limit: number): string => {
    if (!text) return '';
    return text.length > limit ? `${text.slice(0, limit)}…` : text;
};

const formatKnowledgeContext = (items: KnowledgeSourceWithSimilarity[]): string => {
    if (!items || items.length === 0) {
        return 'No relevant knowledge base entries were found.';
    }

    const sections = items
        .slice(0, MAX_CONTEXT_SOURCES)
        .map((item, index) => {
            const source = item.source;
            const body = source.data || source.content || '';
            const similarity = item.similarity != null ? ` | similarity ${(item.similarity * 100).toFixed(1)}%` : '';
            return `Source ${index + 1} (${source.type || 'TEXT'}${similarity})\n${truncate(body, PER_SOURCE_CHAR_LIMIT)}`.trim();
        });

    const combined = sections.join('\n\n---\n\n');
    return truncate(combined, MAX_CONTEXT_CHARS);
};

// --- User Management ---
export const getGuestUserId = (): string => mockApi.handleGetGuestUserId(); // Keep local for now
export const clearGuestUserId = (): void => localStorage.removeItem('guestUserId');

export const signUp = async (name: string, email: string, password: string): Promise<User> => {
    const result = await request<{ user: User; token: string }>('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) });
    setToken(result.token);
    return result.user;
};
export const login = async (email: string, password: string): Promise<User> => {
    const result = await request<{ user: User; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    setToken(result.token);
    return result.user;
};
export const logout = (): Promise<void> => {
    clearToken();
    return Promise.resolve();
};
export const getCurrentUser = (): Promise<User | null> => {
    return request<User>('/auth/me').catch(() => null);
};


// --- Knowledge Base ---
// --- Knowledge Base ---
export const getKnowledgeBase = (): Promise<KnowledgeSource[]> => request<KnowledgeSource[]>('/knowledge');

export const addKnowledgeSource = (source: Omit<KnowledgeSource, 'id' | 'createdAt' | 'embedding'>): Promise<KnowledgeSource> => {
    return request<KnowledgeSource>('/knowledge', { method: 'POST', body: JSON.stringify(source) });
};

export const updateKnowledgeSource = (updatedSource: KnowledgeSource): Promise<KnowledgeSource> => {
    // TODO: Add PUT endpoint to backend
    return request<KnowledgeSource>(`/knowledge/${updatedSource.id}`, { method: 'PUT', body: JSON.stringify(updatedSource) });
};

export const deleteKnowledgeSource = (id: string): Promise<void> => {
    return request<void>(`/knowledge/${id}`, { method: 'DELETE' });
};

export const searchKnowledgeBase = (query: string): Promise<KnowledgeSource[]> => {
    return request<KnowledgeSource[]>('/knowledge/search', { method: 'POST', body: JSON.stringify({ query }) });
};

export const searchKnowledgeBaseWithScores = (query: string): Promise<KnowledgeSourceWithSimilarity[]> => {
    // Backend search currently returns just sources, not scores. 
    // For Phase 1, we might need to mock this or update backend to return scores.
    // Let's assume backend returns { source, similarity } objects or just sources.
    // My server/routes/knowledge.ts returns [] for search.
    return request<KnowledgeSourceWithSimilarity[]>('/knowledge/search', { method: 'POST', body: JSON.stringify({ query }) });
};

export const reIndexKnowledgeBase = (): Promise<{ count: number }> => {
    return request<{ count: number }>('/knowledge/reindex', { method: 'POST' });
};

export const validateAndScrapeUrl = (url: string): Promise<{ success: boolean; message?: string; content?: string }> => {
    return request('/knowledge/scrape', { method: 'POST', body: JSON.stringify({ url }) });
};


// --- Chat ---
// --- Chat ---
export const getChatResponse = async (
    userQuery: string,
    chatHistory: { role: string; parts: { text: string }[] }[]
): Promise<string> => {
    // Fallback to mock if backend fails or not configured? 
    // For now, try backend first.
    try {
        // We need to fetch context first if we want to pass it, OR let the backend do it.
        // The roadmap says "Migrate API Service", so backend should handle RAG eventually.
        // But for Phase 1, let's keep the frontend doing RAG logic if the backend isn't ready?
        // No, the plan said "Migrate logic... to server-side".
        // But my server/routes/chat.ts expects `context` in the body.
        // So I still need to fetch context here for now.

        let context = '';
        try {
            const knowledge = await searchKnowledgeBaseWithScores(userQuery).catch(() => []);
            context = formatKnowledgeContext(knowledge);
        } catch (e) {
            console.warn('Failed to fetch context for chat:', e);
        }

        // const systemPrompt = await getSystemPrompt().catch(() => ''); // REMOVED: Secure server-side prompt

        const data = await request<{ response: string }>('/chat', {
            method: 'POST',
            body: JSON.stringify({
                userQuery,
                chatHistory,
                context,
                // systemPrompt // REMOVED
            })
        });
        return data.response;
    } catch (error) {
        console.error('Backend chat failed, falling back to mock:', error);
        return mockApi.handleGetChatResponse(userQuery, chatHistory);
    }
};

/**
 * Stream chat response using Server-Sent Events
 * @param message - User message
 * @param history - Chat history
 * @param onChunk - Callback for each text chunk
 * @param onComplete - Callback when stream completes with usage metadata
 */
export const streamChatResponse = async (
    message: string,
    history: any[], // Accept any format for flexibility
    onChunk: (text: string) => void,
    onComplete: (usageMetadata: any) => void
): Promise<void> => {
    const token = getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message, history })
    });

    if (!response.ok) {
        throw new Error(`Stream request failed: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    try {
                        const parsed = JSON.parse(data);

                        if (parsed.error) {
                            throw new Error(parsed.error);
                        }

                        if (parsed.chunk) {
                            onChunk(parsed.chunk);
                        }

                        if (parsed.done && parsed.usageMetadata) {
                            onComplete(parsed.usageMetadata);
                        }
                    } catch (e) {
                        // Ignore JSON parse errors for incomplete chunks
                    }
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
};



// --- Chat History ---
// --- Chat History ---
export const getChatHistory = (userId: string): Promise<Message[]> => {
    return request<Message[]>(`/chat/history?userId=${userId}`);
};
export const saveMessage = (userId: string, message: Message): Promise<void> => {
    return request<void>('/chat/history/message', { method: 'POST', body: JSON.stringify({ userId, message }) });
};
export const saveFullChatHistory = (userId: string, messages: Message[]): Promise<void> => {
    return request<void>('/chat/history', { method: 'PUT', body: JSON.stringify({ userId, messages }) });
};
export const clearChatHistory = (userId: string): Promise<void> => {
    return request<void>(`/chat/history?userId=${userId}`, { method: 'DELETE' });
};

// --- Admin ---
// --- Admin ---
export const getChatLogs = (): Promise<ChatLog[]> => request<ChatLog[]>('/admin/logs');
export const saveChatLog = (userId: string, messages: Message[]): Promise<void> => {
    return request<void>('/admin/logs', { method: 'POST', body: JSON.stringify({ userId, messages }) });
};
export const getSystemPrompt = (): Promise<string> => request<{ prompt: string }>('/admin/system-prompt').then(r => r.prompt);
export const saveSystemPrompt = (prompt: string): Promise<void> => {
    return request<void>('/admin/system-prompt', { method: 'POST', body: JSON.stringify({ prompt }) });
};
export const getGreetings = (): Promise<Greeting[]> => request<Greeting[]>('/admin/greetings');
export const saveGreetings = (greetings: Greeting[]): Promise<void> => {
    return request<void>('/admin/greetings', { method: 'POST', body: JSON.stringify({ greetings }) });
};
export const getActiveGreeting = (): Promise<string> => request<{ greeting: string }>('/admin/greetings/active').then(r => r.greeting);
export const saveFeedback = (feedback: Omit<UserFeedback, 'id' | 'submittedAt'>): Promise<void> => {
    return request<void>('/feedback', { method: 'POST', body: JSON.stringify(feedback) });
};
export const getFeedback = (): Promise<UserFeedback[]> => request<UserFeedback[]>('/admin/feedback');
