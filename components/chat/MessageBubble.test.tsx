import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageBubble from './MessageBubble';
import { Message, MessageAuthor } from '../../types';

describe('MessageBubble', () => {
    const mockOnFeedback = vi.fn();

    beforeEach(() => {
        mockOnFeedback.mockClear();
    });

    describe('User Messages', () => {
        it('renders user message with correct styling', () => {
            const message: Message = {
                id: 'msg-1',
                text: 'Hello, I need help!',
                author: MessageAuthor.USER,
                timestamp: Date.now(),
            };

            render(<MessageBubble message={message} onFeedback={mockOnFeedback} />);

            const messageText = screen.getByText('Hello, I need help!');
            expect(messageText).toBeInTheDocument();

            // Find the bubble container (parent of the prose div)
            // The text is inside ReactMarkdown -> p -> div(prose) -> div(bubble)
            // closest('div') gets the prose div. We need its parent.
            const proseDiv = messageText.closest('div');
            const bubbleContainer = proseDiv?.parentElement;

            expect(bubbleContainer).toHaveClass('bg-primary');
        });

        it('does not show feedback buttons for user messages', () => {
            const message: Message = {
                id: 'msg-1',
                text: 'User message',
                author: MessageAuthor.USER,
                timestamp: Date.now(),
            };

            render(<MessageBubble message={message} onFeedback={mockOnFeedback} />);

            expect(screen.queryByTestId('feedback-good-msg-1')).not.toBeInTheDocument();
            expect(screen.queryByTestId('feedback-bad-msg-1')).not.toBeInTheDocument();
        });
    });

    describe('AI Messages', () => {
        it('renders AI message with correct styling', () => {
            const message: Message = {
                id: 'msg-2',
                text: 'I can help you with that!',
                author: MessageAuthor.AI,
                timestamp: Date.now(),
            };

            render(<MessageBubble message={message} onFeedback={mockOnFeedback} />);

            const messageText = screen.getByText(/I can help you with that!/);
            expect(messageText).toBeInTheDocument();

            // AI messages should have white background
            const proseDiv = messageText.closest('div');
            const bubbleContainer = proseDiv?.parentElement;

            expect(bubbleContainer).not.toHaveClass('bg-primary');
            expect(bubbleContainer).toHaveClass('bg-white');
        });

        it('shows feedback buttons for AI messages', () => {
            const message: Message = {
                id: 'msg-2',
                text: 'AI response',
                author: MessageAuthor.AI,
                timestamp: Date.now(),
            };

            render(<MessageBubble message={message} onFeedback={mockOnFeedback} />);

            expect(screen.getByTestId('feedback-good-msg-2')).toBeInTheDocument();
            expect(screen.getByTestId('feedback-bad-msg-2')).toBeInTheDocument();
        });

        it('calls onFeedback when good button is clicked', async () => {
            const user = userEvent.setup();
            const message: Message = {
                id: 'msg-3',
                text: 'Helpful response',
                author: MessageAuthor.AI,
                timestamp: Date.now(),
            };

            render(<MessageBubble message={message} onFeedback={mockOnFeedback} />);

            const goodButton = screen.getByTestId('feedback-good-msg-3');
            await user.click(goodButton);

            expect(mockOnFeedback).toHaveBeenCalledWith('msg-3', 'good');
            expect(mockOnFeedback).toHaveBeenCalledTimes(1);
        });

        it('calls onFeedback when bad button is clicked', async () => {
            const user = userEvent.setup();
            const message: Message = {
                id: 'msg-4',
                text: 'Unhelpful response',
                author: MessageAuthor.AI,
                timestamp: Date.now(),
            };

            render(<MessageBubble message={message} onFeedback={mockOnFeedback} />);

            const badButton = screen.getByTestId('feedback-bad-msg-4');
            await user.click(badButton);

            expect(mockOnFeedback).toHaveBeenCalledWith('msg-4', 'bad');
            expect(mockOnFeedback).toHaveBeenCalledTimes(1);
        });
    });

    describe('System Messages', () => {
        it('renders system message with centered styling', () => {
            const message: Message = {
                id: 'msg-5',
                text: 'Chat cleared',
                author: MessageAuthor.SYSTEM,
                timestamp: Date.now(),
            };

            render(<MessageBubble message={message} onFeedback={mockOnFeedback} />);

            const messageText = screen.getByText('Chat cleared');
            expect(messageText).toBeInTheDocument();
            expect(messageText).toHaveClass('text-center', 'italic');
        });

        it('does not show feedback buttons for system messages', () => {
            const message: Message = {
                id: 'msg-5',
                text: 'System message',
                author: MessageAuthor.SYSTEM,
                timestamp: Date.now(),
            };

            render(<MessageBubble message={message} onFeedback={mockOnFeedback} />);

            expect(screen.queryByTestId(/feedback-/)).not.toBeInTheDocument();
        });
    });

    describe('Markdown Rendering', () => {
        it('renders markdown links correctly', () => {
            const message: Message = {
                id: 'msg-6',
                text: 'Check out [this link](https://example.com)',
                author: MessageAuthor.AI,
                timestamp: Date.now(),
            };

            render(<MessageBubble message={message} onFeedback={mockOnFeedback} />);

            const link = screen.getByRole('link', { name: 'this link' });
            expect(link).toBeInTheDocument();
            expect(link).toHaveAttribute('href', 'https://example.com');
            expect(link).toHaveAttribute('target', '_blank');
        });

        it('handles null text gracefully', () => {
            const message: Message = {
                id: 'msg-7',
                text: null as any,
                author: MessageAuthor.AI,
                timestamp: Date.now(),
            };

            render(<MessageBubble message={message} onFeedback={mockOnFeedback} />);

            // Should not crash, message container should still render
            expect(screen.getByTestId('feedback-good-msg-7')).toBeInTheDocument();
        });
    });
});
