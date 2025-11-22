import React, { useState, useEffect } from 'react';

interface ChromaStatusProps {
  className?: string;
}

const ChromaStatus: React.FC<ChromaStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected' | 'disabled'>('checking');
  const USE_CHROMA = ((import.meta as any).env?.VITE_USE_CHROMA === 'true');
  const CHROMA_URL = (import.meta as any).env?.VITE_CHROMA_URL || '/chroma';

  useEffect(() => {
    if (!USE_CHROMA) {
      setStatus('disabled');
      return;
    }

    const checkHealth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${CHROMA_URL}/api/v2/heartbeat`, { 
          signal: controller.signal,
          method: 'GET'
        });
        clearTimeout(timeoutId);
        console.log('[ChromaStatus] Heartbeat response:', res.status, res.ok);
        setStatus(res.ok ? 'connected' : 'disconnected');
      } catch (error) {
        console.error('[ChromaStatus] Heartbeat failed:', error);
        setStatus('disconnected');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [USE_CHROMA, CHROMA_URL]);

  if (status === 'disabled') return null;

  const statusConfig = {
    checking: { color: 'bg-yellow-400', text: 'Checking...', title: 'Checking ChromaDB connection' },
    connected: { color: 'bg-green-500', text: 'Chroma', title: 'ChromaDB connected' },
    disconnected: { color: 'bg-red-500', text: 'Chroma Offline', title: 'ChromaDB disconnected - using local storage fallback' },
  };

  const config = statusConfig[status];

  return (
    <div 
      className={`flex items-center space-x-2 px-3 py-1.5 bg-neutral-700/50 rounded-md ${className}`}
      title={config.title}
    >
      <div className={`w-2 h-2 rounded-full ${config.color} ${status === 'connected' ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-neutral-200 font-medium">{config.text}</span>
    </div>
  );
};

export default ChromaStatus;
