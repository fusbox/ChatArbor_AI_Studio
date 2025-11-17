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
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
        }
        Insert: {
          id: string
          name: string
          email: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
        }
      },
      knowledge_sources: {
        Row: {
          id: string
          user_id: string
          type: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          content?: string
          created_at?: string
        }
      },
      document_chunks: {
        Row: {
          id: string
          knowledge_source_id: string
          content: string
          embedding: number[]
          created_at: string
        }
        Insert: {
          id?: string
          knowledge_source_id: string
          content: string
          embedding: number[]
          created_at?: string
        }
        Update: {
          id?: string
          knowledge_source_id?: string
          content?: string
          embedding?: number[]
          created_at?: string
        }
      },
      chat_logs: {
        Row: {
          id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
        }
      },
      messages: {
        Row: {
          id: string
          chat_log_id: string
          author: string
          text: string
          timestamp: string
        }
        Insert: {
          id?: string
          chat_log_id: string
          author: string
          text: string
          timestamp?: string
        }
        Update: {
          id?: string
          chat_log_id?: string
          author?: string
          text?: string
          timestamp?: string
        }
      },
      feedback: {
        Row: {
          id: string
          message_id: string
          user_message: string
          ai_message: string
          chat_id: string
          initial_rating: string
          comment: string | null
          submitted_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_message: string
          ai_message: string
          chat_id: string
          initial_rating: string
          comment?: string | null
          submitted_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_message?: string
          ai_message?: string
          chat_id?: string
          initial_rating?: string
          comment?: string | null
          submitted_at?: string
        }
      },
      greetings: {
        Row: {
          id: string
          text: string
          is_active: boolean
        }
        Insert: {
          id?: string
          text: string
          is_active?: boolean
        }
        Update: {
          id?: string
          text?: string
          is_active?: boolean
        }
      }
    }
  }
}
