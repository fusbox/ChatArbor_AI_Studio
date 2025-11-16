import { useCallback, useEffect, useRef, useState } from 'react';

// Lightweight Web Speech API wrapper
// Gracefully handles lack of browser support.

export interface UseSpeechRecognitionOptions {
  lang?: string;
  interimResults?: boolean;
  continuous?: boolean;
  onResult?: (text: string, isFinal: boolean) => void;
}

interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onaudiostart?: () => void;
  onsoundstart?: () => void;
  onspeechstart?: () => void;
  onstart?: () => void;
  onspeechend?: () => void;
  onsoundend?: () => void;
  onaudioend?: () => void;
  onend?: () => void;
  onerror?: (e: any) => void;
  onresult?: (e: any) => void;
}

function getRecognitionCtor(): { new (): RecognitionLike } | null {
  const w = window as any;
  if (w.SpeechRecognition) return w.SpeechRecognition;
  if (w.webkitSpeechRecognition) return w.webkitSpeechRecognition;
  return null;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const { lang = 'en-US', interimResults = true, continuous = false, onResult } = options;
  const [supported] = useState<boolean>(() => !!getRecognitionCtor());
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<RecognitionLike | null>(null);
  const lastEmittedRef = useRef<string>('');

  const cleanup = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.onresult = undefined;
      rec.onerror = undefined;
      rec.onend = undefined;
      rec.onstart = undefined as any;
      rec.onspeechend = undefined;
      rec.stop();
    } catch {}
    recognitionRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const start = useCallback(() => {
    if (!supported || listening) return;
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError('Speech recognition not supported in this browser.');
      return;
    }
    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = interimResults;
    rec.continuous = continuous;

    rec.onresult = (event: any) => {
      let full = '';
      let isFinal = false;
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        full += res[0]?.transcript ?? '';
        if (res.isFinal) isFinal = true;
      }
      if (!full) return;
      // Emit only the new delta to avoid duplicates
      const prev = lastEmittedRef.current;
      let delta = '';
      if (full.startsWith(prev)) {
        delta = full.slice(prev.length);
      } else {
        // Fallback: compute longest common prefix
        let k = 0;
        const m = Math.min(prev.length, full.length);
        while (k < m && prev[k] === full[k]) k++;
        delta = full.slice(k);
      }
      if (delta) {
        onResult?.(delta, isFinal);
        lastEmittedRef.current = full;
      }
    };

    rec.onerror = (e: any) => {
      setError(e?.error || 'Speech recognition error');
    };

    rec.onend = () => {
      setListening(false);
    };

    recognitionRef.current = rec;
    lastEmittedRef.current = '';
    setError(null);
    setListening(true);
    rec.start();
  }, [supported, listening, lang, interimResults, continuous, onResult]);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {}
  }, []);

  return { supported, listening, error, start, stop } as const;
}

export default useSpeechRecognition;

// Helper to append dictated chunks without double spaces
export function appendDictationText(prev: string, chunk: string): string {
  if (!chunk) return prev;
  if (!prev) return chunk.trimStart();
  const prevEndsWithSpace = /\s$/.test(prev);
  const chunkStartsWithSpaceOrPunct = /^[\s,.!?;:)\]}]/.test(chunk);
  const glue = prevEndsWithSpace || chunkStartsWithSpaceOrPunct ? '' : ' ';
  const normalizedChunk = chunk.replace(/^\s+/, '');
  return prev + glue + normalizedChunk;
}
