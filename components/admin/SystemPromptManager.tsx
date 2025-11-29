import React, { useState, useEffect, useCallback } from 'react';
import * as apiService from '../../services/apiService';
import Spinner from '../shared/Spinner';

const SystemPromptManager: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        const fetchPrompt = async () => {
            setIsLoading(true);
            const currentPrompt = await apiService.getSystemPrompt();
            setPrompt(currentPrompt);
            setIsLoading(false);
        };
        fetchPrompt();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus('idle');
        try {
            await apiService.saveSystemPrompt(prompt);
            setSaveStatus('success');
        } catch (error) {
            console.error("Failed to save system prompt", error);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveStatus('idle'), 3000); // Reset status message after 3 seconds
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-text">System Prompt Manager</h2>
            <p className="text-sm text-text-muted mb-6">
                This prompt defines the AI's core identity, instructions, and constraints for every conversation.
                Changes saved here will apply to all new AI responses.
            </p>

            <div className="bg-surface p-6 rounded-lg shadow-sm border border-border">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Spinner />
                    </div>
                ) : (
                    <>
                        <h3 className="text-lg font-semibold mb-3 text-text">AI System Prompt</h3>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Enter the system prompt here..."
                            className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition resize-y min-h-[250px] font-mono text-sm bg-background text-text"
                            data-testid="system-prompt-input"
                        />
                        <div className="mt-4 flex justify-end items-center space-x-4">
                            {saveStatus === 'success' && <p className="text-emerald-600 text-sm font-medium">Changes saved successfully!</p>}
                            {saveStatus === 'error' && <p className="text-red-600 text-sm font-medium">Failed to save changes.</p>}
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:bg-text-muted/30 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                                data-testid="save-system-prompt-button"
                            >
                                {isSaving ? <Spinner /> : 'Save Changes'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SystemPromptManager;
