

import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../../hooks/useChat';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import Spinner from '../shared/Spinner';
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
  const { messages, isLoading, sendMessage, clearChat } = useChat();
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

  useEffect(scrollToBottom, [messages]);
  
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
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onFeedback={handleOpenFeedback} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-neutral-200 rounded-lg p-3 max-w-lg">
              <Spinner />
              <span className="text-neutral-600 italic text-sm">Job Connections AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput ref={inputRef} onSend={sendMessage} onClear={clearChat} disabled={isLoading} />
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