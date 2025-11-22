import React, { useState, forwardRef, useRef, useEffect } from 'react';

// Web Speech API type definitions
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
}

const MessageInput = forwardRef<HTMLTextAreaElement, MessageInputProps>(({ onSend, disabled }, ref) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let newFinalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            newFinalTranscript += transcriptPart;
          } else {
            interimTranscript += transcriptPart;
          }
        }

        if (newFinalTranscript) {
          const separator = finalTranscriptRef.current.length > 0 && !finalTranscriptRef.current.endsWith(' ') ? ' ' : '';
          finalTranscriptRef.current += separator + newFinalTranscript.trim();
        }

        setText(finalTranscriptRef.current + (interimTranscript ? ' ' + interimTranscript : ''));
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access was denied. Please allow microphone access in your browser settings to use dictation.');
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      };
    }
  }, []);

  const handleToggleRecording = () => {
    if (disabled || !recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      finalTranscriptRef.current = text;
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text);
      setText('');
      finalTranscriptRef.current = '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    if (isRecording) {
      finalTranscriptRef.current = newText;
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
        <textarea
          ref={ref}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask about job resources, resume tips, and more..."
          className="flex-1 p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition resize-none"
          rows={1}
          disabled={disabled}
          style={{ maxHeight: '100px' }}
          data-testid="chat-input"
        />
        {speechSupported && (
          <button
            type="button"
            onClick={handleToggleRecording}
            disabled={disabled}
            className={`p-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${isRecording
                ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 focus:ring-neutral-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={isRecording ? 'Stop dictation' : 'Start dictation'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14a3 3 0 003-3V7a3 3 0 10-6 0v4a3 3 0 003 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0M12 19v3" />
            </svg>
          </button>
        )}
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          aria-label="Send message"
          className="bg-primary text-white rounded-full p-3 hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors"
          data-testid="send-message-button"
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