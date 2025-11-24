
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
      const sortedLogs = data.sort((a, b) => b.startTime - a.startTime);
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
      <h2 className="text-2xl font-bold mb-4 text-neutral-800 flex-shrink-0">Chat Logs</h2>
      {logs.length === 0 ? (
        <div className="flex-1 flex items-center justify-center bg-white rounded-lg shadow-md">
          <p className="text-neutral-500">No chat logs have been saved yet.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
          <div className="md:w-1/3 flex flex-col bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3 pb-2 border-b flex-shrink-0">Conversations</h3>
            <div className="overflow-y-auto">
              <ul className="space-y-2">
                {logs.map(log => (
                  <li key={log.id}>
                    <button
                      onClick={() => setSelectedLog(log)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${selectedLog?.id === log.id ? 'bg-primary text-white' : 'hover:bg-neutral-100'}`}
                    >
                      <p className="font-semibold text-sm">User: {log.userId}</p>
                      <p className="text-xs opacity-80">{new Date(log.startTime).toLocaleString()}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="md:w-2/3 flex flex-col bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3 pb-2 border-b flex-shrink-0">Log Details</h3>
            <div className="flex-1 overflow-y-auto">
              {selectedLog ? (
                <div className="space-y-4">
                  {selectedLog.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.author === MessageAuthor.USER ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 rounded-lg max-w-lg ${msg.author === MessageAuthor.USER ? 'bg-primary text-white' : 'bg-neutral-100'}`}>
                        <div className={`prose prose-sm max-w-none break-words ${msg.author === MessageAuthor.USER ? 'prose-invert text-white' : 'text-neutral-800'}`}>
                          <ReactMarkdown
                            components={{
                              a: ({ node, ...props }) => <a {...props} className="underline font-medium hover:opacity-80" target="_blank" rel="noopener noreferrer" />
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
                  <p className="text-neutral-500">Select a conversation to view details.</p>
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
