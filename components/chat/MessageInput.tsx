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
    <div className="p-4 md:p-6 bg-transparent">
      {/* 
        Gemini-Style Input Container:
        - Unified rounded border around everything.
        - Input field is transparent with no border.
        - Icons live inside the container.
      */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 p-2 border border-border bg-surface/50 rounded-3xl shadow-inner focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all"
      >
        <textarea
          ref={ref}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask about job resources, resume tips, and more..."
          className="flex-1 p-3 bg-transparent border-none outline-none text-text placeholder-text-muted focus:ring-0 resize-none max-h-[150px] min-h-[44px]"
          rows={1}
          disabled={disabled}
          data-testid="chat-input"
        />

        <div className="flex items-center gap-1 pb-1 pr-1">
          {speechSupported && (
            <button
              type="button"
              onClick={handleToggleRecording}
              disabled={disabled}
              className={`p-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${isRecording
                ? 'bg-red-500/80 text-white hover:bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                : 'text-primary hover:text-text hover:bg-primary/10'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={isRecording ? 'Stop dictation' : 'Start dictation'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>
          )}
          <button
            type="submit"
            disabled={disabled || !text.trim()}
            aria-label="Send message"
            className={`p-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${text.trim() && !disabled
              ? 'bg-primary text-white hover:bg-primary/90 shadow-md'
              : 'text-text-muted hover:bg-primary/10 cursor-not-allowed opacity-50'
              }`}
            data-testid="send-message-button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
});

export default MessageInput;