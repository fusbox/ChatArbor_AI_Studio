import { KnowledgeSource, Message, ChatLog, UserFeedback, Greeting, User, KnowledgeSourceType } from '../types.js';
import { supabase } from './supabaseClient';

// --- User Management ---
export const getGuestUserId = (): string => {
    let guestId = localStorage.getItem('guestUserId');
    if (!guestId) {
        guestId = `guest_${Date.now()}`;
        localStorage.setItem('guestUserId', guestId);
    }
    return guestId;
};
export const clearGuestUserId = (): void => {
    localStorage.removeItem('guestUserId');
};

// --- Knowledge Base ---
export const getKnowledgeBase = async (): Promise<KnowledgeSource[]> => {
    const { data, error } = await supabase.from('knowledge_sources').select('*');
    if (error) throw error;
    return data;
};

export const addKnowledgeSource = async (source: Omit<KnowledgeSource, 'id' | 'createdAt' | 'embedding'>): Promise<KnowledgeSource> => {
    const { data, error } = await supabase.from('knowledge_sources').insert(source).single();
    if (error) throw error;
    return data;
};

export const updateKnowledgeSource = async (updatedSource: KnowledgeSource): Promise<KnowledgeSource> => {
    const { data, error } = await supabase.from('knowledge_sources').update(updatedSource).eq('id', updatedSource.id).single();
    if (error) throw error;
    return data;
};

export const deleteKnowledgeSource = async (id: string): Promise<void> => {
    const { error } = await supabase.from('knowledge_sources').delete().eq('id', id);
    if (error) throw error;
};

export const reIndexKnowledgeBase = async (): Promise<{ count: number }> => {
    const { data, error } = await supabase.functions.invoke('reindex-knowledge-base');
    if (error) throw error;
    return data;
};

export const validateAndScrapeUrl = (url: string): Promise<{ success: boolean; message?: string; content?: string }> => {
    // This will be replaced with a call to a Supabase Edge Function
    return Promise.resolve({ success: true, content: `[Simulated Content] This is the scraped text from ${url}.` });
};

// --- Chat ---
export const getChatResponse = async (userQuery: string, chatHistory: { role: string; parts: { text: string }[] }[]): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('get-chat-response', {
        body: { query: userQuery, history: chatHistory },
    });
    if (error) throw error;
    return data;
};

// --- Chat History ---
export const createChatLog = async (userId: string | null): Promise<ChatLog> => {
    const { data, error } = await supabase.from('chat_logs').insert({ user_id: userId }).single();
    if (error) throw error;
    return data;
};

export const getChatLog = async (chatLogId: string): Promise<ChatLog> => {
    const { data, error } = await supabase.from('chat_logs').select('*').eq('id', chatLogId).single();
    if (error) throw error;
    return data;
};

export const getChatHistory = async (chatLogId: string): Promise<Message[]> => {
    const { data, error } = await supabase.from('messages').select('*').eq('chat_log_id', chatLogId);
    if (error) throw error;
    return data;
};

export const saveMessage = async (chatLogId: string, message: Message): Promise<void> => {
    const { error } = await supabase.from('messages').insert({ ...message, chat_log_id: chatLogId });
    if (error) throw error;
};

export const saveFullChatHistory = async (chatLogId: string, messages: Message[]): Promise<void> => {
    const { error } = await supabase.from('messages').insert(messages.map(m => ({ ...m, chat_log_id: chatLogId })));
    if (error) throw error;
};

export const clearChatHistory = async (chatLogId: string): Promise<void> => {
    const { error } = await supabase.from('messages').delete().eq('chat_log_id', chatLogId);
    if (error) throw error;
};

// --- Admin ---
export const getChatLogs = async (): Promise<ChatLog[]> => {
    const { data, error } = await supabase.from('chat_logs').select('*');
    if (error) throw error;
    return data;
};

export const saveChatLog = async (userId: string, messages: Message[]): Promise<void> => {
    const { data, error } = await supabase.from('chat_logs').insert({ user_id: userId }).single();
    if (error) throw error;
    await saveFullChatHistory(data.id, messages);
};

export const getSystemPrompt = async (): Promise<string> => {
    const { data, error } = await supabase.from('system_prompts').select('content').single();
    if (error) throw error;
    return data.content;
};

export const saveSystemPrompt = async (prompt: string): Promise<void> => {
    const { error } = await supabase.from('system_prompts').update({ content: prompt }).eq('id', 1);
    if (error) throw error;
};

export const getGreetings = async (): Promise<Greeting[]> => {
    const { data, error } = await supabase.from('greetings').select('*');
    if (error) throw error;
    return data;
};

export const saveGreetings = async (greetings: Greeting[]): Promise<void> => {
    const { error } = await supabase.from('greetings').upsert(greetings);
    if (error) throw error;
};

export const getActiveGreeting = async (): Promise<string> => {
    const { data, error } = await supabase.from('greetings').select('text').eq('is_active', true).single();
    if (error) throw error;
    return data.text;
};

export const saveFeedback = async (feedback: Omit<UserFeedback, 'id' | 'submittedAt'>): Promise<void> => {
    const { error } = await supabase.from('feedback').insert(feedback);
    if (error) throw error;
};

export const getFeedback = async (): Promise<UserFeedback[]> => {
    const { data, error } = await supabase.from('feedback').select('*');
    if (error) throw error;
    return data;
};
