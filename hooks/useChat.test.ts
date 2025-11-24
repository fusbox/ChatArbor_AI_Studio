import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useChat } from './useChat';
import * as apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { Message, MessageAuthor } from '../types';

vi.mock('../services/apiService');
vi.mock('../contexts/AuthContext');

const mockApiService = apiService as vi.Mocked<typeof apiService>;
const mockUseAuth = useAuth as vi.Mock;

const MOCK_USER_ID = 'user_123';
const MOCK_GUEST_ID = 'guest_456';
const GREETING_MESSAGE = 'Hello! How can I help?';
const AI_RESPONSE = 'This is a helpful AI response.';

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiService.getActiveGreeting.mockResolvedValue(GREETING_MESSAGE);
    mockApiService.getChatResponse.mockResolvedValue(AI_RESPONSE);
    mockApiService.saveMessage.mockResolvedValue(undefined);
    mockApiService.clearChatHistory.mockResolvedValue(undefined);
    mockApiService.saveChatLog.mockResolvedValue(undefined);
  });

  it('should initialize with a greeting message if history is empty', async () => {
    mockUseAuth.mockReturnValue({ currentUser: { id: MOCK_USER_ID } });
    mockApiService.getChatHistory.mockResolvedValue([]);

    const { result } = renderHook(() => useChat());

    await act(async () => {
      // Let useEffects run
    });

    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0].text).toBe(GREETING_MESSAGE);
    expect(result.current.messages[0].author).toBe(MessageAuthor.AI);
    expect(mockApiService.getChatHistory).toHaveBeenCalledWith(MOCK_USER_ID);
    expect(mockApiService.saveMessage).toHaveBeenCalled();
  });

  it('should load existing chat history', async () => {
    const mockHistory: Message[] = [
      { id: '1', text: 'Hello', author: MessageAuthor.USER, timestamp: Date.now() },
      { id: '2', text: 'Hi there', author: MessageAuthor.AI, timestamp: Date.now() },
    ];
    mockUseAuth.mockReturnValue({ currentUser: { id: MOCK_USER_ID } });
    mockApiService.getChatHistory.mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useChat());

    await act(async () => { });

    expect(result.current.messages).toEqual(mockHistory);
  });

  it('should handle sending a message and receiving a streaming response', async () => {
    mockUseAuth.mockReturnValue({ currentUser: { id: MOCK_USER_ID } });
    mockApiService.getChatHistory.mockResolvedValue([]);

    // Mock streaming response
    mockApiService.streamChatResponse.mockImplementation(async (text, history, onChunk, onUsage) => {
      onChunk('This ');
      onChunk('is ');
      onChunk('a ');
      onChunk('response.');
      onUsage({ promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 });
    });

    const { result } = renderHook(() => useChat());

    // Wait for initial greeting
    await act(async () => { });

    await act(async () => {
      result.current.sendMessage('Test message');
    });

    // After sending, we should have the greeting, the user message, and the AI response
    expect(result.current.messages.length).toBe(3);
    expect(result.current.messages[1].text).toBe('Test message');
    expect(result.current.messages[1].author).toBe(MessageAuthor.USER);
    expect(result.current.messages[2].text).toBe('This is a response.');
    expect(result.current.messages[2].author).toBe(MessageAuthor.AI);

    expect(result.current.isLoading).toBe(false);
    expect(mockApiService.streamChatResponse).toHaveBeenCalled();
    expect(result.current.usageMetadata).toEqual({ promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 });

    // saveMessage called for greeting, user message, and AI message
    expect(mockApiService.saveMessage).toHaveBeenCalledTimes(3);
  });

  it('should use guest user ID when no user is logged in', async () => {
    mockUseAuth.mockReturnValue({ currentUser: null });
    mockApiService.getGuestUserId.mockReturnValue(MOCK_GUEST_ID);
    mockApiService.getChatHistory.mockResolvedValue([]);

    const { result } = renderHook(() => useChat());

    await act(async () => { });

    expect(mockApiService.getChatHistory).toHaveBeenCalledWith(MOCK_GUEST_ID);

    await act(async () => {
      result.current.sendMessage('Guest message');
    });

    expect(mockApiService.saveMessage).toHaveBeenCalledWith(MOCK_GUEST_ID, expect.any(Object));
  });

  it('should clear chat, save log, and show a new greeting', async () => {
    const mockHistory: Message[] = [
      { id: '1', text: 'Hello', author: MessageAuthor.USER, timestamp: Date.now() },
      { id: '2', text: 'Hi there', author: MessageAuthor.AI, timestamp: Date.now() },
    ];
    mockUseAuth.mockReturnValue({ currentUser: { id: MOCK_USER_ID } });
    mockApiService.getChatHistory.mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useChat());

    // Wait for history to load
    await act(async () => { });

    expect(result.current.messages.length).toBe(2);

    await act(async () => {
      result.current.clearChat();
    });

    expect(mockApiService.saveChatLog).toHaveBeenCalledWith(MOCK_USER_ID, mockHistory);
    expect(mockApiService.clearChatHistory).toHaveBeenCalledWith(MOCK_USER_ID);
    expect(result.current.messages.length).toBe(1);
    expect(result.current.messages[0].text).toBe(GREETING_MESSAGE);
  });
});
