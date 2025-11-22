import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RAGQualityTester from './RAGQualityTester';
import * as apiService from '../../services/apiService';
import { KnowledgeSourceType } from '../../types';

// Mock the apiService
vi.mock('../../services/apiService');

describe('RAGQualityTester', () => {
  const mockResults = [
    {
      source: {
        id: 'ks_1',
        type: KnowledgeSourceType.TEXT,
        content: 'How to write a resume: Start with contact information...',
        createdAt: Date.now(),
        embedding: [0.1, 0.2, 0.3],
      },
      similarity: 0.92,
    },
    {
      source: {
        id: 'ks_2',
        type: KnowledgeSourceType.URL,
        content: 'https://example.com/resume-tips',
        data: 'Resume writing tips and best practices',
        createdAt: Date.now() - 1000,
        embedding: [0.2, 0.3, 0.4],
      },
      similarity: 0.75,
    },
    {
      source: {
        id: 'ks_3',
        type: KnowledgeSourceType.FILE,
        content: 'resume_guide.pdf',
        data: 'Complete guide to resume writing...',
        createdAt: Date.now() - 2000,
        embedding: [0.3, 0.4, 0.5],
      },
      similarity: 0.58,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders initial state with empty results', () => {
    render(<RAGQualityTester />);

    expect(screen.getByRole('heading', { name: /RAG Quality Tester/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Enter a test query/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Test Query/i })).toBeInTheDocument();
    expect(screen.queryByText(/Retrieved Sources/i)).not.toBeInTheDocument();
  });

  it('submits query and displays results with similarity scores', async () => {
    const user = userEvent.setup();
    vi.mocked(apiService.searchKnowledgeBaseWithScores).mockResolvedValue(mockResults);

    render(<RAGQualityTester />);

    const input = screen.getByLabelText(/Enter a test query/i);
    const button = screen.getByRole('button', { name: /Test Query/i });

    await user.type(input, 'How do I write a resume?');
    await user.click(button);

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText(/Retrieved Sources \(3\)/i)).toBeInTheDocument();
    });

    // Verify API was called
    expect(apiService.searchKnowledgeBaseWithScores).toHaveBeenCalledWith('How do I write a resume?');

    // Check that results are displayed
    expect(screen.getByText(/How to write a resume/i)).toBeInTheDocument();
    expect(screen.getByText(/Resume writing tips/i)).toBeInTheDocument();
    expect(screen.getByText(/Complete guide to resume writing/i)).toBeInTheDocument();
  });

  it('displays quality metrics summary', async () => {
    const user = userEvent.setup();
    vi.mocked(apiService.searchKnowledgeBaseWithScores).mockResolvedValue(mockResults);

    render(<RAGQualityTester />);

    const input = screen.getByLabelText(/Enter a test query/i);
    await user.type(input, 'test query');
    await user.click(screen.getByRole('button', { name: /Test Query/i }));

    await waitFor(() => {
      expect(screen.getByText(/Quality Metrics/i)).toBeInTheDocument();
    });

    // Find Quality Metrics section
    const metricsSection = screen.getByText(/Quality Metrics/i).closest('div');
    
    // Check average similarity: (0.92 + 0.75 + 0.58) / 3 = 0.75 = 75.0%
    expect(metricsSection).toHaveTextContent('Avg Similarity');
    expect(metricsSection).toHaveTextContent('75.0');

    // Check high relevance count (≥0.8): only 1 source (0.92)
    expect(metricsSection).toHaveTextContent('1 / 3');
  });

  it('displays relevance labels correctly', async () => {
    const user = userEvent.setup();
    vi.mocked(apiService.searchKnowledgeBaseWithScores).mockResolvedValue(mockResults);

    render(<RAGQualityTester />);

    const input = screen.getByLabelText(/Enter a test query/i);
    await user.type(input, 'test');
    await user.click(screen.getByRole('button', { name: /Test Query/i }));

    await waitFor(() => {
      expect(screen.getAllByText(/High Relevance/i).length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText(/Medium Relevance/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Low Relevance/i).length).toBeGreaterThan(0);
  });

  it('tracks search history', async () => {
    const user = userEvent.setup();
    vi.mocked(apiService.searchKnowledgeBaseWithScores).mockResolvedValue(mockResults);

    render(<RAGQualityTester />);

    const input = screen.getByLabelText(/Enter a test query/i);
    
    // First search
    await user.type(input, 'resume tips');
    await user.click(screen.getByRole('button', { name: /Test Query/i }));

    await waitFor(() => {
      expect(screen.getByText(/Recent Test Queries/i)).toBeInTheDocument();
    });

    // Check for history section content
    const historySection = screen.getByText(/Recent Test Queries/i).closest('div');
    expect(historySection).toHaveTextContent('resume tips');
    expect(historySection).toHaveTextContent('3 sources');
  });

  it('allows clicking search history to re-run query', async () => {
    const user = userEvent.setup();
    vi.mocked(apiService.searchKnowledgeBaseWithScores).mockResolvedValue(mockResults);

    render(<RAGQualityTester />);

    const input = screen.getByLabelText(/Enter a test query/i);
    
    // First search
    await user.type(input, 'unique test query');
    await user.click(screen.getByRole('button', { name: /Test Query/i }));

    await waitFor(() => {
      expect(screen.getByText(/Recent Test Queries/i)).toBeInTheDocument();
    });

    // Find the history section and click on the clickable history item container
    const historySection = screen.getByText(/Recent Test Queries/i).closest('div');
    const historyItem = historySection!.querySelector('.space-y-2 > div');
    await user.click(historyItem!);

    // Input should be populated
    expect(input).toHaveValue('unique test query');
  });

  it('displays no results message when query returns empty', async () => {
    const user = userEvent.setup();
    vi.mocked(apiService.searchKnowledgeBaseWithScores).mockResolvedValue([]);

    render(<RAGQualityTester />);

    const input = screen.getByLabelText(/Enter a test query/i);
    await user.type(input, 'query with no results');
    await user.click(screen.getByRole('button', { name: /Test Query/i }));

    await waitFor(() => {
      expect(screen.getByText(/No sources retrieved for this query/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/no indexed sources exist/i)).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    vi.mocked(apiService.searchKnowledgeBaseWithScores).mockRejectedValue(
      new Error('Network error')
    );

    render(<RAGQualityTester />);

    const input = screen.getByLabelText(/Enter a test query/i);
    await user.type(input, 'test');
    await user.click(screen.getByRole('button', { name: /Test Query/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to test query/i)).toBeInTheDocument();
    });
  });

  it('disables submit button when input is empty', () => {
    render(<RAGQualityTester />);

    const button = screen.getByRole('button', { name: /Test Query/i });
    expect(button).toBeDisabled();
  });

  it('displays indexed status indicators', async () => {
    const user = userEvent.setup();
    const resultsWithMixedIndexing = [
      {
        source: {
          id: 'ks_1',
          type: KnowledgeSourceType.TEXT,
          content: 'Indexed source with embedding',
          createdAt: Date.now(),
          embedding: [0.1, 0.2],
        },
        similarity: 0.9,
      },
      {
        source: {
          id: 'ks_2',
          type: KnowledgeSourceType.TEXT,
          content: 'Not indexed source without embedding',
          createdAt: Date.now(),
          // no embedding
        },
        similarity: 0.5,
      },
    ];

    vi.mocked(apiService.searchKnowledgeBaseWithScores).mockResolvedValue(resultsWithMixedIndexing);

    render(<RAGQualityTester />);

    const input = screen.getByLabelText(/Enter a test query/i);
    await user.type(input, 'test');
    await user.click(screen.getByRole('button', { name: /Test Query/i }));

    await waitFor(() => {
      expect(screen.getByText(/Retrieved Sources/i)).toBeInTheDocument();
    });

    // Check for indexed/not indexed indicators (via title attributes)
    const indexedDot = screen.getByTitle('Indexed');
    const notIndexedDot = screen.getByTitle('Not Indexed');
    
    expect(indexedDot).toBeInTheDocument();
    expect(notIndexedDot).toBeInTheDocument();
  });

  it('displays source type badges correctly', async () => {
    const user = userEvent.setup();
    vi.mocked(apiService.searchKnowledgeBaseWithScores).mockResolvedValue(mockResults);

    render(<RAGQualityTester />);

    const input = screen.getByLabelText(/Enter a test query/i);
    await user.type(input, 'test');
    await user.click(screen.getByRole('button', { name: /Test Query/i }));

    await waitFor(() => {
      expect(screen.getByText(/Retrieved Sources/i)).toBeInTheDocument();
    });

    // Check that all three source types are displayed
    const textBadges = screen.getAllByText('text');
    const urlBadges = screen.getAllByText('url');
    const fileBadges = screen.getAllByText('file');
    
    expect(textBadges.length).toBeGreaterThan(0);
    expect(urlBadges.length).toBeGreaterThan(0);
    expect(fileBadges.length).toBeGreaterThan(0);
  });
});
