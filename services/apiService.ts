import { KnowledgeSource, Message, ChatLog, UserFeedback, Greeting, User } from '../types';
import * as mockApi from './mockApiService';

// --- API Client Service ---
// This service simulates making network requests to a backend.
// In a real app, this would use `fetch` to call a REST or GraphQL API.
// To simulate latency, a small delay is added to each call.

const SIMULATED_LATENCY_MS = 250;

const apiCall = <T>(fn: () => T | Promise<T>): Promise<T> => {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                const result = await fn();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }, SIMULATED_LATENCY_MS);
    });
};

// --- User Management ---
export const getGuestUserId = (): string => mockApi.handleGetGuestUserId();
export const clearGuestUserId = (): void => localStorage.removeItem('guestUserId');

export const signUp = (name: string, email: string, password: string): Promise<User> => {
    return apiCall(() => mockApi.handleSignUp(name, email, password));
};
export const login = (email: string, password: string): Promise<User> => {
    return apiCall(() => mockApi.handleLogin(email, password));
};
export const logout = (): Promise<void> => apiCall(mockApi.handleLogout);
export const getCurrentUser = (): Promise<User | null> => apiCall(mockApi.handleGetCurrentUser);


// --- Knowledge Base ---
export const getKnowledgeBase = (): Promise<KnowledgeSource[]> => apiCall(mockApi.handleGetKnowledgeBase);
export const addKnowledgeSource = (source: Omit<KnowledgeSource, 'id' | 'createdAt' | 'embedding'>): Promise<KnowledgeSource> => {
    return apiCall(() => mockApi.handleAddKnowledgeSource(source));
};
export const updateKnowledgeSource = (updatedSource: KnowledgeSource): Promise<KnowledgeSource> => {
    return apiCall(() => mockApi.handleUpdateKnowledgeSource(updatedSource));
};
export const deleteKnowledgeSource = (id: string): Promise<void> => apiCall(() => mockApi.handleDeleteKnowledgeSource(id));
export const reIndexKnowledgeBase = (): Promise<{ count: number }> => apiCall(mockApi.handleReIndexKnowledgeBase);
export const validateAndScrapeUrl = (url: string): Promise<{ success: boolean; message?: string; content?: string }> => {
    // This has a longer delay to simulate network + scraping time
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockApi.handleValidateAndScrapeUrl(url));
        }, 1500);
    });
};


// --- Chat ---
export const getChatResponse = (userQuery: string, chatHistory: { role: string; parts: { text: string }[] }[]): Promise<string> => {
    // No extra latency here, as Gemini API has its own response time.
    return mockApi.handleGetChatResponse(userQuery, chatHistory);
};


// --- Chat History ---
export const getChatHistory = (userId: string): Promise<Message[]> => apiCall(() => mockApi.handleGetChatHistory(userId));
export const saveMessage = (userId: string, message: Message): Promise<void> => apiCall(() => mockApi.handleSaveMessage(userId, message));
export const saveFullChatHistory = (userId: string, messages: Message[]): Promise<void> => apiCall(() => mockApi.handleSaveFullChatHistory(userId, messages));
export const clearChatHistory = (userId: string): Promise<void> => apiCall(() => mockApi.handleClearChatHistory(userId));

// --- Admin ---
export const getChatLogs = (): Promise<ChatLog[]> => apiCall(mockApi.handleGetChatLogs);
export const saveChatLog = (userId: string, messages: Message[]): Promise<void> => apiCall(() => mockApi.handleSaveChatLog(userId, messages));
export const getSystemPrompt = (): Promise<string> => apiCall(mockApi.handleGetSystemPrompt);
export const saveSystemPrompt = (prompt: string): Promise<void> => apiCall(() => mockApi.handleSaveSystemPrompt(prompt));
export const getGreetings = (): Promise<Greeting[]> => apiCall(mockApi.handleGetGreetings);
export const saveGreetings = (greetings: Greeting[]): Promise<void> => apiCall(() => mockApi.handleSaveGreetings(greetings));
export const getActiveGreeting = (): Promise<string> => apiCall(mockApi.handleGetActiveGreeting);
export const saveFeedback = (feedback: Omit<UserFeedback, 'id' | 'submittedAt'>): Promise<void> => apiCall(() => mockApi.handleSaveFeedback(feedback));
export const getFeedback = (): Promise<UserFeedback[]> => apiCall(mockApi.handleGetFeedback);
