import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StreamingBubble from './StreamingBubble';

describe('StreamingBubble', () => {
    it('renders nothing when text is empty', () => {
        const { container } = render(<StreamingBubble text="" />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders the streaming text', () => {
        const text = 'Streaming content...';
        render(<StreamingBubble text={text} />);
        expect(screen.getByText(text)).toBeInTheDocument();
    });

    it('renders the blinking cursor', () => {
        const { container } = render(<StreamingBubble text="Test" />);
        // The cursor is a span with 'animate-pulse' class
        const cursor = container.querySelector('.animate-pulse');
        expect(cursor).toBeInTheDocument();
    });
});
