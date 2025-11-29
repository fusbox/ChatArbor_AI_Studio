import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface StreamingBubbleProps {
    text: string;
}

const StreamingBubble: React.FC<StreamingBubbleProps> = ({ text }) => {
    const { theme, mode } = useTheme();

    if (!text) return null;

    return (
        <div className="flex items-start gap-2 px-4 justify-start w-full">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-transparent flex items-center justify-center overflow-hidden">
                <img
                    src={theme === 'corporate'
                        ? (mode === 'dark' ? "/va_logo2.svg" : "/va_logo_light2.svg")
                        : (mode === 'dark' ? "/va_logo.svg" : "/va_logo_light.svg")
                    }
                    alt="VA"
                    className="w-full h-full object-contain"
                />
            </div>
            <div className="px-4 py-3 w-full bg-transparent text-text">
                <div className="prose prose-sm max-w-none break-words leading-relaxed text-text prose-headings:text-text prose-p:text-text prose-strong:text-text prose-ul:text-text prose-ol:text-text">
                    <div className="whitespace-pre-wrap">{text}</div>
                    <span className="inline-block w-2 h-4 bg-secondary animate-pulse ml-1"></span>
                </div>
            </div>
        </div>
    );
};

export default StreamingBubble;