import React from 'react';

interface StreamingBubbleProps {
    text: string;
}

const StreamingBubble: React.FC<StreamingBubbleProps> = ({ text }) => {
    if (!text) return null;

    return (
        <div className="flex items-start gap-2 px-4 justify-start w-full">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-transparent flex items-center justify-center overflow-hidden">
                <img src="/va_logo_light.svg" alt="VA" className="w-full h-full object-contain" />
            </div>
            <div className="px-4 py-3 w-full bg-transparent text-white">
                <div className="prose prose-sm max-w-none break-words prose-invert text-white leading-relaxed">
                    <div className="whitespace-pre-wrap">{text}</div>
                    <span className="inline-block w-2 h-4 bg-brand-blue animate-pulse ml-1"></span>
                </div>
            </div>
        </div>
    );
};

export default StreamingBubble;