import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import Spinner from '../shared/Spinner';
import StreamingBubble from './StreamingBubble';
import FeedbackModal from './FeedbackModal';
import { Message, MessageAuthor, UserFeedback } from '../../types';
import * as apiService from '../../services/apiService';
import { useAuth } from '../../contexts/AuthContext';


interface FeedbackState {
  isOpen: boolean;
  userMessage: Message | null;
  aiMessage: Message | null;
  initialRating: 'good' | 'bad';
}

const ChatWindow: React.FC = () => {
  const { messages, isLoading, sendMessage, clearChat, streamingMessage } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { currentUser } = useAuth();

  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    isOpen: false,
    userMessage: null,
    aiMessage: null,
    initialRating: 'good',
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, streamingMessage]);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const handleOpenFeedback = (aiMessageId: string, rating: 'good' | 'bad') => {
    const aiMessageIndex = messages.findIndex(m => m.id === aiMessageId);
    if (aiMessageIndex > 0) {
      const aiMessage = messages[aiMessageIndex];
      // Find the last user message before this AI message
      let userMessage = null;
      for (let i = aiMessageIndex - 1; i >= 0; i--) {
        if (messages[i].author === MessageAuthor.USER) {
          userMessage = messages[i];
          break;
        }
      }

      if (userMessage) {
        setFeedbackState({
          isOpen: true,
          userMessage: userMessage,
          aiMessage: aiMessage,
          initialRating: rating,
        });
      }
    }
  };

  const handleCloseFeedback = () => {
    setFeedbackState({ isOpen: false, userMessage: null, aiMessage: null, initialRating: 'good' });
  };

  const handleSubmitFeedback = async (feedbackData: Omit<UserFeedback, 'id' | 'submittedAt' | 'chatId'>) => {
    const activeUserId = currentUser?.id || apiService.getGuestUserId();
    const fullFeedback = {
      ...feedbackData,
      chatId: `chat_${activeUserId}`,
    };
    await apiService.saveFeedback(fullFeedback);
    handleCloseFeedback();
    // Maybe show a "Thank you for your feedback!" toast message here
  };


  return (
    <div className="flex flex-col h-full bg-neutral-50 max-w-4xl mx-auto border-x border-neutral-200">
      {/* Sticky Header - positioned below main header */}
      <div className="sticky top-[72px] z-10 bg-white border-b border-neutral-200 p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <div>
            <h1 className="font-semibold text-neutral-800">Job Connections AI</h1>
            <p className="text-xs text-neutral-500">Powered by Rangam</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
          data-testid="new-chat-button"
        >
          New Chat
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" data-testid="message-list">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-400 space-y-4 opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>Start a conversation to get help with your job search</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} onFeedback={handleOpenFeedback} />
          ))
        )}
        {isLoading && !streamingMessage && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-neutral-200 rounded-lg p-3 max-w-lg">
              <Spinner />
              <span className="text-neutral-600 italic text-sm">Job Connections AI is thinking...</span>
            </div>
          </div>
        )}
        <StreamingBubble text={streamingMessage || ''} />
        <div ref={messagesEndRef} />
      </div>
      <MessageInput ref={inputRef} onSend={sendMessage} disabled={isLoading} />
      {feedbackState.isOpen && feedbackState.userMessage && feedbackState.aiMessage && (
        <FeedbackModal
          isOpen={feedbackState.isOpen}
          onClose={handleCloseFeedback}
          onSubmit={handleSubmitFeedback}
          userMessage={feedbackState.userMessage}
          aiMessage={feedbackState.aiMessage}
          initialRating={feedbackState.initialRating}
        />
      )}
    </div>
  );
};

export default ChatWindow;