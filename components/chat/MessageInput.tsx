

import React, { useState, forwardRef } from 'react';

interface MessageInputProps {
  onSend: (text: string) => void;
  onClear: () => void;
  disabled: boolean;
}

const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(({ onSend, onClear, disabled }, ref) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text);
      setText('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-white border-t border-neutral-200">
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        <button 
          type="button" 
          onClick={onClear} 
          disabled={disabled}
          title="Start New Conversation"
          className="p-2 rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-primary disabled:opacity-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9a9 9 0 0114.23-5.77M20 15a9 9 0 01-14.23 5.77" /></svg>
        </button>
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about job resources, resume tips, and more..."
          className="flex-1 p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition resize-none"
          rows={1}
          disabled={disabled}
          style={{ maxHeight: '100px' }}
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="bg-primary text-white rounded-full p-3 hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </form>
    </div>
  );
});

export default MessageInput;