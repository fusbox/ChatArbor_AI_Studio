import React from 'react';

interface StreamingBubbleProps {
    text: string;
}

const StreamingBubble: React.FC<StreamingBubbleProps> = ({ text }) => {
    if (!text) return null;

    return (
        <div className="flex items-end gap-2 px-4 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white font-bold">
                A
            </div>
            <div className="px-4 py-3 rounded-xl max-w-lg shadow-sm bg-white text-neutral-800 rounded-bl-none">
                <div className="prose prose-sm max-w-none break-words text-neutral-800">
                    <div className="whitespace-pre-wrap">{text}</div>
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1"></span>
                </div>
            </div>
        </div>
    );
};

export default StreamingBubble;