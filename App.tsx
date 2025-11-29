import React, { useState, useEffect } from 'react';
import Header from './components/shared/Header';
import ChatWindow from './components/chat/ChatWindow';
import AdminDashboard from './components/admin/AdminDashboard';
import PortfolioView from './components/portfolio/PortfolioView';
import { APP_NAME } from './constants';
import AuthPage from './components/auth/AuthPage';
import * as apiService from './services/apiService';
import { ThemeProvider } from './contexts/ThemeContext';

type View = 'chat' | 'admin' | 'portfolio';

const AppContent: React.FC = () => {
  const [view, setView] = useState<View>('chat');
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  // ============================================================================
  // DEV ONLY - REMOVE BEFORE PRODUCTION MIGRATION
  // Auto-login dev user to validate authentication flow
  // ============================================================================
  useEffect(() => {
    const isDev = (import.meta as any).env?.DEV;
    const shouldAutoLogin = (import.meta as any).env?.VITE_AUTO_LOGIN === 'true';

    if (isDev && shouldAutoLogin) {
      apiService.login('fu@dev.local', 'dev123')
        .then(() => console.log('✅ Auto-logged in as Fu (dev mode)'))
        .catch(err => console.warn('Auto-login failed (expected on first run):', err.message));
    }
  }, []);
  // ============================================================================
  // END DEV ONLY
  // ============================================================================

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans bg-background text-text transition-colors duration-300">
      <Header
        title={APP_NAME}
        currentView={view}
        onViewChange={setView}
        onAuthClick={() => setAuthModalOpen(true)}
      />
      <main className="flex-1 flex flex-col min-h-0">
        {view === 'chat' && <ChatWindow />}
        {view === 'admin' && <AdminDashboard />}
        {view === 'portfolio' && <PortfolioView />}
      </main>
      {isAuthModalOpen && (
        <AuthPage onClose={() => setAuthModalOpen(false)} />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;