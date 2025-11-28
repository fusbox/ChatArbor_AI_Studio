import React, { useState, useEffect } from 'react';
import Header from './components/shared/Header';
import ChatWindow from './components/chat/ChatWindow';
import AdminDashboard from './components/admin/AdminDashboard';
import { APP_NAME } from './constants';
import AuthPage from './components/auth/AuthPage';
import * as apiService from './services/apiService';

type View = 'chat' | 'admin';

const App: React.FC = () => {
  const [view, setView] = useState<View>('chat');
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  // ============================================================================
  // DEV ONLY - REMOVE BEFORE PRODUCTION MIGRATION
  // Auto-login dev user to validate authentication flow
  // ============================================================================
  useEffect(() => {
    const isDev = (import.meta as any).env?.DEV;
    if (isDev) {
      apiService.login('fu@dev.local', 'dev123')
        .then(() => console.log('✅ Auto-logged in as Fu (dev mode)'))
        .catch(err => console.warn('Auto-login failed (expected on first run):', err.message));
    }
  }, []);
  // ============================================================================
  // END DEV ONLY
  // ============================================================================

  return (
    <div className={`flex flex-col h-screen overflow-hidden font-sans transition-colors duration-300 ${view === 'chat' ? 'bg-brand-dark text-white' : 'bg-brand-bg-light text-brand-dark'}`}>
      <Header
        title={APP_NAME}
        currentView={view}
        onViewChange={setView}
        onAuthClick={() => setAuthModalOpen(true)}
      />
      <main className="flex-1 flex flex-col min-h-0">
        {view === 'chat' ? <ChatWindow /> : <AdminDashboard />}
      </main>
      {isAuthModalOpen && (
        <AuthPage onClose={() => setAuthModalOpen(false)} />
      )}
    </div>
  );
};

export default App;