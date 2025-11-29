
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatLog, MessageAuthor } from '../../types';
import * as apiService from '../../services/apiService';
import Spinner from '../shared/Spinner';

const ChatLogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ChatLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      const data = await apiService.getChatLogs();
      const sortedLogs = data.sort((a, b) => b.timestamp - a.timestamp);
      setLogs(sortedLogs);
      if (sortedLogs.length > 0) {
        setSelectedLog(sortedLogs[0]);
      }
      setIsLoading(false);
    };
    fetchLogs();
  }, []);

  if (isLoading) return <Spinner />;

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-text flex-shrink-0">Chat Logs</h2>
      {logs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center bg-surface rounded-lg shadow-md border border-border">
          <p className="text-text-muted">No chat logs have been saved yet.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
          <div className="md:w-1/3 flex flex-col bg-surface p-4 rounded-lg shadow-md border border-border">
            <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-border flex-shrink-0 text-text">Conversations</h3>
            <div className="overflow-y-auto">
              <ul className="space-y-2">
                {logs.map(log => (
                  <li key={log.id}>
                    <button
                      onClick={() => setSelectedLog(log)}
                      className={`app-button w-full text-left justify-start ${selectedLog?.id === log.id ? 'app-button-primary' : 'app-button-secondary'}`}
                    >
                      <p className="font-semibold text-sm">User: {log.userId}</p>
                      <p className="text-xs opacity-80">{new Date(log.timestamp).toLocaleString()}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="md:w-2/3 flex flex-col bg-surface p-4 rounded-lg shadow-md border border-border">
            <h3 className="text-lg font-semibold mb-3 pb-2 border-b border-border flex-shrink-0 text-text">Log Details</h3>
            <div className="flex-1 overflow-y-auto">
              {selectedLog ? (
                <div className="space-y-4">
                  {selectedLog.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.author === MessageAuthor.USER ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 rounded-lg max-w-lg ${msg.author === MessageAuthor.USER ? 'bg-primary text-white' : 'bg-background text-text border border-border'}`}>
                        <div className={`prose prose-sm max-w-none break-words ${msg.author === MessageAuthor.USER ? 'prose-invert text-white' : 'text-text prose-headings:text-text prose-p:text-text prose-strong:text-text prose-ul:text-text prose-ol:text-text'}`}>
                          <ReactMarkdown
                            components={{
                              a: ({ node, ...props }) => <a {...props} className="underline font-medium hover:opacity-80 text-secondary" target="_blank" rel="noopener noreferrer" />
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                        <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-text-muted">Select a conversation to view details.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatLogsViewer;
