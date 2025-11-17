import { useState, useCallback, useEffect } from 'react';
import { Message, MessageAuthor, ChatLog } from '../types';
import * as apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chatLog, setChatLog] = useState<ChatLog | null>(null);
  const { currentUser } = useAuth();
  
  const activeUserId = currentUser?.id || null;

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      const chatLogId = sessionStorage.getItem('chat_log_id');
      if (chatLogId) {
        const existingChatLog = await apiService.getChatLog(chatLogId);
        setChatLog(existingChatLog);
        const history = await apiService.getChatHistory(existingChatLog.id);
        setMessages(history);
      } else {
        const newChatLog = await apiService.createChatLog(activeUserId);
        setChatLog(newChatLog);
        sessionStorage.setItem('chat_log_id', newChatLog.id);

        const activeGreeting = await apiService.getActiveGreeting();
        const greetingMessage = {
            id: `ai_${Date.now()}`,
            text: activeGreeting,
            author: MessageAuthor.AI,
            timestamp: Date.now(),
        };
        setMessages([greetingMessage]);
        await apiService.saveMessage(newChatLog.id, greetingMessage);
      }
      setIsLoading(false);
    };
    loadHistory();
  }, [activeUserId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !chatLog) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      text,
      author: MessageAuthor.USER,
      timestamp: Date.now(),
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    await apiService.saveMessage(chatLog.id, userMessage);
    setIsLoading(true);

    try {
      const historyForApi = updatedMessages
        .filter(m => m.author !== MessageAuthor.SYSTEM)
        .map(m => ({
          role: m.author === MessageAuthor.AI ? 'model' : 'user',
          parts: [{ text: m.text }],
        }));

      const aiResponseText = await apiService.getChatResponse(text, historyForApi);

      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        text: aiResponseText,
        author: MessageAuthor.AI,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      await apiService.saveMessage(chatLog.id, aiMessage);

    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMessage: Message = {
        id: `err_${Date.now()}`,
        text: 'Sorry, I am having trouble connecting. Please try again later.',
        author: MessageAuthor.SYSTEM,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, chatLog]);

  const clearChat = useCallback(async () => {
      if (!chatLog) return;

      await apiService.clearChatHistory(chatLog.id);
      sessionStorage.removeItem('chat_log_id');
      const activeGreeting = await apiService.getActiveGreeting();
      const greetingMessage = {
          id: `ai_${Date.now()}`,
          text: activeGreeting,
          author: MessageAuthor.AI,
          timestamp: Date.now(),
      };
      setMessages([greetingMessage]);
      const newChatLog = await apiService.createChatLog(activeUserId);
      setChatLog(newChatLog);
      sessionStorage.setItem('chat_log_id', newChatLog.id);
      await apiService.saveMessage(newChatLog.id, greetingMessage);
  }, [messages, chatLog, activeUserId]);

  return { messages, isLoading, sendMessage, clearChat };
};
