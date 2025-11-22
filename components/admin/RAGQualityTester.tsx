import React, { useState } from 'react';
import { KnowledgeSourceWithSimilarity } from '../../types';
import * as apiService from '../../services/apiService';
import Spinner from '../shared/Spinner';

const RAGQualityTester: React.FC = () => {
  const [testQuery, setTestQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<KnowledgeSourceWithSimilarity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<Array<{ query: string; count: number; timestamp: number }>>([]);

  const handleTestQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;

    setIsSearching(true);
    setError(null);
    
    try {
      // Get the retrieved sources with similarity scores
      const resultsWithScores = await apiService.searchKnowledgeBaseWithScores(testQuery);
      
      setResults(resultsWithScores);
      
      // Add to search history
      setSearchHistory(prev => [{
        query: testQuery,
        count: resultsWithScores.length,
        timestamp: Date.now()
      }, ...prev.slice(0, 9)]); // Keep last 10 searches
      
    } catch (err) {
      setError('Failed to test query. Please try again.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getSimilarityColor = (similarity: number): string => {
    if (similarity >= 0.8) return 'bg-emerald-500';
    if (similarity >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSimilarityLabel = (similarity: number): string => {
    if (similarity >= 0.8) return 'High Relevance';
    if (similarity >= 0.6) return 'Medium Relevance';
    return 'Low Relevance';
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-800">RAG Quality Tester</h2>
        <p className="text-sm text-neutral-600 mt-1">
          Test what knowledge sources are retrieved for user queries and evaluate retrieval quality.
        </p>
      </div>

      {/* Test Query Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-3">Test a Query</h3>
        <form onSubmit={handleTestQuery} className="space-y-4">
          <div>
            <label htmlFor="test-query" className="block text-sm font-medium text-neutral-700 mb-2">
              Enter a test query
            </label>
            <input
              id="test-query"
              type="text"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="E.g., How do I write a resume?"
              className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-primary focus:border-primary"
              disabled={isSearching}
            />
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSearching || !testQuery.trim()}
            className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-neutral-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSearching && <Spinner />}
            <span>{isSearching ? 'Searching...' : 'Test Query'}</span>
          </button>
        </form>
      </div>

      {/* Results Display */}
      {results.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Retrieved Sources ({results.length})
            </h3>
            <div className="text-sm text-neutral-600">
              Query: <span className="font-medium text-neutral-800">"{testQuery}"</span>
            </div>
          </div>

          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={result.source.id}
                className="border border-neutral-200 rounded-lg p-4 hover:border-primary transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 bg-neutral-100 text-neutral-700 text-xs font-medium rounded-full capitalize">
                      {result.source.type}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${result.source.embedding ? 'bg-emerald-500' : 'bg-neutral-300'}`}
                      title={result.source.embedding ? 'Indexed' : 'Not Indexed'}
                    />
                  </div>
                  
                  {/* Similarity Score */}
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs text-neutral-500">{getSimilarityLabel(result.similarity)}</div>
                      <div className="text-sm font-semibold text-neutral-800">
                        {(result.similarity * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="w-20 h-2 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getSimilarityColor(result.similarity)} transition-all`}
                        style={{ width: `${result.similarity * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Source Content Preview */}
                <div className="bg-neutral-50 rounded p-3 mt-2">
                  <div className="text-xs text-neutral-500 mb-1 font-medium">Content Preview:</div>
                  <div className="text-sm text-neutral-700 line-clamp-3">
                    {result.source.type === 'text' 
                      ? result.source.content 
                      : result.source.data || result.source.content}
                  </div>
                </div>

                {/* Source Metadata */}
                <div className="flex gap-4 mt-3 text-xs text-neutral-500">
                  <span>ID: {result.source.id}</span>
                  <span>Added: {new Date(result.source.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quality Summary */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Quality Metrics</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-blue-700 font-medium">Avg Similarity</div>
                <div className="text-blue-900 text-lg font-bold">
                  {(results.reduce((sum, r) => sum + r.similarity, 0) / results.length * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-blue-700 font-medium">High Relevance</div>
                <div className="text-blue-900 text-lg font-bold">
                  {results.filter(r => r.similarity >= 0.8).length} / {results.length}
                </div>
              </div>
              <div>
                <div className="text-blue-700 font-medium">Low Relevance</div>
                <div className="text-blue-900 text-lg font-bold">
                  {results.filter(r => r.similarity < 0.6).length} / {results.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {!isSearching && results.length === 0 && testQuery && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded-lg text-center">
          <p className="font-medium">No sources retrieved for this query</p>
          <p className="text-sm mt-1">
            This could mean: (1) no indexed sources exist, (2) query similarity is below threshold (0.5), or (3) knowledge base is empty.
          </p>
        </div>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3">Recent Test Queries</h3>
          <div className="space-y-2">
            {searchHistory.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg text-sm hover:bg-neutral-100 cursor-pointer transition-colors"
                onClick={() => setTestQuery(item.query)}
              >
                <span className="text-neutral-700 truncate flex-1">{item.query}</span>
                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  <span className="bg-neutral-200 px-2 py-1 rounded">
                    {item.count} sources
                  </span>
                  <span>{formatTimestamp(item.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RAGQualityTester;
