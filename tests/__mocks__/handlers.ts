import { http, HttpResponse } from 'msw';

// Mock API base URL
const API_BASE = '/api';

export const handlers = [
    // Auth
    http.post(`${API_BASE}/auth/signup`, async () => {
        return HttpResponse.json({
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
        });
    }),

    http.post(`${API_BASE}/auth/login`, async () => {
        return HttpResponse.json({
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
        });
    }),

    http.get(`${API_BASE}/auth/me`, async () => {
        return HttpResponse.json({
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
        });
    }),

    // Chat
    http.post(`${API_BASE}/chat`, async ({ request }) => {
        const body = await request.json() as { message: string };
        return HttpResponse.json({
            response: `Mock response to: ${body.message}`,
        });
    }),

    // Knowledge Base
    http.get(`${API_BASE}/knowledge`, async () => {
        return HttpResponse.json([
            {
                id: 'kb-1',
                type: 'text',
                content: 'Sample knowledge',
                createdAt: Date.now(),
            },
        ]);
    }),

    http.post(`${API_BASE}/knowledge`, async () => {
        return HttpResponse.json({
            id: 'kb-new',
            type: 'text',
            content: 'New knowledge',
            createdAt: Date.now(),
        });
    }),

    // Admin
    http.get(`${API_BASE}/admin/system-prompt`, async () => {
        return HttpResponse.json({ prompt: 'Test system prompt' });
    }),

    http.get(`${API_BASE}/admin/greetings`, async () => {
        return HttpResponse.json([
            {
                id: 'greet-1',
                text: 'Hello!',
                isActive: true,
            },
        ]);
    }),
];
