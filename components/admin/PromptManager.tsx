import React, { useState, useEffect, useCallback } from 'react';
import { Greeting } from '../../types';
import * as apiService from '../../services/apiService';
import Spinner from '../shared/Spinner';

const PromptManager: React.FC = () => {
  const [greetings, setGreetings] = useState<Greeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newGreetingText, setNewGreetingText] = useState('');

  const fetchGreetings = useCallback(async () => {
    setIsLoading(true);
    const data = await apiService.getGreetings();
    setGreetings(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchGreetings();
  }, [fetchGreetings]);

  const handleSetActive = async (id: string) => {
    const updatedGreetings = greetings.map(g => ({ ...g, isActive: g.id === id }));
    setGreetings(updatedGreetings);
    await apiService.saveGreetings(updatedGreetings);
  };

  const handleAddGreeting = async () => {
    if (!newGreetingText.trim()) return;
    const newGreeting: Greeting = {
      id: `greet_${Date.now()}`,
      text: newGreetingText,
      isActive: false,
    };
    const updatedGreetings = [...greetings, newGreeting];
    setGreetings(updatedGreetings);
    await apiService.saveGreetings(updatedGreetings);
    setNewGreetingText('');
  };

  const handleDeleteGreeting = async (id: string) => {
    if (greetings.find(g => g.id === id)?.isActive) {
      alert("Cannot delete the active greeting.");
      return;
    }
    const updatedGreetings = greetings.filter(g => g.id !== id);
    setGreetings(updatedGreetings);
    await apiService.saveGreetings(updatedGreetings);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-neutral-800">Greeting Manager</h2>
      <p className="text-sm text-neutral-600 mb-6">Manage the initial messages the chatbot uses to greet users. Only one greeting can be active at a time.</p>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-3">Add New Greeting</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newGreetingText}
            onChange={(e) => setNewGreetingText(e.target.value)}
            placeholder="Enter a new greeting message..."
            className="flex-grow p-2 border rounded-lg"
            data-testid="new-greeting-input"
          />
          <button onClick={handleAddGreeting} className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors" data-testid="add-greeting-button">Add</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-3">Available Greetings</h3>
        {isLoading ? <Spinner /> : (
          <div className="space-y-3">
            {greetings.map(greeting => (
              <div key={greeting.id} className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg border" data-testid={`greeting-item-${greeting.id}`}>
                <p className="text-sm text-neutral-800">{greeting.text}</p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSetActive(greeting.id)}
                    disabled={greeting.isActive}
                    className="text-xs px-3 py-1 rounded-full transition-colors disabled:cursor-not-allowed enabled:hover:bg-primary-light enabled:hover:text-white"
                    style={{
                      backgroundColor: greeting.isActive ? '#0284c7' : '#e2e8f0',
                      color: greeting.isActive ? 'white' : '#475569'
                    }}
                    data-testid={`set-active-greeting-${greeting.id}`}
                  >
                    {greeting.isActive ? 'Active' : 'Set Active'}
                  </button>
                  <button onClick={() => handleDeleteGreeting(greeting.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 transition-colors" data-testid={`delete-greeting-${greeting.id}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptManager;
