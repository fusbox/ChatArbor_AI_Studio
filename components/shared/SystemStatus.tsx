import React, { useState, useEffect } from 'react';

const SystemStatus: React.FC = () => {
    const [chromaStatus, setChromaStatus] = useState<'checking' | 'connected' | 'disconnected' | 'disabled'>('checking');
    const USE_CHROMA = ((import.meta as any).env?.VITE_USE_CHROMA === 'true');

    // Chat status is currently hardcoded as we don't have a global connection state yet,
    // but this structure allows for easy integration later.
    const chatStatus = 'connected';

    useEffect(() => {
        if (!USE_CHROMA) {
            setChromaStatus('disabled');
            return;
        }

        const checkHealth = async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const res = await fetch('/api/vectors/health', {
                    signal: controller.signal,
                    method: 'GET'
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    setChromaStatus(data.status === 'connected' ? 'connected' : 'disconnected');
                } else {
                    setChromaStatus('disconnected');
                }
            } catch (error) {
                console.error('[SystemStatus] Chroma health check failed:', error);
                setChromaStatus('disconnected');
            }
        };

        checkHealth();
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, [USE_CHROMA]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'connected': return 'bg-green-400';
            case 'disconnected': return 'bg-red-400';
            case 'checking': return 'bg-yellow-400';
            case 'disabled': return 'bg-gray-400';
            default: return 'bg-gray-400';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'connected': return 'Online';
            case 'disconnected': return 'Offline';
            case 'checking': return '...';
            case 'disabled': return 'Disabled';
            default: return 'Unknown';
        }
    };

    return (
        <div className="flex flex-col justify-center space-y-1 py-1">
            {/* Chat Status */}
            <div className="flex items-center space-x-2">
                <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(chatStatus)} ${chatStatus === 'connected' ? 'animate-pulse' : ''}`} />
                <span className="text-[10px] font-medium uppercase tracking-wider text-brand-grey/80 leading-none">
                    Chat <span className="opacity-70 ml-1">{getStatusText(chatStatus)}</span>
                </span>
            </div>

            {/* Chroma Status */}
            {chromaStatus !== 'disabled' && (
                <div className="flex items-center space-x-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(chromaStatus)} ${chromaStatus === 'connected' ? 'animate-pulse' : ''}`} />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-brand-grey/80 leading-none">
                        Chroma <span className="opacity-70 ml-1">{getStatusText(chromaStatus)}</span>
                    </span>
                </div>
            )}
        </div>
    );
};

export default SystemStatus;
