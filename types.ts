export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system',
}

export interface Message {
  id: string;
  text: string;
  author: MessageAuthor;
  timestamp: number;
}

export enum KnowledgeSourceType {
  TEXT = 'text',
  URL = 'url',
  FILE = 'file',
}

export interface KnowledgeSource {
  id: string;
  type: KnowledgeSourceType;
  content: string; // For TEXT and URL, this is the text/URL itself. For FILE, it's the filename.
  data?: string; // For FILE, this is the file content.
  createdAt: number;
  embedding?: number[]; // Vector embedding for similarity search
}

export interface KnowledgeSourceWithSimilarity {
  source: KnowledgeSource;
  similarity: number;
}

export interface ChatLog {
  id: string;
  userId: string;
  startTime: number;
  endTime: number;
  messages: Message[];
}

export interface SurveyScore {
  dimension: string;
  weight: number;
  score: number | 'N/A';
}

export interface UserFeedback {
  id: string;
  messageId: string;
  userMessage: Message;
  aiMessage: Message;
  chatId: string;
  initialRating: 'good' | 'bad';
  scores: SurveyScore[];
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

export interface User {
  id: string;
  name: string;
  email: string;
  // In a real app, this would be a securely hashed password, not plain text.
  password: string; 
}