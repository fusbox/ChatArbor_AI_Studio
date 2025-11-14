import React, { useState, useEffect, useCallback } from 'react';
import { KnowledgeSource, KnowledgeSourceType } from '../../types';
import * as apiService from '../../services/apiService';
import Spinner from '../shared/Spinner';

const KnowledgeBaseManager: React.FC = () => {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newSourceType, setNewSourceType] = useState<KnowledgeSourceType>(KnowledgeSourceType.TEXT);
  const [textContent, setTextContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [fileContent, setFileContent] = useState<{name: string, data: string} | null>(null);

  const [editingSource, setEditingSource] = useState<KnowledgeSource | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);


  const fetchSources = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await apiService.getKnowledgeBase();
      setSources(data.sort((a,b) => b.createdAt - a.createdAt));
    } catch (e) {
      setError('Failed to load knowledge base.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['text/plain', 'text/markdown', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const allowedExtensions = ['.txt', '.md', '.pdf', '.docx'];
      const fileExtension = '.' + file.name.split('.').pop();
      
      if (allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)) {
        setValidationError(null);
        if (file.type === "text/plain" || file.type === "text/markdown") {
            const reader = new FileReader();
            reader.onload = (e) => {
              const text = e.target?.result as string;
              setFileContent({ name: file.name, data: text });
            };
            reader.readAsText(file);
        } else {
          setFileContent({ name: file.name, data: `[Content of ${file.name}. In a real app, this file would be processed on a server.]` });
        }
      } else {
        setValidationError('Unsupported file type. Please upload a PDF, DOCX, TXT, or MD file.');
        setFileContent(null);
        event.target.value = ''; // Clear the input
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    let sourceToAdd: Omit<KnowledgeSource, 'id' | 'createdAt' | 'embedding'> | null = null;
    
    if (newSourceType === KnowledgeSourceType.TEXT) {
        if (!textContent.trim()) {
            setValidationError('Text content cannot be empty.');
            return;
        }
        sourceToAdd = { type: KnowledgeSourceType.TEXT, content: textContent };
    } else if (newSourceType === KnowledgeSourceType.URL) {
        if (!urlContent.trim()) {
            setValidationError('URL field cannot be empty.');
            return;
        }
        
        setIsSubmitting(true);
        const validationResult = await apiService.validateAndScrapeUrl(urlContent);

        if (!validationResult.success) {
            setValidationError(validationResult.message || 'Failed to validate URL.');
            setIsSubmitting(false);
            return;
        }
        
        sourceToAdd = {
            type: KnowledgeSourceType.URL,
            content: urlContent,
            data: validationResult.content,
        };
        
    } else if (newSourceType === KnowledgeSourceType.FILE) {
        if (!fileContent) {
            setValidationError('Please select a file to add.');
            return;
        }
        sourceToAdd = { type: KnowledgeSourceType.FILE, content: fileContent.name, data: fileContent.data };
    }

    if (sourceToAdd) {
      if (!isSubmitting) setIsSubmitting(true);
      await apiService.addKnowledgeSource(sourceToAdd);
      setTextContent('');
      setUrlContent('');
      setFileContent(null);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      await fetchSources();
    }
    
    setIsSubmitting(false);
  };
  
  const handleUpdate = async () => {
    if (!editingSource) return;
    await apiService.updateKnowledgeSource(editingSource);
    setEditingSource(null);
    await fetchSources();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this source?')) {
      await apiService.deleteKnowledgeSource(id);
      await fetchSources();
    }
  };

  const handleReIndex = async () => {
    if (window.confirm('This will generate embeddings for any sources that are missing them. This may take a moment. Continue?')) {
      setIsIndexing(true);
      try {
        const result = await apiService.reIndexKnowledgeBase();
        alert(`${result.count} source(s) were successfully indexed.`);
        await fetchSources(); // Refresh to get updated data
      } catch (e) {
        setError('Failed to re-index the knowledge base.');
      } finally {
        setIsIndexing(false);
      }
    }
  };

  const renderInput = () => {
    switch (newSourceType) {
      case KnowledgeSourceType.TEXT:
        return <textarea value={textContent} onChange={e => setTextContent(e.target.value)} placeholder="Paste plain text content here..." className="w-full p-2 border rounded min-h-[120px]" />;
      case KnowledgeSourceType.URL:
        return <input type="url" value={urlContent} onChange={e => setUrlContent(e.target.value)} placeholder="https://example.com/job-resources" className="w-full p-2 border rounded" />;
      case KnowledgeSourceType.FILE:
        return (
          <div>
            <input id="file-input" type="file" onChange={handleFileChange} accept=".txt,.md,.pdf,.docx" className="w-full p-2 border rounded file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-white hover:file:bg-primary" />
            <p className="text-xs text-neutral-500 mt-2">Accepted formats: PDF, DOCX, TXT, MD. Note: PDF and DOCX content is simulated in this demo.</p>
          </div>
        );
    }
  };
  
  const filteredSources = sources.filter(source => {
      const query = searchQuery.toLowerCase();
      if (!query) return true;
      const typeMatch = source.type.toLowerCase().includes(query);
      const contentMatch = source.content.toLowerCase().includes(query);
      const dataMatch = source.data ? source.data.toLowerCase().includes(query) : false;
      return typeMatch || contentMatch || dataMatch;
  });

  return (
    <div className="h-full flex flex-col space-y-6">
      <h2 className="text-2xl font-bold text-neutral-800 flex-shrink-0">Knowledge Base Manager</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md flex-shrink-0">
        <h3 className="text-lg font-semibold mb-3">Add New Source</h3>
        <form onSubmit={handleSubmit}>
          <div className="flex space-x-2 mb-4 border-b">
            {(Object.values(KnowledgeSourceType)).map(type => (
              <button key={type} type="button" onClick={() => { setNewSourceType(type); setValidationError(null); }} className={`capitalize px-4 py-2 text-sm font-medium border-b-2 ${newSourceType === type ? 'border-primary text-primary' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>
                {type}
              </button>
            ))}
          </div>
          <div className="mb-4">{renderInput()}</div>
          {validationError && (
            <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">{validationError}</p>
          )}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors disabled:bg-neutral-400 disabled:cursor-wait flex items-center justify-center min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Spinner />
                <span className="ml-2">{newSourceType === KnowledgeSourceType.URL ? 'Validating URL...' : 'Adding Source...'}</span>
              </>
            ) : (
              'Add Source'
            )}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-3 flex-shrink-0">
            <h3 className="text-lg font-semibold">Existing Sources ({filteredSources.length})</h3>
            <button
                onClick={handleReIndex}
                disabled={isIndexing}
                className="bg-sky-100 text-primary px-4 py-2 text-sm font-semibold rounded-lg hover:bg-sky-200 transition-colors disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-wait flex items-center"
            >
                {isIndexing && <Spinner />}
                <span className="ml-2">{isIndexing ? 'Indexing...' : 'Re-Index Knowledge Base'}</span>
            </button>
        </div>

        <div className="mb-4 relative flex-shrink-0">
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sources by type or content..."
                className="w-full p-2 pl-10 border rounded-lg focus:ring-primary focus:border-primary"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            {isLoading ? <Spinner /> : error ? <p className="text-red-500">{error}</p> : (
            <div className="space-y-3">
                {filteredSources.map(source => (
                <div key={source.id} className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg border">
                    <div className="flex-1 min-w-0 flex items-center">
                    <span className={`flex-shrink-0 w-2 h-2 rounded-full mr-3 ${source.embedding ? 'bg-emerald-500' : 'bg-neutral-300'}`} title={source.embedding ? 'Indexed' : 'Not Indexed'}></span>
                    <span className="font-mono text-xs px-2 py-1 bg-neutral-200 text-neutral-600 rounded mr-3 capitalize">{source.type}</span>
                    <span className="text-sm text-neutral-700 truncate">{source.type === 'text' ? `${source.content.substring(0, 70)}...` : source.content}</span>
                    </div>
                    <div className="flex space-x-2">
                        <button onClick={() => setEditingSource(source)} className="text-primary hover:text-primary-dark p-1 rounded-full hover:bg-sky-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(source.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>
                ))}
                {sources.length > 0 && filteredSources.length === 0 && (
                    <p className="text-neutral-500 text-center py-4">No sources match your search.</p>
                )}
                {sources.length === 0 && <p className="text-neutral-500 text-center py-4">No knowledge sources found.</p>}
            </div>
            )}
        </div>

      </div>

      {/* Edit Modal */}
      {editingSource && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                  <h3 className="text-lg font-semibold mb-4">Edit Source</h3>
                  <textarea 
                      value={editingSource.type === 'text' ? editingSource.content : editingSource.data || ''}
                      onChange={e => setEditingSource({ ...editingSource, [editingSource.type === 'text' ? 'content' : 'data']: e.target.value })}
                      className="w-full p-2 border rounded min-h-[200px]"
                      disabled={editingSource.type !== 'text'}
                  />
                  <p className="text-xs text-neutral-500 mt-2">Note: Editing content for URL or file sources is disabled. To update, please delete and re-add. Saving changes will re-generate the vector embedding.</p>
                  <div className="mt-4 flex justify-end space-x-2">
                      <button onClick={() => setEditingSource(null)} className="px-4 py-2 bg-neutral-200 rounded-lg hover:bg-neutral-300">Cancel</button>
                      <button onClick={handleUpdate} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">Save Changes</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default KnowledgeBaseManager;
