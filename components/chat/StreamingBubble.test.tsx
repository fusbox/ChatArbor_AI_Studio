import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StreamingBubble from './StreamingBubble';
import { useTheme } from '../../contexts/ThemeContext';

// Mock useTheme
vi.mock('../../contexts/ThemeContext', () => ({
    useTheme: vi.fn(),
}));

describe('StreamingBubble', () => {
    vi.mocked(useTheme).mockReturnValue({
        theme: 'corporate',
        mode: 'light',
        setTheme: vi.fn(),
        setMode: vi.fn(),
        toggleMode: vi.fn(),
    });

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
