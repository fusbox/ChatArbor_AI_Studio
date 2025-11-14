import { KnowledgeSource, Message, ChatLog, UserFeedback, Greeting, User, KnowledgeSourceType } from '../types';
import { generateEmbedding } from './geminiService';
import { GoogleGenAI } from "@google/genai";

// --- SIMULATED BACKEND SERVER ---
// This file now acts as a mock backend. The functions in apiService.ts will call these.

// --- Gemini API Setup (SERVER-SIDE) ---
const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

const generateMockResponse = async (prompt: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return `This is a mock response to your query: "${prompt}". In a real environment, I would provide a detailed answer based on the provided knowledge base. Please configure your API_KEY to connect to Gemini.`;
};

// --- Local Storage Helpers ---
const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

const saveToStorage = <T,>(key:string, value: T): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage key “${key}”:`, error);
  }
};


// --- User Management (SERVER-SIDE) ---
const USERS_KEY = 'users';
const CURRENT_USER_KEY = 'currentUser';
const GUEST_USER_ID_KEY = 'guestUserId';

export const handleGetGuestUserId = (): string => {
    let guestId = window.localStorage.getItem(GUEST_USER_ID_KEY);
    if (!guestId) {
        guestId = `guest_${Date.now()}`;
        window.localStorage.setItem(GUEST_USER_ID_KEY, guestId);
    }
    return guestId;
};

export const handleSignUp = (name: string, email: string, password: string): User => {
    const users = getFromStorage<User[]>(USERS_KEY, []);
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        throw new Error('User with this email already exists.');
    }
    const newUser: User = {
        id: `user_${Date.now()}`,
        name,
        email,
        password, // In a real app, hash and salt the password here.
    };
    saveToStorage(USERS_KEY, [...users, newUser]);
    return newUser;
};

export const handleLogin = (email: string, password: string): User => {
    const users = getFromStorage<User[]>(USERS_KEY, []);
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        saveToStorage(CURRENT_USER_KEY, user);
        return user;
    }
    throw new Error('Invalid email or password.');
};

export const handleLogout = (): void => {
    window.localStorage.removeItem(CURRENT_USER_KEY);
};

export const handleGetCurrentUser = (): User | null => {
    return getFromStorage<User | null>(CURRENT_USER_KEY, null);
};


// --- Knowledge Base (Vector DB Simulation on SERVER-SIDE) ---
const KNOWLEDGE_BASE_KEY = 'knowledgeBase';

const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const handleGetKnowledgeBase = (): KnowledgeSource[] => {
  return getFromStorage<KnowledgeSource[]>(KNOWLEDGE_BASE_KEY, []);
};

export const handleAddKnowledgeSource = async (source: Omit<KnowledgeSource, 'id' | 'createdAt' | 'embedding'>): Promise<KnowledgeSource> => {
  const sources = getFromStorage<KnowledgeSource[]>(KNOWLEDGE_BASE_KEY, []);
  const contentToEmbed = source.data || source.content;
  const embedding = await generateEmbedding(contentToEmbed);

  const newSource: KnowledgeSource = {
    ...source,
    id: `ks_${Date.now()}`,
    createdAt: Date.now(),
    embedding,
  };
  saveToStorage(KNOWLEDGE_BASE_KEY, [...sources, newSource]);
  return newSource;
};

export const handleUpdateKnowledgeSource = async (updatedSource: KnowledgeSource): Promise<KnowledgeSource> => {
  let sources = getFromStorage<KnowledgeSource[]>(KNOWLEDGE_BASE_KEY, []);
  const originalSource = sources.find(s => s.id === updatedSource.id);
  const contentToEmbed = updatedSource.data || updatedSource.content;

  if (originalSource && (originalSource.data || originalSource.content) !== contentToEmbed) {
      updatedSource.embedding = await generateEmbedding(contentToEmbed);
  }
  
  sources = sources.map(s => s.id === updatedSource.id ? updatedSource : s);
  saveToStorage(KNOWLEDGE_BASE_KEY, sources);
  return updatedSource;
};

export const handleDeleteKnowledgeSource = (id: string): void => {
  let sources = getFromStorage<KnowledgeSource[]>(KNOWLEDGE_BASE_KEY, []);
  sources = sources.filter(s => s.id !== id);
  saveToStorage(KNOWLEDGE_BASE_KEY, sources);
};

export const handleSearchKnowledgeBase = async (query: string): Promise<KnowledgeSource[]> => {
  const sources = getFromStorage<KnowledgeSource[]>(KNOWLEDGE_BASE_KEY, []);
  if (sources.length === 0) return [];

  const queryEmbedding = await generateEmbedding(query);
  const sourcesWithSimilarity = sources
    .map(source => ({
      source,
      similarity: cosineSimilarity(queryEmbedding, source.embedding || []),
    }))
    .filter(item => item.similarity > 0.5); 

  sourcesWithSimilarity.sort((a, b) => b.similarity - a.similarity);
  return sourcesWithSimilarity.slice(0, 5).map(item => item.source);
};

export const handleReIndexKnowledgeBase = async (): Promise<{ count: number }> => {
    let sources = getFromStorage<KnowledgeSource[]>(KNOWLEDGE_BASE_KEY, []);
    let updatedCount = 0;
    const updatedSources = await Promise.all(sources.map(async (source) => {
        if (!source.embedding || source.embedding.length !== 768) {
            const contentToEmbed = source.data || source.content;
            source.embedding = await generateEmbedding(contentToEmbed);
            updatedCount++;
        }
        return source;
    }));
    saveToStorage(KNOWLEDGE_BASE_KEY, updatedSources);
    return { count: updatedCount };
};

export const handleValidateAndScrapeUrl = (url: string): { success: boolean; message?: string; content?: string } => {
    try {
        const parsedUrl = new URL(url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          return { success: false, message: 'Only http and https URLs are allowed.' };
        }
        if (parsedUrl.hostname.includes('broken-link.com')) {
           return { success: false, message: 'This URL appears to be broken or inaccessible.' };
        }
        return {
          success: true,
          content: `[Simulated Content] This is the scraped text from ${url}. It includes relevant information for job seekers.`
        };
      } catch (_) {
        return { success: false, message: 'Invalid URL format. Please include http:// or https://' };
      }
};

// --- Chat Logic (SERVER-SIDE) ---
export const handleGetChatResponse = async (
  userQuery: string,
  chatHistory: { role: string; parts: { text: string }[] }[]
): Promise<string> => {
  if (!ai) {
    return generateMockResponse(userQuery);
  }

  const model = 'gemini-2.5-flash';
  const knowledgeContext = await handleSearchKnowledgeBase(userQuery);
  const contextText = knowledgeContext
    .map(source => `Source (${source.type}):\n${source.data || source.content}`)
    .join('\n\n---\n\n');

  const systemInstruction = await handleGetSystemPrompt();
  
  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: [
            ...chatHistory,
            { role: 'user', parts: [{text: `Context:\n${contextText}\n\nQuestion: ${userQuery}`}] }
        ],
        config: { systemInstruction }
    });
    return response.text;
  } catch (error) {
    console.error("Error generating content:", error);
    return "I'm sorry, I encountered an error while processing your request. Please try again later.";
  }
};

// --- Chat History (SERVER-SIDE) ---
export const handleGetChatHistory = (userId: string): Message[] => {
  return getFromStorage<Message[]>(`chatHistory_${userId}`, []);
};

export const handleSaveMessage = (userId: string, message: Message): void => {
  const messages = getFromStorage<Message[]>(`chatHistory_${userId}`, []);
  saveToStorage(`chatHistory_${userId}`, [...messages, message]);
};

export const handleSaveFullChatHistory = (userId: string, messages: Message[]): void => {
    saveToStorage(`chatHistory_${userId}`, messages);
};

export const handleClearChatHistory = (userId: string): void => {
    saveToStorage(`chatHistory_${userId}`, []);
}

// --- Chat Logs (for admin on SERVER-SIDE) ---
const CHAT_LOGS_KEY = 'chatLogs';
export const handleGetChatLogs = (): ChatLog[] => {
  return getFromStorage<ChatLog[]>(CHAT_LOGS_KEY, []);
}

export const handleSaveChatLog = (userId: string, messages: Message[]): void => {
    if (messages.length === 0) return;
    const logs = getFromStorage<ChatLog[]>(CHAT_LOGS_KEY, []);
    const newLog: ChatLog = {
        id: `log_${Date.now()}`,
        userId: userId,
        startTime: messages[0].timestamp,
        endTime: messages[messages.length - 1].timestamp,
        messages: messages,
    };
    saveToStorage(CHAT_LOGS_KEY, [...logs, newLog]);
}

// --- System Prompt (SERVER-SIDE) ---
const SYSTEM_PROMPT_KEY = 'systemPrompt';
const DEFAULT_SYSTEM_PROMPT = `You are a helpful and encouraging AI assistant for job seekers. Your name is Job Connections AI.
Use the provided context from our knowledge base to answer the user's questions accurately.
If the answer is not in the context, say that you don't have information on that topic but can help with other job-seeking questions.
Keep your responses concise, clear, and positive. Format your responses with markdown for better readability.`;

export const handleGetSystemPrompt = (): string => {
    return getFromStorage<string>(SYSTEM_PROMPT_KEY, DEFAULT_SYSTEM_PROMPT);
};

export const handleSaveSystemPrompt = (prompt: string): void => {
    saveToStorage(SYSTEM_PROMPT_KEY, prompt);
};

// --- Greetings (SERVER-SIDE) ---
const GREETINGS_KEY = 'greetings';
const DEFAULT_GREETINGS: Greeting[] = [
    { id: 'greet_1', text: "Hello! I'm the Job Connections AI Assistant. How can I help you find a job today?", isActive: true },
    { id: 'greet_2', text: "Welcome to the job portal! I can help you with your job search. What are you looking for?", isActive: false },
];

export const handleGetGreetings = (): Greeting[] => {
    return getFromStorage<Greeting[]>(GREETINGS_KEY, DEFAULT_GREETINGS);
};

export const handleSaveGreetings = (greetings: Greeting[]): void => {
    saveToStorage(GREETINGS_KEY, greetings);
};

export const handleGetActiveGreeting = (): string => {
    const greetings = handleGetGreetings();
    const activeGreeting = greetings.find(g => g.isActive);
    return activeGreeting ? activeGreeting.text : DEFAULT_GREETINGS[0].text;
};

// --- User Feedback (SERVER-SIDE) ---
const FEEDBACK_KEY = 'userFeedback';
export const handleSaveFeedback = (feedback: Omit<UserFeedback, 'id' | 'submittedAt'>): void => {
    const allFeedback = getFromStorage<UserFeedback[]>(FEEDBACK_KEY, []);
    const newFeedback: UserFeedback = { 
      ...feedback, 
      id: `fb_${Date.now()}`,
      submittedAt: Date.now()
    };
    saveToStorage(FEEDBACK_KEY, [...allFeedback, newFeedback]);
};

export const handleGetFeedback = (): UserFeedback[] => {
    return getFromStorage<UserFeedback[]>(FEEDBACK_KEY, []);
}