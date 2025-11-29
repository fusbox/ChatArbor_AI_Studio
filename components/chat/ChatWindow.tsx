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
      userMessageId: feedbackState.userMessage?.id || '',
      aiMessageId: feedbackState.aiMessage?.id || '',
    };
    await apiService.saveFeedback(fullFeedback);
    handleCloseFeedback();
  };


  return (
    <>
      <div className="flex flex-col h-full w-full max-w-4xl mx-auto overflow-hidden relative">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar" data-testid="message-list">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-brand-grey space-y-6 opacity-70">
              <div className="relative">
                <div className="absolute inset-0 bg-brand-blue/20 blur-xl rounded-full"></div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 relative z-10 text-brand-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="text-lg font-light tracking-wide">Initialize conversation sequence...</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} onFeedback={handleOpenFeedback} />
            ))
          )}
          {isLoading && !streamingMessage && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-3 bg-brand-purple/20 backdrop-blur-sm border border-brand-purple/30 rounded-lg p-4 max-w-lg">
                <Spinner />
                <span className="text-brand-blue italic text-sm tracking-wide">Processing input...</span>
              </div>
            </div>
          )}
          <StreamingBubble text={streamingMessage || ''} />
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area - Fixed at bottom via flex layout */}
        <div className="flex-none p-4 bg-transparent">
          <MessageInput ref={inputRef} onSend={sendMessage} disabled={isLoading} />
        </div>

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

      {/* New Session Button - Fixed at bottom left */}
      <button
        onClick={clearChat}
        className="app-button app-button-secondary fixed bottom-8 left-8 px-4 py-2 text-sm z-50 shadow-lg"
        data-testid="new-chat-button"
      >
        New Session
      </button>
    </>
  );
};

export default ChatWindow;