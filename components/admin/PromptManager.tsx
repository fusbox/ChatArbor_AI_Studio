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
      <h2 className="text-2xl font-bold mb-4 text-text">Greeting Manager</h2>
      <p className="text-sm text-text-muted mb-6">Manage the initial messages the chatbot uses to greet users. Only one greeting can be active at a time.</p>

      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border mb-6">
        <h3 className="text-lg font-semibold mb-3 text-text">Add New Greeting</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newGreetingText}
            onChange={(e) => setNewGreetingText(e.target.value)}
            placeholder="Enter a new greeting message..."
            className="flex-grow p-2 border border-border rounded-lg bg-background text-text focus:ring-primary focus:border-primary"
            data-testid="new-greeting-input"
          />
          <button onClick={handleAddGreeting} className="app-button app-button-primary" data-testid="add-greeting-button">Add</button>
        </div>
      </div>

      <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
        <h3 className="text-lg font-semibold mb-3 text-text">Available Greetings</h3>
        {isLoading ? <Spinner /> : (
          <div className="space-y-3">
            {greetings.map(greeting => (
              <div key={greeting.id} className="flex justify-between items-center p-3 bg-background rounded-lg border border-border" data-testid={`greeting-item-${greeting.id}`}>
                <p className="text-sm text-text">{greeting.text}</p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSetActive(greeting.id)}
                    disabled={greeting.isActive}
                    className={`text-xs rounded-full disabled:cursor-not-allowed ${greeting.isActive ? "app-button app-button-primary" : "app-button app-button-secondary"}`}
                    data-testid={`set-active-greeting-${greeting.id}`}
                  >
                    {greeting.isActive ? 'Active' : 'Set Active'}
                  </button>
                  <button onClick={() => handleDeleteGreeting(greeting.id)} className="app-button app-button-danger rounded-full" data-testid={`delete-greeting-${greeting.id}`}>
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
