import { useState, useCallback, useEffect } from 'react';
import { Message, MessageAuthor } from '../types';
import * as apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [streamingMessage, setStreamingMessage] = useState<string>(''); // For real-time streaming text
  const [usageMetadata, setUsageMetadata] = useState<any>(null);
  const { currentUser } = useAuth();

  const activeUserId = currentUser?.id || apiService.getGuestUserId();

  useEffect(() => {
    if (!activeUserId) return;

    const loadHistory = async () => {
      setIsLoading(true);
      const history = await apiService.getChatHistory(activeUserId);
      if (history.length === 0) {
        const activeGreeting = await apiService.getActiveGreeting();
        const greetingMessage = {
          id: `ai_${Date.now()}`,
          text: activeGreeting,
          author: MessageAuthor.AI,
          timestamp: Date.now(),
        };
        setMessages([greetingMessage]);
        await apiService.saveMessage(activeUserId, greetingMessage);
      } else {
        setMessages(history);
      }
      setIsLoading(false);
    };
    loadHistory();
  }, [activeUserId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !activeUserId) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      text,
      author: MessageAuthor.USER,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    await apiService.saveMessage(activeUserId, userMessage);
    setIsLoading(true);
    setStreamingMessage(''); // Reset streaming message

    try {
      const historyForApi = updatedMessages
        .filter(m => m.author !== MessageAuthor.SYSTEM)
        .map(m => ({
          role: m.author === MessageAuthor.AI ? 'model' : 'user',
          parts: [{ text: m.text }],
        }));

      // Use streaming API
      let fullResponse = '';

      await apiService.streamChatResponse(
        text,
        historyForApi,
        (chunk) => {
          fullResponse += chunk;
          setStreamingMessage(fullResponse);
          setIsLoading(false); // Show streaming immediately
        },
        (metadata) => {
          setUsageMetadata(metadata);
          console.log('📊 Usage:', metadata);
        }
      );

      // Create final AI message
      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        text: fullResponse,
        author: MessageAuthor.AI,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setStreamingMessage(''); // Clear streaming state
      await apiService.saveMessage(activeUserId, aiMessage);

    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMessage: Message = {
        id: `err_${Date.now()}`,
        text: 'Sorry, I am having trouble connecting. Please try again later.',
        author: MessageAuthor.SYSTEM,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setStreamingMessage('');
    } finally {
      setIsLoading(false);
    }
  }, [messages, activeUserId]);

  const clearChat = useCallback(async () => {
    if (!activeUserId) return;

    if (messages.length > 1) {
      await apiService.saveChatLog(activeUserId, messages);
    }
    await apiService.clearChatHistory(activeUserId);
    const activeGreeting = await apiService.getActiveGreeting();
    const greetingMessage = {
      id: `ai_${Date.now()}`,
      text: activeGreeting,
      author: MessageAuthor.AI,
      timestamp: Date.now(),
    };
    setMessages([greetingMessage]);
    await apiService.saveMessage(activeUserId, greetingMessage);
  }, [messages, activeUserId]);

  return { messages, isLoading, sendMessage, clearChat, streamingMessage, usageMetadata };
};
