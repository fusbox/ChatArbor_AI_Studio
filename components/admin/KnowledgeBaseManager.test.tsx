import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import KnowledgeBaseManager from './KnowledgeBaseManager';
import * as apiService from '../../services/apiService';
import { KnowledgeSource, KnowledgeSourceType } from '../../types';

vi.mock('../../services/apiService');

// Use runtime helper instead of type namespace
const mockApiService = vi.mocked(apiService, true);

const mockSources: KnowledgeSource[] = [
    { id: '1', type: KnowledgeSourceType.TEXT, content: 'This is a test source.', createdAt: Date.now(), embedding: [0.1] },
    { id: '2', type: KnowledgeSourceType.URL, content: 'https://example.com', data: 'Example content', createdAt: Date.now() - 1000, embedding: [0.2] },
];

describe('KnowledgeBaseManager', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockApiService.getKnowledgeBase.mockResolvedValue(mockSources);
        mockApiService.addKnowledgeSource.mockResolvedValue({ ...mockSources[0], id: '3' });
        mockApiService.deleteKnowledgeSource.mockResolvedValue(undefined);
    });

    it('renders and fetches initial knowledge sources', async () => {
        render(<KnowledgeBaseManager />);
        expect(screen.getByText('Knowledge Base Manager')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText((_content, element) => {
                return element?.textContent === 'This is a test source....';
            })).toBeInTheDocument();
            expect(screen.getByText('https://example.com')).toBeInTheDocument();
        });

        expect(mockApiService.getKnowledgeBase).toHaveBeenCalledTimes(1);
    });

    it('allows a user to add a new text source', async () => {
        const user = userEvent.setup();
        render(<KnowledgeBaseManager />);

        const textarea = screen.getByPlaceholderText(/Paste plain text content here/i);
        await user.type(textarea, 'New knowledge from text.');

        const addButton = screen.getByRole('button', { name: /Add Source/i });
        await user.click(addButton);

        await waitFor(() => {
            expect(mockApiService.addKnowledgeSource).toHaveBeenCalledWith({
                type: KnowledgeSourceType.TEXT,
                content: 'New knowledge from text.',
            });
        });

        // It should also re-fetch the list
        expect(mockApiService.getKnowledgeBase).toHaveBeenCalledTimes(2);
    });

    it('validates and adds a new URL source', async () => {
        const user = userEvent.setup();
        mockApiService.validateAndScrapeUrl.mockImplementation(() =>
            new Promise(resolve =>
                setTimeout(() => resolve({ success: true, content: 'Scraped content' }), 100)
            )
        );

        render(<KnowledgeBaseManager />);

        const urlTab = screen.getByRole('button', { name: 'url' });
        await user.click(urlTab);

        const input = screen.getByPlaceholderText('https://example.com/job-resources');
        await user.type(input, 'https://valid-url.com');

        const addButton = screen.getByRole('button', { name: /Add Source/i });
        await user.click(addButton);

        // Wait for the loading state which changes the label
        const validatingBtn = await screen.findByRole('button', { name: /Validating URL/i });
        expect(validatingBtn).toHaveAttribute('aria-busy', 'true');

        await waitFor(() => {
            expect(mockApiService.validateAndScrapeUrl).toHaveBeenCalledWith('https://valid-url.com');
        });

        await waitFor(() => {
            expect(mockApiService.addKnowledgeSource).toHaveBeenCalledWith({
                type: KnowledgeSourceType.URL,
                content: 'https://valid-url.com',
                data: 'Scraped content',
            });
        });
    });

    it('shows a validation error for a broken URL', async () => {
        const user = userEvent.setup();
        mockApiService.validateAndScrapeUrl.mockResolvedValue({ success: false, message: 'URL is broken.' });

        render(<KnowledgeBaseManager />);

        await user.click(screen.getByRole('button', { name: 'url' }));
        await user.type(screen.getByPlaceholderText('https://example.com/job-resources'), 'https://broken.com');
        await user.click(screen.getByRole('button', { name: /Add Source/i }));

        await waitFor(() => {
            expect(screen.getByText('URL is broken.')).toBeInTheDocument();
        });

        expect(mockApiService.addKnowledgeSource).not.toHaveBeenCalled();
    });

    it('allows deleting a source', async () => {
        window.confirm = vi.fn(() => true); // Mock confirm dialog
        const user = userEvent.setup();
        render(<KnowledgeBaseManager />);

        await waitFor(() => {
            expect(screen.getByText('https://example.com')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
        // Assuming the order is stable and we delete the URL source
        await user.click(deleteButtons[0]);

        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this source?');

        await waitFor(() => {
            expect(mockApiService.deleteKnowledgeSource).toHaveBeenCalledWith(mockSources[0].id);
        });
    });

    // TODO: Fix FileReader mock for jsdom environment
    it.skip('allows uploading a file source', async () => {
        const user = userEvent.setup();
        render(<KnowledgeBaseManager />);

        const fileTab = screen.getByRole('button', { name: 'file' });
        await user.click(fileTab);

        // Robust FileReader mock
        const fileReaderMock = {
            readAsText: vi.fn(),
            onload: null as any,
            result: 'File content',
        };

        const FileReaderMock = vi.fn(() => fileReaderMock);
        const originalFileReader = window.FileReader;
        window.FileReader = FileReaderMock as any;

        const file = new File(['File content'], 'test.md', { type: 'text/markdown' });
        const input = screen.getByLabelText(/Upload File/i);

        await user.upload(input, file);

        // Wait for readAsText to be called
        await waitFor(() => {
            expect(fileReaderMock.readAsText).toHaveBeenCalledWith(file);
        });

        // Ensure onload is assigned before calling it
        await waitFor(() => {
            expect(fileReaderMock.onload).toBeDefined();
        });

        act(() => {
            fileReaderMock.onload({ target: { result: 'File content' } });
        });

        const addButton = screen.getByRole('button', { name: /Add Source/i });
        await user.click(addButton);

        await waitFor(() => {
            expect(mockApiService.addKnowledgeSource).toHaveBeenCalledWith({
                type: KnowledgeSourceType.FILE,
                content: 'test.md',
                data: 'File content',
            });
        });

        window.FileReader = originalFileReader;
    });
});
