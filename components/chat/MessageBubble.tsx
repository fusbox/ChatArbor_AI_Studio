import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, MessageAuthor } from '../../types';

interface MessageBubbleProps {
  message: Message;
  onFeedback: (messageId: string, rating: 'good' | 'bad') => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onFeedback }) => {
  const isUser = message.author === MessageAuthor.USER;
  const isSystem = message.author === MessageAuthor.SYSTEM;

  if (isSystem) {
    return (
      <div className="text-center text-xs text-neutral-500 italic my-2">
        {message.text || ''}
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 px-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
          A
        </div>
      )}
      <div className={`px-4 py-3 rounded-xl max-w-lg shadow-sm ${isUser ? 'bg-primary text-white rounded-br-none' : 'bg-white text-neutral-800 rounded-bl-none'}`}>
        <div className={`prose prose-sm max-w-none break-words ${isUser ? 'prose-invert text-white' : 'text-neutral-800'}`}>
          <ReactMarkdown
            components={{
              a: ({ node, ...props }) => <a {...props} className="underline font-medium hover:opacity-80" target="_blank" rel="noopener noreferrer" />
            }}
          >
            {message.text || ''}
          </ReactMarkdown>
        </div>
        {!isUser && (
          <div className="mt-2 pt-2 border-t border-neutral-200/50 flex items-center justify-end space-x-2">
            <span className="text-xs text-neutral-400">Helpful?</span>
            <button
              onClick={() => onFeedback(message.id, 'good')}
              className="p-1 rounded-full hover:bg-emerald-100 text-neutral-500 hover:text-emerald-600 transition-colors"
              data-testid={`feedback-good-${message.id}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 18.236V6.223c0-.447.335-.826.778-.926l2.062-.262a3 3 0 012.16.155L14 6V5a2 2 0 012-2h1a2 2 0 012 2v1h-3z" /></svg>
            </button>
            <button
              onClick={() => onFeedback(message.id, 'bad')}
              className="p-1 rounded-full hover:bg-red-100 text-neutral-500 hover:text-red-600 transition-colors"
              data-testid={`feedback-bad-${message.id}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.738 3h4.017c.163 0 .326.02.485.06L17 5.764v12.013c0 .447-.335.826-.778.926l-2.062.262a3 3 0 01-2.16-.155L10 18v1a2 2 0 01-2 2h-1a2 2 0 01-2-2v-1h3z" /></svg>
            </button>
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
          U
        </div>
      )}
    </div>
  );
};

export default MessageBubble;