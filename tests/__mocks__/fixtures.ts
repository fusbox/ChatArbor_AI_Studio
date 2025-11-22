import { Message, MessageAuthor, KnowledgeSource, KnowledgeSourceType, Greeting } from '../../types';

export const mockMessages: Message[] = [
    {
        id: 'msg-1',
        text: 'Hello, how can I help you?',
        author: MessageAuthor.AI,
        timestamp: Date.now() - 10000,
    },
    {
        id: 'msg-2',
        text: 'I need help finding a job',
        author: MessageAuthor.USER,
        timestamp: Date.now() - 5000,
    },
    {
        id: 'msg-3',
        text: 'I can help you with that. What type of job are you looking for?',
        author: MessageAuthor.AI,
        timestamp: Date.now(),
    },
];

export const mockKnowledgeSources: KnowledgeSource[] = [
    {
        id: 'kb-1',
        type: KnowledgeSourceType.TEXT,
        content: 'Resume writing tips for job seekers',
        data: 'Start with a strong summary statement...',
        createdAt: Date.now() - 86400000,
    },
    {
        id: 'kb-2',
        type: KnowledgeSourceType.URL,
        content: 'https://example.com/interview-guide',
        data: 'Interview preparation guide content...',
        createdAt: Date.now() - 172800000,
    },
];

export const mockGreetings: Greeting[] = [
    {
        id: 'greet-1',
        text: 'Welcome to Job Connections AI! How can I help you today?',
        isActive: true,
    },
    {
        id: 'greet-2',
        text: 'Hello! I\'m here to assist with your job search.',
        isActive: false,
    },
];

export const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
};
